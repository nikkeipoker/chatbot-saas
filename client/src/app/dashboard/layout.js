'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('tenant');
    if (u) setUser(JSON.parse(u));
    if (t) setTenant(JSON.parse(t));
  }, [router]);

  function handleLogout() {
    localStorage.clear();
    router.push('/login');
  }

  const navItems = [
    { href:'/dashboard', icon:'📊', label:'Dashboard' },
    { href:'/dashboard/conversations', icon:'💬', label:'Conversaciones' },
    { href:'/dashboard/bot-config', icon:'🤖', label:'Configurar Bot' },
    { href:'/dashboard/settings', icon:'⚙️', label:'Configuracion' },
    ...(user?.is_super_admin ? [{ href:'/dashboard/admin', icon:'🛡️', label:'Administracion' }] : []),
  ];

  if (!user) return <div className="loading-overlay" style={{minHeight:'100vh'}}><div className="spinner" style={{width:40,height:40}}></div></div>;

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Button - Minimalist */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
        id="mobile-toggle"
        style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1100,
          background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)',
          border: 'var(--glass-border)', color: '#fff', padding: '10px',
          borderRadius: '12px', cursor: 'pointer', display: 'none'
        }}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
      <style>{`@media(max-width:768px){#mobile-toggle{display:block!important} .sidebar{transform:translateX(-100%); width: 100%; max-width: 300px;} .sidebar.open{transform:translateX(0)} .main-stage{margin-left:0; padding: 24px;}}`}</style>

      {/* Premium Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.2rem'
          }}>🤖</div>
          <span>ChatBot V2</span>
        </div>

        <nav className="nav-list">
          {navItems.map(item => (
            <button 
              key={item.href} 
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => { router.push(item.href); setSidebarOpen(false); }}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: 'var(--glass-border)' }}>
          <div style={{ marginBottom: 20, padding: '0 18px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{tenant?.name || 'Mi Negocio'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-mute)' }}>{user?.email}</div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%', color: '#EF4444' }}>
            <span>🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-stage animate-fade">
        {children}
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && <div 
        onClick={() => setSidebarOpen(false)} 
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999 }} 
      />}
    </div>
  );
}
