import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const OfferingsText = () => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/content`)
      .then(res => {
        const offeringsContent = res.data.find(c => c.section === 'Offerings');
        if (offeringsContent) setContent(offeringsContent);
      })
      .catch(console.error);
  }, []);

  if (!content) return null;

  return (
    <section className="relative w-full py-24 px-6 lg:px-12 flex items-center justify-center border-y border-white/5 overflow-hidden text-white z-10">
      {content.backgroundImageUrl ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed opacity-70 pointer-events-none"
            style={{ backgroundImage: `url('${content.backgroundImageUrl}')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-black/40 to-[#050505]"></div>
        </>
      ) : (
        <div className="absolute inset-0 bg-[#050505]"></div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-7xl mx-auto text-center"
      >
        <h4 className="font-sans text-[10px] text-gray-500 uppercase tracking-[0.4em] mb-4">
          Offerings
        </h4>
        <h2 className="font-mirage font-bold text-4xl md:text-6xl text-white uppercase tracking-widest mb-8">
          {content.title || 'What We Offer'}
        </h2>
        
        {content.description && (
          <p className="font-sans text-gray-400 text-sm tracking-widest leading-relaxed mb-12 max-w-2xl mx-auto">
            {content.description}
          </p>
        )}
        
        {content.features && content.features.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-x-12 gap-y-8 mt-16">
            {content.features.map((feature, idx) => (
              <li key={idx} className="flex flex-row items-center sm:items-start text-xs font-sans tracking-[0.2em] text-gray-300 uppercase text-left max-w-sm">
                <span className="w-1.5 h-1.5 bg-white rounded-full mr-3 mt-1.5 opacity-50 flex-shrink-0"></span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </section>
  );
};

export default OfferingsText;
