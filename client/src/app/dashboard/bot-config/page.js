'use client';
import { useEffect, useState } from 'react';

export default function BotConfigPage() {
  const [config, setConfig] = useState(null);
  const [tenantName, setTenantName] = useState('Mi Negocio');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [newKey, setNewKey] = useState('');

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tenant', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.botConfig) {
        const opts = typeof data.botConfig.static_options === 'string'
          ? JSON.parse(data.botConfig.static_options) : (data.botConfig.static_options || []);
        setConfig({ ...data.botConfig, static_options: opts });
      }
      if (data.tenant) setTenantName(data.tenant.name || 'Mi Negocio');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const body = {
        bot_mode: config.bot_mode,
        bot_active: config.bot_active,
        business_emoji: config.business_emoji,
        static_options: config.static_options,
        default_response: config.default_response,
        welcome_message: config.welcome_message,
        system_prompt: config.system_prompt,
        ai_model: config.ai_model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        booking_url: config.booking_url
      };
      if (newKey) body.openai_api_key = newKey;

      const res = await fetch('/api/tenant/bot-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        const opts = typeof data.botConfig.static_options === 'string'
          ? JSON.parse(data.botConfig.static_options) : (data.botConfig.static_options || []);
        setConfig({ ...data.botConfig, static_options: opts });
        setNewKey('');
        showToast('Configuracion guardada!', 'success');
      } else showToast('Error al guardar', 'error');
    } catch (e) { showToast('Error de conexion', 'error'); }
    finally { setSaving(false); }
  }

  const u = (f, v) => setConfig(p => ({ ...p, [f]: v }));
  function showToast(msg, type) { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }

  // Dynamic options helpers
  function updateOption(index, field, value) {
    const opts = [...config.static_options];
    opts[index] = { ...opts[index], [field]: value };
    u('static_options', opts);
  }

  function addOption() {
    if (config.static_options.length >= 5) return;
    u('static_options', [...config.static_options, { label: 'Nueva Opcion', response: 'Respuesta de ejemplo...' }]);
  }

  function removeOption(index) {
    u('static_options', config.static_options.filter((_, i) => i !== index));
  }

  const promptTemplates = [
    { name: '🍽️ Restaurante', prompt: 'Eres el asistente virtual de un restaurante. Ayudas con menu, reservas, horarios y ubicacion. Responde en espanol, breve y profesional. Si piden reservar, pedi: nombre, dia, hora y cantidad.' },
    { name: '🏪 Tienda', prompt: 'Eres el asistente de una tienda online y fisica. Ayudas con productos, precios, disponibilidad y envios. Responde en espanol, claro y util. Si preguntan por un articulo no disponible, ofrece alternativas.' },
    { name: '🏥 Clinica', prompt: 'Eres el asistente de una clinica medica. Ayudas a agendar turnos, consultar especialidades, horarios y cobertura de obras sociales. Responde de forma profesional y empatica en espanol.' },
    { name: '🏋️ Gimnasio', prompt: 'Eres el asistente de un gimnasio. Ayudas con informacion sobre membresias, clases, horarios y promociones. Responde de forma energica y motivadora en espanol.' },
    { name: '💈 Peluqueria', prompt: 'Eres el asistente de una peluqueria o salon de belleza. Ayudas a agendar turnos, informas sobre servicios, precios y disponibilidad. Responde de forma amigable y cercana en espanol.' },
    { name: '🔧 Tecnico', prompt: 'Eres el asistente de un servicio tecnico. Ayudas a describir problemas, agendar visitas domiciliarias y consultar presupuestos. Responde en espanol de forma tecnica pero accesible.' },
  ];

  // Rich templates for static mode welcome message + options
  const welcomeTemplates = [
    {
      id: 'restaurant',
      name: '🍽️ Restaurante',
      emoji: '🍽️',
      description: 'Menu, reservas, horarios y ubicacion',
      options: [
        { label: 'Ver Menu 📋', response: '📋 Nuestro menu completo:\n\nEntradas, platos principales y postres disponibles.\n\n📱 Ver menu digital: [pega tu link aqui]' },
        { label: 'Hacer una Reserva 📅', response: '📅 Para reservar, necesito:\n\n• Tu nombre\n• Dia y hora\n• Cantidad de personas\n\n¡Escribime esos datos!' },
        { label: 'Horarios 🕐', response: '🕐 Nuestros horarios:\n\nLunes a Viernes: 12:00 - 00:00\nSabados: 12:00 - 01:00\nDomingos: 12:00 - 23:00' },
        { label: 'Como llegar 📍', response: '📍 Nos encontras en:\n\n[Tu direccion aqui]\n\nGoogle Maps: [link]' },
        { label: 'Hablar con alguien 👋', response: '👋 En breve un encargado te va a responder. Gracias por tu paciencia!' },
      ]
    },
    {
      id: 'bar',
      name: '☕ Bar / Cafe',
      emoji: '☕',
      description: 'Carta de bebidas, horarios y delivery',
      options: [
        { label: 'Ver Carta ☕', response: '☕ Nuestra carta:\n\nCafes especiales, tragos, empanadas, sandwiches y mas.\n\n📱 Carta completa: [link]' },
        { label: 'Delivery 🛵', response: '🛵 Hacemos delivery!\n\nZona de cobertura: [tu zona]\nTiempo estimado: 30-45 min\nPedidos por: PedidosYa / Rappi / directo' },
        { label: 'Horarios 🕐', response: '🕐 Estamos abiertos:\n\nLunes a Jueves: 09:00 - 23:00\nViernes y Sabado: 09:00 - 02:00\nDomingos: 10:00 - 22:00' },
        { label: 'Donde estamos 📍', response: '📍 Encontranos en:\n\n[Tu direccion]\n\n📍 Google Maps: [link]' },
      ]
    },
    {
      id: 'retail',
      name: '🛒 Tienda / Local',
      emoji: '🛒',
      description: 'Productos, precios y envios',
      options: [
        { label: 'Ver Productos 🛍️', response: '🛍️ Nuestro catalogo completo:\n\n📱 Tienda online: [link]\n\n¿Buscas algo en particular? ¡Escribime y te ayudo!' },
        { label: 'Consultar Precio 💰', response: '💰 Cuéntame qué producto te interesa y te paso el precio actualizado al momento.' },
        { label: 'Envios y Pagos 🚚', response: '🚚 Envios:\n• Capital: $XXXX (24-48hs)\n• Interior: Consultar\n• Retiro en local: gratis\n\n💳 Pagamos con: efectivo, tarjeta, transferencia' },
        { label: 'Horarios del local 🕐', response: '🕐 Horarios de atencion:\n\nLunes a Viernes: 09:00 - 19:00\nSabados: 09:00 - 14:00' },
        { label: 'Otra consulta 💬', response: '💬 Decime en que puedo ayudarte y te respondo lo antes posible!' },
      ]
    },
    {
      id: 'gym',
      name: '🏋️ Gimnasio',
      emoji: '🏋️',
      description: 'Membresias, clases y horarios',
      options: [
        { label: 'Membresias y Precios 💪', response: '💪 Nuestros planes:\n\n• Mensual: $XXXX\n• Trimestral: $XXXX (-10%)\n• Anual: $XXXX (-20%)\n\nTodos incluyen acceso libre + clases grupales' },
        { label: 'Horario de Clases 📅', response: '📅 Clases grupales:\n\n• Yoga: Lunes y Miercoles 09:00\n• Spinning: Martes y Jueves 18:00\n• Pilates: Viernes 10:00\n• Funcional: Sabados 09:00' },
        { label: 'Horarios del gym 🕐', response: '🕐 Estamos abiertos:\n\nLunes a Viernes: 06:00 - 23:00\nSabados: 08:00 - 20:00\nDomingos: 09:00 - 14:00' },
        { label: 'Donde estamos 📍', response: '📍 Encontranos en:\n\n[Tu direccion]\n\nGoogle Maps: [link]' },
        { label: 'Probar una clase gratis 🎁', response: '🎁 ¡Si, ofrecemos una clase de prueba gratuita!\n\nEscribime tu nombre y te coordinamos la proxima clase disponible.' },
      ]
    },
    {
      id: 'clinic',
      name: '🏥 Clinica / Doctor',
      emoji: '🏥',
      description: 'Turnos, especialidades y cobertura',
      options: [
        { label: 'Sacar un Turno 📅', response: '📅 Para sacar un turno necesito:\n\n• Tu nombre completo\n• Especialidad que buscas\n• Obra social (si tenes)\n• Dia y horario de preferencia\n\n¡Escribime esa info!' },
        { label: 'Especialidades 👨‍⚕️', response: '👨‍⚕️ Nuestras especialidades:\n\n• Medicina general\n• Pediatria\n• Ginecologia\n• Cardiologia\n• [Otras especialidades]' },
        { label: 'Obras Sociales 💳', response: '💳 Aceptamos:\n\n✅ OSDE\n✅ Swiss Medical\n✅ Medicus\n✅ [Otras obras sociales]\n\n¿Tu obra social no esta? Consulta igual, tenemos precios accesibles.' },
        { label: 'Horarios de atencion 🕐', response: '🕐 Horarios:\n\nLunes a Viernes: 08:00 - 20:00\nSabados: 08:00 - 13:00' },
      ]
    },
    {
      id: 'beauty',
      name: '💈 Peluqueria / Salon',
      emoji: '💈',
      description: 'Turnos, servicios y precios',
      options: [
        { label: 'Reservar un Turno 📅', response: '📅 Para reservar tu turno:\n\n¿Que servicio necesitas?\n¿Que dia y horario te viene bien?\n\n¡Escribime y lo coordinamos!' },
        { label: 'Servicios y Precios 💰', response: '💰 Nuestros servicios:\n\n✂️ Corte: desde $XXXX\n🎨 Coloracion: desde $XXXX\n💆 Tratamientos: desde $XXXX\n\n¿Queres mas info de algun servicio?' },
        { label: 'Horarios 🕐', response: '🕐 Atendemos:\n\nLunes a Sabado: 09:00 - 20:00\nDomingos: cerrado\n\n¡Te esperamos!' },
        { label: 'Donde estamos 📍', response: '📍 Nos encontras en:\n\n[Tu direccion]\n\nGoogle Maps: [link]' },
      ]
    },
    {
      id: 'tech',
      name: '🔧 Servicio Tecnico',
      emoji: '🔧',
      description: 'Reparaciones, presupuestos y retiro',
      options: [
        { label: 'Solicitar Presupuesto 💰', response: '💰 Para darte un presupuesto, contame:\n\n• ¿Que equipo es? (marca y modelo)\n• ¿Que problema tiene?\n• ¿Hace cuanto sucede?\n\n¡Te respondemos a la brevedad!' },
        { label: 'Retiro a Domicilio 🚗', response: '🚗 Hacemos retiro y entrega a domicilio!\n\nZona de cobertura: [tu zona]\nCosto de retiro: $XXXX (se descuenta si reparan)\n\n¿Te mandamos?' },
        { label: 'Equipos que reparamos 🛠️', response: '🛠️ Reparamos:\n\n💻 Notebooks y PCs\n📱 Celulares y tablets\n🖨️ Impresoras\n📺 Smart TVs\n\n¿Tu equipo no esta en la lista? ¡Consulta igual!' },
        { label: 'Horarios 🕐', response: '🕐 Horarios de atencion:\n\nLunes a Viernes: 09:00 - 18:00\nSabados: 09:00 - 13:00' },
      ]
    },
    {
      id: 'blank',
      name: '✏️ Desde Cero',
      emoji: '⭐',
      description: 'Empeza con opciones vacias y personaliza todo',
      options: [
        { label: 'Opcion 1', response: 'Respuesta de la opcion 1...' },
        { label: 'Opcion 2', response: 'Respuesta de la opcion 2...' },
      ]
    },
  ];

  const emojiOptions = ['🏪', '🍽️', '🍣', '🍕', '☕', '🏥', '💈', '🛒', '🔧', '🎓', '🏋️', '🎭', '🌺', '⭐', '💎', '🚗', '🏠', '✂️', '🐾', '📚'];

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;
  if (!config) return <div className="card"><div className="empty-state"><div className="empty-icon">⚠️</div><p>No se pudo cargar la configuracion.</p></div></div>;

  const isAI = config.bot_mode === 'ai';
  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

  // Build preview welcome message
  const previewWelcome = () => {
    if (config.welcome_message) return config.welcome_message;
    const emoji = config.business_emoji || '🏪';
    let msg = `${emoji} *¡Hola! Bienvenido a ${tenantName}* ${emoji}\n\n¿En qué podemos ayudarte? Respondé con un número:\n\n`;
    (config.static_options || []).forEach((opt, i) => {
      msg += `${numberEmojis[i]} ${opt.label}\n`;
    });
    return msg;
  };

  return (
    <div className="animate-fade">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="flex justify-between items-center" style={{ marginBottom: 40 }}>
        <div>
          <h1 className="page-title">Configuración del Agente</h1>
          <p style={{ color: 'var(--color-text-dim)' }}>Define el comportamiento y personalidad de tu chatbot.</p>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-md" style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ width: 10, height: 10, borderRadius: '50%', background: config.bot_active ? '#10B981' : '#EF4444', boxShadow: config.bot_active ? '0 0 10px #10B981' : 'none' }}></div>
             <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{config.bot_active ? 'Bot en Línea' : 'Bot Desactivado'}</span>
             <button onClick={() => u('bot_active', !config.bot_active)} style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
               {config.bot_active ? 'Pausar' : 'Activar'}
             </button>
          </div>
          <button className="btn-premium btn-p-primary" onClick={handleSave} disabled={saving}>
            <span>{saving ? '⌛' : '💾'}</span> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* MODE SELECTOR V2 */}
      <div className="flex gap-md" style={{ marginBottom: 48 }}>
        <div 
          className="glass-card" 
          onClick={() => u('bot_mode', 'static')} 
          style={{ 
            flex: 1, cursor: 'pointer', 
            borderColor: !isAI ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
            background: !isAI ? 'rgba(124,58,237,0.05)' : 'var(--color-bg-card)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="flex items-center gap-md" style={{ marginBottom: 16 }}>
             <div style={{ fontSize: '2rem' }}>📋</div>
             <h3 style={{ fontSize: '1.25rem' }}>Flujo Estático</h3>
          </div>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Ideal para menús de opciones fijas. Control total sobre cada respuesta y derivación.
          </p>
        </div>

        <div 
          className="glass-card" 
          onClick={() => u('bot_mode', 'ai')} 
          style={{ 
            flex: 1, cursor: 'pointer', 
            borderColor: isAI ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
            background: isAI ? 'rgba(124,58,237,0.05)' : 'var(--color-bg-card)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="flex items-center gap-md" style={{ marginBottom: 16 }}>
             <div style={{ fontSize: '2rem' }}>🧠</div>
             <h3 style={{ fontSize: '1.25rem' }}>IA Inteligente</h3>
          </div>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Respuestas naturales y dinámicas usando GPT-4. Entiende el contexto y resuelve dudas complejas.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: CONFIG */}
        <div className="flex" style={{ flexDirection: 'column', gap: 32 }}>
          
          {/* STATIC CONFIG */}
          {!isAI && (
            <>
              <div className="glass-card">
                <h3 style={{ marginBottom: 20, fontSize: '1.2rem' }}>🎭 Plantillas Rápidas</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {welcomeTemplates.map(tpl => (
                    <button key={tpl.id} onClick={() => {
                      u('business_emoji', tpl.emoji);
                      u('static_options', tpl.options);
                    }} style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 'var(--radius-md)', padding: '16px', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.3s'
                    }}
                      className="template-btn"
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{tpl.emoji}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{tpl.name}</div>
                    </button>
                  ))}
                  <style>{`.template-btn:hover { background: rgba(124,58,237,0.1)!important; border-color: var(--color-primary)!important; transform: translateY(-2px); }`}</style>
                </div>
              </div>

              <div className="glass-card">
                 <h3 style={{ marginBottom: 24, fontSize: '1.2rem' }}>💬 Configuración del Menú</h3>
                 
                 <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-mute)', textTransform: 'uppercase', marginBottom: 8 }}>Mensaje de Bienvenida</label>
                    <textarea className="input-premium" value={config.welcome_message || ''} onChange={e => u('welcome_message', e.target.value)} rows={3} placeholder="¡Hola! ¿Cómo podemos ayudarte hoy?" />
                 </div>

                 <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: '1rem', color: '#fff' }}>Botones de Opción ({config.static_options.length}/5)</h4>
                    {config.static_options.length < 5 && <button className="btn-premium" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', fontSize: '0.8rem' }} onClick={addOption}>+ Añadir</button>}
                 </div>

                 <div className="flex" style={{ flexDirection: 'column', gap: 16 }}>
                    {config.static_options.map((opt, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: 20 }}>
                         <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-primary-light)' }}>OPCIÓN {i+1}</span>
                            <button onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer' }}>Eliminar</button>
                         </div>
                         <input className="input-premium" style={{ marginBottom: 12 }} value={opt.label} onChange={e => updateOption(i, 'label', e.target.value)} placeholder="Ej: Ver Servicios" />
                         <textarea className="input-premium" style={{ height: 80 }} value={opt.response} onChange={e => updateOption(i, 'response', e.target.value)} placeholder="Respuesta del bot..." />
                      </div>
                    ))}
                 </div>
              </div>
            </>
          )}

          {/* AI CONFIG */}
          {isAI && (
            <>
              <div className="glass-card">
                 <h3 style={{ marginBottom: 20, fontSize: '1.2rem' }}>🔑 Conexión OpenAI</h3>
                 <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginBottom: 16 }}>Introduce tu API Key para habilitar el cerebro de la IA.</p>
                 <input type="password" className="input-premium" placeholder={config.has_openai_key ? '••••••••••••••••••••' : 'sk-...'} value={newKey} onChange={e => setNewKey(e.target.value)} />
              </div>

              <div className="glass-card">
                 <h3 style={{ marginBottom: 20, fontSize: '1.2rem' }}>🧠 Personalidad de la IA</h3>
                 <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginBottom: 16 }}>Describe quién es tu bot y cómo debe responder.</p>
                 <textarea className="input-premium" value={config.system_prompt || ''} onChange={e => u('system_prompt', e.target.value)} rows={10} style={{ fontFamily: 'monospace', fontSize: '0.9rem' }} />
              </div>

              <div className="glass-card">
                 <h3 style={{ marginBottom: 20, fontSize: '1.2rem' }}>⚙️ Ajustes Avanzados</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-mute)', marginBottom: 8 }}>Modelo IA</label>
                      <select className="input-premium" value={config.ai_model || 'gpt-4o-mini'} onChange={e => u('ai_model', e.target.value)}>
                        <option value="gpt-4o-mini">GPT-4o Mini (Veloz)</option>
                        <option value="gpt-4o">GPT-4o (Poderoso)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-mute)', marginBottom: 8 }}>Creatividad ({config.temperature || 0.7})</label>
                      <input type="range" min="0" max="1" step="0.1" value={config.temperature || 0.7} onChange={e => u('temperature', parseFloat(e.target.value))} style={{ width: '100%', marginTop: 10 }} />
                    </div>
                 </div>
              </div>
            </>
          )}

          {/* SHARED SETTINGS */}
          <div className="glass-card">
              <h3 style={{ marginBottom: 20, fontSize: '1.2rem' }}>📅 Enlace de Reservas</h3>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginBottom: 16 }}>Si usas Calendly o Cal.com, pégalo aquí para que el bot pueda ofrecer turnos.</p>
              <input className="input-premium" value={config.booking_url || ''} onChange={e => u('booking_url', e.target.value)} placeholder="https://calendly.com/mi-negocio" />
          </div>

        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div style={{ position: 'sticky', top: 40 }}>
           <h3 style={{ marginBottom: 24, fontSize: '1rem', color: 'var(--color-text-mute)', textAlign: 'center' }}>VISTA PREVIA EN VIVO</h3>
           <div className="phone-v2" style={{ margin: '0 auto' }}>
              <div className="phone-v2-screen">
                 <div style={{ background: '#1F2C34', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>{config.business_emoji || '🏪'}</div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{tenantName}</div>
                       <div style={{ fontSize: '0.7rem', color: '#10B981' }}>en línea</div>
                    </div>
                 </div>
                 
                 {/* Preview content switcher */}
                 <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {!isAI ? (
                      <>
                        <div style={{ alignSelf: 'flex-start', background: '#1F2C34', color: '#fff', padding: '8px 12px', borderRadius: '8px', borderTopLeftRadius: 0, fontSize: '0.85rem', maxWidth: '85%', whiteSpace: 'pre-wrap' }}>
                           {previewWelcome()}
                        </div>
                        {(config.static_options || []).map((opt, i) => (
                          <div key={i} style={{ alignSelf: 'flex-end', background: '#005C4B', color: '#fff', padding: '8px 12px', borderRadius: '8px', borderTopRightRadius: 0, fontSize: '0.85rem', marginTop: 8 }}>
                             {i+1}
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        <div style={{ alignSelf: 'flex-end', background: '#005C4B', color: '#fff', padding: '8px 12px', borderRadius: '8px', borderTopRightRadius: 0, fontSize: '0.85rem' }}>
                           Hola! Quiero reservar para mañana.
                        </div>
                        <div style={{ alignSelf: 'flex-start', background: '#1F2C34', color: '#fff', padding: '8px 12px', borderRadius: '8px', borderTopLeftRadius: 0, fontSize: '0.85rem', maxWidth: '85%', fontStyle: 'italic', opacity: 0.8 }}>
                           La IA responde siguiendo tus instrucciones de personalidad...
                        </div>
                        <div style={{ alignSelf: 'flex-end', background: '#005C4B', color: '#fff', padding: '8px 12px', borderRadius: '8px', borderTopRightRadius: 0, fontSize: '0.85rem' }}>
                           ¿Venden pizzas?
                        </div>
                        <div style={{ alignSelf: 'flex-start', background: '#1F2C34', color: '#fff', padding: '8px 12px', borderRadius: '8px', borderTopLeftRadius: 0, fontSize: '0.85rem', maxWidth: '85%', fontStyle: 'italic', opacity: 0.8 }}>
                           ...y aclarando dudas específicas basadas en el conocimiento que le brindaste.
                        </div>
                      </>
                    )}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
