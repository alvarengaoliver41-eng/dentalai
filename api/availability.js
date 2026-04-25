import { getAvailableSlots } from '../lib/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Falta la fecha' });
  try {
    const slots = await getAvailableSlots(date);
    res.json({ date, slots });
  } catch (err) {
    console.error('availability error:', err);
    res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
}
