import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filenamePath = fileURLToPath(import.meta.url);
const __dirnamePath = path.dirname(__filenamePath);
const logoPath = path.join(__dirnamePath, '../../frontend/public/images/logo.png');

import Booking from '../models/Booking.js';
import SlotCapacity from '../models/Slot.js';
import { getMailer } from '../mailer.js';
import Settings from '../models/Settings.js';
import TeamMember from '../models/TeamMember.js';
import { sendEmail } from '../mailer.js';

const router = express.Router();

import Service from '../models/Service.js';

// Get available slots for a given date
router.get('/slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { serviceId } = req.query;
    const slots = ['Morning', 'Afternoon', 'Evening'];
    const availability = [];

    // Identify if requested service is exclusive
    let isRequestedExclusive = false;
    if (serviceId) {
      const requestedService = await Service.findOne({ slug: serviceId });
      if (requestedService && requestedService.limitOnePerSession) {
        isRequestedExclusive = true;
      }
    }

    // Get all exclusive service names to check existing bookings
    const allServices = await Service.find();
    const exclusiveServiceNames = allServices.filter(s => s.limitOnePerSession).map(s => s.name);

    // Get default capacity based on weekday
    const settings = await Settings.findOne().lean() || {};
    // Parse date as UTC to avoid server timezone offset shifting the day of week
    const dayIndex = new Date(date).getUTCDay();
    
    // Check if the entire weekday is blocked (holiday)
    const isHoliday = settings.blockedWeekdays && settings.blockedWeekdays.includes(dayIndex);
    let defaultCapacity = 3;
    if (isHoliday) {
      defaultCapacity = 0;
    } else if (settings.weekdayCapacities) {
      const capStr = dayIndex.toString();
      const capNum = typeof settings.weekdayCapacities.get === 'function' 
        ? settings.weekdayCapacities.get(capStr) 
        : settings.weekdayCapacities[capStr];
      if (capNum !== undefined && capNum !== null) {
        defaultCapacity = capNum;
      }
    }

    for (let slot of slots) {
      let slotRecord = await SlotCapacity.findOne({ date, slot });
      
      // If legacy block (maxCapacity=0) or holiday, keep 0, otherwise use global defaultCapacity
      let maxCap = (slotRecord && slotRecord.maxCapacity === 0) || isHoliday ? 0 : defaultCapacity;
      let blockedCount = slotRecord ? slotRecord.blockedCount : 0;
      let currentBookings = slotRecord ? slotRecord.currentBookings : 0;
      
      let capacity = maxCap - blockedCount - currentBookings;
      let status = capacity > 0 ? 'Available' : 'Fully Booked';

      // Enforce Exclusivity Rule
      if (status === 'Available' && isRequestedExclusive) {
        // If the client wants an exclusive shoot, we must check if the session already contains ANY exclusive shoot
        const existingBookings = await Booking.find({ date, slot, bookingType: 'Client' });
        // Also check multi-slots (studio bookings) - studio bookings are exclusive by nature?
        const multiBookings = await Booking.find({ date, slots: slot, bookingType: 'Studio' });
        const allBookings = [...existingBookings, ...multiBookings];

        let hasExclusive = false;
        for (let b of allBookings) {
          if (b.bookingType === 'Studio') {
            hasExclusive = true; // Studio takes up the whole slot conceptually, or at least is exclusive
            break;
          }
          if (b.shootType && exclusiveServiceNames.some(name => b.shootType.startsWith(name))) {
            hasExclusive = true;
            break;
          }
        }

        if (hasExclusive) {
          status = 'Fully Booked';
          capacity = 0; // Prevent booking this slot for this specific service
        }
      }

      // Fetch actual booking details to display in the admin panel
      const existingBookings = await Booking.find({ date, slot, bookingType: 'Client' });
      const multiBookings = await Booking.find({ date, slots: slot, bookingType: 'Studio' });
      const allBookings = [...existingBookings, ...multiBookings];

      availability.push({ 
        slot, 
        capacity: capacity < 0 ? 0 : capacity, 
        status,
        maxCapacity: maxCap,
        blockedCount: slotRecord ? slotRecord.blockedCount : 0,
        currentBookings: slotRecord ? slotRecord.currentBookings : 0,
        bookingDetails: allBookings.map(b => ({ name: b.name, shootType: b.shootType }))
      });
    }

    res.json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching slots' });
  }
});

