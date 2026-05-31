import { put, list } from '@vercel/blob';

function cleanSeason(season) {
  return String(season || '').replace(/[^0-9]/g, '');
}

function blobPath(season) {
  const clean = cleanSeason(season);
  return clean ? `kel-data/season-${clean}.json` : '';
}

async function readJsonBlob(path) {
  const found = await list({ prefix: path, limit: 1 });

  if (!found.blobs || found.blobs.length === 0) {
    return null;
  }

  const response = await fetch(found.blobs[0].url, { cache: 'no-store' });

  if (!response.ok) {
    return null;
  }

  return response.json();
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
      const path = blobPath(req.query.season);
      if (!path) return res.status(400).json({ error: 'Missing season' });

      const data = await readJsonBlob(path);
      return res.status(200).json({ data });
    }

    if (req.method === 'POST') {
      const { season, data } = req.body || {};
      const path = blobPath(season);

      if (!path || !data) {
        return res.status(400).json({ error: 'Missing season or data' });
      }

      await put(path, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
