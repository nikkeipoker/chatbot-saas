'use client';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [tenant, setTenant] = useState(null);
  const [meta, setMeta] = useState({ meta_phone_number_id:'', meta_access_token:'', meta_waba_id:'' });
  const [profile, setProfile] = useState({ name:'', phone_number:'' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState({profile:false,meta:false});

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tenant', { headers:{Authorization:`Bearer ${token}`} });
      const data = await res.json();
      if (data.tenant) {
        setTenant(data.tenant);
        setProfile({ name:data.tenant.name||'', phone_number:data.tenant.phone_number||'' });
        setMeta({ meta_phone_number_id:data.tenant.meta_phone_number_id||'', meta_access_token:'', meta_waba_id:data.tenant.meta_waba_id||'' });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function saveProfile() {
    setSaving(s=>({...s,profile:true}));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tenant',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(profile)});
      if (res.ok) {
        const data = await res.json();
        setTenant(data.tenant);
        const stored=JSON.parse(localStorage.getItem('tenant')||'{}');
        stored.name=data.tenant.name;
        localStorage.setItem('tenant',JSON.stringify(stored));
        showToast('Perfil actualizado','success');
      }
    } catch (e) { showToast('Error','error'); }
    finally { setSaving(s=>({...s,profile:false})); }
  }

  async function saveMeta() {
    if (!meta.meta_phone_number_id || !meta.meta_access_token) { showToast('Completa Phone Number ID y Access Token','error'); return; }
    setSaving(s=>({...s,meta:true}));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tenant/meta',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(meta)});
      if (res.ok) showToast('Credenciales de Meta guardadas','success');
      else { const d=await res.json(); showToast(d.error||'Error','error'); }
    } catch (e) { showToast('Error de conexion','error'); }
    finally { setSaving(s=>({...s,meta:false})); }
  }

  function showToast(msg,type) { setToast({msg,type}); setTimeout(()=>setToast(null),3000); }

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{width:40,height:40}}></div></div>;

  const webhookUrl = typeof window!=='undefined'
    ? `${window.location.origin.replace(':3000',':3001')}/webhook`
    : '/webhook';

  return (
    <div className="animate-fade">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      
      <div className="flex justify-between items-center" style={{ marginBottom: 40 }}>
        <div>
          <h1 className="page-title">Configuración del Sistema</h1>
          <p style={{ color: 'var(--color-text-dim)' }}>Administra tu perfil, suscripción y conexiones externas.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 32, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: SETTINGS */}
        <div className="flex" style={{ flexDirection: 'column', gap: 32 }}>
          
          {/* BUSINESS PROFILE */}
          <div className="glass-card">
            <h3 style={{ marginBottom: 24, fontSize: '1.2rem' }}>🏪 Perfil del Negocio</h3>
            <div className="flex" style={{ flexDirection: 'column', gap: 20 }}>
               <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-mute)', textTransform: 'uppercase', marginBottom: 8 }}>Nombre Comercial</label>
                  <input className="input-premium" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} placeholder="Ej: Sushi Zen" />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-mute)', textTransform: 'uppercase', marginBottom: 8 }}>WhatsApp de Contacto (Público)</label>
                  <input className="input-premium" value={profile.phone_number} onChange={e=>setProfile(p=>({...p,phone_number:e.target.value}))} placeholder="+54 11 1234-5678" />
               </div>
               <div style={{ marginTop: 8 }}>
                  <button className="btn-premium btn-p-primary" onClick={saveProfile} disabled={saving.profile}>
                     {saving.profile ? '⌛ Guardando...' : '💾 Guardar Cambios'}
                  </button>
               </div>
            </div>
          </div>

          {/* META WHATSAPP CONFIG */}
          <div className="glass-card">
            <h3 style={{ marginBottom: 12, fontSize: '1.2rem' }}>📱 WhatsApp Business API</h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginBottom: 24 }}>
               Conecta tu número oficial a través de Meta Cloud API para automatizar respuestas.
            </p>
            
            <div className="flex" style={{ flexDirection: 'column', gap: 20 }}>
               <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-mute)', textTransform: 'uppercase', marginBottom: 8 }}>Phone Number ID</label>
                  <input className="input-premium" value={meta.meta_phone_number_id} onChange={e=>setMeta(m=>({...m,meta_phone_number_id:e.target.value}))} placeholder="ID de 15 dígitos..." />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-mute)', textTransform: 'uppercase', marginBottom: 8 }}>Access Token (Permanente)</label>
                  <input className="input-premium" type="password" value={meta.meta_access_token} onChange={e=>setMeta(m=>({...m,meta_access_token:e.target.value}))} placeholder="EAAB..." />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-mute)', textTransform: 'uppercase', marginBottom: 8 }}>WABA Account ID</label>
                  <input className="input-premium" value={meta.meta_waba_id} onChange={e=>setMeta(m=>({...m,meta_waba_id:e.target.value}))} placeholder="ID de la cuenta business..." />
               </div>
               <div style={{ marginTop: 8 }}>
                  <button className="btn-premium btn-p-primary" onClick={saveMeta} disabled={saving.meta}>
                     {saving.meta ? '⌛ Conectando...' : '🔗 Vincular WhatsApp'}
                  </button>
               </div>
            </div>
          </div>

          {/* WEBHOOK DETAILS */}
          <div className="glass-card" style={{ border: '1px dashed rgba(124,58,237,0.3)' }}>
            <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>🔗 Callback URL (Webhook)</h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', marginBottom: 16 }}>
               Copia esta URL en el panel de desarrolladores de Meta para recibir los mensajes.
            </p>
            <div className="flex gap-md">
               <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-primary-light)' }}>
                  {webhookUrl}
               </div>
               <button className="btn-premium" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem' }} onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  showToast('URL Copiada', 'success');
               }}>📋 Copiar</button>
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(124,58,237,0.05)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
               <strong>Verify Token:</strong> Utiliza el token definido en tu configuración de servidor.
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: STATUS & HELP */}
        <div style={{ position: 'sticky', top: 40 }} className="flex flex-col gap-lg">
           
           {/* SUBSCRIPTION STATUS */}
           <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(0,0,0,0))' }}>
              <div className="flex justify-between items-start" style={{ marginBottom: 16 }}>
                 <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-mute)', textTransform: 'uppercase' }}>Suscripción</h4>
                 <div style={{ fontSize: '1.5rem' }}>💎</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#fff' }}>
                 {tenant?.subscription_status === 'trial' ? 'Prueba Gratis' : 'Plan Premium'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginBottom: 20 }}>
                 {tenant?.subscription_status === 'trial' ? `Vence el ${new Date(tenant.trial_ends_at).toLocaleDateString()}` : 'Renovación mensual activa'}
              </div>
              <button className="btn-premium" style={{ width: '100%', border: '1px solid var(--color-primary)', background: 'transparent' }}>Gestionar Plan</button>
           </div>

           {/* QUICK SETUP GUIDE */}
           <div className="glass-card">
              <h4 style={{ fontSize: '1rem', marginBottom: 16 }}>Guía de Conexión</h4>
              <div className="flex flex-col gap-md">
                 {[
                    { n: 1, t: 'Crea tu App en Meta Developers' },
                    { n: 2, t: 'Agrega el producto WhatsApp' },
                    { n: 3, t: 'Copia el Phone ID y Token mensual' },
                    { n: 4, t: 'Configura el Callback URL arriba' },
                    { n: 5, t: 'Suscríbete al campo message' }
                 ].map(s => (
                    <div key={s.n} className="flex gap-md items-center">
                       <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>{s.n}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>{s.t}</div>
                    </div>
                 ))}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
