import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

import HeroSlide from './models/HeroSlide.js';
import Gallery from './models/Gallery.js';
import Service from './models/Service.js';
import Theme from './models/Theme.js';
import Content from './models/Content.js';

dotenv.config();

// Configure Cloudinary with your new credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const OLD_CLOUD_NAME = 'dnadimm4k'; // Your old Cloudinary cloud name

async function uploadToNewCloudinary(oldUrl) {
  if (!oldUrl || !oldUrl.includes(OLD_CLOUD_NAME)) return oldUrl;
  
  console.log(`Migrating image: ${oldUrl}`);
  try {
    // Cloudinary can upload directly from a public URL
    const result = await cloudinary.uploader.upload(oldUrl, {
      folder: process.env.CLOUDINARY_FOLDER || 'studio_uploads'
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${oldUrl}:`, error.message);
    return oldUrl; // return old one if it fails
  }
}

async function migrateImages() {
  if (!process.env.MONGODB_URI) {
    console.error("No MONGODB_URI found in .env");
    process.exit(1);
  }

  console.log("Connecting to Database...");
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("Migrating HeroSlides...");
  const slides = await HeroSlide.find();
  for (let slide of slides) {
    let changed = false;
    if (slide.img && slide.img.includes(OLD_CLOUD_NAME)) {
      slide.img = await uploadToNewCloudinary(slide.img);
      changed = true;
    }
    if (slide.mobileImg && slide.mobileImg.includes(OLD_CLOUD_NAME)) {
      slide.mobileImg = await uploadToNewCloudinary(slide.mobileImg);
      changed = true;
    }
    if (changed) await slide.save();
  }

  console.log("Migrating Galleries...");
  const galleries = await Gallery.find();
  for (let gal of galleries) {
    if (gal.url && gal.url.includes(OLD_CLOUD_NAME)) {
      gal.url = await uploadToNewCloudinary(gal.url);
      await gal.save();
    }
  }

  console.log("Migrating Themes...");
  const themes = await Theme.find();
  for (let theme of themes) {
    if (theme.image && theme.image.includes(OLD_CLOUD_NAME)) {
      theme.image = await uploadToNewCloudinary(theme.image);
      await theme.save();
    }
  }

  console.log("Migrating Contents...");
  const contents = await Content.find();
  for (let content of contents) {
    if (content.imageUrl && content.imageUrl.includes(OLD_CLOUD_NAME)) {
      content.imageUrl = await uploadToNewCloudinary(content.imageUrl);
      await content.save();
    }
  }

  console.log("Migrating Services...");
  const services = await Service.find();
  for (let service of services) {
    let changed = false;
    if (service.imageUrl && service.imageUrl.includes(OLD_CLOUD_NAME)) {
      service.imageUrl = await uploadToNewCloudinary(service.imageUrl);
      changed = true;
    }
    if (service.subServices && service.subServices.length > 0) {
      for (let sub of service.subServices) {
        if (sub.imageUrl && sub.imageUrl.includes(OLD_CLOUD_NAME)) {
          sub.imageUrl = await uploadToNewCloudinary(sub.imageUrl);
          changed = true;
        }
      }
    }
    if (changed) await service.save();
  }

  console.log("Image migration completely finished! 🎉");
  process.exit(0);
}

migrateImages().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
