import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'dentalai_chat_history';
const STORAGE_LOG_KEY = 'dentalai_message_log';
const APPOINTMENTS_KEY = 'dentalai_appointments';

function loadAppointments() {
  try { return JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]'); } catch { return []; }
}
function saveAppointments(data) {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(data));
}

const SUGGESTIONS = [
  'Quiero sacar un turno para limpieza dental',
  '¿Qué horarios tienen disponibles?',
  'Necesito cancelar un turno',
  '¿Qué servicios ofrecen?',
];

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--slate-400)',
            animation: `typingDot 1.4s infinite ${i * 0.16}s`
          }}
        />
      ))}
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const greeting = {
        role: 'assistant',
        content: '¡Hola! 👋 Soy Sarah, la recepcionista virtual de Clínica Dental Sonrisa. ¿En qué te puedo ayudar hoy?',
        ts: new Date().toISOString()
      };
      setMessages([greeting]);
      logMessage(greeting);
    }
  }, []);

  function logMessage(msg) {
    try {
      const log = JSON.parse(localStorage.getItem(STORAGE_LOG_KEY) || '[]');
      log.push(msg);
      localStorage.setItem(STORAGE_LOG_KEY, JSON.stringify(log));
    } catch {}
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    setShowSuggestions(false);

    const userMsg = { role: 'user', content: text.trim(), ts: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    logMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          appointments: loadAppointments()
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (Array.isArray(data.appointments)) saveAppointments(data.appointments);
      const assistantMsg = { role: 'assistant', content: data.response, ts: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
      logMessage(assistantMsg);
    } catch {
      const errMsg = {
        role: 'assistant',
        content: 'Ups, tuve un problema técnico 😕 ¿Podés intentarlo de nuevo? Si el problema continúa, llamanos al teléfono de la clínica.',
        ts: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function clearChat() {
    setMessages([]);
    setShowSuggestions(true);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* HEADER */}
      <div className="chat-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 32px', borderBottom: '1px solid var(--slate-100)',
        background: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--blue-500), var(--blue-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: 'white'
          }}>🦷</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--slate-900)' }}>Sarah</div>
            <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>● En línea</div>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{
            fontSize: 13, fontWeight: 600, color: '#ef4444',
            padding: '6px 14px', borderRadius: 'var(--radius-sm)',
            border: '1px solid #fecaca', background: 'transparent', transition: 'all 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          Restablecer
        </button>
      </div>

      {/* MENSAJES */}
      <div className="chat-messages" style={{
        flex: 1, overflowY: 'auto', padding: '32px',
        display: 'flex', flexDirection: 'column', gap: 12
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.3s ease forwards'
          }}>
            <div className="msg-bubble" style={{
              maxWidth: '70%', padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--blue-600), var(--blue-700))'
                : 'white',
              color: msg.role === 'user' ? 'white' : 'var(--slate-800)',
              fontSize: 14, lineHeight: 1.65,
              boxShadow: msg.role === 'assistant' ? 'var(--shadow-sm)' : 'none',
              border: msg.role === 'assistant' ? '1px solid var(--slate-100)' : 'none',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '14px 18px', borderRadius: '18px 18px 18px 4px',
              background: 'white', boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--slate-100)'
            }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        {showSuggestions && messages.length <= 1 && !loading && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12,
            animation: 'fadeIn 0.4s ease forwards'
          }}>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                style={{
                  padding: '8px 14px', borderRadius: 999, fontSize: 13,
                  background: 'var(--blue-50)', color: 'var(--blue-700)', fontWeight: 500,
                  border: '1px solid var(--blue-200)', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.target.style.background = 'var(--blue-100)'; }}
                onMouseLeave={e => { e.target.style.background = 'var(--blue-50)'; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input-area" style={{
        display: 'flex', gap: 10, padding: '16px 32px 24px',
        borderTop: '1px solid var(--slate-100)', background: 'white'
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="Escribí tu consulta..."
          disabled={loading}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--slate-200)', fontSize: 14, outline: 'none',
            transition: 'border-color 0.15s', background: 'var(--slate-50)'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--blue-400)'}
          onBlur={e => e.target.style.borderColor = 'var(--slate-200)'}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() && !loading ? 'var(--blue-600)' : 'var(--slate-200)',
            color: input.trim() && !loading ? 'white' : 'var(--slate-400)',
            padding: '12px 20px', borderRadius: 'var(--radius-md)',
            fontWeight: 600, fontSize: 14, transition: 'all 0.15s',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed'
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
