import { readConfig, writeConfig } from '../lib/storage.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.json(await readConfig());
    }
    if (req.method === 'PUT') {
      await writeConfig(req.body || {});
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('config error:', err);
    res.status(500).json({ error: 'Error al leer/escribir la configuración' });
  }
}
