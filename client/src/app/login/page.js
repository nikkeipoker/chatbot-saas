'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesion');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('tenant', JSON.stringify(data.tenant));
      router.push('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="logo">🤖</span>
          <h1>ChatBot SaaS</h1>
          <p>Inicia sesion en tu panel de control</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="toast toast-error" style={{position:'relative',top:0,right:0}}>{error}</div>}
          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" className="input-field" placeholder="tu@negocio.com" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="login-pass">Contrasena</label>
            <input id="login-pass" type="password" className="input-field" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesion'}
          </button>
        </form>
        <div className="auth-divider">No tienes cuenta? <a href="/register" className="auth-link">Registrate gratis</a></div>
      </div>
    </div>
  );
}
