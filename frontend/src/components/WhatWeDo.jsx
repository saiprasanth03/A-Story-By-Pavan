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
    <section className="bg-white py-28 px-6 lg:px-12 text-[#0f0f12] border-t border-black/10 relative z-10 overflow-hidden">
      {/* Background Decorative Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-black/[0.03] blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="font-mirage text-xs text-neutral-500 uppercase tracking-[0.6em] mb-4 block">
            Core Specialties
          </span>
          <h2 className="font-mirage text-4xl sm:text-5xl md:text-6xl text-[#0f0f12] tracking-[0.2em] uppercase font-bold drop-shadow-sm">
            What We Do
          </h2>
          <div className="w-20 h-[3px] bg-black mx-auto mt-6 rounded-full"></div>
        </motion.div>

        {/* CSS grid for Masonry/Variable width look */}
        <div className="flex flex-wrap justify-center gap-8">
          {items.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`group relative flex flex-col justify-between p-8 md:p-12 bg-black text-white border border-neutral-800 hover:border-white/50 transition-all duration-500 rounded-3xl cursor-pointer overflow-hidden shadow-2xl hover:-translate-y-3 ${
                index < 2 ? 'w-full md:w-[calc(50%-1rem)]' : 'w-full md:w-[calc(33.333%-1.35rem)]'
              }`}
            >
              {/* Subtle hover background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-neutral-950 opacity-100 group-hover:opacity-90 transition-opacity pointer-events-none"></div>
              
              {/* Animated corner light flare */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl rounded-full group-hover:bg-white/10 transition-all duration-700"></div>

              <div className="relative z-10 flex justify-between items-center mb-8">
                <span className="font-mirage text-xs text-neutral-300 uppercase tracking-[0.4em] font-bold border border-white/20 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
                  0{index + 1}
                </span>
                <div className="w-10 h-[1.5px] bg-white/30 group-hover:w-20 transition-all duration-500 bg-gradient-to-r from-white to-transparent"></div>
              </div>
              
              <div className="relative z-10">
                <h3 className="font-mirage text-2xl md:text-3xl text-left mb-5 tracking-[0.15em] uppercase text-white font-bold leading-tight group-hover:text-neutral-100 transition-colors">
                  {item.title}
                </h3>
                <p className="font-sans text-sm md:text-base text-left leading-relaxed font-light text-neutral-300 group-hover:text-white transition-colors duration-500">
                  {item.description}
                </p>
              </div>

              <div className="relative z-10 mt-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs font-sans uppercase tracking-[0.25em] text-neutral-400 group-hover:text-white transition-colors font-semibold">
                <span>Explore Experience</span>
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeDo;
