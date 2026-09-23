import React, { useState, useEffect } from 'react';
import About from '../components/About';
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
    <div className="min-h-screen bg-black">
      
      {/* Wox-style Hero section for About Us */}
      <div 
        className="relative min-h-screen flex flex-col items-center justify-center text-center border-b border-white/10 bg-cover bg-center"
        style={{ backgroundImage: `url('${aboutContent?.backgroundImageUrl || '/images/about_bg.jpeg'}')` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full px-6 pt-20"
        >
          <h2 className="font-oswald text-xs text-gray-500 uppercase tracking-[0.5em] mb-4">Behind the Lens</h2>
          <h1 className="font-oswald font-bold text-5xl md:text-7xl text-white uppercase tracking-widest leading-none mb-8">
            {aboutContent?.title || 'Our Story'}
          </h1>
          <div className="w-16 h-[1px] bg-white mx-auto mb-8"></div>
          <p className="text-gray-300 font-sans font-light text-sm md:text-base leading-relaxed max-w-2xl mx-auto tracking-wide">
            {aboutContent?.description || `${siteConfig.brand.name} was founded with a single mission: to capture life's most precious and fleeting moments with cinematic elegance and unparalleled luxury.`}
          </p>
        </motion.div>
      </div>
      
      {/* Reuse the Wox-styled About component we built earlier */}
      <About />
      
      {/* Additional Studio Info */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-32">
        <div className="text-center mb-20">
          <h2 className="font-oswald font-bold text-4xl text-white uppercase tracking-widest">
            The Team
          </h2>
        </div>
        
        {teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 lg:gap-16">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={member._id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                className="group cursor-default"
              >
                <div className="aspect-[3/4] relative overflow-hidden mb-6 bg-[#111]">
                  {member.imageUrl && (
                    <img 
                      src={member.imageUrl} 
                      alt={member.name} 
                      className="w-full h-full object-cover filter grayscale group-hover:scale-105 transition-transform duration-[2s]"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700"></div>
                </div>
                <h3 className="text-3xl font-oswald text-white uppercase tracking-widest mb-2">{member.name}</h3>
                <p className="text-lg font-sans text-gray-300 capitalize mb-1">{member.title}</p>
                <p className="text-xs font-sans tracking-[0.3em] text-gray-500 uppercase mb-2">{member.subtitle}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 uppercase tracking-widest font-sans text-sm">Our talented team is coming soon.</p>
        )}
      </div>
    </div>
  );
};

export default AboutUs;
