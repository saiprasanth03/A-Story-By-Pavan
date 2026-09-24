import express from 'express';
import dns from 'dns';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();
dns.setDefaultResultOrder('ipv4first');

import connectDB from './config/db.js';
import AdminUser from './models/AdminUser.js';

import authRoutes from './routes/auth.js';
import adminUsersRoutes from './routes/adminUsers.js';
import bookingRoutes from './routes/bookings.js';
import contentRoutes from './routes/content.js';
import servicesRoutes from './routes/services.js';
import uploadRoutes from './routes/upload.js';
import themesRoutes from './routes/themes.js';
import themeCategoriesRoutes from './routes/themeCategories.js';
import galleryRoutes from './routes/gallery.js';
import galleryCategoriesRoutes from './routes/galleryCategories.js';
import heroRoutes from './routes/hero.js';
import settingsRoutes from './routes/settings.js';
import inquiriesRoutes from './routes/inquiries.js';
import testimonialsRoutes from './routes/testimonials.js';
import landingPagesRoutes from './routes/landingPages.js';
import teamRoutes from './routes/team.js';
import studioRoutes from './routes/studio.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import leadsRoutes from './routes/leads.js';
import businessRoutes from './routes/business.js';
import clientGalleryRoutes from './routes/clientGalleryRoutes.js';
import quotesRoutes from './routes/quotes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin ? (corsOrigin.includes(',') ? corsOrigin.split(',').map(s => s.trim()) : corsOrigin) : true,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin-users', adminUsersRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/themes', themesRoutes);
app.use('/api/theme-categories', themeCategoriesRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/gallery-categories', galleryCategoriesRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/landing-pages', landingPagesRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/studio', studioRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/client-gallery', clientGalleryRoutes);
app.use('/api/quotes', quotesRoutes);

// Database connection & Server Startup
const startServer = async () => {
  await connectDB();

  // Create super admin if configured and does not exist
  const createSuperAdmin = async () => {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        console.log('ADMIN_PASSWORD not set in environment. Skipping automatic super admin creation.');
        return;
      }

      const existingAdmin = await AdminUser.findOne({ email: adminEmail });
      if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        const newAdmin = new AdminUser({
          email: adminEmail,
          password: hashedPassword,
          isSuperAdmin: true,
          permissions: ['dashboard', 'leads', 'inquiries', 'bookings', 'calendar', 'slots', 'customers', 'testimonials', 'team', 'cms', 'hero', 'teamAccess']
        });
        await newAdmin.save();
        console.log(`Super Admin "${adminEmail}" initialized successfully.`);
      }
    } catch (err) {
      console.error('Error bootstrapping super admin:', err.message);
    }
  };

  await createSuperAdmin();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
