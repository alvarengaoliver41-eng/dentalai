import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const APPOINTMENTS_PATH = join(__dirname, 'data', 'appointments.json');
const CONFIG_PATH = join(__dirname, 'data', 'clinic-config.json');

function readAppointments() {
  if (!existsSync(APPOINTMENTS_PATH)) return [];
  return JSON.parse(readFileSync(APPOINTMENTS_PATH, 'utf-8'));
}

function writeAppointments(data) {
  writeFileSync(APPOINTMENTS_PATH, JSON.stringify(data, null, 2));
}

function readConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

function writeConfig(data) {
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

function generateTimeSlots() {
  const slots = [];
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

function getAvailableSlots(date) {
  const appointments = readAppointments();
  const allSlots = generateTimeSlots();
  const taken = appointments
    .filter(a => a.date === date && a.status !== 'cancelled')
    .map(a => a.time);
  return allSlots.filter(slot => !taken.includes(slot));
}

// ─── RUTAS DE CONFIGURACIÓN ───────────────────────────────────────────────────

app.get('/api/config', (req, res) => {
  res.json(readConfig());
});

app.put('/api/config', (req, res) => {
  writeConfig(req.body);
  res.json({ ok: true });
});

// ─── RUTAS DE TURNOS ──────────────────────────────────────────────────────────

app.get('/api/appointments', (req, res) => {
  res.json(readAppointments());
});

app.get('/api/availability', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Falta la fecha' });
  res.json({ date, slots: getAvailableSlots(date) });
});

app.post('/api/appointments', (req, res) => {
  const { patientName, patientEmail, patientPhone, date, time, service } = req.body;
  if (!patientName || !date || !time || !service) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  const available = getAvailableSlots(date);
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
  const appointments = readAppointments();
  appointments.push(appointment);
  writeAppointments(appointments);
  res.status(201).json(appointment);
});

app.patch('/api/appointments/:id/cancel', (req, res) => {
  const appointments = readAppointments();
  const idx = appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Turno no encontrado' });
  appointments[idx].status = 'cancelled';
  appointments[idx].cancelledAt = new Date().toISOString();
  writeAppointments(appointments);
  res.json(appointments[idx]);
});

app.delete('/api/appointments/:id', (req, res) => {
  const appointments = readAppointments();
  const idx = appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Turno no encontrado' });
  const [removed] = appointments.splice(idx, 1);
  writeAppointments(appointments);
  res.json({ ok: true, removed });
});

app.delete('/api/appointments', (req, res) => {
  const { scope } = req.query; // 'all' | 'history'
  const appointments = readAppointments();
  let kept;
  if (scope === 'all') {
    kept = [];
  } else if (scope === 'history') {
    kept = appointments.filter(a => a.status === 'active');
  } else {
    return res.status(400).json({ error: 'Parámetro scope inválido. Usá "all" o "history".' });
  }
  const removedCount = appointments.length - kept.length;
  writeAppointments(kept);
  res.json({ ok: true, removedCount });
});

app.patch('/api/appointments/:id/reschedule', (req, res) => {
  const { date, time } = req.body;
  const appointments = readAppointments();
  const idx = appointments.findIndex(a => a.id === req.params.id);
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
});

// ─── RUTA DE CHAT CON SARAH ───────────────────────────────────────────────────

const tools = [
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

async function executeTool(name, params) {
  const baseUrl = 'http://localhost:3001';
  if (name === 'check_availability') {
    const r = await fetch(`${baseUrl}/api/availability?date=${encodeURIComponent(params.date)}`);
    return await r.json();
  }
  if (name === 'create_appointment') {
    const r = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await r.json();
  }
  if (name === 'cancel_appointment') {
    const r = await fetch(`${baseUrl}/api/appointments/${params.id}/cancel`, { method: 'PATCH' });
    return await r.json();
  }
  if (name === 'reschedule_appointment') {
    const r = await fetch(`${baseUrl}/api/appointments/${params.id}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: params.date, time: params.time })
    });
    return await r.json();
  }
  return { error: `Tool desconocido: ${name}` };
}

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const config = readConfig();
  const appointments = readAppointments();

  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const todayISO = new Date().toISOString().slice(0, 10);

  const systemPrompt = `Sos Sarah, la recepcionista virtual de ${config.name}. Hablás español rioplatense, tuteás siempre (vos, querés, podés), sos cálida, empática y profesional. Usás máximo 1 o 2 emojis por mensaje. No mencionás que sos una IA salvo que te lo pregunten directamente.

DATOS DE LA CLÍNICA
- Nombre: ${config.name}
- Dirección: ${config.address}
- Teléfono: ${config.phone}
- Email: ${config.email}
- Horarios: ${config.schedule}
- Servicios: ${config.services.join(', ')}
- Descripción: ${config.description}

CONTEXTO TEMPORAL
- Hoy es ${today} (${todayISO}).
- Los turnos son de lunes a viernes, de 09:00 a 17:30, cada 30 minutos.

TURNOS ACTIVOS EN EL SISTEMA
${JSON.stringify(appointments.filter(a => a.status === 'active'), null, 2)}

CÓMO TRABAJÁS
Tenés cuatro herramientas (functions/tools): check_availability, create_appointment, cancel_appointment, reschedule_appointment. Las usás llamándolas como tool calls — NO escribas JSON en el texto, NO le anuncies al paciente que vas a usar herramientas.

REGLA DE ORO: si una acción se puede hacer ahora, hacela ahora. NUNCA digas "voy a agendarlo", "dame un momento", "ya lo hago", "ahora lo cargo" — esas frases están prohibidas. Si tenés los datos, ejecutás el tool en este mismo turno; el resultado natural se lo das al paciente recién cuando la acción ya está hecha.

PROTOCOLO DE AGENDAMIENTO
1. Si el paciente pide un turno, primero llamá check_availability para esa fecha.
2. Antes de llamar create_appointment SIEMPRE tenés que tener el NOMBRE COMPLETO (nombre y apellido) del paciente. Si el paciente no te lo dijo explícitamente, o si solo te dio el nombre pero no el apellido, pedíselo claramente con una pregunta corta tipo: "¿Me decís tu nombre y apellido para confirmar el turno?". NO inventes apellidos ni asumas un nombre del saludo del paciente.
3. Si ya tenés nombre completo + fecha + hora + servicio + horario libre, llamá create_appointment de inmediato en el mismo turno, sin avisar antes.
4. Si falta algún otro dato obligatorio (servicio, fecha, hora), pedilo. El teléfono y el email son opcionales.
5. Si el horario está ocupado, ofrecé alternativas cercanas del mismo día.
6. Recién cuando create_appointment devuelva éxito, confirmale al paciente con texto natural y amistoso, mencionando fecha, hora y servicio.

OTRAS REGLAS
- Para cancelar o reprogramar, primero buscá el turno en la lista de turnos activos arriba para conseguir el id. Si no lo encontrás, pedí más datos al paciente (nombre, fecha aproximada).
- Si el paciente pide algo que no podés resolver, derivá al teléfono ${config.phone}.
- Nunca le muestres al paciente IDs internos, JSON crudo, ni nombres de tools.`;

  const conversation = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const actionsRun = [];
  const MAX_ITERATIONS = 8;
  let finalResponse = null;

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: conversation,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000
      });

      const msg = completion.choices[0].message;

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        conversation.push(msg);
        for (const call of msg.tool_calls) {
          let params = {};
          try { params = JSON.parse(call.function.arguments || '{}'); } catch {}
          const result = await executeTool(call.function.name, params);
          actionsRun.push({ action: call.function.name, params, result });
          conversation.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(result)
          });
        }
        continue;
      }

      finalResponse = msg.content || '';
      break;
    }

    if (!finalResponse) {
      finalResponse = 'Perdoná, tuve un problemita procesando tu consulta 😅 ¿Podés repetirlo?';
    }

    res.json({ response: finalResponse, actions: actionsRun });
  } catch (error) {
    console.error('Error OpenAI:', error);
    res.status(500).json({ error: 'Ocurrió un error al contactar a Sarah' });
  }
});

// ─── INICIO DEL SERVIDOR ──────────────────────────────────────────────────────

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});
