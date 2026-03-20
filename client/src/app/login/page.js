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
    <div className="auth-wrapper animate-fade">
      <div className="glass-card auth-card-v2">
        <div className="auth-header">
          <span className="logo">🤖</span>
          <h1 className="font-display">Bienvenido</h1>
          <p>Ingresa a tu panel de control para gestionar tu bot</p>
        </div>
        
        <form className="auth-form-v2" onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          
          <div>
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              className="input-premium" 
              placeholder="tu@negocio.com" 
              value={form.email} 
              onChange={e => u('email', e.target.value)} 
              required 
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
              <label style={{ marginBottom: 0 }}>Contraseña</label>
              <a href="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', textDecoration: 'none' }}>¿La olvidaste?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-premium"
                placeholder="Tu contraseña secreta"
                value={form.password}
                onChange={e => u('password', e.target.value)}
                required
                style={{ paddingRight: 48 }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-mute)'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn-premium btn-p-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
            {loading ? 'Validando...' : '🚀 Iniciar Sesión'}
          </button>
        </form>
        
        <div className="auth-footer">
          ¿No tienes una cuenta todavía? <a href="/register">Regístrate Gratis</a>
        </div>
      </div>
    </div>
  );
}
