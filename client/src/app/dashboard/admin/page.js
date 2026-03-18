'use client';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const token = localStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const [tenantsRes, statsRes] = await Promise.all([
        fetch('/api/admin/tenants', { headers: h }),
        fetch('/api/admin/stats', { headers: h })
      ]);
      if (tenantsRes.ok) setTenants((await tenantsRes.json()).tenants || []);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function changeStatus(id, status) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/tenants/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscription_status: status })
      });
      if (res.ok) {
        showToast(`Cliente ${status === 'active' ? 'activado' : status === 'suspended' ? 'suspendido' : status}`, 'success');
        loadData();
      }
    } catch (e) { showToast('Error', 'error'); }
  }

  function showToast(msg, type) { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }

  function statusBadge(status) {
    const map = { active: 'badge-active', trial: 'badge-trial', suspended: 'badge-suspended', cancelled: 'badge-suspended' };
    const labels = { active: 'Activo', trial: 'Prueba', suspended: 'Suspendido', cancelled: 'Cancelado' };
    return <span className={`badge ${map[status] || 'badge-trial'}`}>{labels[status] || status}</span>;
  }

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;

  return (
    <>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header"><h1>🛡️ Panel de Administracion</h1><p>Gestiona todos los clientes de la plataforma</p></div>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="stat-card"><div className="stat-icon">🏪</div><div className="stat-value">{stats.totalTenants}</div><div className="stat-label">Clientes Totales</div></div>
          <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{stats.activeTenants}</div><div className="stat-label">Activos</div></div>
          <div className="stat-card"><div className="stat-icon">💬</div><div className="stat-value">{stats.totalConversations}</div><div className="stat-label">Conversaciones</div></div>
          <div className="stat-card"><div className="stat-icon">📨</div><div className="stat-value">{stats.totalMessages}</div><div className="stat-label">Mensajes Totales</div></div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Modo Bot</th>
                <th>Estado</th>
                <th>Conversaciones</th>
                <th>Mensajes</th>
                <th>Meta WhatsApp</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No hay clientes registrados</td></tr>
              ) : (
                tenants.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td><span className={`badge ${t.bot_mode === 'ai' ? 'badge-active' : 'badge-trial'}`}>{t.bot_mode === 'ai' ? '🧠 IA' : '📋 Estatico'}</span></td>
                    <td>{statusBadge(t.subscription_status)}</td>
                    <td>{t.conversation_count}</td>
                    <td>{t.total_messages}</td>
                    <td>{t.meta_access_token ? '✅ Conectado' : '❌ Sin conectar'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{new Date(t.created_at).toLocaleDateString('es-AR')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {t.subscription_status !== 'active' && (
                          <button className="btn btn-success btn-sm" onClick={() => changeStatus(t.id, 'active')} title="Activar">✅</button>
                        )}
                        {t.subscription_status !== 'suspended' && (
                          <button className="btn btn-danger btn-sm" onClick={() => changeStatus(t.id, 'suspended')} title="Suspender">⛔</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
