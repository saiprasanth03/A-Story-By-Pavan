import { Camera, Video, Film, Globe, Zap, Aperture } from 'lucide-react';

/**
 * =============================================================================
 * QUOTE WIZARD CONFIGURATION & IMAGE ASSET MAP
 * All images sourced directly from `frontend/public/images/quote/`
 * =============================================================================
 */

export const EVENT_TYPES = [
  { id: 'engagement',      label: 'ENGAGEMENT',         emoji: '💍', image: '/images/quote/engagement.png' },
  { id: 'pre-wedding',     label: 'PRE-WEDDING',        emoji: '📸', image: '/images/quote/pre-wedding.png' },
  { id: 'godumrai',        label: 'GODUMRAI',           emoji: '🪔', image: '/images/quote/avatar.png' },
  { id: 'haldi',           label: 'HALDI',              emoji: '🌾', image: '/images/quote/haldi.png' },
  { id: 'mehendi',         label: 'MEHENDI',            emoji: '🎨', image: '/images/quote/mehendi.png' },
  { id: 'sangeet',         label: 'SANGEET',            emoji: '🎵', image: '/images/quote/dancing.png' },
  { id: 'pellikoduku',     label: 'PELLIKODUKU EVENT',  emoji: '👳', image: '/images/quote/pellikoduku.png' },
  { id: 'pellikuturu',     label: 'PELLIKUTURU EVENT',  emoji: '👰', image: '/images/quote/pellikuturu.png' },
  { id: 'bride-to-be',     label: 'BRIDE-TO-BE',        emoji: '💐', image: '/images/quote/bride-to-be.png' },
  { id: 'groom-to-be',     label: 'GROOM-TO-BE',        emoji: '🤵', image: '/images/quote/groom-to-be.png' },
  { id: 'cocktail-party',  label: 'COCKTAIL PARTY',     emoji: '🥂', image: '/images/quote/cocktail-party.png' },
  { id: 'wedding',         label: 'WEDDING',            emoji: '💒', image: '/images/quote/wedding.png' },
  { id: 'vratham',         label: 'VRATHAM',            emoji: '🙏', image: '/images/quote/avatar.png' },
  { id: 'reception',       label: 'RECEPTION',          emoji: '🎊', image: '/images/quote/reception.png' },
  { id: 'additional',      label: 'ADDITIONAL EVENT',   emoji: '➕', image: '/images/quote/additional-event.png' },
];

export const DURATIONS = [
  { id: 'half-day', label: 'HALF DAY (UP TO 6 HRS)' },
  { id: 'full-day', label: 'FULL DAY (UP TO 12 HRS)' },
  { id: '2-days',   label: '2 DAYS' },
  { id: '3-plus',   label: '3+ DAYS' },
];

export const COVERAGE_SERVICES = [
  {
    id: 'trad-photo',
    label: 'TRADITIONAL PHOTOGRAPHY',
    Icon: Camera,
    image: '/images/quote/traditional-photography.png',
    price: 15000,
    desc: 'Classic event photography focused on capturing important moments, rituals, family portraits, and guest memories in a clear and timeless style.',
  },
  {
    id: 'trad-video',
    label: 'TRADITIONAL VIDEOGRAPHY',
    Icon: Video,
    image: '/images/quote/traditional-videography.png',
    price: 20000,
    desc: 'Complete event coverage that captures all rituals, ceremonies, and important moments in a clear and natural style.',
  },
  {
    id: 'candid-photo',
    label: 'CANDID PHOTOGRAPHY',
    Icon: Aperture,
    image: '/images/quote/candid-photography.png',
    price: 12000,
    desc: 'Natural and emotion-filled photography that captures real moments, genuine expressions, and beautiful memories without forced poses.',
  },
  {
    id: 'cinematic',
    label: 'CINEMATIC VIDEO',
    Icon: Film,
    image: '/images/quote/cinematic-video.png',
    price: 20000,
    desc: 'A movie-like filming style that captures emotions, moments, and celebrations with creative visuals, smooth camera movements, and cinematic storytelling.',
  },
  {
    id: 'drone',
    label: 'DRONE',
    Icon: Zap,
    image: '/images/quote/drone.png',
    price: 8000,
    desc: 'Aerial cinematic shots that capture the venue, crowd, decorations, and event atmosphere from unique and visually stunning perspectives.',
  },
  {
    id: 'fpv-drone',
    label: 'FPV DRONE',
    Icon: Zap,
    image: '/images/quote/fpv-drone.png',
    price: 10000,
    desc: 'Dynamic and immersive drone shots captured with high-speed cinematic movements, creating a unique flying perspective and energetic visual experience.',
  },
  {
    id: 'vr-360',
    label: '360° VR COVERAGE',
    Icon: Globe,
    image: '/images/quote/360-vr-coverage.png',
    price: 12000,
    desc: 'An immersive video experience that captures every angle of the event, allowing you to relive moments in a fully interactive and realistic view through a VR headset.',
  },
];

