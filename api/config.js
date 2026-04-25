import { readConfig, writeConfig } from '../lib/storage.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(readConfig());
  }
  if (req.method === 'PUT') {
    writeConfig(req.body || {});
    return res.json({ ok: true });
  }
  res.status(405).json({ error: 'Método no permitido' });
}
