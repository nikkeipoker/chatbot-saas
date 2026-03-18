const db = require('../db');
const moment = require('moment'); // Using moment for easy date math

/**
 * Gets the next available slots for a tenant for the next 7 days.
 * Returns an array of available slots: [{ start: Date, end: Date, formatted: 'Jueves 15, 14:00' }, ...]
 */
async function getAvailableSlots(tenantId, daysAhead = 7) {
  // 1. Get rules
  const rules = await db('availability_rules').where({ tenant_id: tenantId, is_active: true });
  if (!rules.length) return []; // No availability defined

  // 2. Get existing future appointments
  const now = moment();
  const maxDate = moment().add(daysAhead, 'days').endOf('day');
  
  const appointments = await db('appointments')
    .where('tenant_id', tenantId)
    .whereIn('status', ['confirmed', 'pending'])
    .where('appointment_time', '>', now.toDate())
    .where('appointment_time', '<=', maxDate.toDate());

  const bookedTimes = appointments.map(a => moment(a.appointment_time).format('YYYY-MM-DD HH:mm'));

  // 3. Generate slots
  let availableSlots = [];
  
  for (let i = 0; i <= daysAhead; i++) {
    const currentDay = moment().add(i, 'days');
    const dayOfWeek = currentDay.day(); // 0(Sun) - 6(Sat)
    
    const rule = rules.find(r => r.day_of_week === dayOfWeek);
    if (!rule) continue;

    const startOfDay = moment(currentDay).format('YYYY-MM-DD');
    const startTimeStr = `${startOfDay} ${rule.start_time}`;
    const endTimeStr = `${startOfDay} ${rule.end_time}`;
    
    let currentSlot = moment(startTimeStr, 'YYYY-MM-DD HH:mm:ss');
    const endSlot = moment(endTimeStr, 'YYYY-MM-DD HH:mm:ss');
    const duration = rule.slot_duration_minutes || 30;

    while (currentSlot.isBefore(endSlot)) {
      if (currentSlot.isAfter(now)) { // Don't show slots in the past today
        const slotKey = currentSlot.format('YYYY-MM-DD HH:mm');
        
        // If not booked, it's available
        if (!bookedTimes.includes(slotKey)) {
          availableSlots.push({
            start: currentSlot.toDate(),
            formatted: currentSlot.locale('es').format('dddd DD/MM [a las] HH:mm')
          });
        }
      }
      currentSlot.add(duration, 'minutes');
    }
  }

  // Cap at 15 slots to not overwhelm WhatsApp messages
  return availableSlots.slice(0, 15);
}

/**
 * Books an appointment
 */
async function bookAppointment(tenantId, customerName, customerPhone, startTimeDate) {
  // Double check if slot is still available
  const existing = await db('appointments')
    .where({ tenant_id: tenantId })
    .whereIn('status', ['confirmed', 'pending'])
    .where('appointment_time', startTimeDate)
    .first();
    
  if (existing) {
    throw new Error('Lo siento, ese horario ya fue reservado por otra persona.');
  }

  const [appointment] = await db('appointments').insert({
    tenant_id: tenantId,
    customer_name: customerName,
    customer_phone: customerPhone,
    appointment_time: startTimeDate,
    status: 'confirmed'
  }).returning('*');

  return appointment;
}

module.exports = {
  getAvailableSlots,
  bookAppointment
};
