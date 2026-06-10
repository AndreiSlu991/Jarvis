import { Router } from 'express';
import db from '../db/db.js';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── CAR INFO ─────────────────────────────────────────────
router.get('/info', (req, res) => {
  const info = db.prepare('SELECT * FROM car_info WHERE user_id=?').get(req.user.id);
  res.json(info || {});
});

router.put('/info', (req, res) => {
  const { make, model, year, fuel_type } = req.body;
  const existing = db.prepare('SELECT id FROM car_info WHERE user_id=?').get(req.user.id);
  if (existing) {
    db.prepare('UPDATE car_info SET make=?,model=?,year=?,fuel_type=?,updated_at=datetime("now") WHERE user_id=?').run(make, model, year, fuel_type, req.user.id);
  } else {
    db.prepare('INSERT INTO car_info (user_id,make,model,year,fuel_type) VALUES (?,?,?,?,?)').run(req.user.id, make, model, year, fuel_type);
  }
  res.json(db.prepare('SELECT * FROM car_info WHERE user_id=?').get(req.user.id));
});

// ── DOCUMENTS ───────────────────────────────────────────
router.get('/documents', (req, res) => {
  res.json(db.prepare('SELECT * FROM car_documents WHERE user_id=? ORDER BY expiry_date ASC').all(req.user.id));
});

router.post('/documents', (req, res) => {
  const { type, expiry_date, reminder_days = 30, notes = '' } = req.body;
  const existing = db.prepare('SELECT id FROM car_documents WHERE user_id=? AND type=?').get(req.user.id, type);
  if (existing) {
    db.prepare('UPDATE car_documents SET expiry_date=?,reminder_days=?,notes=?,updated_at=datetime("now") WHERE id=?').run(expiry_date, reminder_days, notes, existing.id);
    return res.json(db.prepare('SELECT * FROM car_documents WHERE id=?').get(existing.id));
  }
  const r = db.prepare('INSERT INTO car_documents (user_id,type,expiry_date,reminder_days,notes) VALUES (?,?,?,?,?)').run(req.user.id, type, expiry_date, reminder_days, notes);
  res.json(db.prepare('SELECT * FROM car_documents WHERE id=?').get(r.lastInsertRowid));
});

