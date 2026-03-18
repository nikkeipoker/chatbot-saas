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
    { href:'/dashboard/calendar', icon:'📅', label:'Turnos / Reservas' },
    { href:'/dashboard/settings', icon:'⚙️', label:'Configuracion' },
    ...(user?.is_super_admin ? [{ href:'/dashboard/admin', icon:'🛡️', label:'Administracion' }] : []),
  ];

  if (!user) return <div className="loading-overlay" style={{minHeight:'100vh'}}><div className="spinner" style={{width:40,height:40}}></div></div>;

  return (
    <>
      <button className="btn btn-secondary" onClick={()=>setSidebarOpen(!sidebarOpen)} id="mobile-menu-btn" style={{position:'fixed',top:16,left:16,zIndex:200,display:'none',padding:'8px 12px'}}>☰</button>
      <style>{`@media(max-width:768px){#mobile-menu-btn{display:flex!important}}`}</style>

      <aside className={`sidebar ${sidebarOpen?'open':''}`}>
        <div className="sidebar-brand"><div className="brand-icon">🤖</div><h2>ChatBot SaaS</h2></div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.href} className={`sidebar-link ${pathname===item.href?'active':''}`} onClick={()=>{router.push(item.href);setSidebarOpen(false);}}>
              <span className="link-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{marginBottom:12,padding:'0 8px'}}>
            <div style={{fontSize:'0.85rem',fontWeight:600}}>{tenant?.name||'Mi Negocio'}</div>
            <div style={{fontSize:'0.75rem',color:'var(--color-text-muted)'}}>{user?.email}</div>
          </div>
          <button className="sidebar-link" onClick={handleLogout} style={{color:'var(--color-danger)'}}>
            <span className="link-icon">🚪</span>Cerrar Sesion
          </button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:99}} />}

      <main className="main-content">{children}</main>
    </>
  );
}
