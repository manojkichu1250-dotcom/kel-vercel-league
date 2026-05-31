const { del, list, put } = require('@vercel/blob');

const DATA_ROOT = 'kel-data-fresh';

function cleanSeason(season) {
  return String(season || '').replace(/[^0-9]/g, '');
}

function seasonPrefix(season) {
  const clean = cleanSeason(season);
  return clean ? `${DATA_ROOT}/season-${clean}/` : '';
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function getLatestSeasonData(season) {
  const prefix = seasonPrefix(season);
  if (!prefix) return null;

  const { blobs } = await list({ prefix, limit: 1000 });

  const latest = blobs
    .filter((b) => b.pathname.endsWith('.json'))
    .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))[0];

  if (!latest) return null;

  const response = await fetch(`${latest.url}?t=${Date.now()}`);
  if (!response.ok) throw new Error('Could not read blob: ' + response.status);
  return response.json();
}

async function saveSeasonData(season, data) {
  const prefix = seasonPrefix(season);
  if (!prefix) throw new Error('Missing season');

  const pathname = `${prefix}${Date.now()}.json`;

  const blob = await put(pathname, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });

  // Keep only 5 most recent blobs per season, delete the rest
  const { blobs } = await list({ prefix, limit: 1000 });
  const old = blobs
    .filter((b) => b.pathname.endsWith('.json') && b.pathname !== blob.pathname)
    .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))
    .slice(5);

  if (old.length) await del(old.map((b) => b.url));

  return blob;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const season = cleanSeason(req.query.season);
      if (!season) return res.status(400).json({ error: 'Missing season' });
      const data = await getLatestSeasonData(season);
      return res.status(200).json({ data: data || null });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const clean = cleanSeason(body.season);
      if (!clean || !body.data) return res.status(400).json({ error: 'Missing season or data' });
      const blob = await saveSeasonData(clean, body.data);
      return res.status(200).json({ ok: true, url: blob.url });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('kel-data error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
