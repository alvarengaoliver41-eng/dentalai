import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Chat from '../components/Chat.jsx';
import History from '../components/History.jsx';
import Appointments from '../components/Appointments.jsx';
import Settings from '../components/Settings.jsx';

const tabs = [
  { id: 'chat', label: 'Chat con Sarah', icon: '💬', path: '/panel' },
  { id: 'history', label: 'Historial', icon: '🕐', path: '/panel/historial' },
  { id: 'appointments', label: 'Turnos', icon: '📅', path: '/panel/turnos' },
  { id: 'settings', label: 'Configuración', icon: '⚙️', path: '/panel/configuracion' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = tabs.find(t => t.path === location.pathname) || tabs[0];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--slate-50)' }}>
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar" style={{
        width: 260, background: 'white', borderRight: '1px solid var(--slate-100)',
        display: 'flex', flexDirection: 'column', padding: '24px 16px'
      }}>
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 8px 24px', cursor: 'pointer',
            borderBottom: '1px solid var(--slate-100)', marginBottom: 16
          }}
        >
          <span style={{ fontSize: 24 }}>🦷</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.5px', color: 'var(--slate-900)' }}>DentalAI</div>
            <div style={{ fontSize: 11, color: 'var(--slate-400)', fontWeight: 500 }}>Panel de administración</div>
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          {tabs.map(tab => {
            const active = activeTab.id === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  background: active ? 'var(--blue-50)' : 'transparent',
                  color: active ? 'var(--blue-700)' : 'var(--slate-600)',
                  fontWeight: active ? 600 : 500, fontSize: 14,
                  marginBottom: 2, transition: 'all 0.15s', textAlign: 'left'
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--slate-50)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{
          padding: '12px', fontSize: 12, color: 'var(--slate-400)',
          borderTop: '1px solid var(--slate-100)', fontWeight: 500
        }}>
          Clínica Dental Sonrisa
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="dashboard-main" style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/historial" element={<History />} />
          <Route path="/turnos" element={<Appointments />} />
          <Route path="/configuracion" element={<Settings />} />
        </Routes>
      </main>

      {/* BOTTOM NAV (mobile only) */}
      <nav className="dashboard-mobile-nav">
        {tabs.map(tab => {
          const active = activeTab.id === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '4px 0', fontSize: 10, fontWeight: 600,
                color: active ? 'var(--blue-600)' : 'var(--slate-400)',
                background: 'none', border: 'none', transition: 'color 0.15s'
              }}
            >
              <span style={{ fontSize: 22 }}>{tab.icon}</span>
              <span>{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
