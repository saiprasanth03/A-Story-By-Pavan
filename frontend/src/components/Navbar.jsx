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
            ? 'py-4 bg-black/80 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]' 
            : 'py-8 bg-transparent'
        }`}
      >
        <div className="w-full pl-8 lg:pl-20 pr-8 lg:pr-20 flex justify-between items-center">
          
          {/* LOGO */}
          <motion.a 
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="z-[60] flex items-center"
          >
            <img src={siteConfig.brand.logoUrl} alt={siteConfig.brand.name} className="h-10 md:h-14 w-auto object-contain" />
          </motion.a>

          {/* DESKTOP LINKS */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Portfolio */}
            {siteConfig.features.gallery && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0 }}>
              <Link to="/gallery" className="font-sans text-xs text-white brightness-125 uppercase tracking-[0.3em] hover:text-white transition-all duration-300 relative group block">
                Portfolio
                <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </Link>
            </motion.div>
            )}

            {/* Packages with Dropdown */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <Link to="/packages" className="font-sans text-xs text-white brightness-125 uppercase tracking-[0.3em] hover:text-white transition-all duration-300 relative group block py-4">
                Packages
                <span className="absolute bottom-2 left-1/2 w-0 h-[1px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </Link>
              
              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-0 w-48 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl py-2"
                  >
                    {services.length > 0 ? services.map(svc => (
                      <div key={svc._id} className="relative group/sub">
                        <Link 
                          to={`/packages?service=${encodeURIComponent(svc.slug)}`} 
                          className="block px-4 py-3 text-[10px] font-sans text-gray-200 brightness-110 hover:text-white hover:bg-white/5 uppercase tracking-widest transition-colors"
                        >
                          {svc.name}
                        </Link>
                        {/* Nested SubServices if any */}
                        {svc.subServices && svc.subServices.length > 0 && (
                          <div className="hidden group-hover/sub:block absolute top-0 left-full w-48 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl py-2 ml-1">
                             {svc.subServices.map(sub => (
                                <Link 
                                  key={sub._id || sub.slug}
                                  to={`/packages?service=${encodeURIComponent(svc.slug)}&sub=${encodeURIComponent(sub.slug)}`} 
                                  className="block px-4 py-3 text-[10px] font-sans text-gray-200 brightness-110 hover:text-white hover:bg-white/5 uppercase tracking-widest transition-colors"
                                >
                                  {sub.name}
                                </Link>
                             ))}
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-widest">Loading...</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Themes */}
            {siteConfig.features.themes && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <Link to="/themes" className="font-sans text-xs text-white brightness-125 uppercase tracking-[0.3em] hover:text-white transition-all duration-300 relative group block">
                Themes
                <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </Link>
            </motion.div>
            )}

            {/* Studio */}
            {siteConfig.features.studio && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.18 }}>
              <Link to="/studio" className="font-sans text-xs text-white brightness-125 uppercase tracking-[0.3em] hover:text-white transition-all duration-300 relative group block">
                Studio
                <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </Link>
            </motion.div>
            )}

            {/* About */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <Link to="/about" className="font-sans text-xs text-white brightness-125 uppercase tracking-[0.3em] hover:text-white transition-all duration-300 relative group block">
                About
                <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </Link>
            </motion.div>

            {/* Testimonials */}
            {siteConfig.features.testimonials && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}>
              <Link to="/testimonials" className="font-sans text-xs text-white brightness-125 uppercase tracking-[0.3em] hover:text-white transition-all duration-300 relative group block">
                Testimonials
                <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </Link>
            </motion.div>
            )}

            {/* Contact */}
            {siteConfig.features.contact && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
              <Link to="/contact" className="font-sans text-xs text-white brightness-125 uppercase tracking-[0.3em] hover:text-white transition-all duration-300 relative group block">
                Contact
                <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-white group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
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
                className="px-6 py-3 border border-gray-400 text-white font-sans text-xs uppercase tracking-[0.3em] hover:bg-gray-200 hover:text-black transition-all duration-500 block"
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
                className="px-6 py-3 bg-[#C9A227] text-black font-sans text-xs uppercase tracking-[0.3em] hover:bg-[#e0b82a] transition-all duration-300 block font-bold"
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
              className="text-white hover:text-gray-300 transition-colors flex flex-col gap-1.5 p-2"
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
            className="fixed inset-0 bg-black z-40 flex flex-col items-center justify-center pt-20"
          >
            <div className="flex flex-col items-center gap-8 w-full px-6">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-oswald text-white uppercase tracking-[0.2em]">Home</Link>
              {siteConfig.features.gallery && <Link to="/gallery" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-oswald text-white uppercase tracking-[0.2em]">Portfolio</Link>}
              <Link to="/packages" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-oswald text-white uppercase tracking-[0.2em]">Packages</Link>
              {siteConfig.features.themes && <Link to="/themes" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-oswald text-white uppercase tracking-[0.2em]">Themes</Link>}
              {siteConfig.features.studio && <Link to="/studio" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-oswald text-white uppercase tracking-[0.2em]">Studio</Link>}
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-oswald text-white uppercase tracking-[0.2em]">About</Link>
              {siteConfig.features.testimonials && <Link to="/testimonials" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-oswald text-white uppercase tracking-[0.2em]">Testimonials</Link>}
              {siteConfig.features.contact && <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-oswald text-white uppercase tracking-[0.2em]">Contact</Link>}

              {siteConfig.features.booking && (
              <Link 
                to="/book"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-8 px-8 py-4 border border-white text-white font-sans text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all"
              >
                Book Session
              </Link>
              )}
              {siteConfig.features.getQuote && (
              <Link 
                to="/get-quote"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-8 py-4 bg-[#C9A227] text-black font-sans text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#e0b82a] transition-all"
              >
                Get Quote
              </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
