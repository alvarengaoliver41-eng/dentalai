import { handleChat } from '../lib/chat.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const { messages, appointments = [] } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages debe ser un array' });
    }
    const result = await handleChat(messages, appointments);
    res.json(result);
  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({ error: 'Ocurrió un error al contactar a Sarah' });
  }
}
