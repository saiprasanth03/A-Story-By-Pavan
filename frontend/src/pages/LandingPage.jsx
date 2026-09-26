import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../config/site.config';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode, Navigation, EffectFade, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import '../styles/swiper-custom.css';
import Footer from '../components/Footer';

const LandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowScrollTop(true);
      else setShowScrollTop(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [formData, setFormData] = useState({ name: '', email: '', countryCode: '91', phone: '', serviceId: '', subId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState([]);
  const [activePackages, setActivePackages] = useState([]);

  const { slug } = useParams();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1500);

    const fetchLandingPage = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/landing-pages/${slug}`);
        if (isMounted) {
          setPageData(res.data);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
          navigate('/');
        }
      }
    };
    
    if (slug) fetchLandingPage();
    else setLoading(false);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [slug, navigate]);

  const rawHeroSlides = (pageData?.heroSlides || []).filter(s => s && s.imageUrl && typeof s.imageUrl === 'string' && s.imageUrl.trim() !== '');
  const heroImages = pageData === null 
    ? [] 
    : rawHeroSlides.length > 0 
      ? rawHeroSlides.map(s => ({ 
          desktop: s.imageUrl, 
          mobile: (s.mobileImageUrl && typeof s.mobileImageUrl === 'string' && s.mobileImageUrl.trim() !== '') ? s.mobileImageUrl : s.imageUrl 
        })) 
      : pageData?.heroImage && typeof pageData.heroImage === 'string' && pageData.heroImage.trim() !== ''
        ? [{ desktop: pageData.heroImage, mobile: (pageData.mobileHeroImage && typeof pageData.mobileHeroImage === 'string' && pageData.mobileHeroImage.trim() !== '') ? pageData.mobileHeroImage : pageData.heroImage }] 
        : [
            { desktop: '/images/about_bg.jpeg', mobile: '/images/about_bg.jpeg' },
            { desktop: '/images/experience_bg.jpeg', mobile: '/images/experience_bg.jpeg' },
            { desktop: '/images/studio.jpeg', mobile: '/images/studio.jpeg' }
          ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`);
        setServices(res.data);
        let packages = [];
        res.data.forEach(s => {
          if (s.packages && s.packages.length > 0) packages.push(...s.packages);
          s.subServices?.forEach(sub => {
            if (sub.packages && sub.packages.length > 0) packages.push(...sub.packages);
          });
        });
        setActivePackages(packages.slice(0, 6));
      } catch (err) {
        console.error(err);
      }
    };
    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedService = services.find(s => s.slug === formData.serviceId);
      const selectedSub = selectedService?.subServices?.find(sub => sub.slug === formData.subId);
      
      const payload = { 
        ...formData, 
        phone: `${formData.countryCode}${formData.phone}`,
        interestedIn: selectedSub ? selectedSub.title : (selectedService ? selectedService.title : 'Baby Shoot'),
        landingPageSource: pageData?.name || 'Landing Page' 
      };
      
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads`, payload);
      navigate('/thank-you?type=lead');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert('Error submitting form. Please try again.');
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const displayHeroImages = (heroImages.length > 1 && heroImages.length < 4) 
    ? [...heroImages, ...heroImages] 
    : heroImages;

  const portfolioImages = (pageData?.portfolioImages && pageData.portfolioImages.length > 0) 
    ? pageData.portfolioImages 
    : ['/images/experience_bg.jpeg', '/images/mobile.jpeg', '/images/banner_bg.webp', '/images/studio.jpeg'];

  const displayPortfolioImages = portfolioImages.length > 0
    ? Array(Math.max(4, Math.ceil(16 / portfolioImages.length))).fill(portfolioImages).flat()
    : [];

  const portfolioVideos = (pageData?.portfolioVideos && pageData.portfolioVideos.length > 0) 
    ? pageData.portfolioVideos 
    : ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'];

  const displayPortfolioVideos = portfolioVideos.length > 0
    ? Array(Math.max(4, Math.ceil(16 / portfolioVideos.length))).fill(portfolioVideos).flat()
    : [];

  if (notFound) return <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center text-[#0f0f12] font-mirage text-lg uppercase tracking-widest">Page Not Found</div>;

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#0f0f12] font-lato selection:bg-neutral-200 overflow-x-hidden relative">
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center"
          >
            <div className="relative w-40 sm:w-64 h-20 sm:h-24">
              <img src="/images/logo.png" alt={`${siteConfig.brand.name} Logo`} className="absolute inset-0 w-full h-full object-contain opacity-20" />
              <div 
                className="absolute top-0 left-0 h-full overflow-hidden" 
                style={{ animation: 'fillLogo 2s infinite ease-in-out' }}
              >
                <img src="/images/logo.png" alt={`${siteConfig.brand.name} Logo`} className="w-40 sm:w-64 h-20 sm:h-24 object-contain max-w-none origin-left" />
              </div>
            </div>
            <style>{`
              @keyframes fillLogo {
                0% { width: 0%; }
                50% { width: 100%; }
                100% { width: 0%; }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* YOUTUBE VIDEO MODAL */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-6 right-6 text-white text-4xl hover:text-gray-300 z-[110] font-bold"
            >
              &times;
            </button>
            <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl relative border border-white/20">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING BUTTONS */}
      <AnimatePresence>
        {showScrollTop && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-1.5 sm:gap-2.5"
            >
              <div className="bg-white text-[#0f0f12] border border-black/15 text-[9px] sm:text-[10px] font-lato font-bold uppercase tracking-wider sm:tracking-widest px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-lg whitespace-nowrap">
                {pageData?.floatingBubbleText || 'Hurry, Limited Slots Available!'}
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#0f0f12] hover:bg-neutral-800 text-white px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-mirage uppercase tracking-[0.2em] text-xs font-bold shadow-2xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
              >
                {pageData?.floatingButtonText || 'Book Now'}
              </button>
            </motion.div>

            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 bg-white hover:bg-neutral-100 border border-black/15 text-[#0f0f12] w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow-md flex items-center justify-center transition-all font-bold text-sm"
            >
              ↑
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* HEADER - BLACK NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 px-5 sm:px-8 py-3.5 sm:py-4 flex justify-between items-center bg-[#050505]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={pageData?.logoUrl || "/images/logo.png"} alt={pageData?.heroSubheading || siteConfig.brand.name} className="h-10 sm:h-12 w-auto object-contain" fetchpriority="high" />
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 sm:px-6 py-2.5 bg-white/10 hover:bg-white text-white hover:text-black border border-white/30 rounded-full font-lato uppercase tracking-[0.2em] text-xs font-bold transition-all duration-300 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          {pageData?.floatingButtonText || 'Book Now'}
        </button>
      </header>

      {/* 1. HERO SECTION (SLIDESHOW) - FULL VISIBILITY HERO IMAGES */}
      <section className="relative min-h-[100dvh] sm:h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <Swiper
            modules={[Autoplay, EffectFade, Keyboard, Navigation]}
            navigation={true}
            effect="fade"
            keyboard={{ enabled: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={displayHeroImages.length > 1}
            fadeEffect={{ crossFade: true }}
            allowTouchMove={true}
            className="w-full h-full [&>.swiper-button-next]:hidden md:[&>.swiper-button-next]:flex [&>.swiper-button-prev]:hidden md:[&>.swiper-button-prev]:flex"
          >
            {displayHeroImages.map((img, i) => (
              <SwiperSlide key={i} className="w-full h-full">
                <div className="w-full h-full relative">
                  <img src={img.desktop} alt="Hero Background" className="hidden md:block w-full h-full object-cover opacity-100 scale-105 transform hover:scale-100 transition-transform duration-[10s] ease-out" fetchpriority="high" />
                  <img src={img.mobile} alt="Hero Background Mobile" className="block md:hidden w-full h-full object-cover opacity-100 scale-105 transform hover:scale-100 transition-transform duration-[10s] ease-out" fetchpriority="high" />
                  {/* Subtle Dark Overlay for crisp text contrast while keeping images 100% vibrant */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/60 pointer-events-none" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center pt-24 sm:pt-20 pb-16">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="flex flex-col items-center">
            <h2 className="font-lato text-[11px] sm:text-sm uppercase tracking-[0.3em] text-gray-300 font-bold mb-2">
              {pageData?.heroSubheading || siteConfig.brand.name}
            </h2>
            <h1 className="font-mirage text-3xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-tight leading-[1.08] mb-2 text-white font-bold drop-shadow-md">
              <span style={{ whiteSpace: 'pre-line' }}>{pageData?.heroHeading || 'Beautiful Baby\nPhotography'}</span>
            </h1>
          </motion.div>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="font-spectral text-base sm:text-xl md:text-2xl font-normal italic text-gray-200 max-w-2xl mt-2 mb-5 px-2">
            {pageData?.heroQuote || '"Your Baby\'s Smile, Captured Forever as Art."'}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="flex flex-col items-center w-full">
            <div className="w-full max-w-3xl border-y border-white/20 py-3 mb-6">
              <p className="font-lato font-light text-gray-300 uppercase tracking-widest text-[11px] sm:text-sm leading-relaxed px-2">
                {pageData?.heroDescription || 'Professional baby shoots with stunning themes and complete safety.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-14 mt-1">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="font-lato text-gray-300 uppercase tracking-widest text-[10px] sm:text-xs font-bold mb-0.5">{pageData?.heroPriceText || 'Packages Start From Just'}</span>
                <span className="font-mirage text-white text-2xl sm:text-4xl font-bold">{pageData?.heroPriceAmount || '₹3,999/-'}</span>
              </div>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-6 sm:px-10 py-3 sm:py-4 bg-white hover:bg-neutral-200 text-[#0f0f12] font-mirage uppercase tracking-[0.2em] transition-all duration-300 rounded-full text-xs sm:text-sm font-bold shadow-2xl transform hover:scale-105 active:scale-95"
              >
                {pageData?.heroButtonText || 'Book Your Shoot Now'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none"
        >
          <span className="font-lato uppercase tracking-[0.3em] text-[9px] sm:text-[10px] font-bold text-white mb-1.5">Scroll</span>
          <div className="w-[2px] h-8 sm:h-10 bg-white/20 relative overflow-hidden rounded-full">
            <motion.div 
              animate={{ y: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute top-0 left-0 w-full h-1/2 bg-white"
            />
          </div>
        </motion.div>
      </section>

      {/* 2. INTRO VIDEO */}
      {pageData?.showDisplayVideo !== false && (
        <section className="relative py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto flex justify-center">
          <div className="w-full aspect-video bg-white p-2 sm:p-4 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl relative">
            <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden">
              {pageData?.displayVideoUrl ? (
                <video src={pageData.displayVideoUrl} controls autoPlay muted loop className="w-full h-full object-cover cursor-pointer" controlsList="nodownload" onClick={(e) => { if(e.target.requestFullscreen) e.target.requestFullscreen(); else if(e.target.webkitRequestFullscreen) e.target.webkitRequestFullscreen(); }} />
              ) : (
                <video src="/images/intro.mp4" controls autoPlay muted loop className="w-full h-full object-cover cursor-pointer" controlsList="nodownload" onClick={(e) => { if(e.target.requestFullscreen) e.target.requestFullscreen(); else if(e.target.webkitRequestFullscreen) e.target.webkitRequestFullscreen(); }} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* APPROACH SECTION */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto flex flex-col text-center">
        <h2 className="font-mirage font-bold text-3xl sm:text-5xl uppercase tracking-[0.1em] mb-4 text-[#0f0f12]">
          {pageData?.approachHeading || "Our Approach"}
        </h2>
        <p className="font-lato font-light text-neutral-600 leading-relaxed tracking-wide text-xs sm:text-base max-w-2xl mx-auto mb-8 sm:mb-12">
          {pageData?.approachDescription || "Capturing the purest moments with utmost care and creativity."}
        </p>

        {pageData?.approachSections && pageData.approachSections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
            {pageData.approachSections.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white border border-black/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all">
                <div className="font-mirage text-2xl sm:text-3xl text-neutral-300 font-bold mb-2 sm:mb-3">0{i + 1}</div>
                <h3 className="font-mirage text-base sm:text-lg uppercase tracking-widest mb-2 text-[#0f0f12] font-bold">{item.heading}</h3>
                <p className="font-lato text-xs sm:text-sm text-neutral-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* 3. WHAT WE DO BEST (Service Cards) */}
      <section className="py-16 sm:py-20 bg-[#fafaf9] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
            className="text-center mb-10 sm:mb-14"
          >
            <h2 className="font-mirage text-3xl sm:text-5xl uppercase tracking-widest mb-3 text-[#0f0f12] font-bold">{pageData?.serviceCardsHeading || "What We Do Best"}</h2>
            <div className="w-20 h-1 bg-[#0f0f12] mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {pageData?.serviceCards && pageData.serviceCards.length > 0 ? pageData.serviceCards.map((card, idx) => {
              const cardImgs = (card.images && card.images.length > 0)
                ? (card.images.length > 1 && card.images.length < 4 ? [...card.images, ...card.images] : card.images)
                : [];
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-black/10 shadow-md hover:shadow-2xl transition-all duration-500"
                >
                  <div className="h-64 sm:h-80 overflow-hidden relative">
                    {cardImgs.length > 0 ? (
                      <Swiper modules={[Autoplay, Navigation]} navigation={true} autoplay={{ delay: 3000, disableOnInteraction: false }} loop={cardImgs.length > 1} className="w-full h-full">
                        {cardImgs.map((img, i) => (
                          <SwiperSlide key={i}><img src={img} alt={card.title} className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                        ))}
                      </Swiper>
                    ) : (
                      <div className="w-full h-full bg-neutral-200"></div>
                    )}
                  </div>
                  <div className="p-6 sm:p-7 relative z-20 bg-white">
                    <span className="font-lato text-xs text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block font-bold">{card.category}</span>
                    <h3 className="font-mirage text-xl sm:text-2xl uppercase tracking-wider text-[#0f0f12] font-bold mb-2">{card.title}</h3>
                    <p className="font-lato text-neutral-600 font-light text-xs sm:text-sm leading-relaxed">{card.description}</p>
                  </div>
                </motion.div>
              );
            }) : (
              <>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-black/10 shadow-md hover:shadow-2xl transition-all duration-500"
                >
                  <div className="h-64 sm:h-80 overflow-hidden relative">
                    <Swiper modules={[Autoplay, Navigation]} navigation={true} autoplay={{ delay: 3000, disableOnInteraction: false }} loop={true} className="w-full h-full">
                      <SwiperSlide><img src="/images/experience_bg.jpeg" alt="Newborn" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                      <SwiperSlide><img src="/images/about_bg.jpeg" alt="Newborn 2" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                      <SwiperSlide><img src="/images/experience_bg.jpeg" alt="Newborn 3" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                      <SwiperSlide><img src="/images/about_bg.jpeg" alt="Newborn 4" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                    </Swiper>
                  </div>
                  <div className="p-6 sm:p-7 bg-white">
                    <span className="font-lato text-xs text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block font-bold">5-15 Days</span>
                    <h3 className="font-mirage text-xl sm:text-2xl uppercase tracking-wider text-[#0f0f12] font-bold mb-2">Newborn Shoots</h3>
                    <p className="font-lato text-neutral-600 font-light text-xs sm:text-sm leading-relaxed">Safe, sleepy, and beautiful poses.</p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-black/10 shadow-md hover:shadow-2xl transition-all duration-500"
                >
                  <div className="h-64 sm:h-80 overflow-hidden relative">
                    <Swiper modules={[Autoplay, Navigation]} navigation={true} autoplay={{ delay: 3500, disableOnInteraction: false }} loop={true} className="w-full h-full">
                      <SwiperSlide><img src="/images/mobile.jpeg" alt="Milestone" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                      <SwiperSlide><img src="/images/studio.jpeg" alt="Milestone 2" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                      <SwiperSlide><img src="/images/mobile.jpeg" alt="Milestone 3" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                      <SwiperSlide><img src="/images/studio.jpeg" alt="Milestone 4" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                    </Swiper>
                  </div>
                  <div className="p-6 sm:p-7 bg-white">
                    <span className="font-lato text-xs text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block font-bold">1-12 Months</span>
                    <h3 className="font-mirage text-xl sm:text-2xl uppercase tracking-wider text-[#0f0f12] font-bold mb-2">Milestone Shoots</h3>
                    <p className="font-lato text-neutral-600 font-light text-xs sm:text-sm leading-relaxed">Capturing sitting up, crawling, and first teeth.</p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-black/10 shadow-md hover:shadow-2xl transition-all duration-500"
                >
                  <div className="h-64 sm:h-80 overflow-hidden relative">
                    <Swiper modules={[Autoplay, Navigation]} navigation={true} autoplay={{ delay: 4000, disableOnInteraction: false }} loop={true} className="w-full h-full">
                      <SwiperSlide><img src="/images/banner_bg.webp" alt="Toddler" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                      <SwiperSlide><img src="/images/experience_bg.jpeg" alt="Toddler 2" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                      <SwiperSlide><img src="/images/banner_bg.webp" alt="Toddler 3" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                      <SwiperSlide><img src="/images/experience_bg.jpeg" alt="Toddler 4" className="w-full h-full object-cover" loading="lazy" decoding="async" /></SwiperSlide>
                    </Swiper>
                  </div>
                  <div className="p-6 sm:p-7 bg-white">
                    <span className="font-lato text-xs text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block font-bold">1 Year+</span>
                    <h3 className="font-mirage text-xl sm:text-2xl uppercase tracking-wider text-[#0f0f12] font-bold mb-2">Toddler Shoots</h3>
                    <p className="font-lato text-neutral-600 font-light text-xs sm:text-sm leading-relaxed">Fun-filled first birthday and cake smash celebrations.</p>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* INLINE ENQUIRY FORM */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-white border border-black/15 p-6 sm:p-12 rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden">
          <h3 className="font-mirage text-xl sm:text-3xl uppercase tracking-widest mb-6 sm:mb-8 text-[#0f0f12] text-center font-bold">Book Your Shoot</h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-2">Your Name</label>
              <input type="text" required className="w-full bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-2">Email Address</label>
              <input type="email" required className="w-full bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. john@example.com" />
            </div>
            <div>
              <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-2">Phone Number</label>
              <div className="flex gap-2">
                <select value={formData.countryCode} onChange={e => setFormData({...formData, countryCode: e.target.value})} className="w-24 bg-neutral-50 border border-black/15 rounded-xl px-2 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all appearance-none text-center cursor-pointer shadow-xs">
                  <option value="91">IN (+91)</option>
                  <option value="1">US (+1)</option>
                  <option value="44">UK (+44)</option>
                  <option value="971">UAE (+971)</option>
                  <option value="61">AU (+61)</option>
                  <option value="65">SG (+65)</option>
                </select>
                <input type="tel" required maxLength="10" pattern="[0-9]{10}" title="10 digits" className="flex-1 bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs" value={formData.phone} onChange={e => { const val = e.target.value.replace(/\D/g, ''); if (val.length <= 10) setFormData({...formData, phone: val}); }} placeholder="Mobile number" />
              </div>
            </div>
            <div>
              <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-2">Service</label>
              <select required className="w-full bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs" value={formData.serviceId} onChange={e => setFormData({...formData, serviceId: e.target.value, subId: ''})}>
                <option value="">Select Service</option>
                {services.map(s => <option key={s._id} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="md:col-span-2 mt-2">
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#0f0f12] hover:bg-neutral-800 text-white font-mirage uppercase tracking-[0.2em] text-xs font-bold rounded-xl transition-all shadow-lg disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Get Callback'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 4. OUR BEST CLICKS */}
      <section className="py-16 sm:py-20 border-t border-black/10 overflow-hidden bg-white">
        <div className="px-4 sm:px-6 lg:px-12 mb-8 sm:mb-10 flex flex-col items-center">
          <h2 className="font-mirage font-bold text-2xl sm:text-4xl uppercase tracking-[0.2em] text-[#0f0f12] text-center">{pageData?.portfolioImagesHeading || "Our Best Clicks"}</h2>
        </div>
        
        <div className="relative w-full px-4 sm:px-6 lg:px-12 pb-8">
          <Swiper grabCursor={true} simulateTouch={true}
            modules={[Autoplay, FreeMode]}
            slidesPerView="auto"
            spaceBetween={16}
            freeMode={true}
            loop={displayPortfolioImages.length > 1}
            autoplay={{ delay: 0, disableOnInteraction: false }}
            speed={3000}
            className="mySwiper"
          >
            {displayPortfolioImages.map((img, i) => (
              <SwiperSlide key={i} className="!w-[240px] sm:!w-[300px] md:!w-[350px] h-[340px] sm:h-[400px] md:h-[500px] cursor-pointer overflow-hidden rounded-2xl border border-black/10 relative transition-transform duration-500 hover:scale-[1.02] shadow-md">
                <img src={img} alt="Gallery" className="w-full h-full object-cover" decoding="async" />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* 5. WHY PARENTS LOVE OUR STUDIO & PURE COMFORT */}
      <section className="py-16 sm:py-24 relative overflow-hidden bg-neutral-100/70 border-y border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16">
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="font-mirage text-2xl sm:text-4xl uppercase tracking-widest mb-8 sm:mb-10 flex items-center gap-4 text-[#0f0f12] font-bold">
                <span className="w-8 h-1 bg-[#0f0f12]"></span> {pageData?.whyChooseHeading || "Why Parents Love Our Studio"}
              </motion.h2>
              
              <div className="space-y-6 sm:space-y-8">
                {(pageData?.features?.length > 0 ? pageData.features : [{ title: "40+ Premium Themes", description: "Amazing, hand-crafted setups for every mood." }, { title: "Certified Newborn Wraps", description: "Done by professionals ensuring 100% baby comfort." }, { title: "Cinematic Video & Editing", description: "Premium-grade videos and high-end photo retouching." }]).map((item, i) => (
                  <motion.div key={i} variants={fadeInUp} className="flex gap-4 items-start">
                    <div className="mt-1 w-6 h-6 rounded-full bg-[#0f0f12] text-white flex items-center justify-center text-xs shrink-0 font-bold shadow-xs">✓</div>
                    <div>
                      <h4 className="font-mirage text-base sm:text-lg uppercase tracking-widest text-[#0f0f12] font-bold mb-1">{item.title}</h4>
                      <p className="font-lato text-neutral-600 font-light text-xs sm:text-sm">{item.description || item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="font-mirage text-2xl sm:text-4xl uppercase tracking-widest mb-8 sm:mb-10 flex items-center gap-4 text-[#0f0f12] font-bold">
                <span className="w-8 h-1 bg-[#0f0f12]"></span> {pageData?.comfortHeading || "Pure Comfort for Mother & Baby"}
              </motion.h2>
              
              <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-black/15 shadow-xl relative overflow-hidden">
                <div className="space-y-6 sm:space-y-8 relative z-10">
                  {(pageData?.comfortItems?.length > 0 ? pageData.comfortItems : [
                    { title: '100% AC Studio', desc: 'Perfectly temperature-controlled and dust-free.' },
                    { title: 'Private Nursing Room', desc: 'A dedicated, quiet space for baby feeding and makeup.' },
                    { title: 'Super Patient Team', desc: "We work completely around your baby's nap and feeding time." }
                  ]).map((item, i) => (
                    <motion.div key={i} variants={fadeInUp} className="flex gap-4 items-start">
                      <div className="mt-1 w-6 h-6 rounded-full bg-[#0f0f12] text-white flex items-center justify-center text-xs shrink-0 font-bold shadow-xs">✓</div>
                      <div>
                        <h4 className="font-mirage text-base sm:text-lg uppercase tracking-widest text-[#0f0f12] font-bold mb-1">{item.title}</h4>
                        <p className="font-lato text-neutral-600 font-light text-xs sm:text-sm">{item.description || item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 6. YOUTUBE VIDEOS */}
      {pageData?.showVideoGallery !== false && (
        <section className="py-16 sm:py-20 overflow-hidden bg-white">
          <div className="px-4 sm:px-6 lg:px-12 mb-8 sm:mb-10 flex flex-col items-center text-center">
            <h2 className="font-mirage font-bold text-2xl sm:text-4xl uppercase tracking-[0.2em] text-[#0f0f12]">{pageData?.portfolioVideosHeading || "Memorable Client Stories"}</h2>
          </div>
          
          <div className="relative w-full px-4 sm:px-6 lg:px-12 pb-8">
            <Swiper grabCursor={true} simulateTouch={true}
              modules={[Autoplay, FreeMode]}
              slidesPerView="auto"
              spaceBetween={16}
              freeMode={true}
              loop={displayPortfolioVideos.length > 1}
              autoplay={{ delay: 0, disableOnInteraction: false }}
              speed={3000}
              className="mySwiper"
            >
              {displayPortfolioVideos.map((vid, i) => {
                let videoId = '';
                if (vid.includes('youtube.com/watch?v=')) videoId = vid.split('v=')[1]?.split('&')[0];
                else if (vid.includes('youtu.be/')) videoId = vid.split('youtu.be/')[1]?.split('?')[0];
                
                if (!videoId) return null;
                
                return (
                  <SwiperSlide key={i} className="!w-[260px] sm:!w-[350px] md:!w-[500px] aspect-video overflow-hidden rounded-2xl border border-black/10 relative cursor-pointer hover:border-black/30 transition-all shadow-md" onClick={() => setActiveVideo(videoId)}>
                    <img src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} className="h-full w-auto max-w-none object-cover transition-transform duration-700 hover:scale-105" alt="Video Thumbnail" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-white/90 border border-black/20 flex items-center justify-center shadow-lg backdrop-blur-xs">
                        <span className="text-[#0f0f12] text-base sm:text-lg ml-0.5 font-bold">▶</span>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </section>
      )}

      {/* 8. FINAL CTA BANNER - HIGH VISIBILITY BACKGROUND IMAGE */}
      <section className="relative py-20 sm:py-28 text-center overflow-hidden border-t border-black/10 bg-black">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-100 scale-105"
          style={{ backgroundImage: `url(${pageData?.parallaxFooter?.imageUrl || '/images/studio.jpeg'})` }}
        />
        {/* Dark contrast gradient overlay so background image is clearly visible while text is crisp */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/50 to-black/85" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl px-4 mx-auto text-center"
        >
          <h2 className="font-mirage text-2xl sm:text-5xl md:text-6xl uppercase tracking-widest text-white font-bold mb-4 drop-shadow-md">{pageData?.parallaxFooter?.heading || 'Affordable Premium Baby Shoot'}</h2>
          <div className="font-spectral text-xl sm:text-3xl italic text-gray-200 font-normal mb-6 border-y border-white/20 py-3 sm:py-4 inline-block">
            {pageData?.parallaxFooter?.subheading || 'Starts From Just ₹3,999/-'}
          </div>
          <p className="font-lato text-xs sm:text-base text-gray-300 font-light mb-8 max-w-xl mx-auto">
            {pageData?.parallaxFooter?.description || 'Access to custom themes, wraps, and professional team without breaking your budget.'}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 sm:px-10 py-3.5 sm:py-4 bg-white text-[#0f0f12] hover:bg-neutral-200 font-mirage uppercase tracking-[0.2em] transition-all rounded-full text-xs font-bold shadow-2xl transform hover:scale-105"
          >
            {pageData?.parallaxFooter?.buttonText || 'Claim Your Spot Now'}
          </button>
        </motion.div>
      </section>

      <Footer />

      {/* LEAD CAPTURE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-black/15 p-8 sm:p-12 rounded-3xl max-w-md w-full relative overflow-y-auto max-h-[90vh] shadow-2xl text-[#0f0f12]"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-lg transition-colors"
              >
                ✕
              </button>
              
              <h3 className="font-mirage text-2xl uppercase tracking-widest mb-6 text-[#0f0f12] font-bold">Book Your Shoot</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-1.5">Your Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-1.5">Email Address</label>
                  <input 
                    type="email" required
                    className="w-full bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. john@example.com"
                  />
                </div>
                <div>
                  <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-1.5">Phone Number</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.countryCode}
                      onChange={e => setFormData({...formData, countryCode: e.target.value})}
                      className="w-24 bg-neutral-50 border border-black/15 rounded-xl px-2 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all appearance-none text-center cursor-pointer shadow-xs"
                    >
                      <option value="91">IN (+91)</option>
                      <option value="1">US (+1)</option>
                      <option value="44">UK (+44)</option>
                      <option value="971">UAE (+971)</option>
                      <option value="61">AU (+61)</option>
                      <option value="65">SG (+65)</option>
                    </select>
                    <input 
                      type="tel" required
                      maxLength="10"
                      pattern="[0-9]{10}"
                      title="10 digits"
                      className="flex-1 bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs"
                      value={formData.phone} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setFormData({...formData, phone: val});
                      }}
                      placeholder="Mobile number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-1.5">Service</label>
                  <select 
                    required
                    className="w-full bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs"
                    value={formData.serviceId} 
                    onChange={e => setFormData({...formData, serviceId: e.target.value, subId: ''})}
                  >
                    <option value="">Select Service</option>
                    {services.map(s => (
                      <option key={s._id} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full py-4 bg-[#0f0f12] hover:bg-neutral-800 text-white font-mirage uppercase tracking-[0.2em] text-xs font-bold rounded-xl transition-all shadow-lg mt-3 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Get Callback'}
                </button>
                <p className="text-center font-lato text-[10px] text-neutral-500 uppercase tracking-wider mt-2 font-medium">
                  We'll call you to discuss themes & availability
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
