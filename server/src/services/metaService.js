/**
 * Meta WhatsApp Cloud API service.
 * Sends messages directly via Meta — NO Twilio needed.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const META_API_URL = 'https://graph.facebook.com/v19.0';

// Send a text message
async function sendMessage(phoneNumberId, accessToken, to, text) {
  try {
    const url = `${META_API_URL}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: text }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Meta] Send error:', JSON.stringify(data));
      return null;
    }

    console.log(`[Meta] Sent to ${to}: ${text.substring(0, 50)}...`);
    return data;
  } catch (error) {
    console.error('[Meta] Send failed:', error.message);
    return null;
  }
}

// Mark message as read (blue ticks)
async function markAsRead(phoneNumberId, accessToken, messageId) {
  try {
    const url = `${META_API_URL}/${phoneNumberId}/messages`;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
    });
  } catch (error) {
    // Non-critical, ignore
  }
}

module.exports = { sendMessage, markAsRead };
