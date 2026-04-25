import OpenAI from 'openai';
import { readConfig, readAppointments } from './storage.js';
import { tools, executeTool } from './tools.js';

let _openai;
function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Falta OPENAI_API_KEY. En Vercel: Settings → Environment Variables.');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

function buildSystemPrompt(config, appointments) {
  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const todayISO = new Date().toISOString().slice(0, 10);

  return `Sos Sarah, la recepcionista virtual de ${config.name}. Hablás español rioplatense, tuteás siempre (vos, querés, podés), sos cálida, empática y profesional. Usás máximo 1 o 2 emojis por mensaje. No mencionás que sos una IA salvo que te lo pregunten directamente.

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
}

export async function handleChat(messages) {
  const config = await readConfig();
  const appointments = await readAppointments();

  const conversation = [
    { role: 'system', content: buildSystemPrompt(config, appointments) },
    ...messages
  ];

  const actionsRun = [];
  const MAX_ITERATIONS = 8;
  let finalResponse = null;

  const openai = getOpenAI();
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

  return { response: finalResponse, actions: actionsRun };
}
