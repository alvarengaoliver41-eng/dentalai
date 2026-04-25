import { readAppointments, writeAppointments } from '../../../lib/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const { id } = req.query;
    const appointments = await readAppointments();
    const idx = appointments.findIndex(a => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Turno no encontrado' });
    appointments[idx].status = 'cancelled';
    appointments[idx].cancelledAt = new Date().toISOString();
    await writeAppointments(appointments);
    res.json(appointments[idx]);
  } catch (err) {
    console.error('cancel error:', err);
    res.status(500).json({ error: 'Error al cancelar el turno' });
  }
}
