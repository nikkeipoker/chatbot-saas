'use client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tenant/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{width:40,height:40}}></div></div>;

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Resumen de actividad de tu chatbot</p>
      </div>

      <div className="stats-grid" style={{marginBottom:'var(--space-xl)'}}>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-value">{stats?.todayActive || 0}</div>
          <div className="stat-label">Conversaciones Hoy</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats?.totalConversations || 0}</div>
          <div className="stat-label">Total Clientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📨</div>
          <div className="stat-value">{stats?.totalMessages || 0}</div>
          <div className="stat-label">Mensajes Totales</div>
        </div>
      </div>

      {/* Quick Setup Guide */}
      <div className="card" style={{marginBottom:'var(--space-xl)'}}>
        <h3 style={{marginBottom:'var(--space-lg)'}}>🚀 Guia Rapida de Configuracion</h3>
        <div style={{display:'flex',flexDirection:'column',gap:'var(--space-md)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'var(--space-md)',padding:'12px',background:'var(--color-bg-input)',borderRadius:'var(--radius-md)'}}>
            <span style={{fontSize:'1.5rem',width:40,textAlign:'center'}}>1️⃣</span>
            <div>
              <div style={{fontWeight:600}}>Configura tu Bot</div>
              <div style={{fontSize:'0.85rem',color:'var(--color-text-muted)'}}>Personaliza el prompt de IA y los mensajes → <a href="/dashboard/bot-config">Ir a Configurar Bot</a></div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'var(--space-md)',padding:'12px',background:'var(--color-bg-input)',borderRadius:'var(--radius-md)'}}>
            <span style={{fontSize:'1.5rem',width:40,textAlign:'center'}}>2️⃣</span>
            <div>
              <div style={{fontWeight:600}}>Conecta WhatsApp</div>
              <div style={{fontSize:'0.85rem',color:'var(--color-text-muted)'}}>Agrega tus credenciales de Meta → <a href="/dashboard/settings">Ir a Configuracion</a></div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'var(--space-md)',padding:'12px',background:'var(--color-bg-input)',borderRadius:'var(--radius-md)'}}>
            <span style={{fontSize:'1.5rem',width:40,textAlign:'center'}}>3️⃣</span>
            <div>
              <div style={{fontWeight:600}}>Listo!</div>
              <div style={{fontSize:'0.85rem',color:'var(--color-text-muted)'}}>Tu bot responde automaticamente con IA a todos los mensajes de WhatsApp</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
