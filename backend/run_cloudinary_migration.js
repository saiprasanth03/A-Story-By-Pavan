import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

import Gallery from './models/Gallery.js';
import Service from './models/Service.js';
import Theme from './models/Theme.js';
import Content from './models/Content.js';
import LandingPage from './models/LandingPage.js';
import Settings from './models/Settings.js';

dotenv.config();

// Make sure your .env has your NEW Cloudinary credentials!
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Replace this with your OLD cloud name (the one you are moving away from)
const OLD_CLOUD_NAME = 'dibsrucwt'; 

async function uploadToNewCloudinary(oldUrl) {
  if (!oldUrl || !oldUrl.includes(OLD_CLOUD_NAME)) return oldUrl;
  
  console.log(`Uploading: ${oldUrl}`);
  try {
    const result = await cloudinary.uploader.upload(oldUrl, {
      folder: process.env.CLOUDINARY_FOLDER || 'studio_uploads'
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${oldUrl}:`, error.message);
    return oldUrl; 
  }
}

async function migrateImages() {
  if (!process.env.MONGODB_URI) {
    console.error("No MONGODB_URI found in .env");
    process.exit(1);
  }
  
  if (OLD_CLOUD_NAME === 'YOUR_OLD_CLOUD_NAME_HERE') {
      console.error("Please edit this file and replace 'YOUR_OLD_CLOUD_NAME_HERE' with your old Cloudinary cloud name.");
      process.exit(1);
  }

  console.log("Connecting to Database...");
  await mongoose.connect(process.env.MONGODB_URI);

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

  console.log("Migrating Landing Pages...");
  const landingPages = await LandingPage.find();
  for (let page of landingPages) {
    let changed = false;
    if (page.heroImage && page.heroImage.includes(OLD_CLOUD_NAME)) {
      page.heroImage = await uploadToNewCloudinary(page.heroImage);
      changed = true;
    }
    if (page.parallaxFooter && page.parallaxFooter.imageUrl && page.parallaxFooter.imageUrl.includes(OLD_CLOUD_NAME)) {
      page.parallaxFooter.imageUrl = await uploadToNewCloudinary(page.parallaxFooter.imageUrl);
      changed = true;
    }
    if (page.portfolioImages && page.portfolioImages.length > 0) {
        for (let i = 0; i < page.portfolioImages.length; i++) {
            if (page.portfolioImages[i].includes(OLD_CLOUD_NAME)) {
                page.portfolioImages[i] = await uploadToNewCloudinary(page.portfolioImages[i]);
                changed = true;
            }
        }
    }
    // Also check heroSlides
    if (page.heroSlides && page.heroSlides.length > 0) {
        for (let slide of page.heroSlides) {
            if (slide.imageUrl && slide.imageUrl.includes(OLD_CLOUD_NAME)) {
                slide.imageUrl = await uploadToNewCloudinary(slide.imageUrl);
                changed = true;
            }
        }
    }
    if (changed) {
        // Need to mark arrays as modified in mongoose
        page.markModified('portfolioImages');
        page.markModified('heroSlides');
        await page.save();
    }
  }

  console.log("Migrating Settings...");
  const settings = await Settings.findOne();
  if (settings) {
      let changed = false;
      if (settings.logoUrl && settings.logoUrl.includes(OLD_CLOUD_NAME)) {
          settings.logoUrl = await uploadToNewCloudinary(settings.logoUrl);
          changed = true;
      }
      if (settings.faviconUrl && settings.faviconUrl.includes(OLD_CLOUD_NAME)) {
          settings.faviconUrl = await uploadToNewCloudinary(settings.faviconUrl);
          changed = true;
      }
      if (changed) await settings.save();
  }

  console.log("Image migration completely finished! 🎉");
  process.exit(0);
}

migrateImages().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
