import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SubServicesBanner = () => {
  const [subServices, setSubServices] = useState([]);

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  const yBg = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`)
      .then(res => {
        if (res.data) {
          const allItems = [];
          res.data.forEach(svc => {
            if (svc.subServices && svc.subServices.length > 0) {
              svc.subServices.forEach(sub => {
                allItems.push({
                  ...sub,
                  parentSlug: svc.slug,
                  link: `/book?service=${svc.slug}&sub=${sub.slug}`
                });
              });
            } else {
              allItems.push({
                ...svc,
                link: `/book?service=${svc.slug}`
              });
            }
          });
          setSubServices(allItems);
        }
      })
      .catch(console.error);
  }, []);

  const navigate = useNavigate();

  if (subServices.length === 0) return null;

  return (
    <section ref={containerRef} className="relative w-full py-28 md:py-0 h-[60vh] md:h-[75vh] min-h-[400px] md:min-h-[550px] flex items-center justify-center border-y border-black/10 bg-[#f4f4f5] text-[#0f0f12] overflow-hidden">
      {/* Background Image - Light overlay banner */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-15 pointer-events-none hidden md:block"
        style={{ backgroundImage: `url('/images/banner_bg.webp')` }}
      ></div>
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-15 pointer-events-none md:hidden"
        style={{ backgroundImage: `url('/images/mobile.jpeg')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/90"></div>

      <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h4 className="font-sans text-xs md:text-sm text-neutral-500 uppercase tracking-[0.4em] mb-4 font-bold">
            Specialized Sessions
          </h4>
          <h2 className="font-mirage font-bold text-5xl md:text-7xl text-[#0f0f12] uppercase tracking-widest mb-6">
            Book Your Slot
          </h2>
          <p className="font-sans text-neutral-600 text-sm md:text-base max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed">
            Ready to craft your cinematic story? Explore our specialized sessions and reserve your date with our expert team today.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-4xl mx-auto flex flex-col items-center"
        >
          {/* Mobile Dropdown */}
          <div className="md:hidden w-full max-w-xs relative">
            <select 
              className="w-full appearance-none bg-white border border-black/20 text-[#0f0f12] font-mirage text-sm uppercase tracking-widest px-6 py-4 rounded-xl focus:outline-none focus:border-black transition-all shadow-md"
              onChange={(e) => {
                if (e.target.value) navigate(e.target.value);
              }}
              defaultValue=""
            >
              <option value="" disabled className="text-gray-500 bg-white">Select Your Event</option>
              {subServices.map((sub, i) => (
                <option key={sub._id || i} value={sub.link} className="bg-white text-black">
                  {sub.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex flex-row flex-wrap justify-center gap-4">
            {subServices.map((sub, i) => (
              <Link 
                key={sub._id || i}
                to={sub.link}
                className="px-8 py-4 bg-black text-white font-mirage text-lg uppercase tracking-widest hover:bg-neutral-800 transition-all duration-300 shadow-md hover:shadow-xl rounded-full"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default SubServicesBanner;