export const PREWEDDING_PACKAGES = [
  {
    id: 'basic',
    tags: ['NATURAL', 'CANDID', 'THEME-BASED'],
    name: 'Basic Pre-Wedding',
    desc: 'A simple one-day shoot designed around a unique theme. We capture a mix of natural moments and light freestyle interactions, resulting in a clean and elegant visual experience.',
    features: ['1 Day Shoot', 'Photoshoot', '1–2 Min Video'],
    price: 30000,
  },
  {
    id: 'freestyle',
    tags: ['NATURAL', 'CANDID', 'THEME-BASED'],
    name: 'Freestyle Pre-Wedding',
    desc: 'A fun and natural pre-wedding experience where the couple and our team travel together like a casual trip. We capture spontaneous moments, joyful interactions and real emotions.',
    features: ['2–3 Days Shoot', '2–4 Min Video', 'Save the Date Video', 'Photoshoot Included'],
    price: 60000,
  },
  {
    id: 'conceptual',
    tags: ['CINEMATIC STORY-BASED EXPERIENCE'],
    name: 'Conceptual Pre-Wedding',
    desc: 'We understand your story, emotions, and build a personalized concept with complete pre-planning of locations, costumes and scenes for a cinematic love story.',
    features: ['4–5 Days Shoot', '5–7 Min Song Video', 'Save the Date (Promo Style)', 'Photoshoot Included'],
    price: 120000,
  },
];

export const POSTPROD_OPTIONS = [
  {
    id: 'standard',
    badge: 'STANDARD STYLE (INCLUDED)',
    name: 'STANDARD WEDDING FILM',
    intro: 'Includes all standard editing layouts at NO additional cost:',
    features: [
      'Standard Wedding Film: Full-length wedding archive with clean edits',
      'Wedding Highlights Film: Creative cinematic montage capturing core landmarks',
      'Promo Cut: Energetic, short social-media-ready teaser',
      'Traditional Video: Complete chronologically archived coverage',
    ],
    price: 0,
    priceLabel: 'No Additional Cost',
  },
  {
    id: 'documentary',
    badge: 'NETFLIX-STYLE WEDDING DOCUMENTARY',
    name: 'DOCUMENTARY STYLE WEDDING FILM',
    intro: 'A 15–20 minute cinematic wedding documentary crafted in a Netflix-style storytelling format, designed to capture real emotions, memories, and atmosphere.',
    features: [
      'Emotional interview sessions with parents, friends, cousins, bride & groom',
      'Beautifully woven candid moments and natural ambience sounds',
      'Non-linear cinematic storytelling — immersive, deeply personal',
      'Years may pass; real emotions never become old.',
    ],
    price: 25000,
    priceLabel: '₹25,000/-',
  },
];

export const ALBUM_TIERS = [
  {
    id: 'basic',
    name: 'BASIC ALBUM\n(30 SHEETS)',
    desc: 'A beautifully designed wedding album featuring the best selected moments from your special day. Crafted with elegant layouts and quality printing.',
    gifts: ['Wall Photo Calendar'],
    price: 15000,
    sheets: 30,
  },
  {
    id: 'standard',
    name: 'STANDARD ALBUM\n(50 SHEETS)',
    desc: 'Detailed coverage of rituals, candid emotions, family moments, and celebrations. Designed with creative layouts and high-quality finishing.',
    gifts: ['Wall Photo Calendar', 'Photo Frame'],
    price: 25000,
    sheets: 50,
  },
  {
    id: 'premium',
    name: 'PREMIUM ALBUM\n(80 SHEETS)',
    desc: 'Luxury album with rich premium layouts, complete event storytelling, delivered as two separate album books inside a premium luxury designer box.',
    gifts: ['Table Photo Calendar', 'Pocket Album', 'Premium Acrylic Photo Frame'],
    price: 40000,
    sheets: 80,
  },
];

export const ADDON_GROUPS = [
  {
    label: 'SOCIAL MEDIA REELS',
    items: [
      {
        id: 'instant-reels', type: 'qty',
        name: 'EVENT INSTANT REELS',
        priceLabel: '₹1,000 EACH (MIN 5 REELS)',
        desc: 'We use high-end iPhone cameras to shoot and edit quickly on the same day. Fast, smooth, and social-media-ready content.',
        pricePerUnit: 1000, minQty: 5,
      },
      {
        id: 'cinematic-reels', type: 'qty',
        name: 'CINEMATIC REELS',
        priceLabel: '₹2,000 EACH (MIN 5 REELS)',
        desc: 'Shot using professional cameras and delivered with high-quality editing and cinematic color grading by the next 2 days.',
        pricePerUnit: 2000, minQty: 5,
      },
    ],
  },
  {
    label: 'STAGE DISPLAYS & STREAMS',
    items: [
      {
        id: 'led-screen', type: 'toggle',
        name: '8X12 OR 6X8 LED SCREEN',
        priceLabel: '₹20,000/-',
        desc: 'High-Quality LED Screens (P1) — Delivering sharp visuals, vibrant colors and clear visibility for stage displays.',
        price: 20000,
      },
      {
        id: 'yt-live-full', type: 'toggle',
        name: 'YOUTUBE LIVE (FULL DAY)',
        priceLabel: '₹15,000/-',
        desc: 'Full Day Wedding Live — Complete ceremony coverage.',
        price: 15000,
      },
      {
        id: 'yt-live-half', type: 'toggle',
        name: 'YOUTUBE LIVE (HALF DAY)',
        priceLabel: '₹8,000/-',
        desc: 'Half Day Events Live — Haldi / Sangeeth / Engagement / Reception.',
        price: 8000,
      },
    ],
  },
];

export const RETAINER_TERMS = [
  'Quotation is valid for 30 days from date of submission.',
  'A 50% retainer fee is required to confirm and secure shoot dates.',
  'Balance 40% on shoot date, and final 10% upon digital deliverables approval.',
  'Travel, standard local logistics, outstation permits, and lodging are borne by the client.',
  'Studio holds copyright ownership for all generated photographic & cinematic assets.',
];
