import { readAppointments, writeAppointments } from '../../../lib/storage.js';

export default function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { id } = req.query;
  const appointments = readAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Turno no encontrado' });
  const [removed] = appointments.splice(idx, 1);
  writeAppointments(appointments);
  res.json({ ok: true, removed });
}
