import { v4 as uuidv4 } from 'uuid';
import { getAvailableSlotsSync } from './storage.js';

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

// appointments is the current array from the frontend; returns { result, appointments }
export function executeTool(name, params, appointments) {
  const appts = [...appointments];

  if (name === 'check_availability') {
    const slots = getAvailableSlotsSync(appts, params.date);
    return { result: { date: params.date, slots }, appointments: appts };
  }

  if (name === 'create_appointment') {
    const { patientName, patientEmail, patientPhone, date, time, service } = params;
    if (!patientName || !date || !time || !service) {
      return { result: { error: 'Faltan datos obligatorios' }, appointments: appts };
    }
    const slots = getAvailableSlotsSync(appts, date);
    if (!slots.includes(time)) {
      return { result: { error: 'Ese horario ya está ocupado' }, appointments: appts };
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
    return { result: appointment, appointments: [...appts, appointment] };
  }

  if (name === 'cancel_appointment') {
    const idx = appts.findIndex(a => a.id === params.id);
    if (idx === -1) return { result: { error: 'Turno no encontrado' }, appointments: appts };
    appts[idx] = { ...appts[idx], status: 'cancelled', cancelledAt: new Date().toISOString() };
    return { result: appts[idx], appointments: appts };
  }

  if (name === 'reschedule_appointment') {
    const idx = appts.findIndex(a => a.id === params.id);
    if (idx === -1) return { result: { error: 'Turno no encontrado' }, appointments: appts };
    const slots = getAvailableSlotsSync(appts, params.date);
    if (!slots.includes(params.time)) {
      return { result: { error: 'Ese horario ya está ocupado' }, appointments: appts };
    }
    appts[idx] = { ...appts[idx], date: params.date, time: params.time, updatedAt: new Date().toISOString() };
    return { result: appts[idx], appointments: appts };
  }

  return { result: { error: `Tool desconocido: ${name}` }, appointments: appts };
}
