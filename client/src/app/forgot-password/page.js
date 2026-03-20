'use client';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSent(true);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-wrapper animate-fade">
      <div className="glass-card auth-card-v2">
        <div className="auth-header">
          <span className="logo">🔑</span>
          <h1 className="font-display">Recuperar Acceso</h1>
          <p>Te enviaremos un enlace seguro para restablecer tu contraseña</p>
        </div>

        {sent ? (
          <div className="animate-fade" style={{ padding: '24px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: 24, filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.3))' }}>📧</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 12, color: '#fff' }}>¡Email Enviado!</h3>
            <p style={{ color: 'var(--color-text-dim)', marginBottom: 32, fontSize: '0.95rem', lineHeight: 1.6 }}>
              Hemos enviado instrucciones a <strong>{email}</strong>. <br />
              Por favor, revisa tu bandeja de entrada y spam.
            </p>
            <a href="/login" className="btn-premium btn-p-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              Volver al Inicio
            </a>
          </div>
        ) : (
          <form className="auth-form-v2" onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            
            <div>
              <label>Tu Correo Electrónico</label>
              <input 
                type="email" 
                className="input-premium" 
                placeholder="tu@negocio.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <button type="submit" className="btn-premium btn-p-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
              {loading ? 'Enviando...' : '📧 Enviar Enlace de Recuperación'}
            </button>
          </form>
        )}
        
        <div className="auth-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 32 }}>
          <a href="/login">← Volver al Inicio de Sesión</a>
        </div>
      </div>
    </div>
  );
}
