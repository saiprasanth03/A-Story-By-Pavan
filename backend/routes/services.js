import express from 'express';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import QuoteRequest from '../models/QuoteRequest.js';

const router = express.Router();

// GET all services (Public fetches isActive: true sorted by order; Admin can pass ?all=true)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: { $ne: false } };
    const services = await Service.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /reorder - Batch update order positions
router.patch('/reorder', async (req, res) => {
  try {
    const { items } = req.body; // Array of { _id, order }
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array of { _id, order }' });
    }
    const operations = items.map(item => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { order: Number(item.order) || 0 } }
      }
    }));
    await Service.bulkWrite(operations);
    res.json({ message: 'Services reordered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET specific service by slug or ID
router.get('/:slugOrId', async (req, res) => {
  try {
    const param = req.params.slugOrId;
    let service = await Service.findOne({ slug: param });
    if (!service && param.match(/^[0-9a-fA-F]{24}$/)) {
      service = await Service.findById(param);
    }
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper function to normalize heroImages array
const normalizeHeroImages = (data) => {
  if (data && Array.isArray(data.heroImages)) {
    data.heroImages = data.heroImages.map(item => {
      if (typeof item === 'string') return { url: item, position: '50% 50%' };
      if (item && typeof item === 'object' && item.url) return { url: item.url, position: item.position || '50% 50%' };
      return null;
    }).filter(Boolean);
  }
};

// POST a new service
router.post('/', async (req, res) => {
  normalizeHeroImages(req.body);
  const service = new Service(req.body);
  try {
    const newService = await service.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT (update) a service
router.put('/:id', async (req, res) => {
  try {
    normalizeHeroImages(req.body);
    let service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    Object.assign(service, req.body);
    await service.save();
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// DELETE a service with dependency check
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Check for existing bookings tied to this service
    const existingBookings = await Booking.countDocuments({
      $or: [
        { shootType: service.title },
        { shootType: service.name },
        { shootType: service.slug }
      ]
    });

    let existingQuotes = 0;
    try {
      existingQuotes = await QuoteRequest.countDocuments({
        $or: [
          { serviceId: service._id },
          { serviceSlug: service.slug },
          { selectedService: service.title }
        ]
      });
    } catch (e) {}

    if (existingBookings > 0 || existingQuotes > 0) {
      // Soft delete by setting isActive to false instead of corrupting historic bookings
      service.isActive = false;
      await service.save();
      return res.json({ message: 'Service has active bookings/quotes. Deactivated (soft deleted) to preserve history.', isSoftDeleted: true });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

