'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
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

  const PasswordInput = ({ field, placeholder, show, onToggle }) => (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        className="input-premium"
        placeholder={placeholder}
        value={form[field]}
        onChange={e => u(field, e.target.value)}
        required minLength={8}
        style={{ paddingRight: 48 }}
      />
      <button 
        type="button" 
        onClick={onToggle} 
        style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-mute)'
        }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );

  if (!token) return (
    <div className="auth-wrapper animate-fade">
      <div className="glass-card auth-card-v2">
        <div className="auth-header">
          <span className="logo">❌</span>
          <h1 className="font-display">Enlace Inválido</h1>
          <p>Este enlace de recuperación no es válido o ya ha expirado.</p>
        </div>
        <a href="/forgot-password" className="btn-premium btn-p-primary" style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}>
          Solicitar nuevo enlace
        </a>
      </div>
    </div>
  );

  return (
    <div className="auth-wrapper animate-fade">
      <div className="glass-card auth-card-v2">
        <div className="auth-header">
          <span className="logo">🔒</span>
          <h1 className="font-display">Nueva Contraseña</h1>
          <p>Crea una nueva contraseña segura para tu cuenta</p>
        </div>

        {success ? (
          <div className="animate-fade" style={{ padding: '24px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: 24, filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))' }}>✅</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 12, color: '#fff' }}>¡Actualizada!</h3>
            <p style={{ color: 'var(--color-text-dim)', marginBottom: 32 }}>
              Tu contraseña ha sido cambiada con éxito. <br />
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        ) : (
          <form className="auth-form-v2" onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            
            <div>
              <label>Nueva Contraseña</label>
              <PasswordInput 
                field="password" 
                placeholder="Mínimo 8 caracteres" 
                show={showPassword} 
                onToggle={() => setShowPassword(!showPassword)} 
              />
            </div>
            
            <div>
              <label>Confirmar Contraseña</label>
              <PasswordInput 
                field="confirmPassword" 
                placeholder="Repite tu contraseña" 
                show={showConfirm} 
                onToggle={() => setShowConfirm(!showConfirm)} 
              />
            </div>
            
            <button type="submit" className="btn-premium btn-p-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
              {loading ? 'Guardando...' : '🔒 Cambiar Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-container"><div className="spinner" style={{width: 40, height: 40}}></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
