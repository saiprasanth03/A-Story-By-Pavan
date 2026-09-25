# A Story By Pavan — Luxury Editorial Photography & Studio Platform

A high-end, monochrome editorial web application and administrative portal for **A Story By Pavan**, inspired by luxury editorial photography visual systems.

---

## 🎨 Typography System

The application strictly enforces a 3-tier typography system:

1. **MADE Mirage** — *Primary Luxury / Display Font*
   - Used for main brand headings, hero titles, display section headers, and high-impact visual statements.
   - Loaded as a custom webfont (`@font-face` with fallbacks).

2. **Spectral** — *Secondary Editorial Serif Font*
   - Used for taglines, quotes, italic editorial subtitles, and stylized editorial callouts.
   - Loaded via Google Fonts (`Spectral: 300, 400, 500, 600, 700 + Italics`).

3. **Lato** — *Body, Navigation & Supporting Text Font*
   - Used for body paragraphs, navigation menus, badges, buttons, form controls, labels, and supporting text.
   - Loaded via Google Fonts (`Lato: 100, 300, 400, 700, 900`).

---

## 🖤 Design Aesthetics & Color Palette

- **Palette**: Pure White (`#FFFFFF`), Deep Obsidian & Dark Charcoal (`#050505`, `#0A0A0A`, `#111111`), and Subtle Silver (`#EFEFEF` / `rgba(255, 255, 255, 0.4)`). Zero gold accents.
- **Visual Style**: High-contrast, monochromatic editorial photography layout with full-bleed aspect ratio cards, clean thin borders, and subtle micro-interactions.
- **Loader**: Hardware-accelerated `<LuxuryLoader>` with glowing white SVG progress ring and counter.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite 8, Tailwind CSS, Framer Motion, Swiper, Axios, React Router v6.
- **Backend**: Node.js, Express, MongoDB Atlas, Mongoose, Cloudinary, Nodemailer.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Connection String

### Installation

1. **Clone repository**:
   ```bash
   git clone https://github.com/saiprasanth03/A-Story-By-Pavan.git
   cd A-Story-By-Pavan
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🔒 Administrative Portal

Access `/admin/login` to manage:
- Services, sub-services, and package pricing
- Portfolio image & video galleries
- Quotations & administrative lead calculators
- Site configuration & maintenance mode settings
