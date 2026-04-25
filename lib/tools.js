import { v4 as uuidv4 } from 'uuid';
import {
  readAppointments,
  writeAppointments,
  getAvailableSlots
} from './storage.js';

export const tools = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Devuelve la lista de horarios libres en una fecha. Llamala SIEMPRE antes de agendar para confirmar que el slot está libre.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' }
        },
        required: ['date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_appointment',
      description: 'Agenda un turno nuevo en el sistema. Solo llamala cuando ya tengas confirmado el horario libre y todos los datos obligatorios del paciente.',
      parameters: {
        type: 'object',
        properties: {
          patientName: { type: 'string', description: 'Nombre y apellido del paciente' },
          date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
          time: { type: 'string', description: 'Hora en formato HH:MM (cada 30 min, de 09:00 a 17:30)' },
          service: { type: 'string', description: 'Servicio a realizar (ej: Limpieza dental)' },
          patientPhone: { type: 'string', description: 'Teléfono del paciente (opcional)' },
          patientEmail: { type: 'string', description: 'Email del paciente (opcional)' }
        },
        required: ['patientName', 'date', 'time', 'service']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: 'Cancela un turno existente.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID del turno a cancelar' }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_appointment',
      description: 'Reprograma un turno existente a otra fecha y/u hora.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID del turno' },
          date: { type: 'string', description: 'Nueva fecha YYYY-MM-DD' },
          time: { type: 'string', description: 'Nueva hora HH:MM' }
        },
        required: ['id', 'date', 'time']
      }
    }
  }
];

export async function executeTool(name, params) {
  if (name === 'check_availability') {
    return { date: params.date, slots: getAvailableSlots(params.date) };
  }
  if (name === 'create_appointment') {
    const { patientName, patientEmail, patientPhone, date, time, service } = params;
    if (!patientName || !date || !time || !service) {
      return { error: 'Faltan datos obligatorios' };
    }
    const available = getAvailableSlots(date);
    if (!available.includes(time)) {
      return { error: 'Ese horario ya está ocupado' };
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
    const appointments = readAppointments();
    appointments.push(appointment);
    writeAppointments(appointments);
    return appointment;
  }
  if (name === 'cancel_appointment') {
    const appointments = readAppointments();
    const idx = appointments.findIndex(a => a.id === params.id);
    if (idx === -1) return { error: 'Turno no encontrado' };
    appointments[idx].status = 'cancelled';
    appointments[idx].cancelledAt = new Date().toISOString();
    writeAppointments(appointments);
    return appointments[idx];
  }
  if (name === 'reschedule_appointment') {
    const appointments = readAppointments();
    const idx = appointments.findIndex(a => a.id === params.id);
    if (idx === -1) return { error: 'Turno no encontrado' };
    const available = getAvailableSlots(params.date);
    if (!available.includes(params.time)) {
      return { error: 'Ese horario ya está ocupado' };
    }
    appointments[idx].date = params.date;
    appointments[idx].time = params.time;
    appointments[idx].updatedAt = new Date().toISOString();
    writeAppointments(appointments);
    return appointments[idx];
  }
  return { error: `Tool desconocido: ${name}` };
}
