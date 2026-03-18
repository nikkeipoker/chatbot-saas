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
    <>
      <div className="page-header">
        <h1>Conversaciones</h1>
        <p>Historial de chats con tus clientes</p>
      </div>

      <div className="grid-2" style={{gridTemplateColumns:'350px 1fr',height:'calc(100vh - 160px)'}}>
        {/* Conversation List */}
        <div className="card" style={{padding:0,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'var(--space-md)',borderBottom:'1px solid var(--color-border)'}}>
            <div style={{fontSize:'0.85rem',color:'var(--color-text-muted)'}}>{conversations.length} conversaciones</div>
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {conversations.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">💬</div><p>Aun no hay conversaciones</p></div>
            ) : (
              conversations.map(conv => (
                <div key={conv.id} className="conversation-item" onClick={()=>setSelected(conv)}
                  style={{background: selected?.id === conv.id ? 'rgba(124,58,237,0.1)' : 'transparent'}}>
                  <div className="conversation-avatar">👤</div>
                  <div className="conversation-info">
                    <div className="conversation-name">{conv.customer_phone}</div>
                    <div className="conversation-preview">{getLastMessage(conv)}</div>
                  </div>
                  <div className="conversation-time">{formatTime(conv.last_message_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="card" style={{padding:0,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          {!selected ? (
            <div className="empty-state" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
              <div className="empty-icon">👈</div>
              <p>Selecciona una conversacion</p>
            </div>
          ) : (
            <>
              <div style={{padding:'var(--space-md) var(--space-lg)',borderBottom:'1px solid var(--color-border)',display:'flex',alignItems:'center',gap:'var(--space-md)'}}>
                <div className="conversation-avatar">👤</div>
                <div>
                  <div style={{fontWeight:600}}>{selected.customer_phone}</div>
                  <div style={{fontSize:'0.8rem',color:'var(--color-text-muted)'}}>{selected.message_count} mensajes</div>
                </div>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'var(--space-md)',display:'flex',flexDirection:'column',gap:'var(--space-sm)'}}>
                {(selected.messages || []).map((msg, i) => (
                  <div key={i} className={`message-bubble ${msg.role==='user'?'message-user':'message-bot'}`}>
                    {msg.content}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
