import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String }
});

const faqSchema = new mongoose.Schema({
  question: { type: String },
  answer: { type: String }
});

const landingPageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  heroSlides: [{
    imageUrl: { type: String },
    mobileImageUrl: { type: String },
    heading: { type: String },
    description: { type: String }
  }],
  heroTextAlign: { type: String, default: 'center' },

  // Global Hero Text
  heroSubheading: { type: String, default: 'Studio & Creative Services' },
  heroHeading: { type: String, default: 'Beautiful Baby\nPhotography' },
  heroQuote: { type: String, default: '"Your Baby\'s Smile, Captured Forever as Art."' },
  heroDescription: { type: String, default: 'Professional baby shoots with stunning themes and complete safety.' },
  heroPriceText: { type: String, default: 'Packages Start From Just' },
  heroPriceAmount: { type: String, default: '₹3,999/-' },
  heroButtonText: { type: String, default: 'Book Your Shoot Now' },

  // New Dynamic Content Fields
  logoUrl: { type: String },
  heroImage: { type: String },
  cardImage: { type: String },
  mobileHeroImage: { type: String },
  
  approachHeading: { type: String, default: 'Our Approach' },
  approachDescription: { type: String, default: 'Capturing the purest moments with utmost care and creativity.' },
  
  serviceCardsHeading: { type: String, default: 'What We Do Best' },
  serviceCards: [{
    category: { type: String },
    title: { type: String },
    description: { type: String },
    images: [{ type: String }]
  }],

  whyChooseHeading: { type: String, default: 'Why Parents Love Our Studio' },
  whyChooseItems: [{
    title: { type: String },
    desc: { type: String }
  }],

  comfortHeading: { type: String, default: 'Pure Comfort for Mother & Baby' },
  comfortItems: [{
    title: { type: String },
    desc: { type: String }
  }],


  // Floating Buttons
  floatingBubbleText: { type: String, default: 'Hurry, Limited Slots Available!' },
  floatingButtonText: { type: String, default: 'Book Now' },

  
  displayVideoUrl: { type: String },
  showDisplayVideo: { type: Boolean, default: true },
  showVideoGallery: { type: Boolean, default: true },
  approachSections: [{
    heading: { type: String },
    description: { type: String },
    align: { type: String, default: 'center' }
  }],
  portfolioImagesHeading: { type: String },
  portfolioImagesAlign: { type: String, default: 'center' },
  portfolioVideosHeading: { type: String },
  portfolioVideosAlign: { type: String, default: 'center' },
  whyChooseHeading: { type: String },
  featuresAlign: { type: String, default: 'left' },
  showTestimonials: { type: Boolean, default: true },
  parallaxFooter: {
    heading: { type: String, default: 'Affordable Premium Baby Shoot' },
    subheading: { type: String, default: 'Starts From Just ₹3,999/-' },
    description: { type: String, default: 'Access to custom themes, wraps, and professional team without breaking your budget.' },
    buttonText: { type: String, default: 'Claim Your Spot Now' },
    imageUrl: { type: String },
    align: { type: String, default: 'center' }
  },
  showPackages: { type: Boolean, default: false },
  packagesHeading: { type: String, default: "Investment" },
  selectedPackages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  customPackages: [{
    name: { type: String },
    price: { type: String },
    description: { type: String }
  }],
  features: [featureSchema],
  faqs: [faqSchema],
  portfolioImages: [{ type: String }],
  portfolioVideos: [{ type: String }],
  threeSixtyImages: [{ type: String }],
  callToActionLink: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('LandingPage', landingPageSchema);
