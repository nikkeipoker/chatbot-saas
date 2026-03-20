'use client';
import { useEffect, useState } from 'react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadConversations(); }, []);

  async function loadConversations() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tenant/conversations?limit=50', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h`;
    return d.toLocaleDateString('es-AR', { day:'numeric', month:'short' });
  }

  function getLastMessage(conv) {
    const msgs = conv.messages || [];
    if (msgs.length === 0) return 'Sin mensajes';
    const last = msgs[msgs.length - 1];
    return `${last.role === 'assistant' ? '🤖 ' : ''}${last.content?.substring(0, 60)}...`;
  }

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{width:40,height:40}}></div></div>;

  return (
    <div className="animate-fade" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Centro de Mensajes</h1>
          <p style={{ color: 'var(--color-text-dim)' }}>Gestiona las interacciones de tus clientes en tiempo real.</p>
        </div>
        <div className="flex items-center gap-md">
           <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-mute)' }}>Total:</span> <span style={{ fontWeight: 600 }}>{conversations.length}</span>
           </div>
        </div>
      </div>

      {/* MAIN INTERFACE */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, minHeight: 0 }}>
        
        {/* CONVERSATION LIST */}
        <div className="glass-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
             <input className="input-premium" placeholder="🔍 Buscar cliente..." style={{ fontSize: '0.85rem', padding: '10px 16px' }} />
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
            {conversations.length === 0 ? (
               <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>💬</div>
                  <p>No hay mensajes aún</p>
               </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id} 
                  onClick={() => setSelected(conv)}
                  style={{ 
                    padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: selected?.id === conv.id ? 'rgba(124,58,237,0.08)' : 'transparent',
                    borderLeft: selected?.id === conv.id ? '3px solid var(--color-primary)' : '3px solid transparent'
                  }}
                  onMouseEnter={e => { if(selected?.id !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { if(selected?.id !== conv.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex justify-between items-start" style={{ marginBottom: 4 }}>
                     <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{conv.customer_phone}</span>
                     <span style={{ fontSize: '0.7rem', color: 'var(--color-text-mute)' }}>{formatTime(conv.last_message_at)}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                     {getLastMessage(conv)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CHAT VIEW */}
        <div className="glass-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {!selected ? (
            <div className="flex flex-center" style={{ height: '100%', flexDirection: 'column', opacity: 0.3 }}>
               <div style={{ fontSize: '4rem', marginBottom: 20 }}>📬</div>
               <p style={{ fontSize: '1.1rem' }}>Selecciona una conversación para leerla</p>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}
              <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div className="flex items-center gap-md">
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                       {selected.customer_phone.substring(selected.customer_phone.length - 2)}
                    </div>
                    <div>
                       <div style={{ fontWeight: 600 }}>{selected.customer_phone}</div>
                       <div style={{ fontSize: '0.75rem', color: '#10B981' }}>Activo ahora</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-md">
                    <button className="btn-premium" style={{ padding: '6px 14px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}>
                       Asumir Control Humano
                    </button>
                 </div>
              </div>

              {/* MESSAGES */}
              <div 
                style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(0,0,0,0.1)' }}
                className="custom-scrollbar"
              >
                {(selected.messages || []).map((msg, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      alignSelf: msg.role === 'user' ? 'flex-start' : 'flex-end',
                      maxWidth: '75%',
                      position: 'relative'
                    }}
                  >
                    <div style={{ 
                      padding: '12px 16px', 
                      borderRadius: '16px',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : 'var(--color-primary)',
                      color: msg.role === 'user' ? '#fff' : '#fff',
                      borderBottomLeftRadius: msg.role === 'user' ? 0 : '16px',
                      borderBottomRightRadius: msg.role === 'user' ? '16px' : 0,
                      boxShadow: msg.role === 'user' ? 'none' : '0 4px 15px rgba(124,58,237,0.3)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-mute)', marginTop: 4, textAlign: msg.role === 'user' ? 'left' : 'right' }}>
                       {msg.role === 'user' ? 'Cliente' : 'Asistente IA'} • Justo ahora
                    </div>
                  </div>
                ))}
              </div>

              {/* INPUT AREA (READ ONLY FOR NOW) */}
              <div style={{ padding: 20, background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                 <div className="flex gap-md">
                    <input className="input-premium" disabled placeholder="Respuesta manual deshabilitada en la versión beta" style={{ opacity: 0.6 }} />
                    <button className="btn-premium btn-p-primary" disabled style={{ opacity: 0.5 }}>Enviar</button>
                 </div>
              </div>
            </>
          )}
        </div>

      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
