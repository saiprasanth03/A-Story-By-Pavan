import express from 'express';
import Gallery from '../models/Gallery.js';

const router = express.Router();

// Get all gallery images (including images & videos from Services)
router.get('/', async (req, res) => {
  try {
    const directGalleryItems = await Gallery.find().lean();
    
    // Aggregate media assets attached to Services
    let serviceMediaItems = [];
    try {
      const Service = (await import('../models/Service.js')).default;
      const services = await Service.find({ isActive: { $ne: false } }).lean();

      services.forEach(svc => {
        const categoryName = svc.title || svc.name || 'Services';

        // Collect URLs to exclude (cover images & hero parallax images)
        const cover = svc.coverImage || svc.imageUrl;
        const hero = svc.heroImage;
        const heroList = (svc.heroImages || []).map(h => typeof h === 'string' ? h : (h?.url || ''));
        const excludedUrls = new Set([cover, hero, ...heroList].filter(Boolean));

        // Portfolio Images / images array (EXCLUDING cover images & hero parallax images)
        const imgList = svc.images && svc.images.length > 0 ? svc.images : (svc.portfolioImages || []);
        imgList.forEach((imgUrl, idx) => {
          if (imgUrl && !excludedUrls.has(imgUrl)) {
            serviceMediaItems.push({
              _id: `svc-img-${svc._id}-${idx}`,
              url: imgUrl,
              category: categoryName,
              type: 'image',
              source: 'service'
            });
          }
        });


        // Portfolio Videos / videos array
        const vidList = svc.videos && svc.videos.length > 0 ? svc.videos : (svc.portfolioVideos || []);
        vidList.forEach((vidUrl, idx) => {
          if (vidUrl) {
            serviceMediaItems.push({
              _id: `svc-vid-${svc._id}-${idx}`,
              url: vidUrl,
              category: categoryName,
              type: 'video',
              source: 'service'
            });
          }
        });

        // SubServices Media
        if (svc.subServices && Array.isArray(svc.subServices)) {
          svc.subServices.forEach(sub => {
            const subCat = sub.name || categoryName;
            const subImgs = sub.images && sub.images.length > 0 ? sub.images : (sub.portfolioImages || []);
            subImgs.forEach((sImg, idx) => {
              if (sImg) {
                serviceMediaItems.push({
                  _id: `sub-img-${svc._id}-${sub.slug || idx}-${idx}`,
                  url: sImg,
                  category: subCat,
                  type: 'image',
                  source: 'service'
                });
              }
            });
            const subVids = sub.videos && sub.videos.length > 0 ? sub.videos : (sub.portfolioVideos || []);
            subVids.forEach((sVid, idx) => {
              if (sVid) {
                serviceMediaItems.push({
                  _id: `sub-vid-${svc._id}-${sub.slug || idx}-${idx}`,
                  url: sVid,
                  category: subCat,
                  type: 'video',
                  source: 'service'
                });
              }
            });
          });
        }
      });
    } catch (e) {
      console.warn('Failed to aggregate service gallery media:', e);
    }

    const existingUrls = new Set(directGalleryItems.map(item => item.url));
    const uniqueServiceItems = serviceMediaItems.filter(item => !existingUrls.has(item.url));

    res.json([...directGalleryItems, ...uniqueServiceItems]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add image
router.post('/', async (req, res) => {
  const image = new Gallery(req.body);
  try {
    const newImage = await image.save();
    res.status(201).json(newImage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete image
router.delete('/:id', async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Update image
router.put('/:id', async (req, res) => {
  try {
    const updatedImage = await Gallery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    );
    res.json(updatedImage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
