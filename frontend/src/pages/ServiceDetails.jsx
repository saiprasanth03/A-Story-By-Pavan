import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { siteConfig } from '../config/site.config';

const ServiceDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to optimize Cloudinary URLs with high quality
  const optimizeCloudinaryUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('/upload/q_auto')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_800/');
  };

  useEffect(() => {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white">
        <h2 className="text-4xl font-oswald mb-4">Service Not Found</h2>
        <button onClick={() => navigate('/')} className="px-6 py-2 border border-white/20 hover:bg-white hover:text-black transition">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-20 px-6">
      <Helmet>
        <title>{service.name} | {siteConfig.brand.name}</title>
        <meta name="description" content={service.description || `Explore our ${service.name} services at ${siteConfig.brand.name}.`} />
      </Helmet>

      <div className="max-w-[90rem] mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 border-b border-white/10 pb-8"
        >
          <button 
            onClick={() => navigate('/#experiences')} 
            className="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition"
          >
            <span>←</span> Back to Experiences
          </button>
          <h1 className="text-5xl md:text-7xl font-oswald uppercase tracking-widest text-white mb-4">
            {service.name}
          </h1>
          {service.description && (
            <p className="text-gray-400 max-w-2xl text-lg font-sans">
              {service.description}
            </p>
          )}
        </motion.div>

        {/* Sub-services Grid */}
        {service.subServices && service.subServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {service.subServices.map((sub, idx) => (
              <motion.div
                key={sub._id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={() => navigate(`/portfolio?service=${service.slug}&sub=${sub.slug}`)}
                className="group cursor-pointer bg-[#141414] hover:bg-[#1f1f1f] border border-white/5 hover:border-white/20 rounded-xl p-4 flex items-center gap-4 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-black shrink-0 border border-white/10 group-hover:border-white/30 transition-colors">
                  {sub.imageUrl ? (
                    <img 
                      src={optimizeCloudinaryUrl(sub.imageUrl)} 
                      alt={sub.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-oswald text-xl">
                      {sub.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-bold font-sans uppercase tracking-wider text-white truncate group-hover:text-[#e0e0e0] transition-colors">
                    {sub.name}
                  </h3>
                </div>
                
                {/* Arrow indicator */}
                <div className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 text-gray-400">
                  →
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-[#111] rounded-2xl border border-white/5"
          >
            <h3 className="text-2xl font-oswald text-gray-400 mb-6">No sub-services available</h3>
            <button 
              onClick={() => navigate(`/portfolio?service=${service.slug}`)}
              className="px-8 py-3 bg-white text-black text-xs font-sans uppercase tracking-widest hover:bg-gray-200 transition"
            >
              View {service.name} Portfolio
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetails;
