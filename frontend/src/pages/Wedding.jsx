import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { siteConfig } from '../config/site.config';

const Wedding = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings`);
        setSettings(res.data);
      } catch (error) {
        console.error('Failed to fetch settings', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-emerald-500/30">
      <Helmet>
        <title>{settings?.weddingHeroHeading || 'Wedding'} | {siteConfig.name}</title>
        <meta name="description" content={settings?.weddingHeroDescription || 'Premium Wedding Photography'} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Background Image / Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105 animate-[kenburns_20s_ease-out_infinite_alternate]"
          style={{ backgroundImage: `url('${settings?.weddingHeroBackground || '/images/studio.jpeg'}')` }}
        />
        <div className="absolute inset-0 z-0 bg-black/60" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center"
        >
          <div className="mb-6 flex flex-col items-center">
            <span className="text-white font-bold tracking-[0.3em] uppercase text-xs sm:text-sm mb-4">
              {settings?.weddingHeroSubheading || 'Premium Wedding Photography'}
            </span>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          </div>
          
          <h1 className="font-oswald text-5xl md:text-7xl lg:text-8xl font-light uppercase tracking-widest text-white mb-8 drop-shadow-2xl">
            {settings?.weddingHeroHeading || `${siteConfig.name} Weddings`}
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 font-light max-w-2xl leading-relaxed mb-12 italic whitespace-pre-wrap">
            {settings?.weddingHeroDescription || '"Dedicated to capturing your most precious moments with unparalleled elegance."'}
          </p>
          
          {(settings?.weddingHeroButtonLink || (siteConfig.parentCompany.enabled && siteConfig.parentCompany.url)) && (
          <a 
            href={settings?.weddingHeroButtonLink || siteConfig.parentCompany.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center gap-4 px-10 py-5 bg-white text-black rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            <span className="relative z-10 font-oswald uppercase tracking-[0.2em] font-bold text-sm">
              {settings?.weddingHeroButtonText || (siteConfig.parentCompany.enabled ? `Visit ${siteConfig.parentCompany.name}` : 'Learn More')}
            </span>
            <span className="relative z-10 group-hover:translate-x-2 transition-transform duration-300">
              →
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default Wedding;
