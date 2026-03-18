'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const u = (f, v) => setForm(p => ({ ...p, [f]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
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
          <h1>Bienvenido</h1>
          <p>Ingresa a tu panel de control</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="toast toast-error" style={{ position: 'relative', top: 0, right: 0 }}>{error}</div>}
          <div className="input-group">
            <label>Email</label>
            <input type="email" className="input-field" placeholder="tu@negocio.com" value={form.email} onChange={e => u('email', e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Tu contraseña"
                value={form.password}
                onChange={e => u('password', e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--color-text-muted)'
              }}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <a href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--color-primary-light)' }}>¿Olvidaste tu contraseña?</a>
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Ingresando...' : '🚀 Ingresar'}
          </button>
        </form>
        <div className="auth-divider">¿No tenes cuenta? <a href="/register" className="auth-link">Registrate gratis</a></div>
      </div>
    </div>
  );
}
