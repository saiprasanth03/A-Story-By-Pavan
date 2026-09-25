import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/testimonials`)
      .then(res => {
        setTestimonials(res.data);
      })
      .catch(console.error);
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="relative w-full py-32 bg-[#050505] text-white border-t border-white/10 flex flex-col items-center overflow-hidden">
      <div className="text-center mb-16">
        <span className="font-oswald text-xs text-[#C9A227] uppercase tracking-[0.5em] mb-4 block">
          Client Praise
        </span>
        <h2 className="font-oswald font-bold uppercase text-white text-4xl md:text-6xl tracking-[0.25em]">
          Testimonials
        </h2>
        <div className="w-16 h-[2px] bg-[#C9A227] mx-auto mt-6 shadow-[0_0_10px_rgba(201,162,39,0.8)]"></div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-8 relative flex items-center justify-center">
        
        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          slidesPerView={1}
          spaceBetween={30}
          loop={testimonials.length > 1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          navigation={{
            prevEl: '.swiper-button-prev-testimonial',
            nextEl: '.swiper-button-next-testimonial',
          }}
          pagination={{ clickable: true, el: '.swiper-pagination-testimonial' }}
          className="w-full min-h-[260px]"
        >
          {testimonials.map((current, i) => (
            <SwiperSlide key={i} className="flex flex-col items-center justify-center text-center">
              <div className="text-3xl text-[#C9A227] opacity-60 font-serif mb-4">“</div>
              <p className="font-sans text-base md:text-lg text-gray-300 mb-8 leading-relaxed font-light max-w-2xl mx-auto">
                {current.reviewText}
              </p>
              
              <div className="flex text-[#C9A227] mb-4 text-xs gap-2 justify-center">
                {[...Array(current.rating || 5)].map((_, idx) => (
                  <span key={idx}>★</span>
                ))}
              </div>
              
              <h3 className="font-oswald text-white uppercase tracking-[0.25em] text-sm md:text-base font-bold mb-2 text-center">
                {current.authorName}
              </h3>

              {current.googleReviewUrl && (
                <a 
                  href={current.googleReviewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center gap-2 text-[#C9A227]/70 hover:text-[#C9A227] transition-colors text-[9px] uppercase tracking-[0.3em] font-sans font-medium mt-1"
                >
                  <span>Verified Google Review</span> &#8599;
                </a>
              )}
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation */}
        <button className="swiper-button-prev-testimonial absolute left-0 text-white/40 hover:text-[#C9A227] transition-colors text-4xl font-light z-10">
          &#8249;
        </button>
        
        <button className="swiper-button-next-testimonial absolute right-0 text-white/40 hover:text-[#C9A227] transition-colors text-4xl font-light z-10">
          &#8250;
        </button>

      </div>
      
      {/* Pagination Container */}
      <div className="swiper-pagination-testimonial mt-10 flex justify-center gap-2"></div>

    </section>
  );
};

export default Testimonials;
