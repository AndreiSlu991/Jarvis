import { Router } from 'express';
import { sendTestReminder } from '../services/reminders.js';

const router = Router();

router.post('/test', async (req, res) => {
  const email = req.body.email || process.env.REMINDER_EMAIL;
  if (!email) return res.status(400).json({ error: 'No email address configured. Set REMINDER_EMAIL in .env or pass email in body.' });
  try {
    await sendTestReminder(email, req.user.id);
    res.json({ ok: true, sent_to: email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
