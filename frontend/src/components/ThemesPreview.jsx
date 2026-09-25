import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ThemesPreview = () => {
  const [themes, setThemes] = useState([]);
  const [themeCategories, setThemeCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const scrollContainerRef = React.useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <section id="themes" className="bg-[#050505] text-white w-full overflow-hidden py-24 relative selection:bg-white/20 border-t border-white/5">
      <div className="max-w-[90rem] mx-auto px-6 lg:px-12 text-center relative z-10">
        <div className="flex flex-col justify-center items-center mb-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-mirage text-xs text-gray-500 uppercase tracking-[0.5em] mb-4">Curated Setups</h2>
            <h3 className="font-mirage font-bold text-5xl md:text-7xl text-white uppercase tracking-widest leading-none">
              Theme Catalog
            </h3>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key="categories"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="relative flex items-center">
                {themeCategories.length > 1 && (
                  <button 
                    onClick={scrollLeft}
                    className="absolute left-0 z-20 w-10 h-10 md:w-12 md:h-12 bg-black/50 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors -ml-4 md:-ml-6"
                  >
                    &#8249;
                  </button>
                )}
                
                <div 
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 hide-scrollbar scroll-smooth w-full px-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {themeCategories.map((cat, idx) => {
                    const count = themes.filter(t => t.category === cat.name).length;

                    return (
                      <div 
                        key={idx}
                        onClick={() => window.location.href = `/themes?category=${encodeURIComponent(cat.name)}`}
                        className="relative group h-[400px] cursor-pointer overflow-hidden border border-white/10 rounded-2xl shadow-2xl bg-black shrink-0 snap-center min-w-[85vw] md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)]"
                      >
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110 opacity-60 group-hover:opacity-40"
                          style={{ backgroundImage: `url(${cat.coverImage})` }}
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
                </div>

                {themeCategories.length > 1 && (
                  <button 
                    onClick={scrollRight}
                    className="absolute right-0 z-20 w-10 h-10 md:w-12 md:h-12 bg-black/50 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors -mr-4 md:-mr-6"
                  >
                    &#8250;
                  </button>
                )}
              </div>
              
              {themeCategories.length === 0 && (
                <div className="py-20 text-gray-500 uppercase tracking-widest w-full">
                  No categories found. Add Theme Categories in the Admin Dashboard.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};

export default ThemesPreview;
