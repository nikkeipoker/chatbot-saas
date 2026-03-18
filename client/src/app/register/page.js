'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:'', restaurantName:'', email:'', password:'', confirmPassword:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const u = (f,v) => setForm(p=>({...p,[f]:v}));

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Las contrasenas no coinciden'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email:form.email, password:form.password, name:form.name, restaurantName:form.restaurantName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrarse');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('tenant', JSON.stringify(data.tenant));
      router.push('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{maxWidth:480}}>
        <div className="auth-header">
          <span className="logo">🚀</span>
          <h1>Crea tu ChatBot con IA</h1>
          <p>Registrate y activa tu bot en minutos</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="toast toast-error" style={{position:'relative',top:0,right:0}}>{error}</div>}
          <div className="input-group"><label>Tu nombre</label><input className="input-field" placeholder="Juan Perez" value={form.name} onChange={e=>u('name',e.target.value)} required /></div>
          <div className="input-group"><label>Nombre del negocio</label><input className="input-field" placeholder="Mi Restaurante" value={form.restaurantName} onChange={e=>u('restaurantName',e.target.value)} required /></div>
          <div className="input-group"><label>Email</label><input type="email" className="input-field" placeholder="tu@negocio.com" value={form.email} onChange={e=>u('email',e.target.value)} required /></div>
          <div className="input-group"><label>Contrasena</label><input type="password" className="input-field" placeholder="Minimo 8 caracteres" value={form.password} onChange={e=>u('password',e.target.value)} required minLength={8} /></div>
          <div className="input-group"><label>Confirmar contrasena</label><input type="password" className="input-field" placeholder="Repetir contrasena" value={form.confirmPassword} onChange={e=>u('confirmPassword',e.target.value)} required minLength={8} /></div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{marginTop:8}}>
            {loading ? 'Creando cuenta...' : '🎉 Comenzar Gratis — 14 dias'}
          </button>
        </form>
        <div className="auth-divider">Ya tienes cuenta? <a href="/login" className="auth-link">Inicia sesion</a></div>
      </div>
    </div>
  );
}
