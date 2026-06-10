// Komoot has no official public API; this uses the same endpoints the web app uses,
// authenticated with the account email/password from env.
let cached = null; // { userId, auth, expires }

async function login() {
  const email = process.env.KOMOOT_EMAIL;
  const password = process.env.KOMOOT_PASSWORD;
  if (!email || !password) throw new Error('Komoot is not configured (KOMOOT_EMAIL / KOMOOT_PASSWORD)');

  if (cached && cached.expires > Date.now()) return cached;

  const res = await fetch(
    `https://api.komoot.de/v006/account/email/${encodeURIComponent(email)}/`,
    { headers: { Authorization: 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64') } }
  );
  if (!res.ok) throw new Error(`Komoot login failed (${res.status})`);
  const data = await res.json();
  cached = {
    userId: data.username,
    auth: 'Basic ' + Buffer.from(`${data.username}:${data.password}`).toString('base64'),
    expires: Date.now() + 30 * 60 * 1000
  };
  return cached;
}

export async function getTours(type = 'tour_planned', limit = 20) {
  const { userId, auth } = await login();
  const res = await fetch(
    `https://api.komoot.de/v007/users/${userId}/tours/?type=${type}&limit=${limit}&sort_field=date&sort_direction=desc`,
    { headers: { Authorization: auth } }
  );
  if (!res.ok) throw new Error(`Komoot tours fetch failed (${res.status})`);
  const data = await res.json();
  return (data._embedded?.tours || []).map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    sport: t.sport,
    date: t.date,
    distance: t.distance != null ? t.distance / 1000 : null,
    duration: t.duration ?? null,
    elevation_up: t.elevation_up ?? null,
    elevation_down: t.elevation_down ?? null
  }));
}
