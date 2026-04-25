import { readAppointments, writeAppointments } from '../../../lib/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const { id } = req.query;
    const appointments = await readAppointments();
    const idx = appointments.findIndex(a => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Turno no encontrado' });
    const [removed] = appointments.splice(idx, 1);
    await writeAppointments(appointments);
    res.json({ ok: true, removed });
  } catch (err) {
    console.error('delete appointment error:', err);
    res.status(500).json({ error: 'Error al eliminar el turno' });
  }
}
