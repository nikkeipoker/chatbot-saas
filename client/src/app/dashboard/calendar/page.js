'use client';
import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es'; // Spanish locale

moment.locale('es');
const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'settings'
  const [appointments, setAppointments] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [apptRes, rulesRes] = await Promise.all([
        fetch('/api/appointments', { headers }),
        fetch('/api/appointments/rules', { headers })
      ]);

      const apptData = await apptRes.json();
      const rulesData = await rulesRes.json();

      // Format appointments for react-big-calendar
      const formattedAppts = apptData.map(a => {
        // Find rule to get duration
        const dayOfWeek = new Date(a.appointment_time).getDay();
        const rule = rulesData.find(r => r.day_of_week === dayOfWeek) || { slot_duration_minutes: 30 };
        const start = new Date(a.appointment_time);
        const end = new Date(start.getTime() + rule.slot_duration_minutes * 60000);

        return {
          id: a.id,
          title: `${a.customer_name} ${a.status === 'cancelled' ? '(Cancelado)' : ''}`,
          start,
          end,
          status: a.status,
          phone: a.customer_phone
        };
      });

      setAppointments(formattedAppts);

      // Pre-fill rules array with 7 days if empty
      const defaultRules = Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        is_active: i > 0 && i < 6, // Mon-Fri active by default
        start_time: '09:00:00',
        end_time: '18:00:00',
        slot_duration_minutes: 30
      }));

      // Merge backend rules with defaults
      const mergedRules = defaultRules.map(def => {
        const found = rulesData.find(r => r.day_of_week === def.day_of_week);
        return found ? { ...found } : def;
      });

      setRules(mergedRules);
    } catch (err) {
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function saveRules() {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/appointments/rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rules })
      });
      
      if (!res.ok) throw new Error('Error al guardar');
      showToast('Horarios guardados correctamente');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const daysLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  function updateRule(index, field, value) {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  }

  function copyToAllDays(sourceIndex) {
    if (!window.confirm('¿Copiar este horario a todos los días hábiles (Lunes a Viernes)?')) return;
    const sourceRule = rules[sourceIndex];
    const newRules = rules.map(r => {
      // Only copy active state and times to Monday-Friday
      if (r.day_of_week > 0 && r.day_of_week < 6) {
        return {
          ...r,
          is_active: true,
          start_time: sourceRule.start_time,
          end_time: sourceRule.end_time,
          slot_duration_minutes: sourceRule.slot_duration_minutes
        };
      }
      return r;
    });
    setRules(newRules);
    showToast('Horarios copiados de Lunes a Viernes');
  }

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;

  return (
    <>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Turnos y Reservas</h1>
            <p>Gestiona tu agenda y horarios de atencion</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-lg)' }}>
        <button 
          onClick={() => setActiveTab('calendar')} 
          style={{ 
            background: 'none', border: 'none', color: activeTab === 'calendar' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            padding: 'var(--space-sm) 0', fontWeight: 600, borderBottom: activeTab === 'calendar' ? '2px solid var(--color-primary)' : '2px solid transparent',
            cursor: 'pointer', fontSize: '1rem'
          }}
        >
          📅 Calendario
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          style={{ 
            background: 'none', border: 'none', color: activeTab === 'settings' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            padding: 'var(--space-sm) 0', fontWeight: 600, borderBottom: activeTab === 'settings' ? '2px solid var(--color-primary)' : '2px solid transparent',
            cursor: 'pointer', fontSize: '1rem'
          }}
        >
          ⚙️ Horarios de Atencion
        </button>
      </div>

      {activeTab === 'calendar' ? (
        <div className="card" style={{ height: '75vh', padding: 'var(--space-md)' }}>
          <style dangerouslySetInnerHTML={{__html:`
            .rbc-calendar { font-family: 'Inter', sans-serif; color: var(--color-text-primary); }
            .rbc-header { padding: 8px; font-weight: 600; border-bottom: 1px solid var(--color-border)!important; }
            .rbc-today { background-color: rgba(124,58,237,0.05); }
            .rbc-event { background-color: var(--color-primary); border-radius: 4px; padding: 2px 6px; }
            .rbc-event.cancelled { background-color: var(--color-danger); opacity: 0.8; text-decoration: line-through; }
            .rbc-time-content { border-top: 1px solid var(--color-border); }
            .rbc-time-view, .rbc-month-view { border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; background: var(--color-bg-card); }
            .rbc-day-bg, .rbc-month-row, .rbc-time-header-content { border-color: var(--color-border)!important; }
            .rbc-time-slot { border-color: rgba(255,255,255,0.05)!important; }
            .rbc-btn-group button { color: var(--color-text-primary); border-color: var(--color-border); background: var(--color-bg-input); }
            .rbc-btn-group button.rbc-active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
          `}} />
          <Calendar
            localizer={localizer}
            events={appointments}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={{
              next: "Sig",
              previous: "Ant",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
            }}
            eventPropGetter={(event) => ({
              className: event.status === 'cancelled' ? 'cancelled' : ''
            })}
          />
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 850 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
            <div>
              <h3>Configurar Días y Horarios</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                Define cuando el bot puede agendar turnos y cuánto dura cada uno. Es súper simple: prendé los días que trabajás.
              </p>
            </div>
            <button className="btn btn-primary" onClick={saveRules} disabled={saving}>
              {saving ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>

          <style dangerouslySetInnerHTML={{__html:`
            .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
            .toggle-switch input { opacity: 0; width: 0; height: 0; }
            .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #334155; transition: .3s; border-radius: 24px; }
            .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
            input:checked + .toggle-slider { background-color: var(--color-primary); }
            input:checked + .toggle-slider:before { transform: translateX(20px); }
          `}} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {rules.map((rule, idx) => (
              <div key={idx} style={{ 
                display: 'grid', gridTemplateColumns: '140px 1fr', 
                gap: 'var(--space-md)', alignItems: 'center', 
                background: 'var(--color-bg-input)', padding: 'var(--space-md)', 
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                borderLeft: rule.is_active ? '4px solid var(--color-primary)' : '4px solid transparent',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={rule.is_active} 
                      onChange={e => updateRule(idx, 'is_active', e.target.checked)} 
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <strong style={{ fontSize: '1rem', color: rule.is_active ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                    {daysLabels[rule.day_of_week]}
                  </strong>
                </div>
                
                {rule.is_active ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto 1fr', gap: 'var(--space-lg)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>De</span>
                      <input 
                        type="time" 
                        className="input-field" 
                        value={rule.start_time.slice(0,5)} 
                        onChange={e => updateRule(idx, 'start_time', e.target.value + ':00')}
                        style={{ padding: '6px 10px', width: 110 }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>A</span>
                      <input 
                        type="time" 
                        className="input-field" 
                        value={rule.end_time.slice(0,5)} 
                        onChange={e => updateRule(idx, 'end_time', e.target.value + ':00')}
                        style={{ padding: '6px 10px', width: 110 }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Turnos de</span>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="number" 
                          className="input-field" 
                          value={rule.slot_duration_minutes} 
                          onChange={e => updateRule(idx, 'slot_duration_minutes', parseInt(e.target.value))}
                          min={10} max={240} step={10}
                          style={{ padding: '6px 10px', width: 80, paddingRight: 35 }}
                        />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>min</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => copyToAllDays(idx)} title="Copiar este horario a Lunes a Viernes" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                        Copiar a todos
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic', paddingLeft: 'var(--space-md)' }}>
                    Cerrado
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
