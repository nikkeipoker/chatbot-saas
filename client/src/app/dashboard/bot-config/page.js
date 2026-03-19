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
    const emoji = config.business_emoji || '🏪';
    let msg = `${emoji} *¡Hola! Bienvenido a ${tenantName}* ${emoji}\n\n¿En qué podemos ayudarte? Respondé con un número:\n\n`;
    (config.static_options || []).forEach((opt, i) => {
      msg += `${numberEmojis[i]} ${opt.label}\n`;
    });
    return msg;
  };

  return (
    <>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1>Configurar Bot</h1><p>Elige como quieres que responda tu chatbot</p></div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <button className={`btn ${config.bot_active ? 'btn-success' : 'btn-secondary'} btn-sm`} onClick={() => u('bot_active', !config.bot_active)}>
              {config.bot_active ? '🟢 Activo' : '🔴 Inactivo'}
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
          </div>
        </div>
      </div>

      {/* MODE SELECTOR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <div className="card" onClick={() => u('bot_mode', 'static')} style={{
          cursor: 'pointer', borderColor: !isAI ? 'var(--color-primary)' : 'var(--color-border)',
          boxShadow: !isAI ? 'var(--shadow-glow)' : 'none', position: 'relative', overflow: 'hidden'
        }}>
          {!isAI && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }} />}
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📋</div>
          <h3>Respuestas Preprogramadas</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: 'var(--space-xs)' }}>
            Bienvenida personalizada + hasta 5 opciones con respuestas que vos configuras.
          </p>
        </div>
        <div className="card" onClick={() => u('bot_mode', 'ai')} style={{
          cursor: 'pointer', borderColor: isAI ? 'var(--color-primary)' : 'var(--color-border)',
          boxShadow: isAI ? 'var(--shadow-glow)' : 'none', position: 'relative', overflow: 'hidden'
        }}>
          {isAI && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }} />}
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🧠</div>
          <h3>Inteligencia Artificial</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: 'var(--space-xs)' }}>
            Respuestas inteligentes con IA. Requiere tu propia API Key de OpenAI.
          </p>
        </div>
      </div>

      {/* ========== STATIC MODE ========== */}
      {!isAI && (
        <div className="grid-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

            {/* Template Picker */}
            <div className="card">
              <h4 style={{ marginBottom: 'var(--space-sm)' }}>🎨 Elegir Plantilla</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>
                Elige una plantilla para tu rubro y personalizala. Carga automaticamente el emoji y las opciones.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
                {welcomeTemplates.map(tpl => (
                  <button key={tpl.id} onClick={() => {
                    u('business_emoji', tpl.emoji);
                    u('static_options', tpl.options);
                  }} style={{
                    background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-input)'; }}
                  >
                    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{tpl.emoji}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{tpl.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tpl.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Branding */}
            <div className="card">
              <h4 style={{ marginBottom: 'var(--space-md)' }}>✨ Personaliza tu Bienvenida</h4>
              <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label>Emoji de tu negocio</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {emojiOptions.map(e => (
                    <button key={e} onClick={() => u('business_emoji', e)} style={{
                      width: 40, height: 40, fontSize: '1.3rem', border: '2px solid',
                      borderColor: config.business_emoji === e ? 'var(--color-primary)' : 'var(--color-border)',
                      background: config.business_emoji === e ? 'rgba(124,58,237,0.15)' : 'var(--color-bg-input)',
                      borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>{e}</button>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                El nombre de tu negocio se toma de tu perfil en Configuracion.
              </p>
            </div>

            {/* Dynamic Options */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h4>🔢 Opciones del Menu ({config.static_options.length}/5)</h4>
                {config.static_options.length < 5 && (
                  <button className="btn btn-secondary btn-sm" onClick={addOption}>+ Agregar Opcion</button>
                )}
              </div>

              {config.static_options.map((opt, i) => (
                <div key={i} style={{
                  background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)', marginBottom: 'var(--space-md)',
                  border: '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>{numberEmojis[i]} Opcion {i + 1}</span>
                    {config.static_options.length > 1 && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeOption(i)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>✕ Eliminar</button>
                    )}
                  </div>
                  <div className="input-group" style={{ marginBottom: 'var(--space-sm)' }}>
                    <label>Nombre de la opcion</label>
                    <input className="input-field" value={opt.label} onChange={e => updateOption(i, 'label', e.target.value)} placeholder="Ej: Ver Menu 📋" />
                  </div>
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                      <label style={{ margin: 0 }}>Respuesta cuando eligen esta opcion</label>
                      {opt.response !== '__FLOW_BOOKING__' ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => updateOption(i, 'response', '__FLOW_BOOKING__')} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                          📅 Usar Link de Reservas
                        </button>
                      ) : (
                        <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>Link de Reservas Activado</span>
                      )}
                    </div>
                    {opt.response === '__FLOW_BOOKING__' ? (
                      <div style={{ padding: 'var(--space-md)', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary-light)', fontSize: '0.85rem' }}>
                        <strong>✨ Enlace de Reservas Automático:</strong><br/>
                        Al seleccionar esta opcion, el bot enviará el enlace de agendamiento (Calendly/Cal.com) configurado más abajo.
                      </div>
                    ) : (
                      <textarea className="input-field" value={opt.response} onChange={e => updateOption(i, 'response', e.target.value)} rows={3} style={{ width: '100%' }} placeholder="Lo que el bot responde..." />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Booking URL */}
            <div className="card">
              <h4 style={{ marginBottom: 'var(--space-sm)' }}>📅 Link de Agendamiento / Turnos</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }}>Pega aquí tu enlace de Calendly, Cal.com o similar. El bot se lo enviará a los clientes cuando soliciten agendar un turno.</p>
              <input type="url" className="input-field" value={config.booking_url || ''} onChange={e => u('booking_url', e.target.value)} placeholder="https://calendly.com/tu-negocio" style={{ width: '100%' }} />
            </div>

            {/* Default Response */}
            <div className="card">
              <h4 style={{ marginBottom: 'var(--space-sm)' }}>💬 Respuesta por defecto</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }}>Se usa si algo falla o el cliente escribe algo inesperado.</p>
              <textarea className="input-field" value={config.default_response || ''} onChange={e => u('default_response', e.target.value)} rows={2} style={{ width: '100%' }} />
            </div>
          </div>

          {/* Preview */}
          <div>
            <div style={{ position: 'sticky', top: 'var(--space-xl)' }}>
              <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)' }}>📱 Vista previa</h4>
              <div className="phone-preview">
                <div className="phone-header">
                  <div className="avatar">{config.business_emoji || '🏪'}</div>
                  <div><div className="chat-name">{tenantName}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>en linea</div></div>
                </div>
                <div className="phone-messages">
                  <div className="message-user">Hola!</div>
                  <div className="message-bot">{previewWelcome()}</div>
                  <div className="message-user">1</div>
                  <div className="message-bot">{config.static_options[0]?.response || '...'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== AI MODE ========== */}
      {isAI && (
        <div className="grid-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div className="card" style={{ borderColor: !config.has_openai_key && !newKey ? 'var(--color-warning)' : 'var(--color-border)' }}>
              <h4 style={{ marginBottom: 'var(--space-sm)' }}>🔑 Tu API Key de OpenAI</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 'var(--space-md)' }}>
                Crea tu key en <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>
              </p>
              {config.has_openai_key && !newKey && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                  <span className="badge badge-active">Conectada</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{config.openai_api_key_masked}</span>
                </div>
              )}
              <input type="password" className="input-field" placeholder={config.has_openai_key ? 'Dejar vacio para mantener la actual' : 'sk-...'} value={newKey} onChange={e => setNewKey(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="card">
              <h4 style={{ marginBottom: 'var(--space-sm)' }}>🧠 Instrucciones para la IA</h4>
              <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                {promptTemplates.map(t => (<button key={t.name} className="btn btn-secondary btn-sm" onClick={() => u('system_prompt', t.prompt)}>{t.name}</button>))}
              </div>
              <textarea className="input-field" value={config.system_prompt || ''} onChange={e => u('system_prompt', e.target.value)} rows={8} style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} />
            </div>

            <div className="card">
              <h4 style={{ marginBottom: 'var(--space-md)' }}>⚙️ Parametros</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="input-group">
                  <label>Modelo</label>
                  <select className="input-field" value={config.ai_model || 'gpt-4o-mini'} onChange={e => u('ai_model', e.target.value)}>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-3.5-turbo">GPT-3.5</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Max Tokens</label>
                  <input type="number" className="input-field" value={config.max_tokens || 300} onChange={e => u('max_tokens', parseInt(e.target.value))} min={50} max={2000} />
                </div>
                <div className="input-group">
                  <label>Temperatura ({config.temperature || 0.7})</label>
                  <input type="range" min="0" max="1" step="0.1" value={config.temperature || 0.7} onChange={e => u('temperature', parseFloat(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ position: 'sticky', top: 'var(--space-xl)' }}>
              <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)' }}>📱 Vista previa (modo IA)</h4>
              <div className="phone-preview">
                <div className="phone-header">
                  <div className="avatar">🧠</div>
                  <div><div className="chat-name">{tenantName} (IA)</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>inteligencia artificial</div></div>
                </div>
                <div className="phone-messages">
                  <div className="message-user">Quiero reservar para 4 el viernes</div>
                  <div className="message-bot" style={{ fontStyle: 'italic', opacity: 0.8 }}>La IA responde segun tus instrucciones...</div>
                  <div className="message-user">Tienen opciones vegetarianas?</div>
                  <div className="message-bot" style={{ fontStyle: 'italic', opacity: 0.8 }}>...y mantiene contexto de la conversacion.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
