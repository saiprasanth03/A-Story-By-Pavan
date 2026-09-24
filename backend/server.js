import express from 'express';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

import authRoutes from './routes/auth.js';
import adminUsersRoutes from './routes/adminUsers.js';
import AdminUser from './models/AdminUser.js';
import bcrypt from 'bcryptjs';

import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
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
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studio-template')
  .then(() => {
    console.log('Connected to MongoDB');

    // Create super admin if not exists
    const createSuperAdmin = async () => {
      try {
        const adminEmail = 'ssaiprasanth333@gmail.com';
        const existingAdmin = await AdminUser.findOne({ email: adminEmail });
        if (!existingAdmin) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('admin123', salt);
          const newAdmin = new AdminUser({
            email: adminEmail,
            password: hashedPassword,
            isSuperAdmin: true,
            permissions: ['dashboard', 'leads', 'inquiries', 'bookings', 'calendar', 'slots', 'customers', 'testimonials', 'team', 'cms', 'hero', 'teamAccess']
          });
          await newAdmin.save();
          console.log('Super Admin created with default password "admin123"');
        }
      } catch (err) {
        console.error('Error creating super admin:', err);
      }
    };
    createSuperAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
// trigger restart
// restart 2
// restart 3
// restart 4
// restart 5
// restart 6
// restart 7
// restart 8
// restart 9
