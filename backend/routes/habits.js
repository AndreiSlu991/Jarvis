import { Router } from 'express';
import db from '../db/db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at').all(req.user.id));
});

router.post('/', (req, res) => {
  const { name, description = '', category = 'general', color = '#3b82f6' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const info = db
    .prepare('INSERT INTO habits (user_id, name, description, category, color) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, name, description, category, color);
  res.status(201).json(db.prepare('SELECT * FROM habits WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  const { name = habit.name, description = habit.description, category = habit.category, color = habit.color } =
    req.body || {};
  db.prepare('UPDATE habits SET name = ?, description = ?, category = ?, color = ? WHERE id = ?').run(
    name, description, category, color, habit.id
  );
  res.json(db.prepare('SELECT * FROM habits WHERE id = ?').get(habit.id));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: 'Habit not found' });
  res.json({ ok: true });
});

router.get('/logs', (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const logs = db
    .prepare(
      `SELECT l.* FROM habit_logs l JOIN habits h ON h.id = l.habit_id
       WHERE h.user_id = ? AND l.date = ?`
    )
    .all(req.user.id, date);
  res.json(logs);
});

router.post('/:id/log', (req, res) => {
  const habit = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  const date = req.body?.date || new Date().toISOString().slice(0, 10);
  const completed = req.body?.completed === false ? 0 : 1;
  if (!completed) {
    db.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?').run(habit.id, date);
    return res.json({ habit_id: habit.id, date, completed: false });
  }
  db.prepare(
    `INSERT INTO habit_logs (habit_id, date, completed, notes) VALUES (?, ?, 1, ?)
     ON CONFLICT(habit_id, date) DO UPDATE SET completed = 1, notes = excluded.notes`
  ).run(habit.id, date, req.body?.notes || null);
  res.json({ habit_id: habit.id, date, completed: true });
});

router.get('/streaks', (req, res) => {
  const habits = db.prepare('SELECT id, name, color FROM habits WHERE user_id = ?').all(req.user.id);
  const result = habits.map((h) => {
    const logs = db
      .prepare('SELECT date FROM habit_logs WHERE habit_id = ? AND completed = 1 ORDER BY date DESC LIMIT 365')
      .all(h.id)
      .map((r) => r.date);
    const logSet = new Set(logs);
    let streak = 0;
    const cursor = new Date();
    // A streak survives if today is not yet logged but yesterday was.
    if (!logSet.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
    while (logSet.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return { ...h, streak, total: logs.length, recent: logs.slice(0, 70) };
  });
  res.json(result);
});

export default router;
