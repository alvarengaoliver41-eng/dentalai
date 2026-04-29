import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const APPOINTMENTS_KEY = 'dentalai_appointments';

const STATUS_LABELS = {
  active: { label: 'Activo', color: '#22c55e', bg: '#f0fdf4' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: '#fef2f2' },
  completed: { label: 'Completado', color: '#94a3b8', bg: '#f8fafc' },
};

function loadFromStorage() {
  try { return JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]'); } catch { return []; }
}
function saveToStorage(data) {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(data));
}

export default function Appointments() {
  const [view, setView] = useState('list');
  const [appointments, setAppointments] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [cancellingId, setCancellingId] = useState(null);

  function load() {
    setAppointments(loadFromStorage());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 1000);
    return () => clearInterval(interval);
  }, []);

  function cancelAppointment(apt) {
    if (!window.confirm(`¿Seguro que querés cancelar el turno de ${apt.patientName} el ${apt.date} a las ${apt.time}?`)) return;
    setCancellingId(apt.id);
    const updated = loadFromStorage().map(a =>
      a.id === apt.id ? { ...a, status: 'cancelled', cancelledAt: new Date().toISOString() } : a
    );
    saveToStorage(updated);
    setAppointments(updated);
    setCancellingId(null);
  }

  function deleteAppointment(apt) {
    if (!window.confirm(`¿Eliminar definitivamente el turno de ${apt.patientName} el ${apt.date} a las ${apt.time}? Esta acción no se puede deshacer.`)) return;
    setCancellingId(apt.id);
    const updated = loadFromStorage().filter(a => a.id !== apt.id);
    saveToStorage(updated);
    setAppointments(updated);
    setCancellingId(null);
  }

  function clearHistory() {
    if (!window.confirm(`¿Eliminar el historial de turnos cancelados o completados? Los activos no se tocan.`)) return;
    const updated = loadFromStorage().filter(a => a.status === 'active');
    saveToStorage(updated);
    setAppointments(updated);
  }

  function clearAll() {
    if (!window.confirm(`⚠️ ¿Eliminar TODOS los turnos, incluyendo los activos? Esta acción no se puede deshacer.`)) return;
    saveToStorage([]);
    setAppointments([]);
  }

  const active = appointments.filter(a => a.status === 'active');
  const inactive = appointments.filter(a => a.status !== 'active');

  const daysWithAppointments = new Set(active.map(a => a.date));

  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  return (
    <div className="page-pad" style={{ padding: '32px 48px', maxWidth: 1100, margin: '0 auto' }}>
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 32, flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--slate-900)',
              marginBottom: 6, letterSpacing: '-0.5px'
            }}>
              Turnos
            </h1>
            <p style={{ color: 'var(--slate-500)', fontSize: 14, fontWeight: 450 }}>
              {active.length} turno{active.length !== 1 ? 's' : ''} activo{active.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {appointments.length > 0 && (
            <button
              onClick={clearAll}
              style={{
                fontSize: 13, fontWeight: 600, color: '#ef4444',
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                border: '1px solid #fecaca', background: 'transparent',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Restablecer
            </button>
          )}
          <div style={{
            display: 'inline-flex', background: 'var(--slate-100)',
            padding: 4, borderRadius: 'var(--radius-md)'
          }}>
            {['list', 'calendar'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                  background: view === v ? 'white' : 'transparent',
                  color: view === v ? 'var(--blue-700)' : 'var(--slate-500)',
                  boxShadow: view === v ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {v === 'list' ? '☰ Lista' : '📅 Calendario'}
              </button>
            ))}
          </div>
          </div>
        </div>

        {view === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <Section
              title="Turnos activos"
              items={active}
              onCancel={cancelAppointment}
              onDelete={deleteAppointment}
              cancellingId={cancellingId}
            />
            {inactive.length > 0 && (
              <div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 12
                }}>
                  <h2 style={{
                    fontSize: 13, fontWeight: 700, color: 'var(--slate-500)',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    Históricos ({inactive.length})
                  </h2>
                  <button
                    onClick={clearHistory}
                    style={{
                      fontSize: 12, fontWeight: 600, color: '#ef4444',
                      padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid #fecaca', background: 'transparent',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Limpiar historial
                  </button>
                </div>
                <SectionBody
                  items={inactive}
                  muted
                  onDelete={deleteAppointment}
                  cancellingId={cancellingId}
                />
              </div>
            )}
            {appointments.length > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'flex-end', paddingTop: 8,
                borderTop: '1px dashed var(--slate-200)', marginTop: 8
              }}>
                <button
                  onClick={clearAll}
                  style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--slate-500)',
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--slate-200)', background: 'transparent',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#fef2f2';
                    e.currentTarget.style.borderColor = '#fecaca';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--slate-200)';
                    e.currentTarget.style.color = 'var(--slate-500)';
                  }}
                >
                  Eliminar todos los turnos
                </button>
              </div>
            )}
            {appointments.length === 0 && (
              <div style={{
                background: 'white', borderRadius: 'var(--radius-lg)', padding: '64px 32px',
                textAlign: 'center', border: '1px solid var(--slate-100)'
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}>
                  Todavía no hay turnos
                </div>
                <div style={{ fontSize: 14, color: 'var(--slate-400)', fontWeight: 450 }}>
                  Los turnos agendados por Sarah van a aparecer acá
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-100)', padding: 24
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 20
            }}>
              <button
                onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                style={{ fontSize: 18, color: 'var(--slate-500)', padding: '4px 12px' }}
              >‹</button>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--slate-900)',
                textTransform: 'capitalize'
              }}>
                {format(calendarDate, 'MMMM yyyy', { locale: es })}
              </div>
              <button
                onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                style={{ fontSize: 18, color: 'var(--slate-500)', padding: '4px 12px' }}
              >›</button>
            </div>
            <div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                marginBottom: 8, gap: 4
              }}>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                  <div key={d} style={{
                    textAlign: 'center', fontSize: 12, fontWeight: 600,
                    color: 'var(--slate-400)', padding: 8
                  }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const hasAppts = daysWithAppointments.has(dateStr);
                  const isToday = isSameDay(day, new Date());
                  const dayAppts = active.filter(a => a.date === dateStr);
                  return (
                    <div key={dateStr} style={{
                      aspectRatio: '1 / 1', padding: 6, borderRadius: 'var(--radius-sm)',
                      background: hasAppts ? 'var(--blue-50)' : 'transparent',
                      border: isToday ? '1.5px solid var(--blue-500)' : '1px solid transparent',
                      display: 'flex', flexDirection: 'column', gap: 4,
                      cursor: hasAppts ? 'pointer' : 'default',
                      transition: 'all 0.15s', position: 'relative'
                    }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        color: hasAppts ? 'var(--blue-700)' : 'var(--slate-700)'
                      }}>
                        {day.getDate()}
                      </div>
                      {hasAppts && (
                        <div style={{
                          fontSize: 10, color: 'var(--blue-700)', fontWeight: 600
                        }}>
                          {dayAppts.length} turno{dayAppts.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items, muted, onCancel, onDelete, cancellingId }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 style={{
        fontSize: 13, fontWeight: 700, color: 'var(--slate-500)',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12
      }}>
        {title} ({items.length})
      </h2>
      <SectionBody items={items} muted={muted} onCancel={onCancel} onDelete={onDelete} cancellingId={cancellingId} />
    </div>
  );
}

function SectionBody({ items, muted, onCancel, onDelete, cancellingId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(apt => {
        const status = STATUS_LABELS[apt.status] || STATUS_LABELS.active;
        const isBusy = cancellingId === apt.id;
        return (
          <div key={apt.id} className="apt-card" style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: 16,
            background: 'white', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--slate-100)',
            opacity: muted ? 0.75 : 1, transition: 'all 0.15s'
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'var(--blue-50)', borderRadius: 'var(--radius-sm)',
              padding: '10px 14px', minWidth: 64
            }}>
              <div style={{
                fontSize: 20, fontWeight: 800, color: 'var(--blue-700)',
                lineHeight: 1, fontFamily: 'var(--font-display)'
              }}>
                {apt.date ? apt.date.split('-')[2] : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--blue-600)', fontWeight: 600, marginTop: 2 }}>
                {apt.time || ''}
              </div>
            </div>
            <div className="apt-card-info" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--slate-900)', marginBottom: 4 }}>
                {apt.patientName}
              </div>
              <div style={{ fontSize: 13, color: 'var(--slate-500)', fontWeight: 450 }}>
                {apt.service}
                {apt.patientPhone && ` · ${apt.patientPhone}`}
                {apt.patientEmail && ` · ${apt.patientEmail}`}
              </div>
            </div>
            <div className="apt-card-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <div style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: status.bg, color: status.color
              }}>
                {status.label}
              </div>
              {onCancel && apt.status === 'active' && (
                <IconButton
                  label="Cancelar turno"
                  icon="✕"
                  busy={isBusy}
                  onClick={() => onCancel(apt)}
                />
              )}
              {onDelete && (
                <IconButton
                  label="Eliminar definitivamente"
                  icon="🗑"
                  busy={isBusy}
                  onClick={() => onDelete(apt)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IconButton({ label, icon, busy, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={label}
      aria-label={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: '50%',
        background: busy ? 'var(--slate-100)' : 'transparent',
        color: '#ef4444', border: '1px solid var(--slate-200)',
        fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
        cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.5 : 1
      }}
      onMouseEnter={e => {
        if (!busy) {
          e.currentTarget.style.background = '#fef2f2';
          e.currentTarget.style.borderColor = '#fecaca';
        }
      }}
      onMouseLeave={e => {
        if (!busy) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'var(--slate-200)';
        }
      }}
    >
      {busy ? '…' : icon}
    </button>
  );
}
