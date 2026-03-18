require('dotenv').config();
const express = require('express');
const security = require('./middleware/security');
const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const adminRoutes = require('./routes/adminRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Security ---
app.use(security.helmet);
app.use(security.cors());

// --- Body Parsers ---
// Webhook needs raw body for signature verification
app.use('/webhook', express.json({
  verify: security.verifyMetaSignature
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Rate Limiting ---
app.use('/api/', security.apiLimiter);

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/webhook', webhookRoutes);

// --- Health Check ---
app.get('/', (req, res) => {
  res.json({
    service: 'ChatBot SaaS API',
    status: 'running',
    version: '1.0.0',
    whatsapp: 'Meta Cloud API',
    ai: 'OpenAI GPT-4o-mini'
  });
});

// --- Me Route ---
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user, tenant: req.tenant });
});

// --- Error Handler ---
app.use(security.errorHandler);

app.listen(PORT, () => {
  console.log(`🤖 ChatBot SaaS running on port ${PORT}`);
  console.log(`📡 Webhook: /webhook`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
