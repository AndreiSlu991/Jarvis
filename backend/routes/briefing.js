import { Router } from 'express';
import db from '../db/db.js';
import { generateDailyBriefing } from '../services/claude.js';

const router = Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function gatherUserData(userId) {
  const date = today();
  const habits = db
    .prepare(
      `SELECT h.name, h.category,
        (SELECT COUNT(*) FROM habit_logs l WHERE l.habit_id = h.id AND l.date = ?) AS done_today
       FROM habits h WHERE h.user_id = ?`
    )
    .all(date, userId);
  const tasks = db
    .prepare(
      "SELECT title, status, priority, due_date FROM blajeni_tasks WHERE user_id = ? AND status != 'done' ORDER BY priority LIMIT 10"
    )
    .all(userId);
  const lastFitness = db
    .prepare('SELECT date, type, hrv, sleep_score FROM fitness_sessions WHERE user_id = ? ORDER BY date DESC LIMIT 1')
    .get(userId);
  return { date, habits, open_tasks: tasks, last_fitness: lastFitness || null };
}

async function generate(userId) {
  const date = today();
  const content = await generateDailyBriefing(gatherUserData(userId));
  db.prepare(
    `INSERT INTO daily_briefings (user_id, date, content) VALUES (?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET content = excluded.content, created_at = datetime('now')`
  ).run(userId, date, content);
  return { date, content };
}

router.get('/today', async (req, res) => {
  try {
    const existing = db
      .prepare('SELECT date, content, created_at FROM daily_briefings WHERE user_id = ? AND date = ?')
      .get(req.user.id, today());
    if (existing) return res.json(existing);
    res.json(await generate(req.user.id));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    res.json(await generate(req.user.id));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
