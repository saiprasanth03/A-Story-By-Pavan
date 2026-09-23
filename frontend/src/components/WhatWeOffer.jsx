import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { siteConfig } from '../config/site.config';

const WhatWeOffer = () => {
  const [mainServices, setMainServices] = useState([]);
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  // Parallax effect for the grid
  const yGrid = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  // Helper to optimize Cloudinary URLs with high quality
  const optimizeCloudinaryUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('/upload/q_auto')) return url;
    // f_auto for speed, q_auto for optimal quality, w_1200 to cap extreme sizes
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_1200/');
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`)
      .then(res => {
        if (res.data && res.data.length > 0) {
          setMainServices(res.data);
        }
      })
      .catch(console.error);
  }, []);

  const displayServices = [
    ...mainServices,
    // Wedding card — only shown when parentCompany is enabled (it links externally)
    ...(siteConfig.parentCompany.enabled ? [{
      _id: 'wedding-service',
      name: 'Wedding',
      description: 'Capture your special day with our premium wedding cinematography and photography.',
      slug: 'wedding',
      imageUrl: '/images/wedding.jpg',
      externalLink: siteConfig.parentCompany.url
    }] : [])
  ];

  const handleCardClick = (svc) => {
    if (svc.slug === 'wedding') {
      navigate('/wedding');
    } else if (svc.externalLink) {
      window.open(svc.externalLink, '_blank');
    } else {
      navigate(`/portfolio?service=${encodeURIComponent(svc.slug)}`);
    }
  };

  return (
    <section ref={sectionRef} id="experiences" className="bg-[#020202] pt-32 pb-48 lg:pb-64 px-6 lg:px-12 text-white relative z-10 overflow-hidden">
      <div className="max-w-[90rem] mx-auto relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center flex flex-col items-center justify-center w-full mb-16 md:mb-24"
        >
          <div className="mb-8">
            <h4 className="font-sans text-[10px] text-gray-500 uppercase tracking-[0.4em] mb-4">
              Curated Offerings
            </h4>
            <h2 className="font-oswald font-bold text-5xl md:text-7xl lg:text-8xl text-white uppercase tracking-widest leading-none mb-8">
              Signature<br className="hidden md:block" /> Experiences
            </h2>
          </div>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayServices.map((svc, i) => (
            <motion.div 
              key={svc._id || svc.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onClick={() => handleCardClick(svc)}
              className="group relative h-[400px] md:h-[600px] w-full overflow-hidden bg-[#0a0a0a] border border-white/5 cursor-pointer"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:opacity-100 transition-all duration-1000 scale-110 group-hover:scale-100 grayscale group-hover:grayscale-0"
                style={{ backgroundImage: `url(${optimizeCloudinaryUrl(svc.imageUrl || 'https://images.unsplash.com/photo-1542044896530-05d85be9b11a?q=80')})` }}
              ></div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-700"></div>

              {/* Default Content */}
              <div className="absolute inset-0 p-10 flex flex-col justify-end transition-transform duration-700 md:group-hover:-translate-y-8">
                <h3 className="font-oswald text-4xl md:text-5xl text-white uppercase tracking-widest leading-none mb-6">
                  {svc.name}
                </h3>
                <div className="h-[1px] w-12 bg-white/20 mb-6 md:group-hover:w-full transition-all duration-700 ease-in-out"></div>
                
                {/* Hidden Description (Reveals on Hover on Desktop, Hidden on Mobile) */}
                <div className="hidden md:block h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 overflow-hidden transition-all duration-700 delay-100">
                  <p className="font-sans text-xs text-gray-300 tracking-wider leading-relaxed mb-6">
                    {svc.description}
                  </p>
                </div>
                
                {/* View Gallery Button - Always visible on mobile, visible on hover on desktop */}
                <div className="block md:hidden md:group-hover:block transition-all duration-700">
                  {svc.externalLink ? (
                    <a 
                      href={svc.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} 
                      className="inline-block text-[9px] font-sans text-white uppercase tracking-[0.3em] border border-white/30 px-6 py-3 hover:bg-white hover:text-black transition-colors"
                    >
                      View Gallery
                    </a>
                  ) : (
                    <Link 
                      to={`/portfolio?service=${encodeURIComponent(svc.slug)}`}
                      onClick={(e) => e.stopPropagation()} 
                      className="inline-block text-[9px] font-sans text-white uppercase tracking-[0.3em] border border-white/30 px-6 py-3 hover:bg-white hover:text-black transition-colors"
                    >
                      View Gallery
                    </Link>
                  )}
                </div>
              </div>

            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default WhatWeOffer;
