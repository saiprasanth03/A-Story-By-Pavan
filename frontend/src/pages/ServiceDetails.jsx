import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { siteConfig } from '../config/site.config';

const ServiceDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('images'); // 'images' | 'videos' | 'packages'
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const optimizeCloudinaryUrl = (url, isHero = false) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('/upload/q_auto')) return url;
    if (isHero) return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1920,c_limit/');
    return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1000,c_limit/');
  };

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

  useEffect(() => {
    window.scrollTo(0, 0);
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`)
      .then(res => {
        if (res.data) {
          const foundService = res.data.find(s => s.slug === slug);
          if (foundService) {
            setService(foundService);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-[#0f0f12] p-6 text-center">
        <h2 className="text-4xl font-mirage mb-4">Service Not Found</h2>
        <button onClick={() => navigate('/packages')} className="px-6 py-2 border border-black/20 hover:bg-black hover:text-white transition">
          View All Services
        </button>
      </div>
    );
  }

  const images = (service.images && service.images.length > 0) ? service.images : (service.portfolioImages || []);
  const videos = (service.videos && service.videos.length > 0) ? service.videos : (service.portfolioVideos || []);
  const heroImg = service.heroImage || service.coverImage || service.imageUrl || (service.heroImages?.[0]?.url) || '';

  return (
    <div className="min-h-screen bg-white text-[#0f0f12]">
      <Helmet>
        <title>{service.title || service.name} | {siteConfig.brand.name}</title>
        <meta name="description" content={service.description || `Explore our ${service.title || service.name} services.`} />
      </Helmet>

      {/* Hero Banner Section */}
      <section className="relative h-[65vh] md:h-[75vh] w-full flex items-center justify-center overflow-hidden">
        {heroImg ? (
          <div 
            className="absolute inset-0 bg-cover bg-center scale-105 transition-all duration-1000"
            style={{ backgroundImage: `url(${optimizeCloudinaryUrl(heroImg, true)})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

        <div className="relative z-10 w-full max-w-[90rem] mx-auto px-6 lg:px-12 pt-28 flex flex-col justify-end h-full pb-12">
          <button 
            onClick={() => navigate('/packages')} 
            className="text-[10px] uppercase tracking-[0.3em] text-gray-300 hover:text-white mb-6 flex items-center gap-2 transition w-fit"
          >
            <span>←</span> ALL SERVICES
          </button>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-mirage uppercase tracking-widest text-white mb-4 drop-shadow-2xl">
            {service.title || service.name}
          </h1>

          {(service.heroDescription || service.tagline) && (
            <p className="font-serif italic text-lg md:text-2xl text-white/80 mb-4">
              "{service.heroDescription || service.tagline}"
            </p>
          )}

          {service.description && (
            <p className="text-gray-200 max-w-3xl text-sm md:text-base font-sans leading-relaxed tracking-wide">
              {service.description}
            </p>
          )}
        </div>
      </section>

      {/* Media & Details Container */}
      <section className="py-16 px-6 lg:px-12 max-w-[90rem] mx-auto bg-white">
        
        {/* Media Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-16 border-b border-black/10 pb-6">
          <button 
            onClick={() => setActiveTab('images')}
            className={`px-8 py-3 rounded-full font-sans text-xs md:text-sm uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'images' ? 'bg-black text-white font-bold shadow-xl scale-105' : 'bg-neutral-100 border border-black/10 text-neutral-600 hover:text-black hover:bg-neutral-200'}`}
          >
            GALLERY IMAGES ({images.length})
          </button>
          
          {videos.length > 0 && (
            <button 
              onClick={() => setActiveTab('videos')}
              className={`px-8 py-3 rounded-full font-sans text-xs md:text-sm uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'videos' ? 'bg-black text-white font-bold shadow-xl scale-105' : 'bg-neutral-100 border border-black/10 text-neutral-600 hover:text-black hover:bg-neutral-200'}`}
            >
              VIDEOS ({videos.length})
            </button>
          )}

          {service.packages && service.packages.length > 0 && (
            <button 
              onClick={() => setActiveTab('packages')}
              className={`px-8 py-3 rounded-full font-sans text-xs md:text-sm uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'packages' ? 'bg-black text-white font-bold shadow-xl scale-105' : 'bg-neutral-100 border border-black/10 text-neutral-600 hover:text-black hover:bg-neutral-200'}`}
            >
              PACKAGES ({service.packages.length})
            </button>
          )}
        </div>

        {/* Tab 1: Image Gallery */}
        {activeTab === 'images' && (
          <div>
            {images.length > 0 ? (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                {images.map((imgUrl, i) => (
                  <div 
                    key={i} 
                    className="relative group overflow-hidden rounded-sm bg-neutral-100 border border-black/10 cursor-pointer break-inside-avoid shadow-sm hover:shadow-xl transition-all duration-300"
                    onClick={() => setSelectedImageIndex(i)}
                  >
                    <img 
                      src={optimizeCloudinaryUrl(imgUrl)} 
                      alt={`${service.title || service.name} ${i+1}`} 
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-3xl font-light">+</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-neutral-50 rounded-2xl border border-black/10">
                <p className="text-neutral-500 text-sm uppercase tracking-widest">No gallery images added for this service yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Videos */}
        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {videos.map((vidUrl, i) => (
              <div key={i} className="aspect-video w-full rounded-sm overflow-hidden bg-neutral-100 border border-black/10 shadow-sm">
                <iframe 
                  src={getYouTubeEmbedUrl(vidUrl)} 
                  title={`${service.title || service.name} Video ${i+1}`}
                  className="w-full h-full"
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Packages */}
        {activeTab === 'packages' && service.packages && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {service.packages.map((pkg, idx) => (
              <div key={idx} className={`bg-[#fafafa] border ${pkg.isPopular ? 'border-black shadow-xl ring-1 ring-black/10' : 'border-black/10'} p-8 rounded-2xl flex flex-col justify-between relative`}>
                {pkg.isPopular && (
                  <span className="absolute -top-3 right-6 bg-black text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">POPULAR CHOICE</span>
                )}
                <div>
                  <h3 className="text-xl font-mirage text-[#0f0f12] uppercase tracking-wider mb-2">{pkg.name}</h3>
                  <div className="text-3xl font-bold text-[#0f0f12] mb-6">{pkg.price}</div>
                  <ul className="space-y-3 mb-8">
                    {(pkg.features || []).map((f, i) => (
                      <li key={i} className="text-xs text-neutral-600 flex items-start gap-2">
                        <span className="text-black font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link 
                  to="/get-quote"
                  className="w-full py-3 text-center bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors shadow-md"
                >
                  Get Quote
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Sub-services Section (if present) */}
        {service.subServices && service.subServices.length > 0 && (
          <div className="mt-24 pt-16 border-t border-black/10">
            <h2 className="text-2xl font-mirage text-[#0f0f12] uppercase tracking-wider mb-8">Sub-Experiences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {service.subServices.map((sub, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate(`/portfolio?service=${service.slug}&sub=${sub.slug}`)}
                  className="group cursor-pointer bg-[#fafafa] hover:bg-neutral-100 border border-black/10 hover:border-black/30 rounded-xl p-4 flex items-center gap-4 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-200 shrink-0 border border-black/10">
                    {sub.imageUrl && <img src={sub.imageUrl} alt={sub.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0f0f12] uppercase tracking-wider">{sub.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && images[selectedImageIndex] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl leading-none transition-colors z-50"
              onClick={() => setSelectedImageIndex(null)}
            >
              &times;
            </button>
            <button 
              className="absolute left-4 md:left-12 text-white/50 hover:text-white text-4xl font-light transition-colors z-50 p-4"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1);
              }}
            >
              &#8249;
            </button>
            <img 
              src={optimizeCloudinaryUrl(images[selectedImageIndex], true)}
              alt="Service Lightbox Preview"
              className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-lg"
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
              className="absolute right-4 md:right-12 text-white/50 hover:text-white text-4xl font-light transition-colors z-50 p-4"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1);
              }}
            >
              &#8250;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceDetails;

