import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { siteConfig } from '../config/site.config';

const Maintenance = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden px-6">
      {/* Subtle Studio Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-10 pointer-events-none"
        style={{ backgroundImage: `url('${siteConfig.brand.logoBackgroundUrl}')` }}  
      ></div>
      
      {/* Heavy gradient to keep it dark and moody */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-[#050505] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center max-w-3xl"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto w-16 h-16 mb-10 opacity-70"
        >
          {/* Elegant geometric logo representation */}
          <div className="w-full h-full border border-white/20 rotate-45 flex items-center justify-center">
            <div className="w-8 h-8 border border-white/40"></div>
          </div>
        </motion.div>

        <h4 className="font-sans text-xs text-white/40 uppercase tracking-[0.5em] mb-4">
          {siteConfig.brand.name}
        </h4>
        <h2 className="font-oswald font-light text-5xl md:text-7xl text-white uppercase tracking-[0.1em] mb-8 leading-tight">
          System Upgrade<br/><span className="text-white/50">In Progress</span>
        </h2>
        <p className="font-sans text-sm md:text-base text-gray-400 tracking-wider leading-relaxed mb-12 max-w-xl mx-auto">
          We are currently performing scheduled maintenance to enhance your cinematic journey. The studio will be back online shortly. Thank you for your patience.
        </p>

        {/* Countdown Timer */}
        {timeLeft && (
          <div className="mt-16 border-t border-white/10 pt-16">
            <h5 className="font-sans text-[10px] text-white/30 uppercase tracking-widest mb-8">Expected Return</h5>
            <div className="flex justify-center gap-6 md:gap-12">
              <div className="flex flex-col items-center">
                <span className="font-oswald text-4xl md:text-5xl text-white">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="font-sans text-[10px] text-white/40 uppercase tracking-widest mt-2">Days</span>
              </div>
              <span className="font-oswald text-4xl md:text-5xl text-white/20">:</span>
              <div className="flex flex-col items-center">
                <span className="font-oswald text-4xl md:text-5xl text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="font-sans text-[10px] text-white/40 uppercase tracking-widest mt-2">Hours</span>
              </div>
              <span className="font-oswald text-4xl md:text-5xl text-white/20">:</span>
              <div className="flex flex-col items-center">
                <span className="font-oswald text-4xl md:text-5xl text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="font-sans text-[10px] text-white/40 uppercase tracking-widest mt-2">Mins</span>
              </div>
              <span className="font-oswald text-4xl md:text-5xl text-white/20 hidden md:block">:</span>
              <div className="flex flex-col items-center hidden md:flex">
                <span className="font-oswald text-4xl md:text-5xl text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="font-sans text-[10px] text-white/40 uppercase tracking-widest mt-2">Secs</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Decorative lines */}
      <div className="absolute top-0 left-10 w-[1px] h-32 bg-gradient-to-b from-white/10 to-transparent"></div>
      <div className="absolute bottom-0 right-10 w-[1px] h-32 bg-gradient-to-t from-white/10 to-transparent"></div>
    </div>
  );
};

export default Maintenance;
