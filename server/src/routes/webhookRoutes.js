const express = require('express');
const db = require('../db');
const botEngine = require('../logic/botEngine');

const router = express.Router();

/**
 * GET /webhook — Meta verification endpoint
 * Meta sends a GET request to verify your webhook URL
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('[Webhook] Meta verification successful');
    return res.status(200).send(challenge);
  }

  console.warn('[Webhook] Meta verification failed');
  res.sendStatus(403);
});

/**
 * POST /webhook — Receive messages from Meta Cloud API
 * Identifies tenant by phone_number_id, routes to bot engine
 */
router.post('/', async (req, res) => {
  try {
    // Always respond 200 immediately to Meta (required within 5 seconds)
    res.sendStatus(200);

    const body = req.body;

    if (body.object !== 'whatsapp_business_account') return;

    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        const messages = value?.messages || [];

        if (!phoneNumberId || messages.length === 0) continue;

        // Find tenant by phone_number_id
        const tenant = await db('tenants')
          .where('meta_phone_number_id', phoneNumberId)
          .first();

        if (!tenant) {
          console.warn(`[Webhook] No tenant for phone_number_id: ${phoneNumberId}`);
          continue;
        }

        // Check subscription
        if (tenant.subscription_status === 'suspended') continue;
        if (tenant.subscription_status === 'trial' && new Date(tenant.trial_ends_at) < new Date()) continue;

        for (const message of messages) {
          // Only handle text messages for now
          if (message.type !== 'text') continue;

          const from = message.from; // Customer phone number
          const text = message.text?.body;
          const messageId = message.id;

          if (!text) continue;

          console.log(`[Webhook] [${tenant.name}] From ${from}: ${text.substring(0, 50)}`);

          // Process async to not block webhook
          botEngine.handleMessage(tenant.id, from, text, messageId).catch(err => {
            console.error('[Webhook] Bot engine error:', err.message);
          });
        }
      }
    }
  } catch (error) {
    console.error('[Webhook] Error:', error.message);
  }
});

module.exports = router;
