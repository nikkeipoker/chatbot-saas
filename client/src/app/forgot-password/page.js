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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="logo">🔑</span>
          <h1>Recuperar Contraseña</h1>
          <p>Te enviamos un link para resetearla</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📧</div>
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>¡Email enviado!</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Revisá tu bandeja de entrada en <strong>{email}</strong> y seguí el link para cambiar tu contraseña.
            </p>
            <a href="/login" className="btn btn-primary">Volver al Login</a>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="toast toast-error" style={{ position: 'relative', top: 0, right: 0 }}>{error}</div>}
            <div className="input-group">
              <label>Tu email</label>
              <input type="email" className="input-field" placeholder="tu@negocio.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Enviando...' : '📧 Enviar link de recupero'}
            </button>
          </form>
        )}
        <div className="auth-divider"><a href="/login" className="auth-link">← Volver al Login</a></div>
      </div>
    </div>
  );
}
