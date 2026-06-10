import { Router } from 'express';
import fs from 'fs';
import db from '../db/db.js';
import { uploadFile } from '../middleware/upload.js';
import { parseFitFile } from '../services/fitParser.js';
import { getTours } from '../services/komoot.js';

const router = Router();

router.get('/activities', (req, res) => {
  const rows = db
    .prepare(
      'SELECT id, user_id, date, title, distance, duration, elevation, avg_hr, max_hr, source, created_at FROM bike_activities WHERE user_id = ? ORDER BY date DESC LIMIT 100'
    )
    .all(req.user.id);
  res.json(rows);
});

router.get('/activities/:id', (req, res) => {
  const row = db
    .prepare('SELECT * FROM bike_activities WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Activity not found' });
  res.json({ ...row, fit_data: row.fit_data_json ? JSON.parse(row.fit_data_json) : null });
});

async function importFit(req, res, source) {
  if (!req.file) return res.status(400).json({ error: 'No FIT file uploaded' });
  try {
    const data = await parseFitFile(req.file.path);
    const date = new Date(data.date).toISOString().slice(0, 10);
    const info = db
      .prepare(
        'INSERT INTO bike_activities (user_id, date, title, distance, duration, elevation, avg_hr, max_hr, fit_data_json, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        req.user.id, date,
        req.body?.title || `${data.sport} ${date}`,
        data.distance, data.duration, data.elevation, data.avg_hr, data.max_hr,
        JSON.stringify({ ...data, track: data.track.filter((_, i) => i % 5 === 0) }),
        source
      );
    res.status(201).json(
      db.prepare('SELECT id, date, title, distance, duration, elevation, avg_hr, max_hr, source FROM bike_activities WHERE id = ?')
        .get(info.lastInsertRowid)
    );
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
}

router.post('/activities/upload', uploadFile.single('file'), (req, res) =>
  importFit(req, res, req.body?.source || 'upload')
);
router.post('/sync/garmin', uploadFile.single('file'), (req, res) => importFit(req, res, 'garmin'));
router.post('/sync/coros', uploadFile.single('file'), (req, res) => importFit(req, res, 'coros'));

router.get('/komoot', async (req, res) => {
  try {
    res.json(await getTours(req.query.type || 'tour_planned'));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
