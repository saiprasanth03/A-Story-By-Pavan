import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const WhatWeDo = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings`)
      .then(res => {
        if (res.data?.whatWeDo?.length > 0) {
          setItems(res.data.whatWeDo);
        } else {
          // Fallback if not configured
          setItems([
            { title: 'Documentary Weddings', description: '"Every wedding has a unique story, and we capture it as it unfolds. From heartfelt emotions to joyful celebrations, we preserve every moment beautifully. Your love, your journey, told in the most authentic way!"' },
            { title: 'Conceptual Pre Wedding', description: '"A pre-wedding shoot that goes beyond just beautiful frames — it\'s your story, creatively crafted. From dreamy themes to cinematic storytelling, we bring your love to life. Let\'s turn your journey into a timeless visual masterpiece!"' },
            { title: 'Candid & Traditional Photography', description: 'Every picture tells a story, and every frame captures an emotion. At Astiva Creations, we specialize in cinematic storytelling through our photography and videography, making your memories last forever.' },
            { title: 'Cinematic Videography', description: 'At Astiva Creations, we bring the magic of cinema to your special moments with our cinematic videography. Whether it\'s a wedding, pre-wedding, event, or brand film, we craft visually stunning videos that feel like a movie.' },
            { title: 'Impactful Ad Film', description: 'We specialize in high-quality ad film production that brings your brand\'s story to life! Whether it\'s a commercial, corporate video, brand film, or digital ad, we craft visually stunning and engaging content that connects with your audience.' }
          ]);
        }
      })
      .catch(console.error);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="bg-[#050505] py-32 px-6 lg:px-12 text-white border-t border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="font-oswald text-xs text-[#C9A227] uppercase tracking-[0.5em] mb-4 block">
            Core Specialties
          </span>
          <h2 className="font-oswald text-4xl sm:text-5xl md:text-6xl text-white tracking-[0.25em] uppercase font-bold">
            What We Do
          </h2>
          <div className="w-16 h-[2px] bg-[#C9A227] mx-auto mt-6 shadow-[0_0_10px_rgba(201,162,39,0.8)]"></div>
        </motion.div>

        {/* CSS grid for Masonry/Variable width look */}
        <div className="flex flex-wrap justify-center gap-6">
          {items.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`group relative flex flex-col justify-center items-center p-10 md:p-14 bg-[#0a0a0a] border border-white/5 hover:border-[#C9A227]/40 transition-all duration-700 cursor-pointer overflow-hidden ${
                index < 2 ? 'w-full md:w-[calc(50%-0.75rem)]' : 'w-full md:w-[calc(33.333%-1rem)]'
              }`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9A227]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#C9A227]/15 transition-all duration-700"></div>
              
              <h3 className="font-oswald text-2xl md:text-3xl text-center mb-6 tracking-[0.2em] uppercase transition-colors duration-500 text-white group-hover:text-[#C9A227]">
                {item.title}
              </h3>
              <div className="w-10 h-[1px] bg-[#C9A227]/40 mb-6 group-hover:w-20 transition-all duration-500"></div>
              <p className="font-sans text-sm md:text-base text-center leading-relaxed font-light text-gray-400 group-hover:text-gray-200 transition-colors duration-500">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeDo;
