import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Studio = () => {
  const [activeTab, setActiveTab] = useState('360 DEGREE');
  const [studioData, setStudioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchStudioData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/studio`);
        setStudioData(res.data);
      } catch (error) {
        console.error("Error fetching studio data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudioData();
  }, []);

  const optimizeCloudinaryUrl = (url, isHero = false) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('/upload/q_auto')) return url;
    if (isHero) {
      return url.replace('/upload/', '/upload/f_auto,q_auto,w_1920,c_limit/');
    }
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_1000,c_limit/');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImageIndex === null || !studioData?.images) return;
      if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev + 1) % studioData.images.length);
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev - 1 + studioData.images.length) % studioData.images.length);
      } else if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, studioData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!studioData) {
    return (
      <div className="min-h-screen bg-white text-[#0f0f12] flex items-center justify-center">
        <p>Studio information is currently unavailable.</p>
      </div>
    );
  }

  const tabs = ['360 DEGREE', 'LOCATION', 'IMAGES', 'VIDEOS'];

  // Helper to extract iframe src safely and convert YouTube URLs
  const extractIframeSrc = (embedCode) => {
    if (!embedCode) return '';
    let url = embedCode;
    const match = embedCode.match(/src=["']([^"']+)["']/);
    if (match) url = match[1];
    
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtube.com/watch')) {
      try {
        const videoId = new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}`;
      } catch(e) {}
    }
    
    return url;
  };

  return (
    <div className="min-h-screen bg-white text-[#0f0f12]">

      {/* Hero Section */}
      <section className="relative h-[80vh] md:h-[90vh] w-full flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center hidden md:block"
          style={{ backgroundImage: `url(${optimizeCloudinaryUrl(studioData.heroImageDesktop || 'https://images.unsplash.com/photo-1542044896530-05d85be9b11a?q=80', true)})` }}
        />
        <div 
          className="absolute inset-0 bg-cover bg-center block md:hidden"
          style={{ backgroundImage: `url(${optimizeCloudinaryUrl(studioData.heroImageMobile || studioData.heroImageDesktop || 'https://images.unsplash.com/photo-1542044896530-05d85be9b11a?q=80', true)})` }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70"></div>
        
        <div className="relative z-10 w-full max-w-[90rem] mx-auto px-6 lg:px-12 pt-20 flex flex-col items-center justify-center h-full pb-10 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl text-white"
          >
            <h1 className="font-mirage font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-widest leading-none mb-6 drop-shadow-2xl text-white">
              {studioData.name || 'TWILIGHT STUDIOS'}
            </h1>
            <p className="font-sans text-sm md:text-base text-white tracking-[0.2em] uppercase max-w-xl mx-auto drop-shadow-md">
              {studioData.description || 'Premium Photography & Cinematic Experience'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs & Content Section */}
      <section className="py-20 px-6 lg:px-12 max-w-[90rem] mx-auto min-h-[60vh] bg-white">
        
        {/* Pills / Tabs */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-16">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-full font-sans text-xs sm:text-sm uppercase tracking-[0.2em] transition-all duration-500 ${
                activeTab === tab 
                ? 'bg-black text-white shadow-xl scale-105' 
                : 'bg-neutral-100 border border-black/10 text-neutral-600 hover:border-black/30 hover:text-black hover:bg-neutral-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            
            {/* 360 DEGREE */}
            {activeTab === '360 DEGREE' && (
              <motion.div
                key="360"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="w-full bg-neutral-100 border border-black/10 rounded-xl overflow-hidden aspect-video md:aspect-[21/9]"
              >
                {studioData.threeSixtyImage ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    allowFullScreen 
                    style={{ borderStyle: "none" }} 
                    src={`https://cdn.pannellum.org/2.5/pannellum.htm#panorama=${encodeURIComponent(studioData.threeSixtyImage)}&autoLoad=true`}
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 p-8 text-center">
                    <span className="text-4xl mb-4">↻</span>
                    <p className="font-sans text-sm uppercase tracking-widest">360° View Not Available</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* LOCATION */}
            {activeTab === 'LOCATION' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="w-full h-[60vh] bg-neutral-100 border border-black/10 rounded-xl overflow-hidden"
              >
                {studioData.mapEmbedUrl ? (
                  studioData.mapEmbedUrl.includes('/embed') ? (
                    <iframe
                      src={extractIframeSrc(studioData.mapEmbedUrl)}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  ) : (
                    <a 
                      href={extractIframeSrc(studioData.mapEmbedUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full h-full relative block group bg-neutral-50 flex items-center justify-center transition-all hover:bg-neutral-100"
                    >
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-6 group-hover:bg-black/10 group-hover:scale-110 transition-all shadow-sm">
                          <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                        </div>
                        <h3 className="font-mirage text-2xl tracking-widest uppercase text-[#0f0f12] mb-2">Our Studio Location</h3>
                        <p className="font-sans text-xs text-neutral-600 tracking-[0.2em] uppercase max-w-sm px-4">Click here to open our exact location in Google Maps and get directions.</p>
                      </div>
                    </a>
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 p-8 text-center">
                    <span className="text-4xl mb-4">📍</span>
                    <p className="font-sans text-sm uppercase tracking-widest">Location Map Not Available</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* IMAGES */}
            {activeTab === 'IMAGES' && (
              <motion.div
                key="images"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {studioData.images && studioData.images.length > 0 ? (
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                    {studioData.images.map((imgUrl, idx) => (
                      <div 
                        key={idx} 
                        className="break-inside-avoid relative group overflow-hidden rounded-xl bg-neutral-100 border border-black/10 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                        onClick={() => setSelectedImageIndex(idx)}
                      >
                        <img 
                          src={optimizeCloudinaryUrl(imgUrl)} 
                          alt={`Studio view ${idx + 1}`}
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-64 flex flex-col items-center justify-center text-neutral-500 border border-black/10 rounded-xl bg-neutral-50">
                    <p className="font-sans text-sm uppercase tracking-widest">No images uploaded yet</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIDEOS */}
            {activeTab === 'VIDEOS' && (
              <motion.div
                key="videos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {studioData.videos && studioData.videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studioData.videos.map((vidUrl, idx) => {
                      const isYouTube = vidUrl.includes('youtube.com') || vidUrl.includes('youtu.be');
                      return (
                        <div key={idx} className="aspect-video bg-neutral-100 rounded-xl overflow-hidden border border-black/10 relative shadow-sm">
                          {isYouTube ? (
                            <iframe
                              width="100%"
                              height="100%"
                              src={extractIframeSrc(vidUrl)}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <video 
                              src={vidUrl} 
                              controls 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full h-64 flex flex-col items-center justify-center text-neutral-500 border border-black/10 rounded-xl bg-neutral-50">
                    <p className="font-sans text-sm uppercase tracking-widest">No videos uploaded yet</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && studioData?.images?.[selectedImageIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button 
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-[101]"
              onClick={() => setSelectedImageIndex(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <button 
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors z-[101]"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev - 1 + studioData.images.length) % studioData.images.length);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>

            <button 
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors z-[101]"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev + 1) % studioData.images.length);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>

            <motion.img
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              src={studioData.images[selectedImageIndex]}
              alt={`Expanded view ${selectedImageIndex + 1}`}
              className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Studio;
