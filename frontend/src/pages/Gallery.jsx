import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [activeMediaType, setActiveMediaType] = useState('image');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Helper to optimize Cloudinary URLs
  const optimizeCloudinaryUrl = (url, isThumbnail = true) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('/upload/f_auto')) return url;
    if (isThumbnail) {
      return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_800,c_limit/');
    }
    return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1920,c_limit/');
  };

  useEffect(() => {
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery`).catch(() => ({ data: [] })),
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`).catch(() => ({ data: [] }))
    ]).then(([galleryRes, servicesRes]) => {
      let combinedItems = [];

      // 1. Existing standalone gallery items
      if (galleryRes.data && Array.isArray(galleryRes.data)) {
        combinedItems.push(...galleryRes.data);
      }

      // 2. Aggregate media from Services (Gallery images & videos)
      if (servicesRes.data && Array.isArray(servicesRes.data)) {
        servicesRes.data.forEach(svc => {
          const categoryName = svc.title || svc.name || 'Service';


          // Service Gallery Images
          const serviceImgs = (svc.images && svc.images.length > 0) ? svc.images : (svc.portfolioImages || []);
          serviceImgs.forEach((imgUrl, iIdx) => {
            if (imgUrl) {
              combinedItems.push({
                _id: `svc-img-${svc._id}-${iIdx}`,
                category: categoryName,
                url: imgUrl,
                type: 'image'
              });
            }
          });

          // Service Gallery Videos
          const serviceVids = (svc.videos && svc.videos.length > 0) ? svc.videos : (svc.portfolioVideos || []);
          serviceVids.forEach((vidUrl, vIdx) => {
            if (vidUrl) {
              combinedItems.push({
                _id: `svc-vid-${svc._id}-${vIdx}`,
                category: categoryName,
                url: vidUrl,
                type: 'video'
              });
            }
          });
        });
      }

      // Deduplicate items by URL
      const seen = new Set();
      const uniqueItems = combinedItems.filter(item => {
        if (!item.url || seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });

      if (uniqueItems.length > 0) {
        setImages(uniqueItems);
      } else {
        // Fallback data
        const fallback = [
          { id: 1, category: 'Maternity', url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1000' },
          { id: 2, category: 'Newborn', url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=1000' },
          { id: 3, category: 'Baby', url: 'https://images.unsplash.com/photo-1519759312658-0ce400821ec9?q=80&w=1000' },
          { id: 4, category: 'Family', url: 'https://images.unsplash.com/photo-1517594539167-a8dc824c0d05?q=80&w=1000' }
        ];
        setImages(fallback);
      }
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, []);

  const typeFilteredData = images.filter(img => activeMediaType === 'video' ? img.type === 'video' : img.type !== 'video');
  const categories = ['All', ...new Set(typeFilteredData.map(img => img.category))];
  const categoryFiltered = filter === 'All' ? typeFilteredData : typeFilteredData.filter(img => img.category === filter);
  const filteredImages = categoryFiltered;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % filteredImages.length);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredImages]);

  const getYouTubeId = (url) => {
    if(!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-2 md:px-6 lg:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="font-oswald text-xs text-[#C9A227] uppercase tracking-[0.5em] mb-4 block">Portfolio</span>
          <h1 className="font-oswald font-bold text-5xl md:text-7xl text-white uppercase tracking-widest leading-none">
            Cinematic Gallery
          </h1>
          <div className="w-16 h-[2px] bg-[#C9A227] mx-auto mt-6 mb-12 shadow-[0_0_10px_rgba(201,162,39,0.8)]"></div>
          
          {/* Media Type Toggles */}
          <div className="flex justify-center gap-4 mb-8">
            <button 
              onClick={() => { setActiveMediaType('image'); setLightboxIndex(null); }}
              className={`px-8 py-2.5 font-oswald text-xs tracking-[0.25em] uppercase transition-all duration-300 border ${
                activeMediaType === 'image' 
                ? 'bg-[#C9A227] text-black font-bold border-[#C9A227] shadow-[0_0_20px_rgba(201,162,39,0.4)]' 
                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
              }`}
            >
              Images
            </button>
            <button 
              onClick={() => { setActiveMediaType('video'); setLightboxIndex(null); }}
              className={`px-8 py-2.5 font-oswald text-xs tracking-[0.25em] uppercase transition-all duration-300 border ${
                activeMediaType === 'video' 
                ? 'bg-[#C9A227] text-black font-bold border-[#C9A227] shadow-[0_0_20px_rgba(201,162,39,0.4)]' 
                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
              }`}
            >
              Videos
            </button>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 font-sans text-[11px] tracking-[0.2em] uppercase transition-all duration-300 ${
                  filter === cat 
                  ? 'bg-white text-black font-semibold shadow-md' 
                  : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <div className="w-12 h-12 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <motion.div layout className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            <AnimatePresence>
              {filteredImages.map((img, index) => (
                <motion.div
                  key={img._id || img.id || index}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="relative group overflow-hidden bg-[#111] border border-white/5 break-inside-avoid shadow-2xl mb-6 cursor-pointer"
                  onClick={() => img.type !== 'video' && setLightboxIndex(index)}
                >
                  {img.type === 'video' ? (
                    <div className="relative w-full h-64 bg-black">
                      <iframe 
                        src={`https://www.youtube.com/embed/${getYouTubeId(img.url)}`} 
                        className="absolute inset-0 w-full h-full" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen 
                        frameBorder="0" 
                      />
                    </div>
                  ) : (
                    <img 
                      src={optimizeCloudinaryUrl(img.url, true)} 
                      alt={img.category} 
                      loading="lazy"
                      className="w-full h-auto object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000 ease-out" 
                    />
                  )}
                  
                  {img.type !== 'video' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  )}
                  
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                    <span className="bg-black/90 backdrop-blur-md px-3 py-1 text-[10px] text-[#C9A227] uppercase font-bold tracking-[0.25em] border border-[#C9A227]/30 shadow-xl">
                      {img.category}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        
        {!isLoading && filteredImages.length === 0 && (
          <div className="text-center py-32 text-gray-400 font-sans text-sm tracking-widest uppercase border border-white/10 rounded-2xl bg-white/5">
            No {activeMediaType === 'video' ? 'videos' : 'images'} found in this category.
          </div>
        )}

        {/* Lightbox Modal */}
        <AnimatePresence>
          {lightboxIndex !== null && filteredImages[lightboxIndex] && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
              onClick={() => setLightboxIndex(null)}
            >
              <button onClick={() => setLightboxIndex(null)} className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl font-light z-50">&times;</button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length); }} 
                className="absolute left-4 md:left-10 text-white/50 hover:text-white text-5xl font-light z-50 p-4"
              >
                &#8249;
              </button>

              <div className="w-full max-w-6xl h-[85vh] p-4 flex items-center justify-center">
                <motion.img 
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={optimizeCloudinaryUrl(filteredImages[lightboxIndex].url, false)} 
                  alt="Gallery preview" 
                  loading="eager"
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % filteredImages.length); }} 
                className="absolute right-4 md:right-10 text-white/50 hover:text-white text-5xl font-light z-50 p-4"
              >
                &#8250;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Gallery;
