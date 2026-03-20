'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', restaurantName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const u = (f, v) => setForm(p => ({ ...p, [f]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, name: form.name, restaurantName: form.restaurantName })
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

  return (
    <div className="auth-wrapper animate-fade">
      <div className="glass-card auth-card-v2" style={{ maxWidth: 500 }}>
        <div className="auth-header">
          <span className="logo">🚀</span>
          <h1 className="font-display">Crea tu ChatBot</h1>
          <p>Potenciado con IA y conectado a WhatsApp en minutos</p>
        </div>
        
        <form className="auth-form-v2" onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          
          <div className="flex gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label>Tu Nombre</label>
              <input 
                className="input-premium" 
                placeholder="Ej: Juan" 
                value={form.name} 
                onChange={e => u('name', e.target.value)} 
                required 
              />
            </div>
            <div>
              <label>Tu Negocio</label>
              <input 
                className="input-premium" 
                placeholder="Ej: Sushi Zen" 
                value={form.restaurantName} 
                onChange={e => u('restaurantName', e.target.value)} 
                required 
              />
            </div>
          </div>
          
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
            <label>Contraseña</label>
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
            {loading ? 'Creando cuenta...' : '🎉 Comenzar — 14 días de prueba'}
          </button>
        </form>
        
        <div className="auth-footer">
          ¿Ya tienes una cuenta? <a href="/login">Inicia Sesión</a>
        </div>
      </div>
    </div>
  );
}
