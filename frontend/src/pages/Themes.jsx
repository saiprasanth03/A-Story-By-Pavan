import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

import { useSearchParams } from 'react-router-dom';

const Themes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [themes, setThemes] = useState([]);
  const [themeCategories, setThemeCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || null);
  const [lightboxTheme, setLightboxTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to optimize Cloudinary URLs with high quality
  const optimizeCloudinaryUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1200,c_limit/');
  };

  // Sync selected category when URL changes
  useEffect(() => {
    setSelectedCategory(categoryParam || null);
  }, [categoryParam]);

  const handleSelectCategory = (cat) => {
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    // Fetch both themes and theme categories
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/themes`).catch(() => ({ data: [] })),
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/theme-categories`).catch(() => ({ data: [] }))
    ]).then(([themesRes, categoriesRes]) => {
      setThemes(themesRes.data);
      setThemeCategories(categoriesRes.data);
      setIsLoading(false);
    });
  }, []);

  // Filter themes by selected category
  const filteredThemes = themes.filter(t => t.category === selectedCategory);

  const currentIndex = lightboxTheme ? filteredThemes.findIndex(t => t._id === lightboxTheme._id) : -1;

  const goToPrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setLightboxTheme(filteredThemes[currentIndex - 1]);
    }
  };

  const goToNext = (e) => {
    e?.stopPropagation();
    if (currentIndex >= 0 && currentIndex < filteredThemes.length - 1) {
      setLightboxTheme(filteredThemes[currentIndex + 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxTheme) return;
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') setLightboxTheme(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxTheme, currentIndex, filteredThemes]);

  return (
    <div className="bg-[#050505] min-h-screen text-white pt-32 pb-24 relative selection:bg-white/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h2 className="font-mirage text-xs text-gray-500 uppercase tracking-[0.5em] mb-4">Curated Setups</h2>
          <h3 className="font-mirage font-bold text-5xl md:text-7xl text-white uppercase tracking-widest leading-none">
            {selectedCategory ? selectedCategory : 'Theme Catalog'}
          </h3>
          <div className="w-12 h-[1px] bg-white mx-auto mt-8"></div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!selectedCategory ? (
              /* --- CATEGORY VIEW --- */
              <motion.div 
                key="categories"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
              >
                {themeCategories.map((cat, idx) => {
                  const count = themes.filter(t => t.category === cat.name).length;

                  return (
                    <div 
                      key={idx}
                      onClick={() => handleSelectCategory(cat.name)}
                      className="relative group h-80 cursor-pointer overflow-hidden border border-white/10 rounded-2xl shadow-2xl bg-black"
                    >
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110 opacity-60 group-hover:opacity-40"
                        style={{ backgroundImage: `url(${optimizeCloudinaryUrl(cat.coverImage)})` }}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-8 text-center">
                        <h4 className="font-mirage text-3xl text-white uppercase tracking-[0.2em] group-hover:tracking-[0.3em] transition-all duration-700 drop-shadow-2xl">
                          {cat.name}
                        </h4>
                        <span className="mt-4 text-[10px] font-sans text-gray-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          {count} {count === 1 ? 'Theme' : 'Themes'} Available
                        </span>
                      </div>
                    </div>
                  );
                })}
                {themeCategories.length === 0 && (
                  <div className="col-span-full py-20 text-gray-500 uppercase tracking-widest">
                    No categories found. Add Theme Categories in the Admin Dashboard.
                  </div>
                )}
              </motion.div>
            ) : (
              /* --- THEMES GRID VIEW --- */
              <motion.div 
                key="themes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-left w-full mb-12">
                  <button 
                    onClick={() => handleSelectCategory(null)}
                    className="font-sans text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
                  >
                    ← Back to Categories
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredThemes.map((theme, index) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      key={theme._id || index}
                      onClick={() => setLightboxTheme(theme)}
                      className="relative group h-[500px] overflow-hidden cursor-pointer rounded-2xl border border-white/5 bg-black"
                    >
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-105"
                        style={{ backgroundImage: `url(${optimizeCloudinaryUrl(theme.image)})` }}
                      ></div>
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-700"></div>
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-8 pointer-events-none bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                        <h3 className="font-mirage text-3xl text-white uppercase tracking-widest leading-none mb-4 group-hover:text-gray-200 transition-colors">{theme.name}</h3>
                        <div className="h-[1px] w-12 bg-white/30 mb-4 group-hover:w-full transition-all duration-700 ease-in-out"></div>
                        <div className="flex justify-between items-center text-[10px] font-sans text-gray-400 tracking-widest uppercase opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                          <span>{theme.age}</span>
                          <span>{theme.costume}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredThemes.length === 0 && (
                    <div className="col-span-full py-32 text-gray-500 uppercase tracking-widest">
                      No themes found for this category.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* --- LIGHTBOX MODAL --- */}
      <AnimatePresence>
        {lightboxTheme && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
            onClick={() => setLightboxTheme(null)}
          >
            <button 
              className="absolute top-6 right-8 text-white/50 hover:text-white text-5xl font-light transition-colors z-[110]"
              onClick={() => setLightboxTheme(null)}
            >
              &times;
            </button>

            {/* Prev Button */}
            {currentIndex > 0 && (
              <button 
                onClick={goToPrev}
                className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-5xl md:text-7xl font-light transition-colors z-[110] p-4 hover:scale-110"
              >
                &#10094;
              </button>
            )}

            {/* Next Button */}
            {currentIndex < filteredThemes.length - 1 && (
              <button 
                onClick={goToNext}
                className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-5xl md:text-7xl font-light transition-colors z-[110] p-4 hover:scale-110"
              >
                &#10095;
              </button>
            )}
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-7xl w-full h-[85vh] flex justify-center items-center rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={optimizeCloudinaryUrl(lightboxTheme.image)} 
                alt={lightboxTheme.name} 
                className="w-full h-full object-contain drop-shadow-2xl"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-center items-end pointer-events-none">
                <h3 className="font-mirage text-4xl md:text-5xl text-white uppercase tracking-[0.2em] leading-none drop-shadow-lg text-center pb-4">
                  {lightboxTheme.name}
                </h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Themes;
