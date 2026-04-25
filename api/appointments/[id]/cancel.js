import { readAppointments, writeAppointments } from '../../../lib/storage.js';

export default function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { id } = req.query;
  const appointments = readAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Turno no encontrado' });
  appointments[idx].status = 'cancelled';
  appointments[idx].cancelledAt = new Date().toISOString();
  writeAppointments(appointments);
  res.json(appointments[idx]);
}
