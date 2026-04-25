import { v4 as uuidv4 } from 'uuid';
import { readAppointments, writeAppointments, getAvailableSlots } from '../lib/storage.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.json(await readAppointments());
    }

    if (req.method === 'POST') {
      const { patientName, patientEmail, patientPhone, date, time, service } = req.body || {};
      if (!patientName || !date || !time || !service) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
      }
      const available = await getAvailableSlots(date);
      if (!available.includes(time)) {
        return res.status(409).json({ error: 'Ese horario ya está ocupado' });
      }
      const appointment = {
        id: uuidv4(),
        patientName,
        patientEmail: patientEmail || '',
        patientPhone: patientPhone || '',
        date,
        time,
        service,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      const appointments = await readAppointments();
      appointments.push(appointment);
      await writeAppointments(appointments);
      return res.status(201).json(appointment);
    }

    if (req.method === 'DELETE') {
      const { scope } = req.query;
      const appointments = await readAppointments();
      let kept;
      if (scope === 'all') {
        kept = [];
      } else if (scope === 'history') {
        kept = appointments.filter(a => a.status === 'active');
      } else {
        return res.status(400).json({ error: 'Parámetro scope inválido. Usá "all" o "history".' });
      }
      const removedCount = appointments.length - kept.length;
      await writeAppointments(kept);
      return res.json({ ok: true, removedCount });
    }

    res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('appointments error:', err);
    res.status(500).json({ error: 'Error al procesar turnos' });
  }
}
