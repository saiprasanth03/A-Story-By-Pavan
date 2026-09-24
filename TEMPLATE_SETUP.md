# Studio OS — Website Template Setup & Configuration Guide

Welcome to the **Studio OS** reusable website template. This template provides a full-stack, production-ready website and business operations platform designed for photography studios, creative spaces, and portfolio businesses.

---

## Table of Contents
1. [Overview](#1-overview)
2. [Prerequisites & Software Requirements](#2-prerequisites--software-requirements)
3. [Project Structure](#3-project-structure)
4. [Quick Start (Local Development)](#4-quick-start-local-development)
5. [Frontend Configuration (`site.config.js`)](#5-frontend-configuration-siteconfigjs)
6. [Environment Variables](#6-environment-variables)
7. [Database & Seed Data](#7-database--seed-data)
8. [Super Admin Account Setup](#8-super-admin-account-setup)
9. [Feature Flags Reference](#9-feature-flags-reference)
10. [Cloudinary Media Storage](#10-cloudinary-media-storage)
11. [Email Notifications (Resend / SMTP)](#11-email-notifications-resend--smtp)
12. [Google Drive Client Gallery (Optional)](#12-google-drive-client-gallery-optional)
13. [Branding & Asset Replacement](#13-branding--asset-replacement)
14. [Theme & Font Customization](#14-theme--font-customization)
15. [Production Build & Deployment](#15-production-build--deployment)
16. [Creating a New Website from this Template](#16-creating-a-new-website-from-this-template)
17. [New Website Checklist](#17-new-website-checklist)

---

## 1. Overview
Studio OS combines:
- **Client-Facing Web App**: High-performance, animated UI with Framer Motion, responsive navigation, booking flows, portfolio galleries, pricing calculators, and landing page systems.
- **Admin & CMS Dashboard**: Full back-office for managing bookings, calendar slots, inquiries, leads, CMS content, services, testimonials, expenses, partner rentals, and PDF quotation generation.
- **Dynamic Content Engine**: MongoDB-backed dynamic storage with fallback build-time defaults.

---

## 2. Prerequisites & Software Requirements
- **Node.js**: `v18.0.0` or higher (LTS recommended)
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster.

---

## 3. Project Structure
```
studio-template/
├── backend/
│   ├── config/             # Centralized database connection
│   ├── models/             # Mongoose schemas (Settings, Booking, Service, etc.)
│   ├── routes/             # Express API REST endpoints
│   ├── mailer.js           # Transactional email dispatcher (Resend/SMTP)
│   ├── pdfGenerator.js     # PDFKit invoice & quotation generator
│   ├── seed.js             # Initial sample services and content seeder
│   ├── server.js           # Express application entrypoint
│   ├── .env.example        # Backend environment variables template
│   └── package.json
├── frontend/
│   ├── public/             # Static assets (logos, icons, manifest.json)
│   ├── src/
│   │   ├── components/     # UI components (Navbar, Footer, WhatsAppButton, etc.)
│   │   ├── config/         # Central build-time configuration (site.config.js)
│   │   ├── pages/          # Application routes (Home, Book, Services, Admin, etc.)
│   │   └── App.jsx         # Router & feature-flag gated route definitions
│   ├── .env.example        # Frontend environment variables template
│   ├── index.html          # HTML entry point and Google Fonts
│   └── package.json
├── TEMPLATE_SETUP.md       # Setup & configuration guide
└── README.md
```

---

## 4. Quick Start (Local Development)

### Step 1: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment Files
```bash
# Backend environment setup
cd ../backend
cp .env.example .env

# Frontend environment setup
cd ../frontend
cp .env.example .env
```

### Step 3: Start Development Servers
In Terminal 1 (Backend):
```bash
cd backend
npm run dev
# Starts on http://localhost:5000
```

In Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# Starts on http://localhost:5173
```

---

## 5. Frontend Configuration (`site.config.js`)
All static business information, feature toggles, and metadata defaults are centralized in:
`frontend/src/config/site.config.js`

### Configuration Sections:
- **`brand`**: Business name, short name, tagline, description, and logo asset paths.
- **`contact`**: Public email, formatted display phone, raw WhatsApp number, full address, and service locations.
- **`socials`**: Array of social platforms and profile URLs.
- **`parentCompany`**: Optional parent company branding (`enabled: false` by default).
- **`features`**: Feature flags toggling UI entry points and route availability.
- **`seo`**: Default page title, description, and keywords.
- **`theme`**: Color palette tokens and typography font references.

---

## 6. Environment Variables

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:

```ini
# Application & Server
PORT=5000
NODE_ENV=development
APP_NAME=Studio OS
SITE_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/studio-template

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Initial Admin Bootstrap (leave password empty to skip auto-creation)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_initial_password

# Media Storage (Cloudinary - Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=studio_uploads

# Email Notifications (Resend / SMTP - Optional)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=no-reply@example.com
REPLY_TO_EMAIL=contact@example.com
```

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:

```ini
# Base URL for Express backend API
VITE_API_URL=http://localhost:5000/api
```

---

## 7. Database & Seed Data
The template connects automatically to the database specified in `MONGODB_URI`.

To populate initial sample photography services, packages, and CMS content:
```bash
cd backend
node seed.js
```
*Note: `seed.js` clears and initializes sample services and content safely for demonstration.*

---

## 8. Super Admin Account Setup
When starting the backend:
1. If `ADMIN_PASSWORD` is defined in `backend/.env`, the backend checks if `ADMIN_EMAIL` exists.
2. If the user does not exist, it creates a super administrator with all dashboard permissions.
3. If `ADMIN_PASSWORD` is left empty, automatic bootstrap is safely skipped.

To log in to the admin dashboard:
- Navigate to: `http://localhost:5173/admin/login` (or `/admin`)
- Enter your configured `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

---

## 9. Feature Flags Reference
Feature flags in `site.config.js` control client-side routes and navigation entries:

| Feature Flag | Default | Controlled Routes & Components | Description |
| :--- | :--- | :--- | :--- |
| `gallery` | `true` | `/gallery`, Navbar "Portfolio" | Photo and video portfolio gallery |
| `booking` | `true` | `/book`, Navbar "Book Session" CTA | Client session booking flow with slot selection |
| `testimonials`| `true` | `/testimonials`, Navbar "Testimonials" | Client reviews and testimonial cards |
| `contact` | `true` | `/contact`, Navbar "Contact" | General inquiry and contact form |
| `services` | `true` | `/services/:slug`, Navbar "Packages" | Dynamic service pages and package pricing |
| `themes` | `true` | `/themes`, Navbar "Themes" | Photography themes and setups showcase |
| `studio` | `true` | `/studio`, Navbar "Studio" | Studio space tour, amenities, 360 view |
| `whatsapp` | `true` | Floating `<WhatsAppButton />` | Quick WhatsApp direct chat button |
| `clientGallery`| `false` | `/my-gallery` | Google Drive client gallery viewer & selector |
| `subscriptions`| `false` | Admin subscriptions module | Multi-month milestone subscription packages |
| `leads` | `false` | Admin leads tracker | Landing page lead capture tracking |
| `rentals` | `false` | Admin prop rentals module | Studio equipment & prop rental inventory |
| `events` | `false` | Admin event operations | Production event planning & quotation generator |

---

## 10. Cloudinary Media Storage
Image and video uploads in the admin dashboard use Cloudinary.
1. Sign up at [Cloudinary](https://cloudinary.com).
2. Retrieve your **Cloud Name**, **API Key**, and **API Secret**.
3. Add them to `backend/.env`.
4. Uploaded media will automatically be stored under the configured `CLOUDINARY_FOLDER`.

---

## 11. Email Notifications (Resend / SMTP)
The backend dispatches notifications for booking requests, contact inquiries, new leads, and password resets.

### Option A: Resend (Recommended)
1. Sign up at [Resend](https://resend.com) and create an API key.
2. Add `RESEND_API_KEY=re_...` to `backend/.env`.
3. Configure `EMAIL_FROM` with your verified sending domain.

### Option B: Standard SMTP
If `RESEND_API_KEY` is not provided, the server falls back to SMTP:
```ini
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
```

---

## 12. Google Drive Client Gallery (Optional)
To enable private photo selection galleries powered by Google Drive folders:
1. Enable the Google Drive API in your Google Cloud Console.
2. Create a Service Account and download the JSON key.
3. Stringify and paste into `GOOGLE_SERVICE_ACCOUNT_JSON` in `backend/.env`.
4. Share the target Google Drive folders with your service account email.

---

## 13. Branding & Asset Replacement
Replace the placeholder files in `frontend/public/`:
- **Logo**: `frontend/public/images/logo.png`
- **Secondary / White Logo**: `frontend/public/images/logo2.png`
- **Favicon**: `frontend/public/images/favicon.svg`
- **App Icons**: `frontend/public/icons/`
- **Offline Cover**: `frontend/public/offline.html`

---

## 14. Theme & Font Customization
- **Fonts**: Custom fonts are loaded in `frontend/index.html` via Google Fonts (`Raleway`, `Oswald`, `Playfair Display`, `Cinzel`). To change fonts, update the `<link>` in `frontend/index.html` and the font utility classes in `frontend/src/index.css`.
- **Colors & Styles**: Base colors and dark aesthetic tokens are styled via Tailwind and Vanilla CSS in `frontend/src/index.css`.

---

## 15. Production Build & Deployment

### Build Frontend
```bash
cd frontend
npm run build
```
This generates the optimized static bundle in `frontend/dist/`.

### Deploy Frontend
Deploy `frontend/dist/` to any static host (Vercel, Netlify, Cloudflare Pages, AWS S3).
*Set `VITE_API_URL` to your production backend URL during build.*

### Deploy Backend
Deploy `backend/` to any Node.js hosting platform (Render, Railway, Fly.io, DigitalOcean, Heroku).
*Configure all environment variables in your platform settings and run `npm start`.*

---

## 16. Creating a New Website from this Template

To create a brand-new website:
1. Clone this repository into a new folder:
   ```bash
   git clone <repo_url> my-new-studio
   cd my-new-studio
   ```
2. Initialize fresh git tracking:
   ```bash
   rm -rf .git
   git init
   ```
3. Update `frontend/src/config/site.config.js` with the new business info.
4. Replace assets in `frontend/public/images/`.
5. Create a new MongoDB database and update `MONGODB_URI` in `backend/.env`.
6. Run `node seed.js` to initialize demo services or configure them via the Admin Dashboard.

---

## 17. New Website Checklist

Follow this checklist when spinning up a new project:

- [ ] Update `brand.name`, `shortName`, `tagline`, and `description` in `site.config.js`
- [ ] Replace `logo.png`, `logo2.png`, and `favicon.svg` in `frontend/public/images/`
- [ ] Update `contact.email`, `phone`, `whatsapp`, `address`, and `locations` in `site.config.js`
- [ ] Update social media profile links in `site.config.js`
- [ ] Review and toggle feature flags in `site.config.js`
- [ ] Update default SEO title and description in `site.config.js`
- [ ] Create `.env` in `backend/` from `.env.example`
- [ ] Configure `MONGODB_URI` for the new database
- [ ] Configure `JWT_SECRET` with a secure random key
- [ ] Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- [ ] Configure Cloudinary credentials in `backend/.env`
- [ ] Configure email provider (`RESEND_API_KEY` or SMTP) in `backend/.env`
- [ ] Configure `CORS_ORIGIN` in `backend/.env`
- [ ] Configure `VITE_API_URL` in `frontend/.env`
- [ ] Run `node seed.js` to seed initial services (optional)
- [ ] Start backend and frontend locally (`npm run dev`)
- [ ] Test Admin Login at `/admin`
- [ ] Verify booking submission and notifications
- [ ] Verify contact form submission
- [ ] Run production build (`npm run build`)
