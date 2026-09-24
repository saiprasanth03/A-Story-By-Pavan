import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filenamePath = fileURLToPath(import.meta.url);
const __dirnamePath = path.dirname(__filenamePath);
const logoPath = path.join(__dirnamePath, '../../frontend/public/images/logo.png');

import Lead from '../models/Lead.js';
import Booking from '../models/Booking.js';
import Settings from '../models/Settings.js';
import { getMailer } from '../mailer.js';

const router = express.Router();

// Configure Nodemailer transporter lazily to ensure env vars are loaded
let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = getMailer();
  }
  return transporter;
};

// Create a new lead (from Landing Page)
router.post('/', async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();

    // Send emails asynchronously in the background so it doesn't block the response
    const sendEmailsAsync = async () => {
      try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          const mailer = getTransporter();
          const settings = await Settings.findOne().catch(() => null) || {};
          const businessName = settings.businessName || process.env.APP_NAME || 'Studio';
          const logoHtml = settings.logoUrl
            ? `<img src="${settings.logoUrl}" alt="${businessName}" style="max-width: 150px; height: auto;" />`
            : `<h2 style="color: #ffffff; margin: 0; letter-spacing: 2px;">${businessName}</h2>`;
          
          // 1. Email to Client
          await mailer.sendMail({
            from: `"${businessName}" <${process.env.EMAIL_USER}>`,
            to: lead.email,
            subject: `Thank you for your interest in ${businessName}!`,
            html: `
              <div style="background-color: #000000; font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  ${logoHtml}
                </div>
                <h2 style="color: #ffffff; text-transform: uppercase; letter-spacing: 2px;">Thank you, ${lead.name}!</h2>
                <p>We have successfully received your inquiry ${lead.interestedIn ? `for <strong>${lead.interestedIn}</strong>` : ''}${lead.eventDate ? ` for the date: <strong>${new Date(lead.eventDate).toLocaleDateString()}</strong>` : ''}.</p>
                <p>Our team at ${businessName} is reviewing your details and will get back to you shortly to discuss your vision.</p>
                <br/>
                <hr style="border: none; border-top: 1px solid #333333; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999;">
                  ${businessName}<br/>
                  This is an automated message.
                </p>
              </div>
            `
          });

          // 2. Email to Admin Team
          await mailer.sendMail({
            from: `"${businessName} Website" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Sending to the admin email
            subject: `New Lead: ${lead.name} via ${lead.landingPageSource}`,
            html: `
              <div style="background-color: #000000; font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  ${logoHtml}
                </div>
                <h2 style="color: #d4af37; text-transform: uppercase;">New Landing Page Lead</h2>
                <p><strong>Name:</strong> ${lead.name}</p>
                <p><strong>Email:</strong> ${lead.email}</p>
                <p><strong>Phone:</strong> ${lead.phone}</p>
                ${lead.interestedIn ? `<p><strong>Interested In:</strong> ${lead.interestedIn}</p>` : ''}
                ${lead.eventDate ? `<p><strong>Event Date:</strong> ${new Date(lead.eventDate).toLocaleDateString()}</p>` : ''}
                <p><strong>Source:</strong> ${lead.landingPageSource}</p>
                <br/>
                <p>Please log in to the admin dashboard to manage this lead.</p>
              </div>
            `
          });
        }
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
      }
    };
    sendEmailsAsync(); // Do not await

    res.status(201).json({ message: 'Lead received successfully', lead });
  } catch (error) {
    console.error('Error saving lead:', error);
    res.status(500).json({ error: 'Server error saving lead' });
  }
});

// Admin: Get all leads
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching leads' });
  }
});

// Admin: Update lead status
router.put('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const lead = await Lead.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    
    // Whenever status updated to confirmed in leads, ensure it displays in studio bookings
    if (lead && status && status.toLowerCase() === 'confirmed') {
      const shootDate = lead.eventDate 
        ? new Date(lead.eventDate).toISOString().split('T')[0] 
        : (lead.createdAt ? new Date(lead.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      
      const existingBooking = await Booking.findOne({
        $or: [
          { email: lead.email, date: shootDate },
          { phone: lead.phone, date: shootDate },
          { notes: { $regex: lead._id.toString() } }
        ]
      });

      if (!existingBooking) {
        const booking = new Booking({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          bookingType: 'Client',
          shootType: lead.interestedIn || 'General Shoot',
          package: 'Standard Package',
          date: shootDate,
          slot: 'Morning',
          status: 'Confirmed',
          notes: `Confirmed Lead #${lead._id.toString().substring(lead._id.toString().length - 6).toUpperCase()} (${lead.landingPageSource || 'Landing Page'})`
        });
        await booking.save();
      }
    }

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Server error updating lead' });
  }
});

// Admin: Delete lead
router.delete('/:id', async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting lead' });
  }
});

// Admin: Add a follow-up note
router.post('/:id/followup', async (req, res) => {
  try {
    const { note, scheduledDate } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    
    lead.followUps.push({ note, date: new Date(), scheduledDate });
    await lead.save();
    
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Server error adding follow-up' });
  }
});

// Admin: Update a follow-up note
router.put('/:id/followups/:noteId', async (req, res) => {
  try {
    const { note } = req.body;
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, "followUps._id": req.params.noteId },
      { $set: { "followUps.$.note": note } },
      { returnDocument: 'after' }
    );
    if (!lead) return res.status(404).json({ error: 'Lead or note not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating follow-up' });
  }
});

// Admin: Delete a follow-up note
router.delete('/:id/followups/:noteId', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $pull: { followUps: { _id: req.params.noteId } } },
      { returnDocument: 'after' }
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting follow-up' });
  }
});

export default router;
