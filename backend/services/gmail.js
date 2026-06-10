import { google } from 'googleapis';

function getOAuthClient() {
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    throw new Error('Gmail OAuth is not configured (GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET)');
  }
  const redirect = process.env.GMAIL_REDIRECT_URI ||
    `${process.env.APP_URL || 'http://localhost:3001'}/api/budget/gmail/callback`;
  return new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET, redirect);
}

export function getOAuthUrl() {
  return getOAuthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
}

export async function handleCallback(code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return { client, tokens };
}

export function clientFromTokens(tokens) {
  const client = getOAuthClient();
  client.setCredentials(tokens);
  return client;
}

// Fetches recent order/receipt emails (subject heuristics) for budget parsing.
export async function getOrders(authClient, maxResults = 20) {
  const gmail = google.gmail({ version: 'v1', auth: authClient });
  const q = 'subject:(order OR receipt OR invoice OR comanda OR factura) newer_than:30d';
  const list = await gmail.users.messages.list({ userId: 'me', q, maxResults });
  const messages = list.data.messages || [];
  const orders = [];
  for (const m of messages) {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: m.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date']
    });
    const headers = Object.fromEntries(
      (msg.data.payload?.headers || []).map((h) => [h.name.toLowerCase(), h.value])
    );
    orders.push({
      id: m.id,
      subject: headers.subject || '',
      from: headers.from || '',
      date: headers.date || '',
      snippet: msg.data.snippet || ''
    });
  }
  return orders;
}
