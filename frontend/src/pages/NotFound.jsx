import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden px-6 text-[#0f0f12]">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center max-w-2xl"
      >
        <h1 className="font-mirage font-bold text-[150px] md:text-[200px] leading-none text-[#0f0f12] uppercase tracking-widest drop-shadow-sm">
          404
        </h1>
        <h2 className="font-mirage font-bold text-3xl md:text-5xl text-[#0f0f12] uppercase tracking-[0.2em] mb-6">
          Lost In The Shadows
        </h2>
        <p className="font-sans text-sm md:text-base text-neutral-600 tracking-wider leading-relaxed mb-12">
          The cinematic moment you are looking for does not exist or has been moved to a different gallery.
        </p>

        <Link 
          to="/" 
          className="inline-block px-10 py-5 bg-black text-white hover:bg-neutral-800 rounded-lg font-mirage text-sm md:text-base uppercase tracking-[0.3em] font-bold transition-all shadow-md"
        >
          Return to Studio
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
