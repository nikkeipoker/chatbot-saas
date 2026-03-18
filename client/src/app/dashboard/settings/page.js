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
    <>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      <div className="page-header"><h1>Configuracion</h1><p>Administra tu cuenta y conexiones</p></div>

      <div style={{display:'flex',flexDirection:'column',gap:'var(--space-lg)',maxWidth:700}}>
        {/* Profile */}
        <div className="card">
          <h3 style={{marginBottom:'var(--space-lg)'}}>🏪 Perfil del Negocio</h3>
          <div className="auth-form">
            <div className="input-group"><label>Nombre del negocio</label><input className="input-field" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} /></div>
            <div className="input-group"><label>Telefono de contacto</label><input className="input-field" value={profile.phone_number} onChange={e=>setProfile(p=>({...p,phone_number:e.target.value}))} placeholder="+54 11 1234-5678" /></div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving.profile}>{saving.profile?'Guardando...':'Guardar Perfil'}</button>
          </div>
        </div>

        {/* Subscription */}
        <div className="card">
          <h3 style={{marginBottom:'var(--space-md)'}}>💎 Suscripcion</h3>
          <span className={`badge badge-${tenant?.subscription_status==='active'?'active':'trial'}`}>
            {tenant?.subscription_status==='trial'?'Prueba Gratuita':tenant?.subscription_status==='active'?'Activa':'Suspendida'}
          </span>
          {tenant?.trial_ends_at && tenant.subscription_status==='trial' && (
            <span style={{fontSize:'0.85rem',color:'var(--color-text-muted)',marginLeft:12}}>
              Vence: {new Date(tenant.trial_ends_at).toLocaleDateString('es-AR')}
            </span>
          )}
        </div>

        {/* Meta WhatsApp */}
        <div className="card">
          <h3 style={{marginBottom:'var(--space-sm)'}}>📱 WhatsApp (Meta Cloud API)</h3>
          <p style={{color:'var(--color-text-muted)',fontSize:'0.85rem',marginBottom:'var(--space-lg)'}}>
            Conecta tu numero de WhatsApp Business. Obtene estas credenciales desde{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">developers.facebook.com</a> → Tu App → WhatsApp → API Setup.
          </p>
          <div className="auth-form">
            <div className="input-group">
              <label>Phone Number ID</label>
              <input className="input-field" value={meta.meta_phone_number_id} onChange={e=>setMeta(m=>({...m,meta_phone_number_id:e.target.value}))} placeholder="123456789012345" />
            </div>
            <div className="input-group">
              <label>Access Token (Permanente)</label>
              <input className="input-field" type="password" value={meta.meta_access_token} onChange={e=>setMeta(m=>({...m,meta_access_token:e.target.value}))} placeholder="EAAxxxxxxxx..." />
            </div>
            <div className="input-group">
              <label>WhatsApp Business Account ID (Opcional)</label>
              <input className="input-field" value={meta.meta_waba_id} onChange={e=>setMeta(m=>({...m,meta_waba_id:e.target.value}))} placeholder="123456789012345" />
            </div>
            <button className="btn btn-primary" onClick={saveMeta} disabled={saving.meta}>{saving.meta?'Guardando...':'Guardar Credenciales'}</button>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="card">
          <h3 style={{marginBottom:'var(--space-sm)'}}>🔗 Webhook URL</h3>
          <p style={{color:'var(--color-text-muted)',fontSize:'0.85rem',marginBottom:'var(--space-sm)'}}>
            Configura esta URL en Meta → Tu App → WhatsApp → Configuration → Callback URL:
          </p>
          <div style={{background:'var(--color-bg-input)',padding:'12px 16px',borderRadius:'var(--radius-md)',fontFamily:'var(--font-mono)',fontSize:'0.9rem',wordBreak:'break-all',border:'1px solid var(--color-border)'}}>
            {webhookUrl}
          </div>
          <p style={{color:'var(--color-text-muted)',fontSize:'0.8rem',marginTop:'var(--space-sm)'}}>
            <strong>Verify Token:</strong> El mismo que configuraste en tu variable de entorno <code style={{background:'var(--color-bg-input)',padding:'2px 6px',borderRadius:4}}>META_VERIFY_TOKEN</code>
          </p>
        </div>

        {/* Setup Guide */}
        <div className="card">
          <h3 style={{marginBottom:'var(--space-md)'}}>📖 Guia de Configuracion de Meta</h3>
          <ol style={{fontSize:'0.9rem',color:'var(--color-text-secondary)',paddingLeft:20,display:'flex',flexDirection:'column',gap:8}}>
            <li>Ve a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">developers.facebook.com</a></li>
            <li>Crea una app y selecciona &quot;Business&quot;</li>
            <li>Agrega el producto &quot;WhatsApp&quot;</li>
            <li>En &quot;API Setup&quot; encontras tu Phone Number ID y Access Token</li>
            <li>En &quot;Configuration&quot;, pega tu Webhook URL y Verify Token</li>
            <li>Suscribete al campo &quot;messages&quot;</li>
            <li>Listo! Tu bot empieza a responder</li>
          </ol>
        </div>
      </div>
    </>
  );
}
