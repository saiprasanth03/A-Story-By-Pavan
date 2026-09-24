import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  blockedWeekdays: { 
    type: [Number], 
    default: [],
    // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  },
  weekdayCapacities: {
    type: Map,
    of: Number,
    default: { '0': 3, '1': 3, '2': 3, '3': 3, '4': 3, '5': 3, '6': 3 }
  },
  metaPixelId: { type: String, default: '' },
  googleAnalyticsId: { type: String, default: '' },
  contactEmail: { type: String, default: 'contact@example.com' },
  whatsappNumber: { type: String, default: '+919999999999' },
  contactNumber: { type: String, default: '+919999999999' },
  teamEmails: { type: [String], default: [] },
  portfolioReferrers: { type: [String], default: [] },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceEndTime: { type: Date, default: null },
  footerStudioAddress: { type: String, default: '123 Cinematic Way\nAesthetic District\nNew York, NY 10012' },
  footerSocials: { 
    type: [{ platform: String, link: String }], 
    default: [
      { platform: 'Instagram', link: '#' },
      { platform: 'Facebook', link: '#' },
      { platform: 'Pinterest', link: '#' }
    ]
  },
  displays: {
    type: [{ websiteLink: String, description: String }],
    default: []
  },
  whatWeDo: {
    type: [{ title: String, description: String }],
    default: [
      { title: 'Documentary Weddings', description: '"Every wedding has a unique story, and we capture it as it unfolds. From heartfelt emotions to joyful celebrations, we preserve every moment beautifully. Your love, your journey, told in the most authentic way!"' },
      { title: 'Conceptual Pre Wedding', description: '"A pre-wedding shoot that goes beyond just beautiful frames — it\'s your story, creatively crafted. From dreamy themes to cinematic storytelling, we bring your love to life. Let\'s turn your journey into a timeless visual masterpiece!"' },
      { title: 'Candid & Traditional Photography', description: 'Every picture tells a story, and every frame captures an emotion. We specialize in cinematic storytelling through our photography and videography, making your memories last forever.' },
      { title: 'Cinematic Videography', description: 'We bring the magic of cinema to your special moments with our cinematic videography. Whether it\'s a wedding, pre-wedding, event, or brand film, we craft visually stunning videos that feel like a movie.' },
      { title: 'Impactful Ad Film', description: 'We specialize in high-quality ad film production that brings your brand\'s story to life! Whether it\'s a commercial, corporate video, brand film, or digital ad, we craft visually stunning and engaging content that connects with your audience.' }
    ]
  },
  weddingHeroHeading: { type: String, default: 'Luxury Wedding Photography' },
  weddingHeroSubheading: { type: String, default: 'Premium Wedding Photography' },
  weddingHeroDescription: { type: String, default: '"Capturing your most precious moments with timeless elegance and artistry."' },
  weddingHeroButtonText: { type: String, default: 'Explore Weddings' },
  weddingHeroButtonLink: { type: String, default: '#wedding-portfolio' },
  weddingHeroBackground: { type: String, default: '/images/studio.jpeg' },
  predefinedServices: {
    type: [{ name: String, price: Number }],
    default: [
      { name: 'Candid photography', price: 10000 },
      { name: 'Candid videography', price: 10000 },
      { name: 'Traditional photography', price: 10000 },
      { name: 'Traditional videography', price: 10000 },
      { name: 'Drone', price: 15000 }
    ]
  },
  predefinedDeliverables: {
    type: [String],
    default: [
      'Traditional Video',
      'Traditional Photos',
      'Candid Photos',
      'Candid Video',
      'Cinematic Wedding Film',
      'Teaser / Highlights Video',
      'Drone Footage',
      'Premium Wedding Album',
      'RAW Data Handover',
      'Hard Drive Backup'
    ]
  },
  predefinedComplimentries: {
    type: [String],
    default: [
      'Free Photo Album (30 Pages)',
      'Mini Photobook for Parents',
      'Complimentary Pre-wedding Teaser',
      'Framed Canvas Print (16x24)',
      'Instagram Reels Edit (3 Reels)',
      'Live Streaming Setup'
    ]
  }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
