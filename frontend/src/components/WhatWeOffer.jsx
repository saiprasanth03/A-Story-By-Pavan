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
    <section ref={sectionRef} id="experiences" className="bg-white pt-24 pb-32 px-6 lg:px-12 text-[#0f0f12] relative z-10 overflow-hidden border-t border-black/10">
      <div className="max-w-[90rem] mx-auto relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center flex flex-col items-center justify-center w-full mb-16 md:mb-20"
        >
          <div className="mb-4">
            <span className="font-mirage text-xs text-neutral-500 uppercase tracking-[0.5em] mb-4 block">
              Curated Offerings
            </span>
            <h2 className="font-mirage font-bold text-5xl md:text-7xl text-[#0f0f12] uppercase tracking-widest leading-none mb-6">
              Signature<br className="hidden md:block" /> Experiences
            </h2>
            <div className="w-16 h-[2px] bg-black/40 mx-auto mt-6"></div>
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
              className="group relative h-[450px] md:h-[620px] w-full overflow-hidden bg-black/60 border border-white/10 hover:border-white/40 transition-all duration-700 rounded-3xl cursor-pointer shadow-[0_16px_48px_rgba(0,0,0,0.6)] hover:-translate-y-2"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-75 group-hover:opacity-100 transition-all duration-1000 scale-110 group-hover:scale-100 filter brightness-90 group-hover:brightness-100"
                style={{ backgroundImage: `url(${optimizeCloudinaryUrl(svc.imageUrl || 'https://images.unsplash.com/photo-1542044896530-05d85be9b11a?q=80')})` }}
              ></div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-85 transition-opacity duration-700"></div>

              {/* Top Floating Badge */}
              <div className="absolute top-6 left-6 z-20">
                <span className="px-4 py-1.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/15 text-[10px] font-mirage uppercase tracking-[0.25em] text-white/90">
                  {svc.name}
                </span>
              </div>

              {/* Default Content */}
              <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end transition-transform duration-700 md:group-hover:-translate-y-4 z-20">
                <h3 className="font-mirage text-3xl md:text-5xl text-white uppercase tracking-widest leading-tight mb-4 group-hover:text-white transition-colors font-bold drop-shadow-lg">
                  {svc.name}
                </h3>
                <div className="h-[2px] w-12 bg-white/40 mb-6 md:group-hover:w-full transition-all duration-700 ease-in-out"></div>
                
                {/* Description */}
                <div className="hidden md:block h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 overflow-hidden transition-all duration-700 delay-100">
                  <p className="font-sans text-xs md:text-sm text-gray-300 tracking-wider leading-relaxed mb-6 font-light">
                    {svc.description}
                  </p>
                </div>
                
                {/* View Gallery Button */}
                <div className="block transition-all duration-700 pt-2">
                  {svc.externalLink ? (
                    <a 
                      href={svc.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} 
                      className="inline-block text-[10px] font-mirage text-white uppercase tracking-[0.3em] border border-white/30 px-6 py-3 rounded-full hover:bg-white hover:text-black transition-all backdrop-blur-md shadow-lg"
                    >
                      View Experience &rarr;
                    </a>
                  ) : (
                    <Link 
                      to={`/portfolio?service=${encodeURIComponent(svc.slug)}`}
                      onClick={(e) => e.stopPropagation()} 
                      className="inline-block text-[10px] font-mirage text-white uppercase tracking-[0.3em] border border-white/30 px-6 py-3 rounded-full hover:bg-white hover:text-black transition-all backdrop-blur-md shadow-lg"
                    >
                      View Experience &rarr;
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
