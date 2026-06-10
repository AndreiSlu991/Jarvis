import { Router } from 'express';
import db from '../db/db.js';

const router = Router();

router.get('/tasks', (req, res) => {
  res.json(
    db.prepare("SELECT * FROM blajeni_tasks WHERE user_id = ? ORDER BY CASE status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, created_at DESC")
      .all(req.user.id)
  );
});

router.post('/tasks', (req, res) => {
  const { title, description = '', category = 'general', status = 'todo', priority = 'medium', due_date = null } =
    req.body || {};
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const info = db
    .prepare('INSERT INTO blajeni_tasks (user_id, title, description, category, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(req.user.id, title, description, category, status, priority, due_date);
  res.status(201).json(db.prepare('SELECT * FROM blajeni_tasks WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/tasks/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM blajeni_tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const {
    title = task.title, description = task.description, category = task.category,
    status = task.status, priority = task.priority, due_date = task.due_date
  } = req.body || {};
  db.prepare(
    "UPDATE blajeni_tasks SET title = ?, description = ?, category = ?, status = ?, priority = ?, due_date = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(title, description, category, status, priority, due_date, task.id);
  res.json(db.prepare('SELECT * FROM blajeni_tasks WHERE id = ?').get(task.id));
});

router.delete('/tasks/:id', (req, res) => {
  const info = db.prepare('DELETE FROM blajeni_tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: 'Task not found' });
  res.json({ ok: true });
});

router.get('/notes', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM blajeni_notes WHERE user_id = ? ORDER BY updated_at DESC')
    .all(req.user.id)
    .map((r) => ({ ...r, photos: JSON.parse(r.photos_json || '[]') }));
  res.json(rows);
});

router.post('/notes', (req, res) => {
  const { title, content = '', category = 'general', photos = [] } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const info = db
    .prepare('INSERT INTO blajeni_notes (user_id, title, content, category, photos_json) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, title, content, category, JSON.stringify(photos));
  res.status(201).json(db.prepare('SELECT * FROM blajeni_notes WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/notes/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM blajeni_notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  const { title = note.title, content = note.content, category = note.category } = req.body || {};
  const photos = req.body?.photos ? JSON.stringify(req.body.photos) : note.photos_json;
  db.prepare(
    "UPDATE blajeni_notes SET title = ?, content = ?, category = ?, photos_json = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(title, content, category, photos, note.id);
  res.json(db.prepare('SELECT * FROM blajeni_notes WHERE id = ?').get(note.id));
});

router.delete('/notes/:id', (req, res) => {
  const info = db.prepare('DELETE FROM blajeni_notes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: 'Note not found' });
  res.json({ ok: true });
});

export default router;
