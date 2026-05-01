import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* NAV */}
      <nav className="landing-nav" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 48px', borderBottom: '1px solid var(--slate-100)',
        position: 'sticky', top: 0, background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🦷</span>
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.5px', color: 'var(--slate-900)' }}>DentalAI</span>
        </div>
        <button
          onClick={() => navigate('/panel')}
          style={{
            background: 'var(--blue-600)', color: 'white', padding: '10px 22px',
            borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 14,
            transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(36,91,255,0.35)'
          }}
          onMouseEnter={e => e.target.style.background = 'var(--blue-700)'}
          onMouseLeave={e => e.target.style.background = 'var(--blue-600)'}
        >
          Ir al panel →
        </button>
      </nav>

      {/* HERO */}
      <section className="landing-hero" style={{
        padding: '96px 48px 64px', textAlign: 'center', maxWidth: 980, margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 999,
          background: 'var(--blue-50)', color: 'var(--blue-700)',
          fontSize: 13, fontWeight: 600, marginBottom: 28,
          border: '1px solid var(--blue-100)'
        }}>
          ✨ Recepción inteligente para tu clínica
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 72px)',
          lineHeight: 1.05, color: 'var(--slate-900)', marginBottom: 24,
          letterSpacing: '-2px'
        }}>
          Tu recepcionista trabaja
          <br />
          <span style={{ color: 'var(--blue-600)' }}>las 24 horas</span>
        </h1>
        <p style={{
          fontSize: 19, lineHeight: 1.6, color: 'var(--slate-500)',
          maxWidth: 640, margin: '0 auto 40px', fontWeight: 450
        }}>
          Sarah es una asistente virtual con IA que agenda turnos, responde consultas
          y gestiona la agenda de tu clínica de forma autónoma.
        </p>
        <button
          onClick={() => navigate('/panel')}
          style={{
            background: 'var(--brand-gradient)',
            color: 'white', padding: '16px 36px', borderRadius: 'var(--radius-lg)',
            fontWeight: 700, fontSize: 17, boxShadow: '0 8px 24px rgba(36,91,255,0.4)',
            transition: 'all 0.2s', letterSpacing: '-0.2px'
          }}
          onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 32px rgba(36,91,255,0.55)'; }}
          onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 24px rgba(36,91,255,0.4)'; }}
        >
          Conocer a Sarah →
        </button>
      </section>

      {/* MOCK CHAT */}
      <section className="landing-section-mock" style={{ padding: '0 48px 96px' }}>
        <div style={{
          maxWidth: 560, margin: '0 auto', background: 'white',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--slate-100)', overflow: 'hidden'
        }}>
          <div style={{
            padding: '18px 24px', borderBottom: '1px solid var(--slate-100)',
            display: 'flex', alignItems: 'center', gap: 12, background: 'var(--slate-50)'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--brand-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: 'white'
            }}>🦷</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--slate-800)' }}>Sarah</div>
              <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>● En línea</div>
            </div>
          </div>
          <div style={{ padding: 24, background: 'white' }}>
            {[
              { from: 'sarah', text: '¡Hola! 👋 Soy Sarah, la asistente virtual de Clínica Dental Sonrisa. ¿En qué te puedo ayudar hoy?' },
              { from: 'user', text: 'Quiero sacar turno para una limpieza dental' },
              { from: 'sarah', text: '¡Claro! ¿Para qué fecha te viene bien? Tenemos disponibilidad de lunes a viernes de 9 a 18 hs. 😊' },
              { from: 'user', text: 'El próximo martes estaría perfecto' },
              { from: 'sarah', text: 'Para el martes tengo varios horarios libres: 9:00, 10:30, 14:00 y 16:30. ¿Cuál preferís?' },
            ].map((msg, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12, animation: `fadeIn 0.4s ease ${i * 0.1}s both`
              }}>
                <div style={{
                  maxWidth: '80%', padding: '12px 16px', borderRadius:
                    msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.from === 'user'
                    ? 'var(--brand-gradient)'
                    : 'var(--slate-100)',
                  color: msg.from === 'user' ? 'white' : 'var(--slate-800)',
                  fontSize: 14, lineHeight: 1.6, fontWeight: 450
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="landing-section-benefits" style={{ padding: '64px 48px', background: 'var(--slate-50)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 48px)',
            color: 'var(--slate-900)', textAlign: 'center', marginBottom: 16,
            letterSpacing: '-1px'
          }}>
            Todo lo que hace Sarah
          </h2>
          <p style={{
            textAlign: 'center', fontSize: 17, color: 'var(--slate-500)',
            marginBottom: 56, fontWeight: 450
          }}>
            Sin llamadas perdidas, sin dobles turnos, sin esperas
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20
          }}>
            {[
              { icon: '📅', title: 'Agenda turnos', desc: 'Verifica disponibilidad en tiempo real y agenda sin pisar horarios ocupados.' },
              { icon: '🔄', title: 'Reprograma y cancela', desc: 'Gestiona cambios de turno de forma autónoma, actualizando la agenda al instante.' },
              { icon: '💬', title: 'Responde consultas', desc: 'Informa sobre servicios, horarios y datos de la clínica de forma natural.' },
              { icon: '🕐', title: 'Disponible siempre', desc: 'Trabaja los 7 días de la semana, las 24 horas, sin descanso.' },
            ].map((b, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 'var(--radius-lg)',
                padding: '28px 24px', border: '1px solid var(--slate-100)',
                transition: 'all 0.2s'
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 14 }}>{b.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--slate-900)', marginBottom: 8 }}>{b.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--slate-500)', fontWeight: 450 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="landing-cta" style={{
        padding: '96px 48px',
        background: 'var(--brand-gradient)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4.5vw, 52px)',
            color: 'white', marginBottom: 16, letterSpacing: '-1px'
          }}>
            Probá a Sarah ahora
          </h2>
          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 40,
            fontWeight: 450
          }}>
            Entrá al panel de administración y chateá con ella en segundos.
          </p>
          <button
            onClick={() => navigate('/panel')}
            style={{
              background: 'white', color: 'var(--brand-royal)', padding: '16px 36px',
              borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 16,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
          >
            Ir al panel →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer" style={{
        padding: '32px 48px', textAlign: 'center', fontSize: 13,
        color: 'var(--slate-400)', borderTop: '1px solid var(--slate-100)',
        background: 'white'
      }}>
        🦷 DentalAI — Recepción inteligente para clínicas dentales
      </footer>
    </div>
  );
}