// Get slot capacities for a specific month
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    // Format: YYYY-MM
    const prefix = `${year}-${month.padStart(2, '0')}`;
    const capacities = await SlotCapacity.find({ date: { $regex: `^${prefix}` } });
    res.json(capacities);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching calendar data' });
  }
});

// Create a multi-slot Studio booking
router.post('/studio', async (req, res) => {
  try {
    const { name, studioName, email, phone, date, slots } = req.body;

    if (!slots || slots.length === 0) {
      return res.status(400).json({ error: 'At least one slot must be selected.' });
    }

    // 1. Validate capacity for ALL requested slots
    const settings = await Settings.findOne() || new Settings();
    const dayIndex = new Date(date).getUTCDay();
    const isHoliday = settings.blockedWeekdays && settings.blockedWeekdays.includes(dayIndex);
    let defaultCapacity = 3;
    if (isHoliday) {
      defaultCapacity = 0;
    } else if (settings.weekdayCapacities) {
      const capStr = dayIndex.toString();
      const capNum = typeof settings.weekdayCapacities.get === 'function' 
        ? settings.weekdayCapacities.get(capStr) 
        : settings.weekdayCapacities[capStr];
      if (capNum !== undefined && capNum !== null) {
        defaultCapacity = capNum;
      }
    }

    for (const slot of slots) {
      const slotRecord = await SlotCapacity.findOne({ date, slot });
      let maxCap = (slotRecord && slotRecord.maxCapacity === 0) || isHoliday ? 0 : defaultCapacity;
      let blockedCount = slotRecord ? slotRecord.blockedCount : 0;
      let currentBookings = slotRecord ? slotRecord.currentBookings : 0;

      if (currentBookings >= (maxCap - blockedCount)) {
        return res.status(400).json({ error: `Slot ${slot} is fully booked on ${date}.` });
      }
    }

    // 2. Create ONE booking with the array of slots
    const booking = new Booking({
      name,
      email,
      phone,
      bookingType: 'Studio',
      studioName,
      date,
      slots,
      // Optional default fallbacks for schema
      shootType: 'Studio Session',
      package: studioName || 'Studio Booking',
      status: 'Confirmed'
    });
    await booking.save();

    // 3. Update capacity for each slot
    for (const slot of slots) {
      let slotRecord = await SlotCapacity.findOne({ date, slot });
      if (slotRecord) {
        slotRecord.currentBookings += 1;
        await slotRecord.save();
      } else {
        slotRecord = new SlotCapacity({
          date, slot, currentBookings: 1, maxCapacity: defaultCapacity
        });
        await slotRecord.save();
      }
    }

    res.status(201).json({ message: 'Studio booked successfully', booking });
  } catch (error) {
    console.error('Error creating studio booking:', error);
    res.status(500).json({ error: 'Server error creating studio booking' });
  }
});

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, babyAge, shootType, package: pkg, date, slot, notes } = req.body;

    // Get default capacity for this weekday
    const settings = await Settings.findOne().lean() || {};
    const dayIndex = new Date(date).getUTCDay();
    const isHoliday = settings.blockedWeekdays && settings.blockedWeekdays.includes(dayIndex);
    let defaultCapacity = 3;
    if (isHoliday) {
      defaultCapacity = 0;
    } else if (settings.weekdayCapacities) {
      const capStr = dayIndex.toString();
      const capNum = typeof settings.weekdayCapacities.get === 'function' 
        ? settings.weekdayCapacities.get(capStr) 
        : settings.weekdayCapacities[capStr];
      if (capNum !== undefined && capNum !== null) {
        defaultCapacity = capNum;
      }
    }

    // Check capacity first
    let slotRecord = await SlotCapacity.findOne({ date, slot });
    let maxCap = (slotRecord && slotRecord.maxCapacity === 0) || isHoliday ? 0 : defaultCapacity;
    let blockedCount = slotRecord ? slotRecord.blockedCount : 0;
    let currentBookings = slotRecord ? slotRecord.currentBookings : 0;
    
    if (currentBookings >= (maxCap - blockedCount)) {
      return res.status(400).json({ error: 'Slot is fully booked' });
    }

    // Enforce Exclusivity Rule
    const allServices = await Service.find();
    const exclusiveServiceNames = allServices.filter(s => s.limitOnePerSession).map(s => s.name);
    
    if (shootType && exclusiveServiceNames.some(name => shootType.startsWith(name))) {
      // This is an exclusive shoot. Check if session already has one
      const existingBookings = await Booking.find({ date, slot, bookingType: 'Client' });
      const multiBookings = await Booking.find({ date, slots: slot, bookingType: 'Studio' });
      const allBookings = [...existingBookings, ...multiBookings];
      
      let hasExclusive = false;
      for (let b of allBookings) {
        if (b.bookingType === 'Studio') {
          hasExclusive = true;
          break;
        }
        if (b.shootType && exclusiveServiceNames.some(name => b.shootType.startsWith(name))) {
          hasExclusive = true;
          break;
        }
      }
      
      if (hasExclusive) {
        return res.status(400).json({ error: 'This session already has an exclusive shoot booked.' });
      }
    }

    // Create booking
    const booking = new Booking({
      name, email, phone, babyAge, shootType, package: pkg, date, slot, notes
    });
    await booking.save();

    // Update capacity
    if (slotRecord) {
      slotRecord.currentBookings += 1;
      await slotRecord.save();
    } else {
      slotRecord = new SlotCapacity({
        date, slot, currentBookings: 1, maxCapacity: defaultCapacity
      });
      await slotRecord.save();
    }

    // Try sending email
    try {
      if ((process.env.SMTP_USER || process.env.EMAIL_USER) && (process.env.SMTP_PASS || process.env.EMAIL_PASS)) {
        const authUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        const authPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
        const transporter = getMailer(authUser, authPass);

        const settings = await Settings.findOne() || {};
        const businessName = settings.businessName || process.env.APP_NAME || 'Studio OS';
        const contactEmail = settings.contactEmail || process.env.EMAIL_USER || 'contact@example.com';
        const logoHtml = settings.logoUrl 
          ? `<img src="${settings.logoUrl}" alt="${businessName}" style="max-width: 150px; height: auto;" />`
          : `<h2 style="color: #ffffff; margin: 0; letter-spacing: 2px;">${businessName}</h2>`;

        const teamEmails = settings.teamEmails && settings.teamEmails.length > 0 
          ? settings.teamEmails 
          : [contactEmail];

        const emailHtml = `
          <div style="background-color: #000000; padding: 40px 30px; font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              ${logoHtml}
            </div>
            <h2 style="color: #ffffff;">New Booking Request</h2>
            <p style="color: #ffffff;"><strong>Name:</strong> ${name}</p>
            <p style="color: #ffffff;"><strong>Email:</strong> ${email}</p>
            <p style="color: #ffffff;"><strong>Phone:</strong> ${phone}</p>
            <p style="color: #ffffff;"><strong>Shoot Type:</strong> ${shootType}</p>
            <p style="color: #ffffff;"><strong>Package:</strong> ${pkg}</p>
            <p style="color: #ffffff;"><strong>Date:</strong> ${date}</p>
            <p style="color: #ffffff;"><strong>Slot:</strong> ${slot}</p>
            <p style="color: #ffffff;"><strong>Baby Age:</strong> ${babyAge || 'N/A'}</p>
            <p style="color: #ffffff;"><strong>Notes:</strong> ${notes || 'N/A'}</p>
          </div>
        `;

        // Send to Client
        const clientEmailHtml = `
          <div style="background-color: #000000; padding: 40px 30px; font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 40px;">
              ${logoHtml}
            </div>
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px; color: #e5e5e5;">
              Hi ${name},
            </p>
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px; color: #e5e5e5;">
              We have received your booking request for <strong style="color: #ffffff;">${shootType}</strong>. We are thrilled to capture your special moments!
            </p>
            <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse; font-size: 14px; color: #e5e5e5;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);"><strong>Date:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);"><strong>Slot:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">${slot}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);"><strong>Package:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">${pkg}</td>
              </tr>
            </table>
            <p style="font-size: 13px; color: #a3a3a3; margin-bottom: 40px;">
              Need to contact us? Reach out directly:<br/>
              <span style="font-size: 16px; font-weight: bold; color: #ffffff; display: block; margin: 10px 0;">${settings.whatsappNumber || '+91 99999 99999'}</span>
              <a href="tel:${(settings.whatsappNumber || '+919999999999').replace(/\s/g, '')}" style="color: #ffffff; text-decoration: underline; margin-right: 15px;">📞 Call</a>
              <a href="https://wa.me/${(settings.whatsappNumber || '919999999999').replace(/\D/g, '')}" style="color: #ffffff; text-decoration: underline;">💬 WhatsApp</a>
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #e5e5e5;">
              Our team will review your request and be in touch shortly to confirm your slot.
            </p>
            <div style="margin-top: 50px; font-size: 11px; color: #737373; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
              <p>${businessName}</p>
              <p>Follow the link to opt out of future emails: <a href="#" style="color: #a3a3a3;">Click here to unsubscribe</a></p>
            </div>
          </div>
        `;

        transporter.sendMail({
          from: `"${businessName}" <${authUser}>`,
          to: email,
          subject: `Your ${businessName} Booking Request`,
          html: clientEmailHtml
        }).catch(e => console.error('Client email failed:', e));

        // Send to Team
        transporter.sendMail({
          from: `"${businessName} System" <${authUser}>`,
          to: teamEmails.join(', '),
          subject: `New Booking: ${shootType} on ${date}`,
          html: emailHtml
        }).catch(e => console.error('Team email failed:', e));
      } else {
        console.warn('Email credentials not configured. Emails were not sent.');
      }
    } catch (emailError) {
      console.error('Failed to send emails:', emailError);
    }

    res.status(201).json({ message: 'Booking confirmed', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating booking' });
  }
});

