import { Router } from 'express';
import db from '../db/db.js';

const router = Router();

router.get('/projects', (req, res) => {
  res.json(db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY id').all(req.user.id));
});

router.post('/projects', (req, res) => {
  const { name, color = '#3b82f6', icon = 'folder' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const info = db
    .prepare('INSERT INTO projects (user_id, name, slug, color, icon) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, name, slug, color, icon);
  res.status(201).json(db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid));
});

router.get('/search', (req, res) => {
  const q = `%${req.query.q || ''}%`;
  res.json(
    db.prepare(
      `SELECT * FROM notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
       ORDER BY updated_at DESC LIMIT 50`
    ).all(req.user.id, q, q, q)
  );
});

router.get('/', (req, res) => {
  const { project_id } = req.query;
  const rows = project_id
    ? db.prepare('SELECT * FROM notes WHERE user_id = ? AND project_id = ? ORDER BY updated_at DESC')
        .all(req.user.id, project_id)
    : db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { project_id = null, title, content = '', tags = '' } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const info = db
    .prepare('INSERT INTO notes (user_id, project_id, title, content, tags) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, project_id, title, content, tags);
  res.status(201).json(db.prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  const { title = note.title, content = note.content, tags = note.tags, project_id = note.project_id } =
    req.body || {};
  db.prepare(
    "UPDATE notes SET title = ?, content = ?, tags = ?, project_id = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(title, content, tags, project_id, note.id);
  res.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(note.id));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: 'Note not found' });
  res.json({ ok: true });
});

export default router;
