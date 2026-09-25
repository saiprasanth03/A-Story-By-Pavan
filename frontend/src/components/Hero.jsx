import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation, Pagination, Autoplay, Parallax, Keyboard } from 'swiper/modules';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Hero = () => {
  const fallbackSlides = [
    { img: 'https://images.unsplash.com/photo-1544256627-c10f8546b4fb?q=80&w=1920&auto=format&fit=crop', text: 'Premium Baby Studio', title: 'TIMELESS', titleOutline: '& CINEMATIC MEMORIES.' },
    { img: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1920&auto=format&fit=crop', text: 'Maternity Experiences', title: 'BEAUTIFUL', titleOutline: 'JOURNEY' },
    { img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=1920&auto=format&fit=crop', text: 'Cinematic Storytelling', title: 'CINEMATIC', titleOutline: 'STORIES' },
  ];

  const [slides, setSlides] = useState(() => {
    const cached = localStorage.getItem('heroSlides');
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
    return fallbackSlides;
  });

  // Helper to optimize Cloudinary URLs
  const optimizeCloudinaryUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    // Add q_auto for optimal quality and w_1920 to prevent loading massive 4K/8K images
    if (url.includes('/upload/q_auto')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_1920/');
  };
  const [content, setContent] = useState({ title: 'Timeless & Cinematic Memories.' });

  useEffect(() => {
    // Fetch hero text content
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/content`)
      .then(res => {
        const heroContent = res.data.find(c => c.section === 'Hero');
        if (heroContent) setContent(heroContent);
      })
      .catch(console.error);

    // Fetch dynamic slides
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hero`)
      .then(res => {
        if (res.data && res.data.length > 0) {
          setSlides(res.data);
          localStorage.setItem('heroSlides', JSON.stringify(res.data));
        }
      })
      .catch(console.error);
  }, []);

  return (
    <section id="home" className="relative h-screen w-full bg-black overflow-hidden">
      {/* Loading State or Swiper */}
      {slides.length === 0 ? (
        <div className="absolute inset-0 bg-black"></div>
      ) : (
        <Swiper
          modules={[EffectFade, Navigation, Pagination, Autoplay, Parallax, Keyboard]}
          keyboard={{ enabled: true }}
          allowTouchMove={true}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={1500}
          parallax={true}
          navigation={{
            prevEl: '.swiper-button-prev-custom',
            nextEl: '.swiper-button-next-custom',
          }}
          pagination={{
            clickable: true,
            renderBullet: function (index, className) {
              return `<span class="${className} w-2 h-2 mx-2 rounded-full bg-white/30 transition-all duration-300 hover:bg-white hover:scale-150"></span>`;
            },
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          loop={true}
          className="w-full h-full"
        >
          <div slot="container-start" className="parallax-bg absolute inset-0 z-0 bg-black" data-swiper-parallax="-23%"></div>
          
          {slides.map((slide, i) => (
            <SwiperSlide key={i} className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {/* Desktop Image */}
              <img 
                src={optimizeCloudinaryUrl(slide.img)}
                alt={slide.text}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className={`absolute inset-0 w-full h-full object-cover opacity-70 ${slide.mobileImg ? 'hidden md:block' : ''}`}
                data-swiper-parallax="-30%"
              />
              
              {/* Mobile Image */}
              {slide.mobileImg && (
                <img 
                  src={optimizeCloudinaryUrl(slide.mobileImg)}
                  alt={slide.text}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  className="absolute inset-0 w-full h-full object-cover opacity-70 block md:hidden"
                  data-swiper-parallax="-30%"
                />
              )}
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40"></div>

              {/* Content with Parallax */}
              <div className={`absolute inset-0 flex flex-col pointer-events-none ${i === 0 ? "items-center justify-center" : "items-center justify-end pb-24 md:pb-32"}`}>
                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pointer-events-auto">
                  <div 
                    className="font-oswald text-xs md:text-sm text-[#C9A227] uppercase tracking-[0.5em] mb-4" 
                    data-swiper-parallax="-200"
                  >
                    {slide.text}
                  </div>
                  <h1 
                    className="font-oswald font-bold text-5xl md:text-7xl lg:text-8xl text-white uppercase tracking-widest leading-tight drop-shadow-2xl break-words"
                    data-swiper-parallax="-300"
                  >
                    {slide.title || content.title.split(' ')[0]}
                  </h1>
                  {(slide.titleOutline || content.title.split(' ')[1]) && (
                    <h1 
                      className="font-oswald font-bold text-5xl md:text-7xl lg:text-8xl text-transparent text-stroke-white uppercase tracking-widest leading-tight mt-2 drop-shadow-2xl break-words" 
                      data-swiper-parallax="-150"
                    >
                      {slide.titleOutline || content.title.split(' ').slice(1).join(' ')}
                    </h1>
                  )}
                </div>
              </div>
            </SwiperSlide>
          ))}
          
          {/* Custom Navigation */}
          <div className="swiper-button-prev-custom absolute top-1/2 left-4 md:left-8 -translate-y-1/2 z-20 cursor-pointer opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2 md:gap-4">
            <div className="w-6 md:w-12 h-[1px] bg-[#C9A227] group-hover:bg-white transition-colors"></div>
            <span className="text-white font-oswald text-[8px] md:text-xs uppercase tracking-[0.3em] -rotate-90 origin-left">Prev</span>
          </div>
          
          <div className="swiper-button-next-custom absolute top-1/2 right-4 md:right-8 -translate-y-1/2 z-20 cursor-pointer opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2 md:gap-4">
            <span className="text-white font-oswald text-[8px] md:text-xs uppercase tracking-[0.3em] rotate-90 origin-right">Next</span>
            <div className="w-6 md:w-12 h-[1px] bg-[#C9A227] group-hover:bg-white transition-colors"></div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex-col items-center animate-bounce">
            <div className="relative flex justify-center w-[1px]">
              <span className="absolute bottom-full mb-3 text-[10px] text-[#C9A227] uppercase tracking-[0.3em] font-sans">Scroll</span>
              <div className="w-[1px] h-10 bg-gradient-to-b from-[#C9A227] to-transparent"></div>
            </div>
          </div>
        </Swiper>
      )}
    </section>
  );
};

export default Hero;
