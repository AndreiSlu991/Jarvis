import { Router } from 'express';
import db from '../db/db.js';
import { generateFitnessAdvice } from '../services/claude.js';

const router = Router();

router.get('/sessions', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM fitness_sessions WHERE user_id = ? ORDER BY date DESC LIMIT 60')
    .all(req.user.id)
    .map((r) => ({ ...r, exercises: JSON.parse(r.exercises_json || '[]') }));
  res.json(rows);
});

router.post('/sessions', (req, res) => {
  const {
    date = new Date().toISOString().slice(0, 10),
    type = 'morning',
    duration = 15,
    exercises = [],
    hrv = null,
    sleep_score = null,
    notes = ''
  } = req.body || {};
  const info = db
    .prepare(
      'INSERT INTO fitness_sessions (user_id, date, type, duration, exercises_json, hrv, sleep_score, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(req.user.id, date, type, duration, JSON.stringify(exercises), hrv, sleep_score, notes);
  res.status(201).json(db.prepare('SELECT * FROM fitness_sessions WHERE id = ?').get(info.lastInsertRowid));
});

// Garmin HRV/sleep data without a workout — stored as a 'metrics' session.
router.post('/garmin', (req, res) => {
  const { date = new Date().toISOString().slice(0, 10), hrv, sleep_score } = req.body || {};
  if (hrv == null && sleep_score == null) {
    return res.status(400).json({ error: 'hrv or sleep_score is required' });
  }
  const info = db
    .prepare(
      "INSERT INTO fitness_sessions (user_id, date, type, duration, exercises_json, hrv, sleep_score) VALUES (?, ?, 'metrics', 0, '[]', ?, ?)"
    )
    .run(req.user.id, date, hrv ?? null, sleep_score ?? null);
  res.status(201).json(db.prepare('SELECT * FROM fitness_sessions WHERE id = ?').get(info.lastInsertRowid));
});

async function buildAdvice(userId) {
  const recent = db
    .prepare('SELECT date, type, duration, hrv, sleep_score FROM fitness_sessions WHERE user_id = ? ORDER BY date DESC LIMIT 14')
    .all(userId);
  return generateFitnessAdvice({
    equipment: ['kettlebell', 'resistance bands'],
    target_duration_min: 15,
    recent_sessions: recent
  });
}

router.get('/today', async (req, res) => {
  try {
    res.json(await buildAdvice(req.user.id));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/advice', async (req, res) => {
  try {
    res.json(await buildAdvice(req.user.id));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
