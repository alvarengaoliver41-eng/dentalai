import { useState, useEffect } from 'react';

export default function Settings() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [servicesInput, setServicesInput] = useState('');

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setConfig(data);
        setServicesInput(data.services?.join(', ') || '');
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    const updated = { ...config, services: servicesInput.split(',').map(s => s.trim()).filter(Boolean) };
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setConfig(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!config) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--slate-400)' }}>
      Cargando configuración...
    </div>
  );

  return (
    <div className="page-pad" style={{ padding: '32px 48px', maxWidth: 760, margin: '0 auto' }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--slate-900)',
          marginBottom: 6, letterSpacing: '-0.5px'
        }}>
          Configuración
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: 14, marginBottom: 32, fontWeight: 450 }}>
          Sarah usa estos datos en cada conversación. Los cambios se aplican desde el próximo mensaje.
        </p>

        <div style={{
          background: 'white', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-100)', padding: 28,
          display: 'flex', flexDirection: 'column', gap: 20
        }}>
          {[
            { label: 'Nombre de la clínica', key: 'name' },
            { label: 'Dirección', key: 'address' },
            { label: 'Teléfono', key: 'phone' },
            { label: 'Email', key: 'email' },
            { label: 'Horarios de atención', key: 'schedule' },
          ].map(field => (
            <Field key={field.key} label={field.label}>
              <input
                value={config[field.key] || ''}
                onChange={e => setConfig(c => ({ ...c, [field.key]: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--blue-400)'}
                onBlur={e => e.target.style.borderColor = 'var(--slate-200)'}
              />
            </Field>
          ))}

          <Field label="Servicios" hint="Separá los servicios con comas">
            <input
              value={servicesInput}
              onChange={e => setServicesInput(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--blue-400)'}
              onBlur={e => e.target.style.borderColor = 'var(--slate-200)'}
            />
          </Field>

          <Field label="Descripción">
            <textarea
              value={config.description || ''}
              onChange={e => setConfig(c => ({ ...c, description: e.target.value }))}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = 'var(--blue-400)'}
              onBlur={e => e.target.style.borderColor = 'var(--slate-200)'}
            />
          </Field>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'var(--blue-600)', color: 'white', padding: '12px 28px',
              borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 14,
              transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              opacity: saving ? 0.6 : 1, cursor: saving ? 'wait' : 'pointer'
            }}
            onMouseEnter={e => { if (!saving) e.target.style.background = 'var(--blue-700)'; }}
            onMouseLeave={e => { if (!saving) e.target.style.background = 'var(--blue-600)'; }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {saved && (
            <span style={{
              color: '#22c55e', fontSize: 13, fontWeight: 600,
              animation: 'fadeIn 0.3s ease forwards'
            }}>
              ✓ Guardado correctamente
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--slate-200)', fontSize: 14, outline: 'none',
  transition: 'border-color 0.15s', background: 'var(--slate-50)', color: 'var(--slate-800)'
};

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 600,
        color: 'var(--slate-700)', marginBottom: 6
      }}>
        {label}
      </label>
      {hint && (
        <div style={{ fontSize: 12, color: 'var(--slate-400)', marginBottom: 6, fontWeight: 450 }}>
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}