// Admin: Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching bookings' });
  }
});

// Admin: Update booking status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating booking' });
  }
});

// Admin: Update booking full details
router.put('/:id/details', async (req, res) => {
  try {
    const updateData = req.body;
    const existingBooking = await Booking.findById(req.params.id);
    if (!existingBooking) return res.status(404).json({ error: 'Booking not found' });

    // Handle empty team member assignment only if it is being explicitly updated
    if (updateData.hasOwnProperty('assignedTeamMember')) {
      if (!updateData.assignedTeamMember || String(updateData.assignedTeamMember).trim() === '') {
        updateData.assignedTeamMember = null;
      }
    }
    
    if (updateData.hasOwnProperty('editAssignment')) {
      if (!updateData.editAssignment || String(updateData.editAssignment).trim() === '') {
        updateData.editAssignment = null;
      }
    }

    // Handle Slot Capacity changes if date/slot is changed
    if (updateData.date && updateData.slot && 
       (existingBooking.date !== updateData.date || existingBooking.slot !== updateData.slot)) {
       
       updateData.slotHistory = [...(existingBooking.slotHistory || [])];
       updateData.slotHistory.push({
         oldDate: existingBooking.date,
         oldSlot: existingBooking.slot,
         newDate: updateData.date,
         newSlot: updateData.slot,
         changedAt: new Date()
       });

       // Decrement old slot
       let oldSlotRecord = await SlotCapacity.findOne({ date: existingBooking.date, slot: existingBooking.slot });
       if (oldSlotRecord && oldSlotRecord.currentBookings > 0) {
         oldSlotRecord.currentBookings -= 1;
         await oldSlotRecord.save();
       }

       // Increment new slot
       let newSlotRecord = await SlotCapacity.findOne({ date: updateData.date, slot: updateData.slot });
       if (!newSlotRecord) {
         newSlotRecord = new SlotCapacity({
           date: updateData.date, slot: updateData.slot, currentBookings: 1
         });
       } else {
         newSlotRecord.currentBookings += 1;
       }
       await newSlotRecord.save();
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    
    // Notify team member if assigned (and wasn't already assigned to this person)
    if (booking.assignedTeamMember && String(existingBooking?.assignedTeamMember) !== String(booking.assignedTeamMember)) {
      const teamMember = await TeamMember.findById(booking.assignedTeamMember);
      if (teamMember && teamMember.email) {
        const settings = await Settings.findOne().catch(() => null) || {};
        const appName = settings.businessName || process.env.APP_NAME || 'Studio OS';
        await sendEmail({
          to: teamMember.email,
          subject: `You have been assigned to a Booking: ${booking.shootType || booking.package || 'Shoot'}`,
          text: `Hi ${teamMember.name},\n\nYou have been assigned to a booking scheduled for ${booking.date} (${booking.slot || booking.slots?.join(', ')}).\n\nClient: ${booking.name || 'N/A'}\nPhone: ${booking.phone}\nStatus: ${booking.status}\n\nThanks,\n${appName}`
        }).catch(err => console.error("Failed to send assignment email:", err));
      }
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating booking details' });
  }
});

// Admin: Update payment tracking
router.put('/:id/payment', async (req, res) => {
  try {
    const { totalAmount, advanceAmount, pendingAmount, payments } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { totalAmount, advanceAmount, pendingAmount, payments }, 
      { returnDocument: 'after' }
    );
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating payment' });
  }
});

// Admin: Add a follow-up note
router.post('/:id/followup', async (req, res) => {
  try {
    const { note, scheduledDate, isPinned } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    booking.followUps.push({ note, date: new Date(), scheduledDate, isPinned: isPinned || false });
    await booking.save();
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error adding follow-up' });
  }
});

// Admin: Update a follow-up note
router.put('/:id/followups/:noteId', async (req, res) => {
  try {
    const { note, scheduledDate, isPinned } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, "followUps._id": req.params.noteId },
      { $set: { "followUps.$.note": note, "followUps.$.isPinned": isPinned !== undefined ? isPinned : false } },
      { returnDocument: 'after' }
    );
    if (!booking) return res.status(404).json({ error: 'Booking or note not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating follow-up note' });
  }
});

