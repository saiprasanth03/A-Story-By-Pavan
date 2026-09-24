import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filenamePath = fileURLToPath(import.meta.url);
const __dirnamePath = path.dirname(__filenamePath);
const logoPath = path.join(__dirnamePath, '../../frontend/public/images/logo.png');

import Inquiry from '../models/Inquiry.js';
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

// Create a new inquiry (from contact page)
router.post('/', async (req, res) => {
  try {
    const inquiry = new Inquiry(req.body);
    await inquiry.save();

    // Send thank you email
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const settings = await Settings.findOne().catch(() => null) || {};
        const businessName = settings.businessName || process.env.APP_NAME || 'Studio';
        const logoHtml = settings.logoUrl
          ? `<img src="${settings.logoUrl}" alt="${businessName}" style="max-width: 150px; height: auto;" />`
          : `<h2 style="color: #ffffff; margin: 0; letter-spacing: 2px;">${businessName}</h2>`;

        await getTransporter().sendMail({
          from: `"${businessName}" <${process.env.EMAIL_USER}>`,
          to: inquiry.email,
          subject: `Thank you for contacting ${businessName}!`,
          html: `
            <div style="background-color: #000000; font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 20px;">
                ${logoHtml}
              </div>
              <h2 style="color: #ffffff; text-transform: uppercase; letter-spacing: 2px;">Thank you, ${inquiry.name}!</h2>
              <p>We have successfully received your inquiry regarding <strong>"${inquiry.subject}"</strong>.</p>
              <p>Our team at ${businessName} is currently reviewing your message and will get back to you shortly.</p>
              <br/>
              <p><strong>Your Message:</strong></p>
              <blockquote style="background: #1a1a1a; padding: 15px; border-left: 4px solid #ffffff; font-style: italic; color: #ffffff;">
                ${inquiry.message}
              </blockquote>
              <br/>
              <hr style="border: none; border-top: 1px solid #333333; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">
                ${businessName}<br/>
                This is an automated message.
              </p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    res.status(201).json({ message: 'Inquiry received successfully', inquiry });
  } catch (error) {
    res.status(500).json({ error: 'Server error saving inquiry' });
  }
});

// Admin: Get all inquiries
router.get('/', async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching inquiries' });
  }
});

// Admin: Update inquiry status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });

    // Whenever status updated to confirmed in inquiries, ensure it displays in studio bookings
    if (inquiry && status && (status.toLowerCase() === 'confirmed' || status.toLowerCase() === 'converted')) {
      const todayDate = inquiry.createdAt ? new Date(inquiry.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const existingBooking = await Booking.findOne({
        $or: [
          { email: inquiry.email, date: todayDate },
          { phone: inquiry.phone, date: todayDate },
          { notes: { $regex: inquiry._id.toString() } }
        ]
      });

      if (!existingBooking) {
        const booking = new Booking({
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone,
          bookingType: 'Client',
          shootType: inquiry.subject || 'General Inquiry Shoot',
          package: 'Standard Package',
          date: todayDate,
          slot: 'Morning',
          status: 'Confirmed',
          notes: `Confirmed Inquiry #${inquiry._id.toString().substring(inquiry._id.toString().length - 6).toUpperCase()} (${inquiry.subject}: ${inquiry.message?.substring(0, 80)}...)`
        });
        await booking.save();
      }
    }

    res.json(inquiry);
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ error: 'Server error updating inquiry' });
  }
});

// Admin: Add a follow-up note
router.post('/:id/followup', async (req, res) => {
  try {
    const { note, scheduledDate } = req.body;
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    
    inquiry.followUps.push({ note, date: new Date(), scheduledDate });
    await inquiry.save();
    
    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ error: 'Server error adding follow-up' });
  }
});

// Admin: Update a follow-up note
router.put('/:id/followups/:noteId', async (req, res) => {
  try {
    const { note } = req.body;
    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: req.params.id, "followUps._id": req.params.noteId },
      { $set: { "followUps.$.note": note } },
      { returnDocument: 'after' }
    );
    if (!inquiry) return res.status(404).json({ error: 'Inquiry or note not found' });
    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating follow-up' });
  }
});

// Admin: Delete a follow-up note
router.delete('/:id/followups/:noteId', async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { $pull: { followUps: { _id: req.params.noteId } } },
      { returnDocument: 'after' }
    );
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting follow-up' });
  }
});

// Admin: Delete inquiry
router.delete('/:id', async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inquiry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting inquiry' });
  }
});

export default router;
