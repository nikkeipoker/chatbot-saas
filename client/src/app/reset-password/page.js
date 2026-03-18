'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const u = (f, v) => setForm(p => ({ ...p, [f]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    if (form.password.length < 8) { setError('Mínimo 8 caracteres'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al resetear');
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (!token) return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header"><span className="logo">❌</span><h1>Link inválido</h1><p>Este link de recupero no es válido o expiró.</p></div>
        <a href="/forgot-password" className="btn btn-primary btn-full">Solicitar nuevo link</a>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="logo">🔒</span>
          <h1>Nueva Contraseña</h1>
          <p>Elegí una contraseña segura</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>✅</div>
            <h3>¡Contraseña actualizada!</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>Redirigiendo al login...</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="toast toast-error" style={{ position: 'relative', top: 0, right: 0 }}>{error}</div>}
            <div className="input-group">
              <label>Nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => u('password', e.target.value)} required minLength={8} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <div className="input-group">
              <label>Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} className="input-field" placeholder="Repetir contraseña" value={form.confirmPassword} onChange={e => u('confirmPassword', e.target.value)} required minLength={8} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>{showConfirm ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Guardando...' : '🔒 Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
