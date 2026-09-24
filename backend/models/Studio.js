import mongoose from 'mongoose';

const studioSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Creative Studio'
  },
  description: {
    type: String,
    default: 'Premium Photography Studio'
  },
  heroImageDesktop: {
    type: String,
    default: ''
  },
  heroImageMobile: {
    type: String,
    default: ''
  },
  threeSixtyImage: {
    type: String,
    default: ''
  },
  mapEmbedUrl: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  videos: [{
    type: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('Studio', studioSchema);
