import { kv } from '@vercel/kv';

function seasonKey(season) {
  const clean = String(season || '').replace(/[^0-9]/g, '');
  return clean ? `kel:season:${clean}` : '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      const key = seasonKey(req.query.season);
      if (!key) return res.status(400).json({ error: 'Missing season' });
      const data = await kv.get(key);
      return res.status(200).json({ data: data || null });
    }

    if (req.method === 'POST') {
      const { season, data } = req.body || {};
      const key = seasonKey(season);
      if (!key || !data) return res.status(400).json({ error: 'Missing season or data' });
      await kv.set(key, data);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
