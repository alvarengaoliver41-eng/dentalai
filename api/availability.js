import { getAvailableSlots } from '../lib/storage.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Falta la fecha' });
  res.json({ date, slots: getAvailableSlots(date) });
}
