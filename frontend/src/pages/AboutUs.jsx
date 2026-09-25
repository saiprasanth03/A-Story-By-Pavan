import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { siteConfig } from '../config/site.config';

const AboutUs = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [aboutContent, setAboutContent] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/team`);
        setTeamMembers(response.data);
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };
    
    const fetchContent = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/content`);
        const aboutData = response.data.find(c => c.section === 'About');
        if (aboutData) setAboutContent(aboutData);
      } catch (error) {
        console.error('Error fetching content:', error);
      }
    };

    fetchTeam();
    fetchContent();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      
      {/* Hero Section */}
      <div 
        className="relative flex flex-col items-center justify-center text-center border-b border-white/10 bg-cover bg-center overflow-hidden pt-40 md:pt-48 pb-20 md:pb-28"
        style={{ backgroundImage: `url('${aboutContent?.backgroundImageUrl || '/images/about_bg.jpeg'}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-[#050505]"></div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto px-6"
        >
          <span className="font-mirage text-xs text-white/60 uppercase tracking-[0.5em] mb-4 block">
            Behind The Lens
          </span>
          <h1 className="font-mirage font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white uppercase tracking-widest leading-none mb-6">
            {aboutContent?.title || 'Our Story'}
          </h1>
          <div className="w-20 h-[2px] bg-white/40 mx-auto mb-8"></div>
          <p className="text-gray-300 font-sans font-light text-base md:text-lg leading-relaxed max-w-2xl mx-auto tracking-wide">
            {aboutContent?.description || `${siteConfig.brand.name} was founded with a single mission: to capture life's most precious and fleeting moments with cinematic elegance and luxury.`}
          </p>
        </motion.div>
      </div>

      {/* Philosophy & Highlights Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 border-b border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="font-mirage text-3xl md:text-5xl text-white uppercase tracking-widest leading-tight">
              Crafting Timeless <span className="text-white/80">Visual Stories</span>
            </h2>
            <p className="text-gray-400 font-sans font-light text-sm md:text-base leading-relaxed">
              We specialize in turning split-second emotions into everlasting artworks. Our signature style merges high-fashion editorial direction with candid, heartfelt storytelling. Every image and film is crafted with painstaking attention to detail and color precision.
            </p>

            {siteConfig.parentCompany.enabled && (
              <div className="p-6 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                <a 
                  href={siteConfig.parentCompany.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white hover:text-gray-300 transition-colors flex items-center justify-between text-sm font-sans tracking-wide"
                >
                  <span><strong>{siteConfig.brand.name}</strong> is a proud subsidiary of <strong>{siteConfig.parentCompany.name}</strong></span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 flex-shrink-0 text-white"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#111] p-8 md:p-12 border border-white/10 relative overflow-hidden"
          >
            <h3 className="font-mirage text-xl text-white uppercase tracking-[0.2em] mb-6">
              Studio Features
            </h3>
            
            {aboutContent?.features && aboutContent.features.length > 0 ? (
              <ul className="space-y-4">
                {aboutContent.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm font-sans tracking-wide text-gray-300">
                    <span className="w-2 h-2 bg-white rounded-full mt-2 mr-4 flex-shrink-0"></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-4">
                <li className="flex items-start text-sm font-sans tracking-wide text-gray-300">
                  <span className="w-2 h-2 bg-white rounded-full mt-2 mr-4 flex-shrink-0"></span>
                  <span>Bespoke Editorial & Portrait Photography</span>
                </li>
                <li className="flex items-start text-sm font-sans tracking-wide text-gray-300">
                  <span className="w-2 h-2 bg-white rounded-full mt-2 mr-4 flex-shrink-0"></span>
                  <span>Cinematic 4K Storytelling & Highlights</span>
                </li>
                <li className="flex items-start text-sm font-sans tracking-wide text-gray-300">
                  <span className="w-2 h-2 bg-white rounded-full mt-2 mr-4 flex-shrink-0"></span>
                  <span>Master Color Grading & Custom Albums</span>
                </li>
              </ul>
            )}

            <div className="mt-10 pt-6 border-t border-white/10">
              <a 
                href="/gallery" 
                className="inline-flex items-center gap-3 text-xs font-mirage text-white uppercase tracking-[0.3em] hover:text-gray-300 transition-colors"
              >
                <span>Explore Portfolio</span>
                <span className="text-white">&rarr;</span>
              </a>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Team Showcase */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="text-center mb-16">
          <span className="font-mirage text-xs text-white/60 uppercase tracking-[0.5em] mb-2 block">
            Meet The Visionaries
          </span>
          <h2 className="font-mirage font-bold text-4xl md:text-5xl text-white uppercase tracking-widest">
            The Team
          </h2>
          <div className="w-16 h-[2px] bg-white/40 mx-auto mt-4"></div>
        </div>
        
        {teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={member._id || index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                className="group cursor-default bg-[#0a0a0a] border border-white/5 p-4 rounded-sm hover:border-white/20 transition-all duration-500"
              >
                <div className="aspect-[3/4] relative overflow-hidden mb-6 bg-[#111]">
                  {member.imageUrl ? (
                    <img 
                      src={member.imageUrl} 
                      alt={member.name} 
                      className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-mirage text-sm uppercase tracking-widest">
                      {member.name}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-500"></div>
                </div>
                <h3 className="text-2xl font-mirage text-white uppercase tracking-widest mb-1 group-hover:text-white/80 transition-colors">{member.name}</h3>
                <p className="text-sm font-sans text-gray-300 capitalize mb-1">{member.title}</p>
                {member.subtitle && (
                  <p className="text-xs font-sans tracking-[0.2em] text-gray-500 uppercase">{member.subtitle}</p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-white/5 bg-[#0a0a0a] max-w-xl mx-auto">
            <p className="text-gray-400 font-sans text-sm tracking-widest uppercase">Our creative team details will be displayed here soon.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AboutUs;
