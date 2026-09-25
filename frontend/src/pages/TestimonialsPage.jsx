import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/testimonials`)
      .then(res => {
        setTestimonials(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      
      <main className="flex-1 pt-32 pb-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="font-mirage uppercase tracking-widest text-white text-5xl md:text-6xl mb-6">Client Stories</h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed font-light">
              Don't just take our word for it. Hear from the beautiful couples who trusted us to immortalize their most cherished moments.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((t, index) => (
                <motion.div 
                  key={t._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-[#111] p-8 md:p-10 border border-white/20 relative overflow-hidden flex flex-col h-full"
                >
                  {/* Faded Quote Icon in background */}
                  <div className="absolute top-4 right-4 text-white opacity-5 text-9xl font-sans leading-none select-none pointer-events-none">
                    "
                  </div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex text-white text-sm">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                    {t.googleReviewUrl && (
                      <a 
                        href={t.googleReviewUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 text-white/60 text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                      >
                        <span className="font-bold">G</span> VERIFIED REVIEW &#8599;
                      </a>
                    )}
                  </div>

                  <p className="text-gray-300 font-sans mb-8 leading-relaxed text-sm md:text-base relative z-10 flex-1">
                    "{t.reviewText}"
                  </p>

                  <div className="border-t border-white/10 pt-6 flex justify-between items-center relative z-10">
                    <h4 className="text-white font-mirage tracking-widest uppercase text-lg">{t.authorName}</h4>
                    {t.reviewDate && (
                      <span className="text-gray-600 text-xs font-sans">
                        {new Date(t.reviewDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default TestimonialsPage;
