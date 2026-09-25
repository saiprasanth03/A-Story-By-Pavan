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
    <section className="bg-[#050505] py-32 px-6 lg:px-12 text-white border-t border-white/10 relative z-10 overflow-hidden">
      {/* Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-white/[0.02] blur-[140px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <span className="font-mirage text-xs text-gray-400 uppercase tracking-[0.6em] mb-4 block text-glow-subtle">
            Core Specialties
          </span>
          <h2 className="font-mirage text-4xl sm:text-5xl md:text-7xl text-white tracking-[0.2em] uppercase font-bold drop-shadow-2xl">
            What We Do
          </h2>
          <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent mx-auto mt-6 shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
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
              className={`group relative flex flex-col justify-between p-10 md:p-14 bg-gradient-to-b from-white/[0.05] to-white/[0.01] backdrop-blur-2xl border border-white/10 hover:border-white/40 transition-all duration-700 rounded-3xl cursor-pointer overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.6)] hover:-translate-y-2 ${
                index < 2 ? 'w-full md:w-[calc(50%-1rem)]' : 'w-full md:w-[calc(33.333%-1.35rem)]'
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/15 transition-all duration-700"></div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="font-mirage text-xs text-gray-500 uppercase tracking-[0.4em] font-medium border border-white/10 px-3 py-1 rounded-full bg-black/40">
                  0{index + 1}
                </span>
                <div className="w-8 h-[1px] bg-white/30 group-hover:w-16 transition-all duration-500"></div>
              </div>
              
              <div>
                <h3 className="font-mirage text-2xl md:text-3xl text-left mb-5 tracking-[0.15em] uppercase transition-colors duration-500 text-white font-bold leading-tight">
                  {item.title}
                </h3>
                <p className="font-sans text-sm md:text-base text-left leading-relaxed font-light text-gray-400 group-hover:text-gray-200 transition-colors duration-500">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs font-sans uppercase tracking-[0.25em] text-gray-400 group-hover:text-white transition-colors">
                <span>Explore Experience</span>
                <span className="group-hover:translate-x-2 transition-transform duration-300">&rarr;</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeDo;
