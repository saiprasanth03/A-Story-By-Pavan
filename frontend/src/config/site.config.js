/**
 * site.config.js — Template Configuration
 *
 * This file contains the static, build-time configuration for the template.
 * It provides the fallback/default values used when the database/API is unavailable
 * or when a setting has not been configured in the Admin Dashboard.
 *
 * HOW TO USE:
 * 1. Replace the placeholder values below with your actual business information.
 * 2. Secrets (DB URI, API keys, JWT secret, Cloudinary credentials) must NEVER go here.
 *    Use .env files for secrets — see .env.example.
 * 3. Analytics IDs are intentionally left empty. Configure them via Admin Dashboard.
 *
 * ASSET PATHS:
 * logoUrl, logoBackgroundUrl, and faviconUrl point to files in /public/images/.
 * Replace those files with your own assets.
 */

export const siteConfig = {

  // ─── Brand ─────────────────────────────────────────────────────────────────
  brand: {
    name: 'Your Business Name',
    shortName: 'Your Brand',
    tagline: 'Your Business Tagline',
    description: 'Your business description goes here.',

    // Replace these files in /frontend/public/images/
    logoUrl: '/images/logo.png',
    logoBackgroundUrl: '/images/logo2.png',
    faviconUrl: '/images/favicon.svg',
  },

  // ─── Contact ────────────────────────────────────────────────────────────────
  contact: {
    email: 'hello@example.com',
    phone: '+91 00000 00000',    // Display format (shown in UI)
    whatsapp: '910000000000',    // Digits only (used for wa.me links)

    // Full address as a single string (supports \n for line breaks)
    address: 'Your Business Address\nYour City, State 000000\nIndia',

    // Cities shown in the footer Locations column
    locations: ['Your City'],
  },

  // ─── Social Media ───────────────────────────────────────────────────────────
  // These are the fallback social links shown in the Footer when the database
  // has not been configured. Update via Admin Dashboard → Settings → Socials.
  socials: [
    { platform: 'Instagram', link: 'https://instagram.com/yourusername' },
    { platform: 'Facebook',  link: 'https://facebook.com/yourusername' },
    { platform: 'Pinterest', link: 'https://pinterest.com/yourusername' },
  ],

  // ─── Analytics ──────────────────────────────────────────────────────────────
  // Leave empty. Configure via Admin Dashboard → Settings → Analytics.
  // NEVER put real tracking IDs here in the template.
  analytics: {
    googleAnalyticsId:  '',   // e.g. 'G-XXXXXXXXXX'
    metaPixelId:        '',   // e.g. '123456789'
    googleTagManagerId: '',   // e.g. 'GTM-XXXXXXX'
  },

  // ─── Parent Company ─────────────────────────────────────────────────────────
  // Set enabled: true and fill name/url if this studio is a sub-brand.
  parentCompany: {
    enabled: false,
    name: 'Your Parent Company',
    url: 'https://example.com',
  },

  // ─── Feature Flags ──────────────────────────────────────────────────────────
  // Controls which routes and UI elements are visible.
  // Set a feature to false to hide its UI entry points (does not remove backend routes).
  features: {
    // Core public-facing features — on by default
    gallery:       true,
    booking:       true,
    testimonials:  true,
    contact:       true,
    services:      true,
    themes:        true,
    studio:        true,
    whatsapp:      true,

    // Optional features — off by default (enable if the backend module is active)
    clientGallery: false,
    subscriptions: false,
    leads:         false,
    rentals:       false,
    events:        false,
  },

  // ─── Theme ──────────────────────────────────────────────────────────────────
  // Visual design tokens. Currently informational — used for documentation
  // and as a reference when extending the template.
  theme: {
    colors: {
      primary:    '#111111',
      secondary:  '#ffffff',
      accent:     '#C9A227',
      background: '#050505',
      surface:    '#111111',
      text:       '#ffffff',
      mutedText:  '#888888',
    },
    fonts: {
      heading: 'Oswald',   // loaded via Google Fonts in index.html
      body:    'Raleway',  // loaded via Google Fonts in index.html
    },
  },
};
