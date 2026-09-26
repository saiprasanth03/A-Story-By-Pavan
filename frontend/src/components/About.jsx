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
    <section ref={containerRef} id="about" className="relative bg-[#fcfcfc] text-[#0f0f12] py-28 overflow-hidden border-t border-black/10 min-h-[75vh] flex items-center justify-center">
      
      {/* Background Image with Parallax (bg-fixed) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-75 pointer-events-none z-0"
        style={{ backgroundImage: `url('${content?.backgroundImageUrl || '/images/studio.jpeg'}')` }}
      ></div>

      <div className="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 w-full text-center">
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
            <h4 className="font-sans text-[10px] text-neutral-600 uppercase tracking-[0.4em] mb-6 flex items-center justify-center gap-4 w-full font-bold">
              <span className="w-12 h-[1.5px] bg-black/40"></span>
              Behind The Lens
              <span className="w-12 h-[1.5px] bg-black/40"></span>
            </h4>
            
            <h2 className="font-mirage font-bold text-5xl md:text-7xl lg:text-8xl text-[#0f0f12] uppercase tracking-widest leading-[1.1] mb-8">
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
              <p className="text-neutral-700 font-sans text-sm md:text-base tracking-wide leading-relaxed flex items-center justify-center gap-2">
                <a href={siteConfig.parentCompany.url} target="_blank" rel="noopener noreferrer" className="text-black hover:text-neutral-700 underline underline-offset-4 decoration-black/50 transition-colors inline-flex items-center gap-2 font-bold">
                  {siteConfig.brand.name} is the sub brand of {siteConfig.parentCompany.name}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </a>
              </p>
            )}
            <p className="text-neutral-900 font-sans text-sm md:text-base tracking-wide leading-relaxed font-normal max-w-3xl">
              {content?.description || `At ${siteConfig.brand.name}, we believe every fleeting moment holds a cinematic masterpiece. We specialize in transforming portraits into breathtaking visual stories. Our approach blends high-fashion editorial aesthetics with raw, authentic emotion.`}
            </p>
            
            {content?.features && content.features.length > 0 && (
              <ul className="mt-8 space-y-3.5 text-center flex flex-col items-center">
                {content.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center justify-center text-xs font-sans tracking-[0.2em] text-neutral-800 uppercase max-w-4xl font-semibold">
                    <span className="w-2 h-2 bg-black rounded-full mr-3.5 shrink-0"></span>
                    <span className="text-center">{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-8">
              <a href="/gallery" className="inline-block bg-black text-white px-8 py-3.5 rounded-full text-xs font-sans uppercase tracking-[0.3em] hover:bg-neutral-800 transition-colors font-bold shadow-lg">
                Explore Our Work &rarr;
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
