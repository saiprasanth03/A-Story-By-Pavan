import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden px-6">
      {/* Cinematic Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-30 pointer-events-none"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534067783941-51c5c501c56b?q=80&w=1920&auto=format&fit=crop')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center max-w-2xl"
      >
        <h1 className="font-mirage font-bold text-[150px] md:text-[200px] leading-none text-transparent text-stroke-white uppercase tracking-widest drop-shadow-2xl">
          404
        </h1>
        <h2 className="font-mirage font-bold text-3xl md:text-5xl text-white uppercase tracking-[0.2em] mb-6">
          Lost In The Shadows
        </h2>
        <p className="font-sans text-sm md:text-base text-gray-400 tracking-wider leading-relaxed mb-12">
          The cinematic moment you are looking for does not exist or has been moved to a different gallery.
        </p>

        <Link 
          to="/" 
          className="inline-block relative group px-10 py-5 bg-transparent overflow-hidden"
        >
          <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
          <div className="absolute inset-0 border border-white/30 group-hover:border-transparent transition-colors duration-500"></div>
          <span className="relative z-10 font-mirage text-sm md:text-base text-white group-hover:text-black uppercase tracking-[0.3em] font-bold transition-colors duration-500">
            Return to Studio
          </span>
        </Link>
      </motion.div>

      {/* Decorative grain/vignette overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-20" style={{ backgroundImage: `url('/images/noise.png')` }}></div>
    </div>
  );
};

export default NotFound;
