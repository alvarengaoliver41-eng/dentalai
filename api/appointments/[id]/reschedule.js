import { readAppointments, writeAppointments, getAvailableSlots } from '../../../lib/storage.js';

export default function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { id } = req.query;
  const { date, time } = req.body || {};
  const appointments = readAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Turno no encontrado' });
  const available = getAvailableSlots(date);
  if (!available.includes(time)) {
    return res.status(409).json({ error: 'Ese horario ya está ocupado' });
  }
  appointments[idx].date = date;
  appointments[idx].time = time;
  appointments[idx].updatedAt = new Date().toISOString();
  writeAppointments(appointments);
  res.json(appointments[idx]);
}
