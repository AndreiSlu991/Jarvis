import { Router } from 'express';
import db from '../db/db.js';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── TOPICS ──────────────────────────────────────────────
router.get('/topics', (req, res) => {
  const rows = db.prepare('SELECT * FROM blajeni_topics WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});

router.post('/topics', (req, res) => {
  const { title, status = 'planned', notes = '' } = req.body;
  const r = db.prepare('INSERT INTO blajeni_topics (user_id,title,status,notes) VALUES (?,?,?,?)').run(req.user.id, title, status, notes);
  res.json(db.prepare('SELECT * FROM blajeni_topics WHERE id=?').get(r.lastInsertRowid));
});

router.put('/topics/:id', (req, res) => {
  const { title, status, notes } = req.body;
  db.prepare('UPDATE blajeni_topics SET title=COALESCE(?,title), status=COALESCE(?,status), notes=COALESCE(?,notes), updated_at=datetime("now") WHERE id=? AND user_id=?')
    .run(title, status, notes, req.params.id, req.user.id);
  res.json(db.prepare('SELECT * FROM blajeni_topics WHERE id=?').get(req.params.id));
});

router.delete('/topics/:id', (req, res) => {
  db.prepare('DELETE FROM blajeni_topics WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── SHOPPING LISTS ───────────────────────────────────────
router.get('/shopping', (req, res) => {
  const lists = db.prepare('SELECT * FROM blajeni_shopping_lists WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  const result = lists.map(l => ({
    ...l,
    items: db.prepare('SELECT * FROM blajeni_shopping_items WHERE list_id=? ORDER BY id').all(l.id)
  }));
  res.json(result);
});

router.post('/shopping', (req, res) => {
  const { name, category = 'diverse' } = req.body;
  const r = db.prepare('INSERT INTO blajeni_shopping_lists (user_id,name,category) VALUES (?,?,?)').run(req.user.id, name, category);
  res.json(db.prepare('SELECT * FROM blajeni_shopping_lists WHERE id=?').get(r.lastInsertRowid));
});

router.delete('/shopping/:id', (req, res) => {
  db.prepare('DELETE FROM blajeni_shopping_lists WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

router.post('/shopping/:listId/items', (req, res) => {
  const { name, quantity = 1, unit = 'buc', estimated_price = 0, store_suggestion = '' } = req.body;
  const list = db.prepare('SELECT id FROM blajeni_shopping_lists WHERE id=? AND user_id=?').get(req.params.listId, req.user.id);
  if (!list) return res.status(404).json({ error: 'List not found' });
  const r = db.prepare('INSERT INTO blajeni_shopping_items (list_id,name,quantity,unit,estimated_price,store_suggestion) VALUES (?,?,?,?,?,?)')
    .run(req.params.listId, name, quantity, unit, estimated_price, store_suggestion);
  res.json(db.prepare('SELECT * FROM blajeni_shopping_items WHERE id=?').get(r.lastInsertRowid));
});

router.put('/shopping/items/:itemId', (req, res) => {
  const { name, quantity, unit, estimated_price, bought, store_suggestion } = req.body;
  db.prepare('UPDATE blajeni_shopping_items SET name=COALESCE(?,name), quantity=COALESCE(?,quantity), unit=COALESCE(?,unit), estimated_price=COALESCE(?,estimated_price), bought=COALESCE(?,bought), store_suggestion=COALESCE(?,store_suggestion) WHERE id=?')
    .run(name, quantity, unit, estimated_price, bought, store_suggestion, req.params.itemId);
  res.json(db.prepare('SELECT * FROM blajeni_shopping_items WHERE id=?').get(req.params.itemId));
});

router.delete('/shopping/items/:itemId', (req, res) => {
  db.prepare('DELETE FROM blajeni_shopping_items WHERE id=?').run(req.params.itemId);
  res.json({ ok: true });
});

// ── TOOLS ────────────────────────────────────────────────
router.get('/tools', (req, res) => {
  res.json(db.prepare('SELECT * FROM blajeni_tools WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});

router.post('/tools', async (req, res) => {
  const { name, brand = '', model = '', category = 'general', purchase_date = '', purchase_price = 0, store = '', condition = 'good' } = req.body;

  let manual_url = '';
  if (brand && model) {
    try {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 256,
        messages: [{ role: 'user', content: `Search for the user manual PDF for "${brand} ${model}". Return ONLY a direct URL to the PDF manual, nothing else. Prefer manualslib.com, the official brand site, or makita.com/bosch.com/dewalt.com. If not found, return empty string.` }]
      });
      const text = msg.content[0]?.text?.trim() || '';
      if (text.startsWith('http')) manual_url = text;
    } catch {}
  }

  const r = db.prepare('INSERT INTO blajeni_tools (user_id,name,brand,model,category,purchase_date,purchase_price,store,condition,manual_url) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(req.user.id, name, brand, model, category, purchase_date, purchase_price, store, condition, manual_url);
  res.json(db.prepare('SELECT * FROM blajeni_tools WHERE id=?').get(r.lastInsertRowid));
});

router.put('/tools/:id', (req, res) => {
  const { name, brand, model, category, purchase_date, purchase_price, store, condition, manual_url } = req.body;
  db.prepare('UPDATE blajeni_tools SET name=COALESCE(?,name), brand=COALESCE(?,brand), model=COALESCE(?,model), category=COALESCE(?,category), purchase_date=COALESCE(?,purchase_date), purchase_price=COALESCE(?,purchase_price), store=COALESCE(?,store), condition=COALESCE(?,condition), manual_url=COALESCE(?,manual_url) WHERE id=? AND user_id=?')
    .run(name, brand, model, category, purchase_date, purchase_price, store, condition, manual_url, req.params.id, req.user.id);
  res.json(db.prepare('SELECT * FROM blajeni_tools WHERE id=?').get(req.params.id));
});

router.delete('/tools/:id', (req, res) => {
  db.prepare('DELETE FROM blajeni_tools WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── ASSISTANT CHAT ───────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages, tool_context } = req.body;
  const topics = db.prepare('SELECT title,status FROM blajeni_topics WHERE user_id=?').all(req.user.id);
  const tools = db.prepare('SELECT name,brand,model FROM blajeni_tools WHERE user_id=?').all(req.user.id);
  const topicList = topics.map(t => `- ${t.title} (${t.status})`).join('\n') || 'Niciun proiect adăugat.';
  const toolList = tools.map(t => `- ${t.brand} ${t.model} (${t.name})`).join('\n') || 'Nicio sculă adăugată.';

  const systemPrompt = tool_context
    ? `Ești un asistent tehnic expert pentru ${tool_context.brand} ${tool_context.model}. Ajuți cu probleme tehnice, utilizare și întreținere. Răspunde în română.`
    : `Ești asistentul casei de la Blajeni. Ajuți cu proiecte de renovare și construcție.\n\nProiecte active:\n${topicList}\n\nScule disponibile:\n${toolList}\n\nRăspunde în română, concis și practic.`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  });
  res.json({ reply: msg.content[0]?.text || '' });
});

export default router;
