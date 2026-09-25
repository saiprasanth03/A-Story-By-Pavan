import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. Essential, Premium, Elite
  price: { type: String }, // e.g., "₹24,999"
  features: [{ type: String }],
  deliverables: [{ type: String }],
  duration: { type: String },
  crewSize: { type: String },
  isPopular: { type: Boolean, default: false }
});

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String },
  description: { type: String }
});

const faqSchema = new mongoose.Schema({
  question: { type: String },
  answer: { type: String }
});

const featureSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String }
});

const heroImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  position: { type: String, default: '50% 50%' }
}, { _id: false });

const subServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String },
  slotsActive: { type: Boolean, default: true },
  imageUrl: { type: String },
  coverImage: { type: String },
  heroImage: { type: String },
  heroImages: [heroImageSchema],
  mobileHeroImage: { type: String },
  portfolioImages: [{ type: String }],
  images: [{ type: String }],
  portfolioVideos: [{ type: String }],
  videos: [{ type: String }],
  packages: [packageSchema],
  addons: [addonSchema],
  landingAbout: {
    title: { type: String },
    description: { type: String },
    imageUrl: { type: String }
  },
  features: [featureSchema],
  faqs: [faqSchema]
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  name: { type: String },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  heroDescription: { type: String },
  coverImage: { type: String },
  coverImagePosition: { type: String, default: '50% 50%' },
  imageUrl: { type: String },
  heroImage: { type: String },
  heroImages: [heroImageSchema],
  mobileHeroImage: { type: String },
  images: [{ type: String }], // Cloudinary photo gallery URLs
  portfolioImages: [{ type: String }],
  videos: [{ type: String }], // Cloudinary video highlight reel URLs
  portfolioVideos: [{ type: String }],
  packages: [packageSchema],
  addons: [addonSchema],
  landingPages: [{ type: String }],
  landingAbout: {
    title: { type: String },
    description: { type: String },
    imageUrl: { type: String }
  },
  features: [featureSchema],
  faqs: [faqSchema],
  subServices: [subServiceSchema],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  slotsActive: { type: Boolean, default: true },
  limitOnePerSession: { type: Boolean, default: false },
  tagline: { type: String }
}, { timestamps: true });

// Pre-validate hook to handle string URLs or objects in heroImages
serviceSchema.pre('validate', function () {
  if (Array.isArray(this.heroImages)) {
    this.heroImages = this.heroImages.map(item => {
      if (typeof item === 'string') {
        return { url: item, position: '50% 50%' };
      }
      if (item && typeof item === 'object' && item.url) {
        return { url: item.url, position: item.position || '50% 50%' };
      }
      return item;
    }).filter(Boolean);
  }
});

// Pre-save hook to keep title/name and images/portfolioImages synced
serviceSchema.pre('save', function () {
  if (this.title && !this.name) this.name = this.title;
  if (this.name && !this.title) this.title = this.name;

  if (this.coverImage && !this.imageUrl) this.imageUrl = this.coverImage;
  if (this.imageUrl && !this.coverImage) this.coverImage = this.imageUrl;

  if (this.images && this.images.length > 0 && (!this.portfolioImages || this.portfolioImages.length === 0)) {
    this.portfolioImages = this.images;
  } else if (this.portfolioImages && this.portfolioImages.length > 0 && (!this.images || this.images.length === 0)) {
    this.images = this.portfolioImages;
  }

  if (this.videos && this.videos.length > 0 && (!this.portfolioVideos || this.portfolioVideos.length === 0)) {
    this.portfolioVideos = this.videos;
  } else if (this.portfolioVideos && this.portfolioVideos.length > 0 && (!this.videos || this.videos.length === 0)) {
    this.videos = this.portfolioVideos;
  }
});

export default mongoose.model('Service', serviceSchema);


