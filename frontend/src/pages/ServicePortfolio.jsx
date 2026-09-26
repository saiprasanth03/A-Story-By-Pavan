import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ServicePortfolio = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceSlug = searchParams.get('service');
  const subSlug = searchParams.get('sub');

  const [activeSub, setActiveSub] = useState(subSlug || 'ALL');

  useEffect(() => {
    if (subSlug) setActiveSub(subSlug);
    else setActiveSub('ALL');
  }, [subSlug]);

  const handleSubChange = (newSub) => {
    setActiveSub(newSub);
    if (newSub === 'ALL') {
      setSearchParams({ service: serviceSlug }, { replace: true });
    } else {
      setSearchParams({ service: serviceSlug, sub: newSub }, { replace: true });
    }
  };
  const [activeTab, setActiveTab] = useState('images');
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    try {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        return url;
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch (e) {
      return url;
    }
  };

  const optimizeCloudinaryUrl = (url, isHero = false) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('/upload/q_auto')) return url;
    if (isHero) {
      return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1920,c_limit/');
    }
    return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1000,c_limit/');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        const svcRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`);
        const services = svcRes.data || [];
        
        const parentService = services.find(s => s.slug === serviceSlug);

        if (!parentService) {
          navigate('/packages');
          return;
        }
        setServiceData(parentService);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (serviceSlug) {
      fetchPortfolioData();
    }
  }, [serviceSlug, navigate]);

  const activeData = React.useMemo(() => {
    if (!serviceData) return null;
    
    if (activeSub === 'ALL') {
      const imgSet = new Set(serviceData.portfolioImages || []);
      const vidSet = new Set(serviceData.portfolioVideos || []);
      
      if (serviceData.subServices) {
        serviceData.subServices.forEach(sub => {
          if (sub.portfolioImages) sub.portfolioImages.forEach(img => imgSet.add(img));
          if (sub.portfolioVideos) sub.portfolioVideos.forEach(vid => vidSet.add(vid));
        });
      }

      return {
        name: serviceData.name,
        description: serviceData.description,
        tagline: serviceData.tagline,
        heroImage: serviceData.heroImage,
        mobileHeroImage: serviceData.mobileHeroImage || serviceData.heroImage,
        images: Array.from(imgSet).map(url => ({url})),
        videos: Array.from(vidSet).map(url => ({url})),
        showVideoGallery: serviceData.showVideoGallery !== false
      };
    } else {
      const sub = serviceData.subServices?.find(s => s.slug === activeSub);
      if (!sub) {
        // Fallback to ALL if sub not found
        return {
          name: serviceData.name,
          description: serviceData.description,
          tagline: serviceData.tagline,
          heroImage: serviceData.heroImage,
          mobileHeroImage: serviceData.mobileHeroImage || serviceData.heroImage,
          images: [],
          videos: []
        };
      }
      return {
        name: sub.name,
        description: sub.description,
        tagline: sub.tagline,
        heroImage: sub.heroImage || serviceData.heroImage,
        mobileHeroImage: sub.mobileHeroImage || sub.heroImage || serviceData.mobileHeroImage || serviceData.heroImage,
        images: (sub.portfolioImages || []).map(url => ({url})),
        videos: (sub.portfolioVideos || []).map(url => ({url})),
        showVideoGallery: sub.showVideoGallery !== false
      };
    }
  }, [serviceData, activeSub]);

  useEffect(() => {
    if (selectedImageIndex === null || !activeData) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex(prev => prev === 0 ? activeData.images.length - 1 : prev - 1);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex(prev => prev === activeData.images.length - 1 ? 0 : prev + 1);
      } else if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, activeData]);

  if (loading || !serviceData || !activeData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const viewDetailsLink = activeSub !== 'ALL' 
    ? `/packages?service=${encodeURIComponent(serviceSlug)}&sub=${encodeURIComponent(activeSub)}`
    : `/packages?service=${encodeURIComponent(serviceSlug)}`;

  return (
    <div className="min-h-screen bg-white text-[#0f0f12]">
      <section className="relative h-[80vh] md:h-[90vh] w-full flex items-center justify-center overflow-hidden transition-all duration-1000">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105 hidden md:block transition-all duration-1000"
          style={{ backgroundImage: `url(${optimizeCloudinaryUrl(activeData.heroImage, true)})` }}
        />
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105 block md:hidden transition-all duration-1000"
          style={{ backgroundImage: `url(${optimizeCloudinaryUrl(activeData.mobileHeroImage, true)})` }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
        
        <div className="relative z-10 w-full max-w-[90rem] mx-auto px-6 lg:px-12 pt-20 flex flex-col md:flex-row items-center md:items-end justify-end md:justify-between h-full pb-10 md:pb-20 gap-8 md:gap-0">
          <motion.div 
            key={activeData.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center md:text-left max-w-2xl text-white"
          >
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[10px] text-gray-300 uppercase tracking-[0.3em] hover:text-white transition-colors mb-6 mx-auto md:mx-0 absolute top-28 left-6 md:static md:top-auto md:left-auto"
            >
              <span>←</span> BACK TO HOME
            </button>
            <h1 className="font-mirage font-bold text-2xl sm:text-5xl md:text-6xl lg:text-7xl uppercase tracking-wider sm:tracking-widest leading-tight mb-4 md:mb-6 drop-shadow-2xl text-white max-w-full px-2">
              {activeData.name}
            </h1>
            {activeData.tagline && (
              <p className="font-serif italic text-xl md:text-2xl text-gray-200 mb-8 drop-shadow-md">
                "{activeData.tagline}"
              </p>
            )}
            {activeData.description && (
              <p className="font-sans text-xs md:text-sm text-gray-200 tracking-wider leading-relaxed max-w-xl drop-shadow-md">
                {activeData.description}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-12 md:mt-0"
          >
            <a 
              href={viewDetailsLink}
              className="inline-flex items-center justify-center border border-white/50 bg-black/40 backdrop-blur-md px-10 py-4 md:py-5 font-sans text-xs uppercase tracking-[0.3em] text-white hover:bg-white hover:text-black transition-all duration-500 rounded-sm mt-8 md:mt-0"
            >
              View Packages
            </a>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-12 max-w-[90rem] mx-auto bg-white">
        
        {/* Sub-Service Pills */}
        {serviceData.subServices && serviceData.subServices.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-16">
            <button 
              onClick={() => handleSubChange('ALL')}
              className={`px-8 py-3 rounded-full font-sans text-xs sm:text-sm uppercase tracking-[0.2em] transition-all duration-500 ${activeSub === 'ALL' ? 'bg-black text-white shadow-xl scale-105' : 'bg-neutral-100 border border-black/10 text-neutral-600 hover:border-black/30 hover:text-black hover:bg-neutral-200'}`}
            >
              ALL
            </button>
            {serviceData.subServices.map(sub => (
              <button 
                key={sub.slug}
                onClick={() => handleSubChange(sub.slug)}
                className={`px-8 py-3 rounded-full font-sans text-xs sm:text-sm uppercase tracking-[0.2em] transition-all duration-500 ${activeSub === sub.slug ? 'bg-black text-white shadow-xl scale-105' : 'bg-neutral-100 border border-black/10 text-neutral-600 hover:border-black/30 hover:text-black hover:bg-neutral-200'}`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Media Pills */}
        <div className="flex justify-center gap-4 md:gap-6 mb-16">
          <button 
            onClick={() => setActiveTab('images')}
            className={`px-8 py-3 rounded-full font-sans text-xs sm:text-sm uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'images' ? 'bg-black text-white shadow-xl scale-105' : 'bg-neutral-100 border border-black/10 text-neutral-600 hover:border-black/30 hover:text-black hover:bg-neutral-200'}`}
          >
            IMAGES ({activeData.images.length})
          </button>
          {activeData.showVideoGallery && (
            <button 
              onClick={() => setActiveTab('videos')}
              className={`px-8 py-3 rounded-full font-sans text-xs sm:text-sm uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'videos' ? 'bg-black text-white shadow-xl scale-105' : 'bg-neutral-100 border border-black/10 text-neutral-600 hover:border-black/30 hover:text-black hover:bg-neutral-200'}`}
            >
              VIDEOS ({activeData.videos.length})
            </button>
          )}
        </div>

        {/* Gallery Grid */}
        <AnimatePresence mode="wait">
          {activeTab === 'images' ? (
            <motion.div 
              key={`images-${activeSub}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6"
            >
              {activeData.images.length > 0 ? (
                activeData.images.map((img, i) => (
                  <div 
                    key={i} 
                    className="relative group overflow-hidden rounded-sm bg-neutral-100 break-inside-avoid shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer mb-6 border border-black/10"
                    onClick={() => setSelectedImageIndex(i)}
                  >
                    <img 
                      src={optimizeCloudinaryUrl(img.url)} 
                      alt={`${activeData.name} portfolio`} 
                      className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <span className="text-white text-3xl drop-shadow-lg">+</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center w-full">
                  <p className="text-neutral-500 font-sans text-xs uppercase tracking-[0.2em]">No images available for this category.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key={`videos-${activeSub}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
            >
              {activeData.videos.length > 0 ? (
                activeData.videos.map((vid, i) => (
                  <div key={i} className="aspect-video w-full rounded-sm overflow-hidden bg-neutral-100 border border-black/10 shadow-sm">
                    <iframe 
                      src={getYouTubeEmbedUrl(vid.url)} 
                      title={`${activeData.name} video`}
                      className="w-full h-full"
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center w-full">
                  <p className="text-neutral-500 font-sans text-xs uppercase tracking-[0.2em]">No videos available for this category.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl font-light transition-colors z-50"
              onClick={() => setSelectedImageIndex(null)}
            >
              &times;
            </button>
            
            <button 
              className="absolute left-4 md:left-12 text-white/50 hover:text-white text-4xl md:text-6xl font-light transition-colors z-50 p-4"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex === 0 ? activeData.images.length - 1 : selectedImageIndex - 1);
              }}
            >
              &#8249;
            </button>

            <img 
              src={optimizeCloudinaryUrl(activeData.images[selectedImageIndex].url, true)}
              alt="Lightbox"
              className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />

            <button 
              className="absolute right-4 md:right-12 text-white/50 hover:text-white text-4xl md:text-6xl font-light transition-colors z-50 p-4"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex === activeData.images.length - 1 ? 0 : selectedImageIndex + 1);
              }}
            >
              &#8250;
            </button>

            <div className="absolute bottom-6 left-0 right-0 text-center text-white/50 text-xs font-sans tracking-[0.2em]">
              {selectedImageIndex + 1} / {activeData.images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServicePortfolio;
