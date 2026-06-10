import { Router } from 'express';
import db from '../db/db.js';
import { generateWeeklyMenu } from '../services/claude.js';

const router = Router();

function weekStart() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7)); // Monday
  return d.toISOString().slice(0, 10);
}

function serialize(row) {
  return {
    ...row,
    meals: JSON.parse(row.meals_json),
    shopping_list: JSON.parse(row.shopping_list_json)
  };
}

router.get('/current', (req, res) => {
  const row = db
    .prepare('SELECT * FROM menu_plans WHERE user_id = ? AND week_start = ? ORDER BY id DESC LIMIT 1')
    .get(req.user.id, weekStart());
  if (!row) return res.json(null);
  res.json(serialize(row));
});

router.post('/generate', async (req, res) => {
  try {
    const plan = await generateWeeklyMenu(req.body?.preferences || {});
    const info = db
      .prepare('INSERT INTO menu_plans (user_id, week_start, meals_json, shopping_list_json) VALUES (?, ?, ?, ?)')
      .run(req.user.id, weekStart(), JSON.stringify(plan.meals), JSON.stringify(plan.shopping_list));
    res.status(201).json(serialize(db.prepare('SELECT * FROM menu_plans WHERE id = ?').get(info.lastInsertRowid)));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.put('/:id/shopping', (req, res) => {
  const row = db.prepare('SELECT * FROM menu_plans WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Menu plan not found' });
  const list = JSON.parse(row.shopping_list_json);
  const { index, checked } = req.body || {};
  if (typeof index !== 'number' || !list[index]) return res.status(400).json({ error: 'Invalid item index' });
  list[index].checked = !!checked;
  db.prepare('UPDATE menu_plans SET shopping_list_json = ? WHERE id = ?').run(JSON.stringify(list), row.id);
  res.json({ ok: true, shopping_list: list });
});

export default router;
