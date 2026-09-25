import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { siteConfig } from '../config/site.config';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [services, setServices] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Prevent scrolling when mobile menu is open
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`)
      .then(res => {
        if (res.data) setServices(res.data);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <motion.nav 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? 'py-4 bg-black/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]' 
            : 'py-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-sm'
        }`}
      >
        <div className="w-full pl-6 lg:pl-16 pr-6 lg:pr-16 flex justify-between items-center">
          
          {/* LOGO */}
          <motion.a 
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="z-[60] flex items-center group"
          >
            <img src={siteConfig.brand.logoUrl} alt={siteConfig.brand.name} className="h-14 sm:h-16 md:h-18 w-auto object-contain transition-transform duration-500 group-hover:scale-105 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          </motion.a>

          {/* DESKTOP LINKS */}
          <div className="hidden lg:flex items-center space-x-9 bg-white/[0.03] backdrop-blur-xl border border-white/10 px-8 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            {/* Portfolio */}
            {siteConfig.features.gallery && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0 }}>
              <Link to="/gallery" className="font-sans text-xs text-gray-200 uppercase tracking-[0.25em] hover:text-white transition-all duration-300 relative group block font-medium">
                Portfolio
                <span className="absolute -bottom-1 left-1/2 w-0 h-[1.5px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              </Link>
            </motion.div>
            )}

            {/* Services with Dropdown */}
            {siteConfig.features.services && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <Link to="/packages" className="font-sans text-xs text-gray-200 uppercase tracking-[0.25em] hover:text-white transition-all duration-300 relative group block py-1 flex items-center gap-1.5 font-medium">
                Services
                <svg className="w-3 h-3 text-gray-400 group-hover:text-white transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                <span className="absolute -bottom-1 left-1/2 w-0 h-[1.5px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              </Link>
              
              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-3 w-56 bg-black/90 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.8)] py-3 z-50"
                  >
                    {services.length > 0 ? services.map(svc => (
                      <div key={svc._id} className="relative group/sub">
                        <Link 
                          to={`/services/${svc.slug}`} 
                          className="block px-5 py-3 text-[11px] font-sans text-gray-300 hover:text-white hover:bg-white/10 uppercase tracking-widest transition-all duration-300 flex items-center justify-between"
                        >
                          <span>{svc.title || svc.name}</span>
                          {svc.subServices && svc.subServices.length > 0 && <span className="text-[8px] text-gray-400 group-hover/sub:translate-x-1 transition-transform">▶</span>}
                        </Link>
                        {/* Nested SubServices if any */}
                        {svc.subServices && svc.subServices.length > 0 && (
                          <div className="hidden group-hover/sub:block absolute top-0 left-full w-52 bg-black/95 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl py-3 ml-2">
                             {svc.subServices.map(sub => (
                                <Link 
                                  key={sub._id || sub.slug}
                                  to={`/packages?service=${encodeURIComponent(svc.slug)}&sub=${encodeURIComponent(sub.slug)}`} 
                                  className="block px-5 py-3 text-[10px] font-sans text-gray-300 hover:text-white hover:bg-white/10 uppercase tracking-widest transition-colors"
                                >
                                  {sub.name}
                                </Link>
                             ))}
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="px-5 py-3 text-[10px] text-gray-500 uppercase tracking-widest">No services available</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            )}

            {/* Themes */}
            {siteConfig.features.themes && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <Link to="/themes" className="font-sans text-xs text-gray-200 uppercase tracking-[0.25em] hover:text-white transition-all duration-300 relative group block font-medium">
                Themes
                <span className="absolute -bottom-1 left-1/2 w-0 h-[1.5px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              </Link>
            </motion.div>
            )}

            {/* Studio */}
            {siteConfig.features.studio && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.18 }}>
              <Link to="/studio" className="font-sans text-xs text-gray-200 uppercase tracking-[0.25em] hover:text-white transition-all duration-300 relative group block font-medium">
                Studio
                <span className="absolute -bottom-1 left-1/2 w-0 h-[1.5px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              </Link>
            </motion.div>
            )}

            {/* About */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <Link to="/about" className="font-sans text-xs text-gray-200 uppercase tracking-[0.25em] hover:text-white transition-all duration-300 relative group block font-medium">
                About
                <span className="absolute -bottom-1 left-1/2 w-0 h-[1.5px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              </Link>
            </motion.div>

            {/* Testimonials */}
            {siteConfig.features.testimonials && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}>
              <Link to="/testimonials" className="font-sans text-xs text-gray-200 uppercase tracking-[0.25em] hover:text-white transition-all duration-300 relative group block font-medium">
                Testimonials
                <span className="absolute -bottom-1 left-1/2 w-0 h-[1.5px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              </Link>
            </motion.div>
            )}

            {/* Contact */}
            {siteConfig.features.contact && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
              <Link to="/contact" className="font-sans text-xs text-gray-200 uppercase tracking-[0.25em] hover:text-white transition-all duration-300 relative group block font-medium">
                Contact
                <span className="absolute -bottom-1 left-1/2 w-0 h-[1.5px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              </Link>
            </motion.div>
            )}

          </div>

          {/* BOOK BUTTON + GET QUOTE */}
          <div className="hidden md:flex items-center gap-3">
            {siteConfig.features.booking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Link 
                to="/book"
                className="px-6 py-2.5 border border-white/20 text-white font-sans text-xs uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-all duration-300 rounded-full backdrop-blur-md hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] font-medium"
              >
                Book Session
              </Link>
            </motion.div>
            )}
            {siteConfig.features.getQuote && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link 
                to="/get-quote"
                className="px-6 py-2.5 bg-white text-black font-sans text-xs uppercase tracking-[0.25em] hover:bg-gray-200 transition-all duration-300 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
              >
                Get Quote
              </Link>
            </motion.div>
            )}
          </div>

          {/* MOBILE MENU ICON */}
          <div className="lg:hidden flex items-center z-[60]">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-gray-300 transition-colors flex flex-col gap-1.5 p-2 focus:outline-none"
            >
              <span className={`w-6 h-[2px] bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[8px]' : ''}`}></span>
              <span className={`w-6 h-[2px] bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-6 h-[2px] bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[8px]' : ''}`}></span>
            </button>
          </div>

        </div>
      </motion.nav>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-40 flex flex-col items-center justify-center pt-20"
          >
            <div className="flex flex-col items-center gap-7 w-full px-6">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-mirage text-white uppercase tracking-[0.2em]">Home</Link>
              {siteConfig.features.gallery && <Link to="/gallery" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-mirage text-white uppercase tracking-[0.2em]">Portfolio</Link>}
              {siteConfig.features.services && <Link to="/packages" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-mirage text-white uppercase tracking-[0.2em]">Services</Link>}
              {siteConfig.features.themes && <Link to="/themes" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-mirage text-white uppercase tracking-[0.2em]">Themes</Link>}
              {siteConfig.features.studio && <Link to="/studio" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-mirage text-white uppercase tracking-[0.2em]">Studio</Link>}
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-mirage text-white uppercase tracking-[0.2em]">About</Link>
              {siteConfig.features.testimonials && <Link to="/testimonials" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-mirage text-white uppercase tracking-[0.2em]">Testimonials</Link>}
              {siteConfig.features.contact && <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-mirage text-white uppercase tracking-[0.2em]">Contact</Link>}

              <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
                {siteConfig.features.booking && (
                <Link 
                  to="/book"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3.5 border border-white/30 text-white font-sans text-xs uppercase tracking-[0.25em] rounded-full hover:bg-white hover:text-black transition-all"
                >
                  Book Session
                </Link>
                )}
                {siteConfig.features.getQuote && (
                <Link 
                  to="/get-quote"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3.5 bg-white text-black font-sans text-xs font-bold uppercase tracking-[0.25em] rounded-full hover:bg-gray-200 transition-all"
                >
                  Get Quote
                </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
