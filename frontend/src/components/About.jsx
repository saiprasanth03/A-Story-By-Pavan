import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import axios from 'axios';
import { siteConfig } from '../config/site.config';

const About = () => {
  const [content, setContent] = useState(null);
  
  const containerRef = useRef(null);
  
  // Parallax configuration
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  const yBg = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  const yImage = useTransform(scrollYProgress, [0, 1], ['-30%', '30%']);
  const yText = useTransform(scrollYProgress, [0, 1], ['10%', '-10%']);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/content`)
      .then(res => {
        const aboutContent = res.data.find(c => c.section === 'About');
        if (aboutContent) setContent(aboutContent);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <section ref={containerRef} id="about" className="relative bg-[#050505] text-white py-32 overflow-hidden">
      
      {/* Background Image with CSS Parallax (bg-fixed) */}
      {content?.backgroundImageUrl && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed opacity-60 pointer-events-none z-0"
            style={{ backgroundImage: `url('${content.backgroundImageUrl}')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-black/40 to-[#050505] z-0 pointer-events-none"></div>
        </>
      )}



      <div className="max-w-[90rem] mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          {/* Text Content */}
          <motion.div 
            className="flex flex-col items-center justify-center w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <h4 className="font-sans text-[10px] text-gray-500 uppercase tracking-[0.4em] mb-6 flex items-center justify-center gap-4 w-full">
                <span className="w-12 h-[1px] bg-gray-500"></span>
                Behind The Lens
                <span className="w-12 h-[1px] bg-gray-500"></span>
              </h4>
              
              <h2 className="font-oswald font-bold text-5xl md:text-7xl lg:text-8xl text-white uppercase tracking-widest leading-[1.1] mb-10">
                {content?.title || "Crafting Timeless Narratives"}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1, delay: 0.4 }}
              className="space-y-6 flex flex-col items-center"
            >
              {siteConfig.parentCompany.enabled && (
                <p className="text-gray-400 font-sans text-sm md:text-base tracking-wide leading-relaxed font-light flex items-center justify-center gap-2">
                  <a href={siteConfig.parentCompany.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 underline underline-offset-4 decoration-white/50 transition-colors inline-flex items-center gap-2">
                    {siteConfig.brand.name} is the sub brand of {siteConfig.parentCompany.name}
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  </a>
                </p>
              )}
              <p className="text-white font-sans text-sm md:text-base tracking-wide leading-relaxed font-light">
                {content?.description || `At ${siteConfig.brand.name}, we believe every fleeting moment holds a cinematic masterpiece. We specialize in transforming portraits into breathtaking visual stories. Our approach blends high-fashion editorial aesthetics with raw, authentic emotion.`}
              </p>
              
              {content?.features && content.features.length > 0 && (
                <ul className="mt-8 space-y-4 text-center flex flex-col items-center">
                  {content.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center text-xs font-sans tracking-[0.2em] text-gray-300 uppercase max-w-4xl">
                      <span className="w-1.5 h-1.5 bg-white rounded-full mr-4 opacity-50 flex-shrink-0"></span>
                      <span className="text-center">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-10">
                <a href="/gallery" className="inline-block border-b border-white pb-2 text-[10px] font-sans text-white uppercase tracking-[0.4em] hover:text-gray-400 hover:border-gray-400 transition-colors">
                  Explore Our Work
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
