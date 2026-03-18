const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/**
 * --------------------------------
 * APPOINTMENTS (Bookings)
 * --------------------------------
 */

// GET /api/appointments
// List all appointments for the tenant (for the calendar UI)
router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query; // optional date range filtering
    let query = db('appointments').where('tenant_id', req.user.tenant_id);
    
    if (start) query = query.where('appointment_time', '>=', start);
    if (end) query = query.where('appointment_time', '<=', end);
    
    const appointments = await query.orderBy('appointment_time', 'asc');
    res.json(appointments);
  } catch (err) {
    console.error('[Appointments] Get error:', err);
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
});

// POST /api/appointments
// Create a new appointment (Manual creation from dashboard)
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_phone, appointment_time, notes } = req.body;
    
    if (!customer_name || !appointment_time) {
      return res.status(400).json({ error: 'Nombre y fecha requeridos' });
    }

    const [appointment] = await db('appointments').insert({
      tenant_id: req.user.tenant_id,
      customer_name,
      customer_phone: customer_phone || '',
      appointment_time,
      notes: notes || '',
      status: 'confirmed'
    }).returning('*');

    res.status(201).json(appointment);
  } catch (err) {
    console.error('[Appointments] Create error:', err);
    res.status(500).json({ error: 'Error al crear turno' });
  }
});

// PATCH /api/appointments/:id/status
// Update appointment status (e.g. cancelled)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Estado invalido' });
    }

    const [updated] = await db('appointments')
      .where({ id: req.params.id, tenant_id: req.user.tenant_id })
      .update({ status })
      .returning('*');

    if (!updated) return res.status(404).json({ error: 'Turno no encontrado' });
    res.json(updated);
  } catch (err) {
    console.error('[Appointments] Update status error:', err);
    res.status(500).json({ error: 'Error al actualizar el turno' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    const deletedCount = await db('appointments')
      .where({ id: req.params.id, tenant_id: req.user.tenant_id })
      .del();
      
    if (!deletedCount) return res.status(404).json({ error: 'Turno no encontrado' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Appointments] Delete error:', err);
    res.status(500).json({ error: 'Error al eliminar el turno' });
  }
});


/**
 * --------------------------------
 * AVAILABILITY RULES (Config)
 * --------------------------------
 */

// GET /api/appointments/rules
// Get working hours
router.get('/rules', async (req, res) => {
  try {
    const rules = await db('availability_rules')
      .where('tenant_id', req.user.tenant_id)
      .orderBy('day_of_week', 'asc');
    
    // Convert array of rules into a dictionary or just return array
    res.json(rules);
  } catch (err) {
    console.error('[Availability] Get error:', err);
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
});

// PUT /api/appointments/rules
// Bulk update working hours for the tenant
router.put('/rules', async (req, res) => {
  try {
    const { rules } = req.body; // Array of { day_of_week, start_time, end_time, slot_duration_minutes, is_active }
    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'Formato invalido' });
    }

    await db.transaction(async (trx) => {
      // Upsert each rule
      for (const rule of rules) {
        if (rule.day_of_week === undefined) continue;
        
        await trx('availability_rules')
          .insert({
            tenant_id: req.user.tenant_id,
            day_of_week: rule.day_of_week,
            start_time: rule.start_time || '09:00:00',
            end_time: rule.end_time || '18:00:00',
            slot_duration_minutes: rule.slot_duration_minutes || 30,
            is_active: rule.is_active !== false
          })
          .onConflict(['tenant_id', 'day_of_week'])
          .merge();
      }
    });

    const updated = await db('availability_rules').where('tenant_id', req.user.tenant_id).orderBy('day_of_week', 'asc');
    res.json(updated);
  } catch (err) {
    console.error('[Availability] Update error:', err);
    res.status(500).json({ error: 'Error al guardar horarios' });
  }
});

module.exports = router;
