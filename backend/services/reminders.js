import { Resend } from 'resend';
import db from '../db/db.js';

const resend = new Resend(process.env.RESEND_API_KEY);

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function buildEmailHtml(docs, userName) {
  const rows = docs.map(d => {
    const days = daysUntil(d.expiry_date);
    const color = days <= 7 ? '#f87171' : days <= 14 ? '#fbbf24' : '#ffa047';
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #1e1a14;font-weight:500;color:#f2ede5">${d.type}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e1a14;color:#a09880">${d.expiry_date}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e1a14;color:${color};font-weight:600">${days} zile</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c0a08;font-family:'Segoe UI',system-ui,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="margin-bottom:28px">
      <span style="font-family:monospace;font-size:13px;letter-spacing:0.3em;color:#ffa047">JARVIS</span>
      <h1 style="margin:8px 0 4px;font-size:22px;font-weight:500;color:#f2ede5">Documente mașină — reminder expirare</h1>
      <p style="margin:0;color:#a09880;font-size:14px">Bună${userName ? ', ' + userName : ''}! Ai documente care expiră în curând.</p>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#18140f;border-radius:14px;overflow:hidden;border:1px solid #1e1a14">
      <thead>
        <tr style="background:#201c16">
          <th style="padding:10px 16px;text-align:left;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6357">Document</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6357">Expiră</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6357">Zile rămase</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:24px;font-size:12px;color:#4a4540">Acest email a fost trimis automat de Jarvis. Nu răspunde la acest email.</p>
  </div>
</body>
</html>`;
}

export async function checkAndSendReminders() {
  const users = db.prepare('SELECT id, email FROM users').all();
  const TRIGGER_DAYS = [30, 14, 7, 1];

  for (const user of users) {
    const docs = db.prepare('SELECT * FROM car_documents WHERE user_id=?').all(user.id);
    const toRemind = docs.filter(d => {
      const days = daysUntil(d.expiry_date);
      return TRIGGER_DAYS.includes(days);
    });

    if (!toRemind.length) continue;

    const to = process.env.REMINDER_EMAIL || user.email;
    if (!to) continue;

    try {
      await resend.emails.send({
        from: 'Jarvis <reminders@jarvis.app>',
        to,
        subject: `🚗 ${toRemind.length} document${toRemind.length > 1 ? 'e' : ''} expiră în curând`,
        html: buildEmailHtml(toRemind, user.email?.split('@')[0])
      });
      console.log(`Reminder sent to ${to} for ${toRemind.map(d => d.type).join(', ')}`);
    } catch (err) {
      console.error('Resend error:', err.message);
    }
  }
}

export async function sendTestReminder(email, userId) {
  const docs = db.prepare('SELECT * FROM car_documents WHERE user_id=? ORDER BY expiry_date ASC LIMIT 3').all(userId);
  const mockDocs = docs.length ? docs : [
    { type: 'ITP', expiry_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) },
    { type: 'RCA', expiry_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) },
  ];

  await resend.emails.send({
    from: 'Jarvis <reminders@jarvis.app>',
    to: email,
    subject: '[TEST] Jarvis — reminder expirare documente mașină',
    html: buildEmailHtml(mockDocs, email.split('@')[0])
  });
}
