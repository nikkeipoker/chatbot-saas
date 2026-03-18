const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@chatbotsaas.com';

/**
 * Send password reset email with a styled HTML template
 */
async function sendPasswordResetEmail(toEmail, resetUrl, businessName = 'ChatBot SaaS') {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Email] No RESEND_API_KEY set. Reset URL for ${toEmail}: ${resetUrl}`);
      return { success: false, reason: 'no_api_key' };
    }

    const { data, error } = await resend.emails.send({
      from: `${businessName} <${FROM_EMAIL}>`,
      to: toEmail,
      subject: '🔑 Recuperar contraseña — ChatBot SaaS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#12121a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:40px 32px;text-align:center;">
              <div style="font-size:2.5rem;margin-bottom:12px;">🔑</div>
              <h1 style="color:white;margin:0;font-size:1.5rem;font-weight:700;">Recuperar Contraseña</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:0.95rem;">ChatBot SaaS</p>
            </div>

            <!-- Body -->
            <div style="padding:32px;">
              <p style="color:#e2e8f0;font-size:1rem;margin:0 0 16px;">Hola! Recibimos una solicitud para resetear la contraseña de tu cuenta.</p>
              <p style="color:#94a3b8;font-size:0.9rem;margin:0 0 28px;">Si no fuiste vos, podés ignorar este email.</p>
              
              <!-- Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:white;
                          text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;
                          font-size:1rem;letter-spacing:0.3px;">
                  🔒 Cambiar Contraseña
                </a>
              </div>

              <!-- Warning -->
              <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:8px;padding:16px;margin:24px 0;">
                <p style="color:#a78bfa;margin:0;font-size:0.85rem;">
                  ⚠️ Este link expira en <strong>1 hora</strong>. Si ya expiró, solicitá uno nuevo desde la pantalla de login.
                </p>
              </div>

              <!-- Fallback URL -->
              <p style="color:#64748b;font-size:0.8rem;margin:24px 0 0;">
                Si el botón no funciona, copia y pega esta URL en tu navegador:<br>
                <a href="${resetUrl}" style="color:#7c3aed;word-break:break-all;">${resetUrl}</a>
              </p>
            </div>

            <!-- Footer -->
            <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="color:#475569;font-size:0.75rem;margin:0;">ChatBot SaaS · Este es un email automático, no respondas.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return { success: false, error };
    }

    console.log(`[Email] Password reset sent to ${toEmail} (id: ${data?.id})`);
    return { success: true };

  } catch (err) {
    console.error('[Email] Unexpected error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendPasswordResetEmail };
