import { Router } from 'express';
import db from '../db/db.js';
import { uploadAudio } from '../middleware/upload.js';
import { transcribeAudio } from '../services/whisper.js';
import { extractActionItems } from '../services/claude.js';

const router = Router();

router.get('/recordings', (req, res) => {
  const rows = db
    .prepare('SELECT id, date, title, action_items_json, created_at FROM work_recordings WHERE user_id = ? ORDER BY created_at DESC LIMIT 100')
    .all(req.user.id)
    .map((r) => ({ ...r, action_items: JSON.parse(r.action_items_json || '[]') }));
  res.json(rows);
});

router.get('/recordings/:id', (req, res) => {
  const row = db
    .prepare('SELECT * FROM work_recordings WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Recording not found' });
  res.json({ ...row, action_items: JSON.parse(row.action_items_json || '[]') });
});

router.post('/recordings/upload', uploadAudio.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
  try {
    const transcript = await transcribeAudio(req.file.path);
    let extracted = { title: req.body?.title || 'Meeting', summary: '', action_items: [] };
    try {
      extracted = await extractActionItems(transcript);
    } catch (err) {
      // Keep the transcript even if action item extraction fails.
      extracted.summary = `Action item extraction failed: ${err.message}`;
    }
    const date = new Date().toISOString().slice(0, 10);
    const info = db
      .prepare('INSERT INTO work_recordings (user_id, date, title, audio_file, transcript, action_items_json) VALUES (?, ?, ?, ?, ?, ?)')
      .run(
        req.user.id, date,
        req.body?.title || extracted.title || 'Meeting',
        req.file.filename, transcript,
        JSON.stringify(extracted.action_items || [])
      );
    const row = db.prepare('SELECT * FROM work_recordings WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ ...row, action_items: JSON.parse(row.action_items_json), summary: extracted.summary });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.put('/recordings/:id/actions', (req, res) => {
  const row = db
    .prepare('SELECT id FROM work_recordings WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Recording not found' });
  if (!Array.isArray(req.body?.action_items)) {
    return res.status(400).json({ error: 'action_items array is required' });
  }
  db.prepare('UPDATE work_recordings SET action_items_json = ? WHERE id = ?').run(
    JSON.stringify(req.body.action_items), row.id
  );
  res.json({ ok: true, action_items: req.body.action_items });
});

router.delete('/recordings/:id', (req, res) => {
  const info = db.prepare('DELETE FROM work_recordings WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: 'Recording not found' });
  res.json({ ok: true });
});

export default router;
