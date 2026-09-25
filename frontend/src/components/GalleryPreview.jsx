import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';

const GalleryPreview = () => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery`)
      .then(res => {
        if (res.data && res.data.length > 0) {
          const featuredImages = res.data.filter(img => img.isFeatured);
          // If no images are featured, fallback to displaying up to 6 recent ones
          const imagesToDisplay = featuredImages.length > 0 ? featuredImages : res.data.slice(0, 6);
          setImages(imagesToDisplay);
        } else {
          // Fallback if db is empty
          setImages([
            { url: 'https://images.unsplash.com/photo-1519759312658-0ce400821ec9?q=80&w=1470&auto=format&fit=crop' },
            { url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=800&auto=format&fit=crop' },
            { url: 'https://images.unsplash.com/photo-1517594539167-a8dc824c0d05?q=80&w=800&auto=format&fit=crop' }
          ]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <section className="py-32 bg-black overflow-hidden relative border-t border-white/5">
      <div className="max-w-[90rem] mx-auto px-6 lg:px-12 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end text-center md:text-left mb-16 md:mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center md:items-start"
          >
            <h2 className="font-sans text-[10px] text-gray-500 uppercase tracking-[0.4em] mb-4">Portfolio Highlights</h2>
            <h3 className="font-mirage font-bold text-5xl md:text-7xl lg:text-8xl text-white uppercase tracking-widest leading-none">
              Cinematic<br className="hidden md:block"/> Gallery
            </h3>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-8 md:mt-0 flex justify-center md:justify-end"
          >
            <Link to="/gallery" className="font-sans text-[10px] text-white hover:text-gray-400 uppercase tracking-[0.4em] transition-colors border-b border-white/30 hover:border-white pb-2 flex items-center gap-4">
              View Entire Collection <span className="text-sm">→</span>
            </Link>
          </motion.div>
        </div>

        {images.length > 0 && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((img, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (idx % 3) * 0.2 }}
                className="relative group overflow-hidden break-inside-avoid"
              >
                <img src={img.url || img} alt={`Gallery Highlight ${idx + 1}`} className="w-full h-auto transition-transform duration-[2s] group-hover:scale-105" />
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default GalleryPreview;
