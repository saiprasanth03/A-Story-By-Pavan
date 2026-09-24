import express from 'express';
import BusinessPartner from '../models/BusinessPartner.js';
import Expense from '../models/Expense.js';
import PropRental from '../models/PropRental.js';
import Event from '../models/Event.js';
import RentalItem from '../models/RentalItem.js';
import TeamMember from '../models/TeamMember.js';
import Settings from '../models/Settings.js';
import { sendEmail } from '../mailer.js';
import { generateEventPdf } from '../pdfGenerator.js';

const router = express.Router();

// --- Business Partners ---

router.get('/partners', async (req, res) => {
  try {
    const partners = await BusinessPartner.find();
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/partners', async (req, res) => {
  try {
    const partner = new BusinessPartner(req.body);
    await partner.save();
    res.status(201).json(partner);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/partners/:id', async (req, res) => {
  try {
    const partner = await BusinessPartner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(partner);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/partners/:id', async (req, res) => {
  try {
    await BusinessPartner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Expenses ---

router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Props ---

router.get('/props', async (req, res) => {
  try {
    const props = await PropRental.find().sort({ createdAt: -1 });
    res.json(props);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/props', async (req, res) => {
  try {
    const prop = new PropRental(req.body);
    if (prop.items) {
       prop.totalAmount = prop.items.reduce((sum, item) => sum + item.price, 0);
    }
    await prop.save();
    res.status(201).json(prop);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/props/:id', async (req, res) => {
  try {
    const prop = await PropRental.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // Re-trigger pre-save calculations by saving explicitly if needed, or just calculate on frontend
    if (prop.items) {
       prop.totalAmount = prop.items.reduce((sum, item) => sum + item.price, 0);
       await prop.save();
    }
    res.json(prop);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/props/:id', async (req, res) => {
  try {
    await PropRental.findByIdAndDelete(req.params.id);
    res.json({ message: 'Prop deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Events ---

router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    
    let total = 0;
    if (event.subEventList && event.subEventList.length > 0) {
      total += event.subEventList.reduce((sum, sub) => sum + (sub.services || []).reduce((s, item) => s + (item.price * (item.quantity || 1)), 0), 0);
    } else if (event.services && event.services.length > 0) {
      total += event.services.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    }
    
    if (event.deliverables) total += event.deliverables.reduce((s, item) => s + (item.price || 0), 0);
    if (event.complimentries) total += event.complimentries.reduce((s, item) => s + (item.price || 0), 0);
    if (event.addOns) total += event.addOns.reduce((s, item) => s + (item.price || 0), 0);
    if (event.album && event.album.enabled) total += (event.album.sheets || 0) * (event.album.pricePerSheet || 500);
    
    event.totalAmount = total;
    event.pendingAmount = total - (event.discount || 0) - (event.paidAmount || 0);

    await event.save();
    
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, returnDocument: 'after' });
    
    let total = 0;
    if (event.subEventList && event.subEventList.length > 0) {
      total += event.subEventList.reduce((sum, sub) => sum + (sub.services || []).reduce((s, item) => s + (item.price * (item.quantity || 1)), 0), 0);
    } else if (event.services && event.services.length > 0) {
      total += event.services.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    }
    
    if (event.deliverables) total += event.deliverables.reduce((s, item) => s + (item.price || 0), 0);
    if (event.complimentries) total += event.complimentries.reduce((s, item) => s + (item.price || 0), 0);
    if (event.addOns) total += event.addOns.reduce((s, item) => s + (item.price || 0), 0);
    if (event.album && event.album.enabled) total += (event.album.sheets || 0) * (event.album.pricePerSheet || 500);
    
    event.totalAmount = total;
    
    // Recalculate pending amount if we also have payments (total might have changed)
    const paid = (event.payments && event.payments.length > 0) ? event.payments.reduce((sum, p) => sum + p.amount, 0) : (event.paidAmount || 0);
    event.pendingAmount = total - (event.discount || 0) - paid;
    
    await event.save();
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event: Update payment tracking
router.put('/events/:id/payment', async (req, res) => {
  try {
    const { totalAmount, paidAmount, pendingAmount, payments } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { totalAmount, paidAmount, pendingAmount, payments },
      { new: true }
    );
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event: Add a note
router.post('/events/:id/followup', async (req, res) => {
  try {
    const { note, isPinned } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    event.followUps.push({ note, date: new Date(), isPinned: isPinned || false });
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event: Update a note
router.put('/events/:id/followups/:noteId', async (req, res) => {
  try {
    const { note, isPinned } = req.body;
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, "followUps._id": req.params.noteId },
      { $set: { "followUps.$.note": note, "followUps.$.isPinned": isPinned !== undefined ? isPinned : false } },
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event or note not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event: Delete a note
router.delete('/events/:id/followups/:noteId', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $pull: { followUps: { _id: req.params.noteId } } },
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event: Update details (status, team, album etc)
router.put('/events/:id/details', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/events/:id/send-pdf', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    const discount = event.discount || 0;
    const pdfBuffer = await generateEventPdf(event, discount);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Fetch settings for dynamic business branding
    const settings = await Settings.findOne().catch(() => null) || {};
    const businessName = settings.businessName || process.env.APP_NAME || 'Studio';
    const contactEmail = settings.contactEmail || process.env.EMAIL_USER;
    const safeFilename = `${businessName.replace(/[^a-zA-Z0-9]/g, '')}_${event.phone || 'Event'}.pdf`;

    // Define recipients
    const toEmails = [];
    if (event.email) toEmails.push(event.email);
    if (contactEmail && !toEmails.includes(contactEmail)) toEmails.push(contactEmail);
    
    if (toEmails.length === 0) {
      return res.status(400).json({ error: 'No email address found for client.' });
    }
    
    await sendEmail({
      to: toEmails,
      subject: `Event Summary: ${event.name}`,
      text: `Hi ${event.clientName || 'Client'},\n\nPlease find attached the summary for the event "${event.name}".\n\nThanks,\n${businessName}`,
      attachments: [
        {
          filename: safeFilename,
          content: pdfBase64
        }
      ]
    });
    
    res.json({ message: 'PDF sent successfully' });
  } catch (error) {
    console.error('Send PDF Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/events/:id/download-pdf', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    const settings = await Settings.findOne().catch(() => null) || {};
    const businessName = settings.businessName || process.env.APP_NAME || 'Studio';
    const safeFilename = `${businessName.replace(/[^a-zA-Z0-9]/g, '')}_${event.phone || 'Event'}.pdf`;

    const discount = event.discount || 0;
    const pdfBuffer = await generateEventPdf(event, discount);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download PDF Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Rental Items Master List Routes ---

router.get('/rental-items', async (req, res) => {
  try {
    const items = await RentalItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rental-items', async (req, res) => {
  try {
    const item = new RentalItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/rental-items/:id', async (req, res) => {
  try {
    const item = await RentalItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/rental-items/:id', async (req, res) => {
  try {
    await RentalItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rental item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
