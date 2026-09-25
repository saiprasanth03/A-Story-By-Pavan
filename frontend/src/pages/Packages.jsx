import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const Packages = () => {
  const [servicesData, setServicesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Helper to optimize Cloudinary URLs with high quality
  const optimizeCloudinaryUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('/upload/q_auto')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1200/');
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`)
      .then(res => {
        if (res.data && res.data.length > 0) {
          setServicesData(res.data);
        }
      })
      .catch(err => console.error("Error fetching services", err))
      .finally(() => setIsLoading(false));
  }, []);

  const serviceQuery = searchParams.get('service');

  const filteredServices = servicesData.filter(svc => {
    if (serviceQuery && svc.slug !== serviceQuery) return false;
    return true;
  });

  return (
    <div className="pt-36 min-h-screen bg-[#050505] text-white pb-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center"
        >
          <span className="font-oswald text-xs text-[#C9A227] uppercase tracking-[0.5em] mb-4 block">EXCELLENCE IN CAPTURE</span>
          <h1 className="font-oswald font-bold text-5xl md:text-7xl lg:text-8xl text-white uppercase tracking-widest leading-none">
            OUR SERVICES
          </h1>
          <div className="w-16 h-[2px] bg-[#C9A227] mx-auto mt-6 mb-8 shadow-[0_0_10px_rgba(201,162,39,0.8)]"></div>
          <p className="text-gray-400 font-sans max-w-2xl mx-auto text-sm md:text-base tracking-wide font-light">
            Explore our crafted photography, videography, and creative studio services designed to capture your unforgettable moments.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-[#C9A227] font-oswald text-xs tracking-[0.3em] uppercase animate-pulse py-20 text-center">
            Loading Services...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20 border border-white/10 bg-[#0a0a0a]">
            <h3 className="text-2xl font-oswald text-white uppercase tracking-wider mb-3">No Services Found</h3>
            <p className="text-gray-400 font-sans text-sm mb-6">No services are currently configured or match your selection.</p>
            <Link to="/contact" className="inline-block px-8 py-3 bg-[#C9A227] text-black font-oswald text-xs uppercase tracking-[0.25em] font-bold hover:bg-white transition-all">
              CONTACT US
            </Link>
          </div>
        ) : (
          <div className="space-y-32">
            {filteredServices.map((svc, index) => {
              const coverImg = svc.coverImage || svc.imageUrl || (svc.images && svc.images[0]) || 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80';
              const isEven = index % 2 === 0;

              return (
                <motion.div 
                  key={svc._id || svc.slug}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8 }}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-16 items-center bg-[#0a0a0a] border border-white/5 p-8 lg:p-12 hover:border-[#C9A227]/30 transition-all duration-700`}
                >
                  {/* Service Image Preview */}
                  <div className="lg:w-1/2 w-full">
                    <div className="relative overflow-hidden h-[45vh] md:h-[60vh] group border border-white/10 shadow-2xl">
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                        style={{ backgroundImage: `url(${optimizeCloudinaryUrl(coverImg)})` }}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>

                      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs tracking-[0.25em] text-white/80 font-sans uppercase">
                        <span>{svc.images?.length || 0} Media items</span>
                        {svc.packages?.length > 0 && (
                          <span className="bg-[#C9A227] text-black font-bold px-3 py-1 text-[10px] uppercase font-oswald tracking-widest">
                            {svc.packages.length} Packages Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Service Info & Content */}
                  <div className="lg:w-1/2 w-full flex flex-col justify-center">
                    <span className="text-xs font-oswald uppercase tracking-[0.4em] text-[#C9A227] mb-3">
                      Service Category
                    </span>
                    
                    <h2 className="font-oswald font-bold text-4xl lg:text-5xl text-white uppercase tracking-widest mb-4 leading-tight">
                      {svc.title || svc.name}
                    </h2>

                    {(svc.heroDescription || svc.tagline) && (
                      <p className="font-serif italic text-base md:text-lg text-[#C9A227]/90 mb-4">
                        "{svc.heroDescription || svc.tagline}"
                      </p>
                    )}

                    {svc.description && (
                      <p className="font-sans text-gray-300 font-light leading-relaxed mb-8 text-sm md:text-base">
                        {svc.description}
                      </p>
                    )}

                    {/* Sub-services pills if any */}
                    {svc.subServices && svc.subServices.length > 0 && (
                      <div className="mb-8">
                        <div className="text-xs uppercase font-oswald text-[#C9A227] tracking-[0.25em] mb-3">Specializations:</div>
                        <div className="flex flex-wrap gap-2">
                          {svc.subServices.map(sub => (
                            <span key={sub._id || sub.slug} className="px-3 py-1 bg-white/5 border border-white/10 text-xs text-gray-300 font-sans tracking-wide">
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Packages Preview (Up to 2) */}
                    {svc.packages && svc.packages.length > 0 && (
                      <div className="space-y-4 mb-8 border-t border-b border-white/10 py-6">
                        <div className="text-xs font-oswald uppercase tracking-[0.25em] text-[#C9A227]">Featured Packages</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {svc.packages.slice(0, 2).map((pkg, pIdx) => (
                            <div key={pIdx} className="bg-white/5 p-4 border border-white/5">
                              <div className="font-oswald text-white uppercase text-sm tracking-wider">{pkg.name}</div>
                              <div className="text-[#C9A227] font-sans font-bold text-xs mt-1">{pkg.price}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <Link 
                        to={`/services/${svc.slug}`}
                        className="px-8 py-3.5 bg-[#C9A227] hover:bg-white hover:text-black text-black font-oswald font-bold text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_0_20px_rgba(201,162,39,0.3)]"
                      >
                        VIEW {svc.title || svc.name} GALLERY & DETAILS &rarr;
                      </Link>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Packages;