router.delete('/documents/:id', (req, res) => {
  db.prepare('DELETE FROM car_documents WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── MAINTENANCE ──────────────────────────────────────────
router.get('/maintenance', (req, res) => {
  res.json(db.prepare('SELECT * FROM car_maintenance WHERE user_id=? ORDER BY date DESC').all(req.user.id));
});

router.post('/maintenance', (req, res) => {
  const { type, date, km = 0, next_km = 0, cost = 0, description = '' } = req.body;
  const r = db.prepare('INSERT INTO car_maintenance (user_id,type,date,km,next_km,cost,description) VALUES (?,?,?,?,?,?,?)').run(req.user.id, type, date, km, next_km, cost, description);
  res.json(db.prepare('SELECT * FROM car_maintenance WHERE id=?').get(r.lastInsertRowid));
});

router.delete('/maintenance/:id', (req, res) => {
  db.prepare('DELETE FROM car_maintenance WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── FUEL LOGS ─────────────────────────────────────────────
router.get('/fuel', (req, res) => {
  res.json(db.prepare('SELECT * FROM car_fuel_logs WHERE user_id=? ORDER BY date DESC').all(req.user.id));
});

router.post('/fuel', (req, res) => {
  const { date, liters, price_per_liter, km_odometer, station = '', full_tank = 1 } = req.body;
  const r = db.prepare('INSERT INTO car_fuel_logs (user_id,date,liters,price_per_liter,km_odometer,station,full_tank) VALUES (?,?,?,?,?,?,?)').run(req.user.id, date, liters, price_per_liter, km_odometer, station, full_tank);
  res.json(db.prepare('SELECT * FROM car_fuel_logs WHERE id=?').get(r.lastInsertRowid));
});

router.delete('/fuel/:id', (req, res) => {
  db.prepare('DELETE FROM car_fuel_logs WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── FUEL STATS ───────────────────────────────────────────
router.get('/fuel/stats', (req, res) => {
  const logs = db.prepare('SELECT * FROM car_fuel_logs WHERE user_id=? AND full_tank=1 ORDER BY date ASC, km_odometer ASC').all(req.user.id);
  const consumptions = [];
  for (let i = 1; i < logs.length; i++) {
    const km = logs[i].km_odometer - logs[i-1].km_odometer;
    if (km > 0) {
      consumptions.push({
        date: logs[i].date,
        l_100km: (logs[i].liters / km) * 100,
        km
      });
    }
  }
  const allLogs = db.prepare('SELECT * FROM car_fuel_logs WHERE user_id=? ORDER BY date DESC').all(req.user.id);
  const totalSpent = allLogs.reduce((s, l) => s + l.liters * l.price_per_liter, 0);
  const totalLiters = allLogs.reduce((s, l) => s + l.liters, 0);
  res.json({ consumptions, totalSpent, totalLiters });
});

// ── COSTS SUMMARY ────────────────────────────────────────
router.get('/costs', (req, res) => {
  const year = new Date().getFullYear();
  const fuel = db.prepare('SELECT SUM(liters * price_per_liter) AS total FROM car_fuel_logs WHERE user_id=? AND strftime("%Y",date)=?').get(req.user.id, String(year));
  const maintenance = db.prepare('SELECT SUM(cost) AS total FROM car_maintenance WHERE user_id=? AND strftime("%Y",date)=?').get(req.user.id, String(year));
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', date) AS month,
      SUM(liters * price_per_liter) AS fuel,
      0 AS maintenance
    FROM car_fuel_logs WHERE user_id=? AND strftime('%Y',date)=?
    GROUP BY month
    UNION ALL
    SELECT strftime('%Y-%m', date) AS month, 0 AS fuel, SUM(cost) AS maintenance
    FROM car_maintenance WHERE user_id=? AND strftime('%Y',date)=?
    GROUP BY month
    ORDER BY month
  `).all(req.user.id, String(year), req.user.id, String(year));

  res.json({
    year,
    fuel: fuel?.total || 0,
    maintenance: maintenance?.total || 0,
    total: (fuel?.total || 0) + (maintenance?.total || 0),
    monthly
  });
});

// ── ASSISTANT CHAT ───────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  const info = db.prepare('SELECT * FROM car_info WHERE user_id=?').get(req.user.id) || {};
  const maintenance = db.prepare('SELECT type,date,km,description FROM car_maintenance WHERE user_id=? ORDER BY date DESC LIMIT 10').all(req.user.id);
  const lastFuel = db.prepare('SELECT * FROM car_fuel_logs WHERE user_id=? ORDER BY date DESC LIMIT 1').get(req.user.id);

  const svcHistory = maintenance.map(m => `- ${m.date}: ${m.type} la ${m.km}km${m.description ? ' — ' + m.description : ''}`).join('\n') || 'Fără istoric service.';
  const carDesc = info.make ? `${info.make} ${info.model} ${info.year} (${info.fuel_type})` : 'mașina ta';

  const systemPrompt = `Ești un expert auto. Utilizatorul are un ${carDesc}.
Km actuali: ${lastFuel?.km_odometer || 'necunoscut'}.
Istoric service recent:
${svcHistory}

Răspunde în română, concis și practic. Dacă recomanzi verificări, fii specific.`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  });
  res.json({ reply: msg.content[0]?.text || '' });
});

// ── NEXT EXPIRING DOC (for dashboard) ───────────────────
router.get('/next-expiry', (req, res) => {
  const doc = db.prepare('SELECT * FROM car_documents WHERE user_id=? ORDER BY expiry_date ASC LIMIT 1').get(req.user.id);
  if (!doc) return res.json(null);
  const days = Math.ceil((new Date(doc.expiry_date) - new Date()) / 86400000);
  res.json({ ...doc, days_remaining: days });
});

export default router;
