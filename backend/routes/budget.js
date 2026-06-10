import { Router } from 'express';
import fs from 'fs';
import { parse as parseCsv } from 'csv-parse/sync';
import db from '../db/db.js';
import { uploadFile } from '../middleware/upload.js';
import * as gmail from '../services/gmail.js';

const router = Router();

router.get('/transactions', (req, res) => {
  const { month, category } = req.query;
  let sql = 'SELECT * FROM transactions WHERE user_id = ?';
  const params = [req.user.id];
  if (month) { sql += " AND strftime('%Y-%m', date) = ?"; params.push(month); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  sql += ' ORDER BY date DESC LIMIT 500';
  res.json(db.prepare(sql).all(...params));
});

router.post('/transactions', (req, res) => {
  const { date, amount, description = '', category = 'other' } = req.body || {};
  if (!date || typeof amount !== 'number') {
    return res.status(400).json({ error: 'date and numeric amount are required' });
  }
  const info = db
    .prepare("INSERT INTO transactions (user_id, date, amount, description, category, source) VALUES (?, ?, ?, ?, ?, 'manual')")
    .run(req.user.id, date, amount, description, category);
  res.status(201).json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/transactions/:id', (req, res) => {
  const info = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: 'Transaction not found' });
  res.json({ ok: true });
});

// CSV bank import — accepts common bank export headers (date/amount/description, flexible names).
router.post('/import/csv', uploadFile.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const raw = fs.readFileSync(req.file.path, 'utf8');
    const rows = parseCsv(raw, { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true });
    const pick = (row, keys) => {
      const lower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v]));
      for (const k of keys) if (lower[k] != null && lower[k] !== '') return lower[k];
      return null;
    };
    const insert = db.prepare(
      "INSERT INTO transactions (user_id, date, amount, description, category, source) VALUES (?, ?, ?, ?, 'other', 'csv')"
    );
    let imported = 0;
    const tx = db.transaction(() => {
      for (const row of rows) {
        const date = pick(row, ['date', 'data', 'transaction date', 'booking date', 'data tranzactiei']);
        let amount = pick(row, ['amount', 'suma', 'debit', 'value', 'valoare']);
        const desc = pick(row, ['description', 'descriere', 'details', 'detalii', 'narrative']) || '';
        if (!date || amount == null) continue;
        amount = parseFloat(String(amount).replace(/\./g, (m, i, s) => (s.indexOf(',') > -1 ? '' : m)).replace(',', '.'));
        if (isNaN(amount)) continue;
        const iso = new Date(date).toString() !== 'Invalid Date'
          ? new Date(date).toISOString().slice(0, 10)
          : date;
        insert.run(req.user.id, iso, amount, desc);
        imported++;
      }
    });
    tx();
    res.json({ imported, total_rows: rows.length });
  } catch (err) {
    res.status(400).json({ error: `CSV import failed: ${err.message}` });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

// Salary slip PDF — extracts net pay amount via text heuristics.
router.post('/import/pdf', uploadFile.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
    const data = await pdfParse(fs.readFileSync(req.file.path));
    const text = data.text;
    const netMatch = text.match(/(?:net(?:\s+pay)?|rest\s+de\s+plata|salariu\s+net)[^\d-]*([\d.,]+)/i);
    let transaction = null;
    if (netMatch) {
      const amount = parseFloat(netMatch[1].replace(/\./g, '').replace(',', '.'));
      if (!isNaN(amount)) {
        const date = new Date().toISOString().slice(0, 10);
        const info = db
          .prepare("INSERT INTO transactions (user_id, date, amount, description, category, source) VALUES (?, ?, ?, 'Salary (PDF import)', 'income', 'pdf')")
          .run(req.user.id, date, amount);
        transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(info.lastInsertRowid);
      }
    }
    res.json({ text: text.slice(0, 5000), transaction, parsed: !!transaction });
  } catch (err) {
    res.status(400).json({ error: `PDF parse failed: ${err.message}` });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

router.get('/summary', (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const rows = db
    .prepare("SELECT category, SUM(amount) AS total, COUNT(*) AS count FROM transactions WHERE user_id = ? AND strftime('%Y-%m', date) = ? GROUP BY category")
    .all(req.user.id, month);
  const income = rows.filter((r) => r.total > 0).reduce((s, r) => s + r.total, 0);
  const expenses = rows.filter((r) => r.total < 0).reduce((s, r) => s + r.total, 0);
  res.json({ month, income, expenses, balance: income + expenses, by_category: rows });
});

router.get('/gmail/auth', (req, res) => {
  try {
    res.json({ url: gmail.getOAuthUrl() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/gmail/callback', async (req, res) => {
  try {
    const { client, tokens } = await gmail.handleCallback(req.query.code);
    const orders = await gmail.getOrders(client);
    res.json({ ok: true, tokens, orders });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
