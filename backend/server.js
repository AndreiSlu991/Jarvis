import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { initSchema } from './db/schema.js';
import authMiddleware from './middleware/auth.js';
import { checkAndSendReminders } from './services/reminders.js';

import authRoutes from './routes/auth.js';
import briefingRoutes from './routes/briefing.js';
import habitsRoutes from './routes/habits.js';
import notesRoutes from './routes/notes.js';
import menuRoutes from './routes/menu.js';
import budgetRoutes from './routes/budget.js';
import fitnessRoutes from './routes/fitness.js';
import bikeRoutes from './routes/bike.js';
import workRoutes from './routes/work.js';
import blajeniRoutes from './routes/blajeni.js';
import blajeni2Routes from './routes/blajeni2.js';
import carRoutes from './routes/car.js';
import remindersRoutes from './routes/reminders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initSchema();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/briefing', authMiddleware, briefingRoutes);
app.use('/api/habits', authMiddleware, habitsRoutes);
app.use('/api/notes', authMiddleware, notesRoutes);
app.use('/api/menu', authMiddleware, menuRoutes);
app.use('/api/budget', authMiddleware, budgetRoutes);
app.use('/api/fitness', authMiddleware, fitnessRoutes);
app.use('/api/bike', authMiddleware, bikeRoutes);
app.use('/api/work', authMiddleware, workRoutes);
app.use('/api/blajeni', authMiddleware, blajeniRoutes);
app.use('/api/blajeni2', authMiddleware, blajeni2Routes);
app.use('/api/car', authMiddleware, carRoutes);
app.use('/api/reminders', authMiddleware, remindersRoutes);

// Daily reminder cron — 08:00 every day
if (process.env.RESEND_API_KEY) {
  cron.schedule('0 8 * * *', () => {
    checkAndSendReminders().catch(err => console.error('Cron reminder error:', err));
  });
}

// Serve built frontend in production (Railway single-service deploy).
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

// Central error handler (multer errors, JSON parse errors, etc.)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Jarvis backend listening on :${PORT}`));
