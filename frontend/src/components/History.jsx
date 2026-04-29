import { useState, useEffect } from 'react';

const STORAGE_LOG_KEY = 'dentalai_message_log';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function History() {
  const [messages, setMessages] = useState([]);

  function loadMessages() {
    try {
      const log = JSON.parse(localStorage.getItem(STORAGE_LOG_KEY) || '[]');
      setMessages([...log].reverse());
    } catch { setMessages([]); }
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-pad" style={{ padding: '32px 48px', maxWidth: 900, margin: '0 auto' }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--slate-900)',
          marginBottom: 6, letterSpacing: '-0.5px'
        }}>
          Historial de mensajes
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: 14, marginBottom: 32, fontWeight: 450 }}>
          Se actualiza automáticamente cada 3 segundos
        </p>

        {messages.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 'var(--radius-lg)', padding: '64px 32px',
            textAlign: 'center', border: '1px solid var(--slate-100)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}>
              Todavía no hay mensajes
            </div>
            <div style={{ fontSize: 14, color: 'var(--slate-400)', fontWeight: 450 }}>
              Los mensajes del chat van a aparecer acá
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, padding: 16, background: 'white',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-100)',
                transition: 'all 0.15s'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'assistant'
                    ? 'linear-gradient(135deg, var(--blue-500), var(--blue-700))'
                    : 'var(--slate-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                }}>
                  {msg.role === 'assistant' ? '🦷' : '👤'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-900)' }}>
                      {msg.role === 'assistant' ? 'Sarah' : 'Paciente'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--slate-400)', fontWeight: 500 }}>
                      {msg.ts ? formatTime(msg.ts) : ''}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 14, color: 'var(--slate-700)', lineHeight: 1.6,
                    fontWeight: 450, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
