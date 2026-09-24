import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Content from './models/Content.js';
import Service from './models/Service.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studio-template');
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await Content.deleteMany({});
    await Service.deleteMany({});

    // Seed Content
    const contents = [
      {
        section: 'Hero',
        title: 'Timeless & Cinematic Memories.',
        subtitle: 'Premium Photography & Creative Studio',
        description: 'Capturing Beautiful Memories for Babies, Families & Creators',
      },
      {
        section: 'About',
        title: 'Premium Studio Experience',
        description: 'Our studio is a premier photography space offering versatile creative setups, comfortable spaces, and a highly professional team focused on emotional storytelling.',
        features: ['30+ Creative Themes', 'Premium Equipment', 'Fully Air-Conditioned Studio', 'Comfortable Environment']
      },
      {
        section: 'Offerings',
        title: 'What We Offer',
        description: 'Our premium amenities and features.',
        features: [
          "30+ Creative Baby Shoot Themes",
          "10+ Creative Maternity Themes",
          "Unique Creative Theme Setups",
          "Professional Studio Lighting Setup",
          "Indoor & Outdoor Setups",
          "Huge Collection of Props & Accessories",
          "Premium Maternity Gowns Collection",
          "Newborn Baby Wrapping Collection",
          "Baby Costumes & Accessories",
          "Soft & Safe Newborn Setup Materials",
          "Makeup, Costume Changing & Private Baby Feeding Room",
          "Comfortable Space for Mothers & Babies",
          "Professional Photo Editing",
          "Reels & Cinematic Video Editing",
          "Premium Albums",
          "Premium Photo Frames & Articles",
          "Clean & Hygienic Environment",
          "Fully Air-Conditioned Studio Setup",
          "Peaceful & Comfortable Atmosphere",
          "Baby-Friendly Studio Environment",
          "Very Professional Team"
        ]
      }
    ];

    await Content.insertMany(contents);
    console.log('Content seeded');

    // Seed Services
    const services = [
      {
        name: 'Maternity Stories',
        slug: 'maternity-stories',
        description: 'Elegant maternity storytelling sessions with premium gowns, emotional couple portraits, cinematic lighting, and luxury setups designed specially for mothers.',
        imageUrl: 'https://images.unsplash.com/photo-1517594539167-a8dc824c0d05?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹14,999', features: ['1 Theme Setup', '10 Edited Photos', '1 Reel', '1 Costume', '1 Hour Session'] },
          { name: 'Gold Package', price: '₹24,999', isPopular: true, features: ['2 Premium Themes', '20 Edited Photos', 'Cinematic Reel', '2 Costumes', 'Couple Photos Included', '2 Hour Session'] },
          { name: 'Platinum Package', price: '₹39,999', features: ['Luxury Theme Setups', 'Cinematic Video', 'Premium Editing', 'Multiple Costumes', 'Couple + Family Photos', 'Premium Album', 'Indoor & Outdoor Shoot'] }
        ]
      },
      {
        name: 'Newborn Stories',
        slug: 'newborn-stories',
        description: 'Soft, safe, peaceful newborn photography sessions with wrapped poses, cozy themes, baby-safe materials, and emotional family memories.',
        imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹12,999', features: ['Wrapped Setup', '10 Edited Photos', 'Baby Props Included', '1 Hour Session'] },
          { name: 'Gold Package', price: '₹22,999', isPopular: true, features: ['Multiple Setups', '20 Edited Photos', 'Family Photos Included', 'Reel Included', 'Premium Props'] },
          { name: 'Platinum Package', price: '₹34,999', features: ['Luxury Newborn Styling', 'Cinematic Video', 'Premium Album', 'Multiple Themes', 'Family Session Included'] }
        ]
      },
      {
        name: 'Baby Milestone Story',
        slug: 'baby-milestone-story',
        description: 'A premium 1 to 12 months baby growth journey package capturing every monthly milestone through creative themes, reels, albums, and cinematic memories. (Starting from ₹3,333/month)',
        imageUrl: 'https://images.unsplash.com/photo-1544256627-c10f8546b4fb?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹24,999', features: ['12 Monthly Shoots', '1 Theme Monthly', '5 Edited Photos', '1 Reel'] },
          { name: 'Gold Package', price: '₹39,999', isPopular: true, features: ['Multiple Themes', 'Family Photos', 'Premium Album', 'Birthday Shoot'] },
          { name: 'Platinum Package', price: '₹59,999+', features: ['Cinematic Video', 'Luxury Album', 'Outdoor Session', 'Priority Slots'] }
        ]
      },
      {
        name: 'Tiny Steps',
        slug: 'tiny-steps',
        description: 'Special photography sessions for crawling, sitting, standing, and first-walking moments with playful and emotional storytelling setups.',
        imageUrl: 'https://images.unsplash.com/photo-1519759312658-0ce400821ec9?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹9,999', features: ['1 Theme', '10 Edited Photos', 'Baby Props Included'] },
          { name: 'Gold Package', price: '₹18,999', isPopular: true, features: ['Multiple Creative Setups', 'Family Photos', 'Reel Included', 'Premium Editing'] },
          { name: 'Platinum Package', price: '₹29,999', features: ['Luxury Styling', 'Cinematic Video', 'Premium Album', 'Multiple Themes'] }
        ]
      },
      {
        name: 'Toddler Memories',
        slug: 'toddler-memories',
        description: 'Fun-filled creative shoots for toddlers featuring colorful themes, candid expressions, playful setups, and personality-focused portraits.',
        imageUrl: 'https://images.unsplash.com/photo-1519213872227-2bc4fb101666?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹10,999', features: ['Fun Theme Setup', '10 Edited Photos', '1 Reel'] },
          { name: 'Gold Package', price: '₹19,999', isPopular: true, features: ['Multiple Themes', 'Family Portraits', 'Creative Reels', 'Premium Editing'] },
          { name: 'Platinum Package', price: '₹32,999', features: ['Cinematic Video', 'Premium Album', 'Luxury Theme Setup', 'Indoor + Outdoor Shoot'] }
        ]
      },
      {
        name: 'Birthday Stories',
        slug: 'birthday-stories',
        description: 'Grand birthday storytelling sessions including cake smash, luxury birthday setups, family moments, cinematic celebration videos, and premium albums.',
        imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8892bb6bf4?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹15,999', features: ['Cake Smash Setup', '15 Edited Photos', '1 Reel'] },
          { name: 'Gold Package', price: '₹26,999', isPopular: true, features: ['Premium Birthday Setup', 'Family Photos', 'Cinematic Reel', 'Premium Editing'] },
          { name: 'Platinum Package', price: '₹42,999', features: ['Luxury Decoration', 'Cinematic Birthday Film', 'Premium Album', 'Large Creative Setup'] }
        ]
      },
      {
        name: 'Growing Stories',
        slug: 'growing-stories',
        description: 'Age-based creative portrait sessions designed for growing children to preserve yearly personality, emotions, expressions, achievements, and beautiful childhood memories.',
        imageUrl: 'https://images.unsplash.com/photo-1471286174890-9c11241eb988?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹11,999', features: ['Portrait Session', '10 Edited Photos', '1 Outfit'] },
          { name: 'Gold Package', price: '₹21,999', isPopular: true, features: ['Multiple Creative Portraits', 'Family Photos', 'Reel Included', 'Premium Retouching'] },
          { name: 'Platinum Package', price: '₹34,999', features: ['Cinematic Portrait Film', 'Multiple Outfits', 'Premium Album', 'Indoor & Outdoor Shoot'] }
        ]
      },
      {
        name: 'Couple Shoots',
        slug: 'couple-shoots',
        description: 'Romantic and emotional couple photography sessions designed to capture genuine love, chemistry, candid moments, and cinematic memories through elegant indoor and outdoor setups.',
        imageUrl: 'https://images.unsplash.com/photo-1518228511717-3d969246194b?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹14,999', features: ['1 Location', '15 Edited Photos', '1 Reel'] },
          { name: 'Gold Package', price: '₹28,999', isPopular: true, features: ['Multiple Concepts', 'Cinematic Reel', 'Outfit Changes', 'Premium Editing'] },
          { name: 'Platinum Package', price: '₹49,999', features: ['Cinematic Couple Film', 'Luxury Styling', 'Indoor + Outdoor Shoot', 'Premium Album'] }
        ]
      },
      {
        name: 'Portrait Shoots',
        slug: 'portrait-shoots',
        description: 'Creative and personality-focused portrait sessions with professional lighting, cinematic compositions, premium editing, and modern styling for individuals of all ages.',
        imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=1448&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹8,999', features: ['Studio Portraits', '10 Edited Photos'] },
          { name: 'Gold Package', price: '₹16,999', isPopular: true, features: ['Creative Lighting Setups', 'Multiple Looks', 'Reel Included'] },
          { name: 'Platinum Package', price: '₹28,999', features: ['Fashion Style Portraits', 'Cinematic Edit', 'Premium Retouching', 'Magazine Style Look'] }
        ]
      },
      {
        name: 'Family Shoots',
        slug: 'family-shoots',
        description: 'Heartwarming family photography sessions capturing togetherness, emotions, celebrations, and timeless bonding moments in a beautiful cinematic style.',
        imageUrl: 'https://images.unsplash.com/photo-1506869640319-fea1a27530e0?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹12,999', features: ['Family Portrait Session', '15 Edited Photos'] },
          { name: 'Gold Package', price: '₹24,999', isPopular: true, features: ['Multiple Family Setups', 'Reel Included', 'Premium Editing'] },
          { name: 'Platinum Package', price: '₹39,999', features: ['Cinematic Family Film', 'Premium Album', 'Indoor + Outdoor Session'] }
        ]
      },
      {
        name: 'Modeling Shoots',
        slug: 'modeling-shoots',
        description: 'Professional portfolio shoots for models, influencers, actors, and creators with fashion-focused lighting, stylish compositions, premium retouching, and creative direction.',
        imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹12,999', features: ['Portfolio Shoot', '10 Edited Photos'] },
          { name: 'Gold Package', price: '₹24,999', isPopular: true, features: ['Fashion Lighting', 'Multiple Looks', 'Reel Included'] },
          { name: 'Platinum Package', price: '₹39,999', features: ['Cinematic Fashion Film', 'High-End Retouching', 'Brand Style Portfolio'] }
        ]
      },
      {
        name: 'Reel Shoots',
        slug: 'reel-shoots',
        description: 'Creative short-form video shoots designed for Instagram reels, personal branding, trending content, cinematic edits, and social media promotions.',
        imageUrl: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹9,999', features: ['1 Reel Shoot', 'Basic Edit'] },
          { name: 'Gold Package', price: '₹19,999', isPopular: true, features: ['Multiple Reels', 'Trending Concepts', 'Cinematic Edit'] },
          { name: 'Platinum Package', price: '₹34,999', features: ['Premium Content Production', 'Advanced Cinematic Editing', 'Personal Branding Style'] }
        ]
      },
      {
        name: 'Promotional Shoots',
        slug: 'promotional-shoots',
        description: 'Professional photo and video content creation for brands, businesses, products, stores, services, and marketing campaigns with modern commercial visuals.',
        imageUrl: 'https://images.unsplash.com/photo-1542744094-24638ea0b3b5?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹14,999', features: ['Product/Brand Shoot', '10 Edited Photos'] },
          { name: 'Gold Package', price: '₹29,999', isPopular: true, features: ['Promotional Reel', 'Creative Commercial Setup'] },
          { name: 'Platinum Package', price: '₹59,999+', features: ['Full Brand Campaign Shoot', 'Cinematic Ad Video', 'Premium Commercial Edit'] }
        ]
      },
      {
        name: 'Podcasts',
        slug: 'podcasts',
        description: 'Professional multi-camera podcast recording setup with cinematic lighting, high-quality audio, aesthetic backgrounds, and premium editing for creators, influencers, and brands.',
        imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1470&auto=format&fit=crop',
        packages: [
          { name: 'Silver Package', price: '₹11,999', features: ['Single Camera Setup', 'Audio Recording', 'Basic Edit'] },
          { name: 'Gold Package', price: '₹21,999', isPopular: true, features: ['Multi-Camera Setup', 'Professional Lighting', 'Reels Included'] },
          { name: 'Platinum Package', price: '₹39,999', features: ['Cinematic Podcast Production', 'Premium Audio Processing', 'Social Media Reels', 'Full Episode Editing'] }
        ]
      }
    ];

    await Service.insertMany(services);
    console.log('Services seeded');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
