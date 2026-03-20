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
    <div className="animate-fade">
      <div className="flex justify-between items-center" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Panel de Control</h1>
          <p style={{ color: 'var(--color-text-dim)' }}>Bienvenido de nuevo. Aquí tienes un resumen de tu actividad.</p>
        </div>
        <button className="btn-premium btn-p-primary" onClick={loadStats}>
          <span>🔄</span> Actualizar
        </button>
      </div>

      <div className="stat-grid">
        <div className="glass-card stat-v2">
          <div className="label">Conversaciones Hoy</div>
          <div className="value">{stats?.todayActive || 0}</div>
          <div className="trend up">▲ 12% vs ayer</div>
        </div>
        <div className="glass-card stat-v2">
          <div className="label">Total Contactos</div>
          <div className="value">{stats?.totalConversations || 0}</div>
          <div className="trend up">▲ 5 nuevos</div>
        </div>
        <div className="glass-card stat-v2">
          <div className="label">Mensajes Enviados</div>
          <div className="value">{stats?.totalMessages || 0}</div>
          <div className="trend up">▲ 142 este mes</div>
        </div>
        <div className="glass-card stat-v2">
          <div className="label">Resolución IA</div>
          <div className="value">94%</div>
          <div className="trend up" style={{ color: 'var(--color-primary-light)' }}>Optimizado</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '40px' }}>
        <h2 style={{ marginBottom: 32, fontSize: '1.6rem' }}>🚀 Guía de Configuración Rápida</h2>
        <div className="flex" style={{ gap: 24, flexDirection: 'column' }}>
          
          <div className="flex items-center gap-md" style={{ background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 50, height: 50, borderRadius: '12px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🤖</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#fff', marginBottom: 4 }}>1. Personaliza tu Agente</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Entrena a tu IA con el tono y conocimiento de tu negocio.</p>
            </div>
            <a href="/dashboard/bot-config" className="btn-premium btn-p-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>Configurar</a>
          </div>

          <div className="flex items-center gap-md" style={{ background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 50, height: 50, borderRadius: '12px', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📱</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#fff', marginBottom: 4 }}>2. Conecta WhatsApp</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Vincula tu cuenta de Meta Cloud API para empezar a responder.</p>
            </div>
            <a href="/dashboard/settings" className="btn-premium" style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 20px', fontSize: '0.85rem' }}>Ajustes</a>
          </div>

          <div className="flex items-center gap-md" style={{ background: 'rgba(16,185,129,0.05)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16,185,129,0.1)' }}>
            <div style={{ width: 50, height: 50, borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>✅</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#fff', marginBottom: 4 }}>3. ¡Todo listo!</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Tu bot ya está procesando mensajes automáticamente con IA.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
