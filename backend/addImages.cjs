require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studio-template';

mongoose.connect(uri).then(async () => {
  const LandingPage = mongoose.model('LandingPage', new mongoose.Schema({}, { strict: false }));
  
  const images = [
    'https://images.unsplash.com/photo-1517331589133-c7940ea89b91?w=800&q=80',
    'https://images.unsplash.com/photo-1544078839-a9a3f9e9bf9b?w=800&q=80',
    'https://images.unsplash.com/photo-1519340241574-2ccb4f2c5a01?w=800&q=80',
    'https://images.unsplash.com/photo-1513271786526-7df2e23366cb?w=800&q=80',
    'https://images.unsplash.com/photo-1519163013280-99890f5c1d84?w=800&q=80'
  ];

  await LandingPage.findOneAndUpdate(
    { slug: 'maternity-lp' },
    { 
      $set: { 
        heroImage: 'https://images.unsplash.com/photo-1519340241574-2ccb4f2c5a01?w=1600&q=80',
        'landingAbout.imageUrl': 'https://images.unsplash.com/photo-1544078839-a9a3f9e9bf9b?w=800&q=80',
        portfolioImages: images
      }
    }
  );
  console.log('Updated maternity-lp with unsplash images');
  process.exit();
}).catch(console.error);
