import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NoInternetOverlay = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md px-6 text-center"
        >
          <div className="max-w-md w-full border border-white/10 bg-[#0a0a0a] p-10 rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Cinematic Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/30"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/30"></div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mb-8 flex justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
            </motion.div>

            <h2 className="font-mirage font-bold text-3xl md:text-4xl text-white uppercase tracking-widest mb-4 drop-shadow-xl">
              Connection Lost
            </h2>
            <p className="font-sans text-sm text-gray-400 tracking-wider leading-relaxed">
              It seems you've drifted into the shadows. Please check your internet connection to continue your cinematic journey.
            </p>
            
            <div className="mt-8 flex justify-center">
               <div className="w-16 h-[1px] bg-white/20"></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NoInternetOverlay;
