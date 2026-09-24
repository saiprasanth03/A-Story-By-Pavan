import express from 'express';
import jwt from 'jsonwebtoken';
import QuoteRequest from '../models/QuoteRequest.js';
import { generateQuotePdf } from '../quotePdfGenerator.js';
import { sendEmail } from '../mailer.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// ── Auth middleware (admin-only routes) ─────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Submit a new quote request
// POST /api/quotes
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      clientName, email, phone, city, eventDate,
      events, selectedPackage, addOns, deliverables,
      subtotal, discount, total, estimatedDeliveryDays,
      specialRequests,
    } = req.body;

    if (!clientName || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone are required.' });
    }

    const quote = await QuoteRequest.create({
      clientName, email, phone, city, eventDate,
      events:          events          || [],
      selectedPackage: selectedPackage || null,
      addOns:          addOns          || [],
      deliverables:    deliverables    || [],
      subtotal:        subtotal        || 0,
      discount:        discount        || 0,
      total:           total           || 0,
      estimatedDeliveryDays,
      specialRequests,
    });

    // ── Generate PDF in background and email it ──────────────────────────────
    try {
      const settings = await Settings.findOne();
      const bizName  = settings?.businessName || process.env.APP_NAME || 'Studio';
      const adminEmail = settings?.contactEmail || process.env.EMAIL_USER || process.env.ADMIN_EMAIL;

      const pdfBuffer = await generateQuotePdf(quote.toObject());

      const filename = `Quote_${bizName.replace(/\s+/g, '_')}_${quote._id}.pdf`;

      // Email to client
      if (email) {
        await sendEmail({
          to:      email,
          subject: `Your Quote from ${bizName}`,
          html: `
            <div style="font-family:sans-serif;color:#111;max-width:600px;margin:auto;">
              <h2 style="border-bottom:2px solid #C9A227;padding-bottom:8px;">Thank you, ${clientName}!</h2>
              <p>We've prepared a personalised quote based on your selections. Please find your proposal attached.</p>
              <p>Our team will be in touch within <strong>24–48 hours</strong> to discuss the details.</p>
              <p style="color:#888;font-size:12px;">— Team ${bizName}</p>
            </div>
          `,
          attachments: [{
            filename,
            content: pdfBuffer,
          }],
        });
      }

      // Email copy to admin
      if (adminEmail) {
        await sendEmail({
          to:      adminEmail,
          subject: `New Quote Request — ${clientName} (${email})`,
          html: `
            <div style="font-family:sans-serif;color:#111;max-width:600px;margin:auto;">
              <h2>New Quote Request</h2>
              <p><strong>Client:</strong> ${clientName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Event Date:</strong> ${eventDate || 'Not specified'}</p>
              <p><strong>Total:</strong> ₹${Number(total).toLocaleString('en-IN')}</p>
              <p>Full quote attached.</p>
            </div>
          `,
          attachments: [{
            filename,
            content: pdfBuffer,
          }],
        });
      }
    } catch (mailErr) {
      // Non-fatal — log but don't fail the request
      console.error('[Quote] Email/PDF error:', mailErr.message);
    }

    res.status(201).json({ success: true, quoteId: quote._id });
  } catch (err) {
    console.error('[Quote] POST error:', err);
    res.status(500).json({ message: 'Failed to save quote request.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: List all quotes (paginated)
// GET /api/quotes?page=1&limit=20&status=new
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [quotes, total] = await Promise.all([
      QuoteRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      QuoteRequest.countDocuments(filter),
    ]);

    res.json({ quotes, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Quote] GET list error:', err);
    res.status(500).json({ message: 'Failed to fetch quotes.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Get single quote
// GET /api/quotes/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const quote = await QuoteRequest.findById(req.params.id).lean();
    if (!quote) return res.status(404).json({ message: 'Quote not found.' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quote.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Update quote status / admin notes
// PATCH /api/quotes/:id
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const update = {};
    if (status)     update.status     = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const quote = await QuoteRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!quote) return res.status(404).json({ message: 'Quote not found.' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update quote.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Re-download PDF for a quote
// GET /api/quotes/:id/pdf
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const quote = await QuoteRequest.findById(req.params.id).lean();
    if (!quote) return res.status(404).json({ message: 'Quote not found.' });

    const pdfBuffer = await generateQuotePdf(quote);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Quote_${quote._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[Quote] PDF download error:', err);
    res.status(500).json({ message: 'Failed to generate PDF.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Delete a quote
// DELETE /api/quotes/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await QuoteRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete quote.' });
  }
});

export default router;
