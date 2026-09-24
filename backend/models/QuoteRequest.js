import mongoose from 'mongoose';

const selectedServiceSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  price: { type: Number, default: 0 },
}, { _id: false });

const eventCoverageSchema = new mongoose.Schema({
  eventType:    { type: String, required: true },  // e.g. "Wedding", "Reception"
  shootingDays: { type: Number, default: 1 },
  services:     [selectedServiceSchema],            // photo, video, drone, etc.
}, { _id: false });

const QuoteRequestSchema = new mongoose.Schema({
  // ── Contact Info ─────────────────────────────────────────────
  clientName:  { type: String, required: true, trim: true },
  email:       { type: String, required: true, trim: true, lowercase: true },
  phone:       { type: String, required: true, trim: true },
  city:        { type: String, trim: true },
  eventDate:   { type: String },   // stored as string (YYYY-MM-DD) from the wizard

  // ── Wizard Selections ─────────────────────────────────────────
  events:      [eventCoverageSchema],              // Step 1–2

  selectedPackage: {                               // Step 3
    name:        String,
    description: String,
    price:       Number,
  },

  addOns: [selectedServiceSchema],                 // Step 4

  deliverables: [selectedServiceSchema],           // Step 5 (album, photobook, etc.)

  // ── Pricing ──────────────────────────────────────────────────
  subtotal:    { type: Number, default: 0 },
  discount:    { type: Number, default: 0 },
  total:       { type: Number, default: 0 },

  // ── Delivery ─────────────────────────────────────────────────
  estimatedDeliveryDays: { type: Number },

  // ── Notes ────────────────────────────────────────────────────
  specialRequests: { type: String, trim: true },

  // ── Status ───────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['new', 'contacted', 'converted', 'closed'],
    default: 'new',
  },

  // ── Internal notes (admin only) ──────────────────────────────
  adminNotes: { type: String },

}, { timestamps: true });

export default mongoose.model('QuoteRequest', QuoteRequestSchema);