// Admin: Delete a follow-up note
router.delete('/:id/followups/:noteId', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $pull: { followUps: { _id: req.params.noteId } } },
      { returnDocument: 'after' }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting follow-up note' });
  }
});

// Admin: Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    // Decrement slot capacity
    if (booking.slots && booking.slots.length > 0) {
      for (const slot of booking.slots) {
        let slotRecord = await SlotCapacity.findOne({ date: booking.date, slot });
        if (slotRecord && slotRecord.currentBookings > 0) {
          slotRecord.currentBookings -= 1;
          await slotRecord.save();
        }
      }
    } else if (booking.slot) {
      let slotRecord = await SlotCapacity.findOne({ date: booking.date, slot: booking.slot });
      if (slotRecord && slotRecord.currentBookings > 0) {
        slotRecord.currentBookings -= 1;
        await slotRecord.save();
      }
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting booking' });
  }
});

// Admin: Block or Open a Slot
router.put('/slots/block', async (req, res) => {
  try {
    const { date, slot, action } = req.body;
    
    let slotRecord = await SlotCapacity.findOne({ date, slot });
    
    // Get default capacity if record doesn't exist
    const settings = await Settings.findOne() || new Settings();
    const dayIndex = new Date(date).getDay();
    const defaultCapacity = settings.weekdayCapacities ? (settings.weekdayCapacities.get(dayIndex.toString()) ?? 3) : 3;

    if (!slotRecord) {
      slotRecord = new SlotCapacity({
        date, 
        slot, 
        currentBookings: 0,
        blockedCount: 0,
        maxCapacity: defaultCapacity
      });
    }

    if (action === 'block_single') {
      slotRecord.blockedCount += 1;
    } else if (action === 'open_single') {
      slotRecord.blockedCount = Math.max(0, slotRecord.blockedCount - 1);
    } else if (action === 'block') {
      // Legacy behavior just in case
      slotRecord.maxCapacity = 0;
    } else if (action === 'open') {
      slotRecord.maxCapacity = defaultCapacity;
    }
    
    await slotRecord.save();
    res.json(slotRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating slot capacity' });
  }
});

// Admin: Set maxCapacity for all slots on a date
router.put('/slots/capacity', async (req, res) => {
  try {
    const { date, capacity } = req.body;
    const slots = ['Morning', 'Afternoon', 'Evening'];
    
    for (let slot of slots) {
      let slotRecord = await SlotCapacity.findOne({ date, slot });
      if (!slotRecord) {
        slotRecord = new SlotCapacity({ date, slot, currentBookings: 0, maxCapacity: capacity });
      } else {
        // If it's blocked (0), don't unblock it unless capacity is > 0?
        // Wait, if they set capacity, it should override everything
        slotRecord.maxCapacity = capacity;
      }
      await slotRecord.save();
    }
    res.json({ message: 'Capacity updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating capacities' });
  }
});

export default router;
