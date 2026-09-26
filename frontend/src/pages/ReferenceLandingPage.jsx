import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode, Navigation, EffectFade, Keyboard } from 'swiper/modules';
import 'swiper/css';
import { siteConfig } from '../config/site.config';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import '../styles/swiper-custom.css';
import Footer from '../components/Footer';
import axios from 'axios';

const ReferenceLandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', serviceId: '', subId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState([]);
  const [activePackages, setActivePackages] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`);
        setServices(res.data);
        let packages = [];
        res.data.forEach(s => {
          if (s.packages && s.packages.length > 0) packages.push(...s.packages);
          s.subServices?.forEach(sub => {
            if (sub.packages && sub.packages.length > 0) packages.push(...sub.packages);
          });
        });
        setActivePackages(packages.slice(0, 6));
      } catch (err) {
        console.error(err);
      }
    };
    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedService = services.find(s => s.slug === formData.serviceId);
      const selectedSub = selectedService?.subServices?.find(sub => sub.slug === formData.subId);
      
      const payload = { 
        ...formData, 
        interestedIn: selectedSub ? selectedSub.title : (selectedService ? selectedService.title : 'Baby Shoot'),
        landingPageSource: 'Reference Landing Page' 
      };
      
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads`, payload);
      window.location.href = '/thank-you?type=lead';
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert('Error submitting form. Please try again.');
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const heroImages = [
    '/images/about_bg.jpeg',
    '/images/experience_bg.jpeg',
    '/images/studio.jpeg'
  ];

  const portfolioImages = [
    '/images/experience_bg.jpeg',
    '/images/mobile.jpeg',
    '/images/banner_bg.webp',
    '/images/studio.jpeg'
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#0f0f12] font-lato selection:bg-neutral-200 overflow-x-hidden relative">
      
      {/* FLOATING BUTTONS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <div className="bg-white text-[#0f0f12] border border-black/15 text-[10px] font-lato font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-lg">
          Hurry, Limited Slots Available!
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0f0f12] hover:bg-neutral-800 text-white px-7 py-3.5 rounded-full font-mirage uppercase tracking-[0.2em] text-xs font-bold shadow-2xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
        >
          Book Now
        </button>
      </div>

      {/* HEADER - BLACK NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#050505]/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/images/logo.png" alt={siteConfig.brand.name} className="h-11 w-auto object-contain" />
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2.5 bg-white/10 hover:bg-white text-white hover:text-black border border-white/30 rounded-full font-lato uppercase tracking-[0.2em] text-[11px] font-bold transition-all duration-300 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          Book Now
        </button>
      </header>

      {/* 1. HERO SECTION - FULL VISIBILITY HERO IMAGES */}
      <section className="relative h-[90vh] sm:h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <Swiper
            modules={[Autoplay, EffectFade, Keyboard, Navigation]}
            navigation={true}
            effect="fade"
            keyboard={{ enabled: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            fadeEffect={{ crossFade: true }}
            className="w-full h-full [&>.swiper-button-next]:hidden md:[&>.swiper-button-next]:flex [&>.swiper-button-prev]:hidden md:[&>.swiper-button-prev]:flex"
          >
            {heroImages.map((img, i) => (
              <SwiperSlide key={i}>
                <div className="w-full h-full relative">
                  <img src={img} alt="Hero Background" className="w-full h-full object-cover opacity-100 scale-105 transform hover:scale-100 transition-transform duration-[10s] ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center pt-20">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="flex flex-col items-center">
            <h2 className="font-lato text-xs sm:text-sm uppercase tracking-[0.3em] text-gray-300 font-bold mb-2">
              {siteConfig.brand.name}
            </h2>
            <h1 className="font-mirage text-5xl sm:text-7xl lg:text-8xl uppercase tracking-tight leading-[1.05] mb-2 text-white font-bold drop-shadow-md">
              Beautiful Baby<br />Photography
            </h1>
          </motion.div>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="font-spectral text-xl md:text-2xl font-normal italic text-gray-200 max-w-2xl mt-2 mb-6">
            "Your Baby's Smile, Captured Forever as Art."
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="flex flex-col items-center w-full">
            <div className="w-full max-w-3xl border-y border-white/20 py-3.5 mb-6">
              <p className="font-lato font-light text-gray-300 uppercase tracking-widest text-xs md:text-sm leading-relaxed">
                Professional baby shoots with stunning themes and complete safety.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-14 mt-2">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="font-lato text-gray-300 uppercase tracking-widest text-xs font-bold mb-0.5">Packages Start From Just</span>
                <span className="font-mirage text-white text-3xl sm:text-4xl font-bold">₹3,999/-</span>
              </div>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-10 py-4 bg-white hover:bg-neutral-200 text-[#0f0f12] font-mirage uppercase tracking-[0.2em] transition-all duration-300 rounded-full text-xs sm:text-sm font-bold shadow-2xl transform hover:scale-105 active:scale-95"
              >
                Book Your Shoot Now
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. INTRO VIDEO */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto flex justify-center">
        <div className="w-full aspect-video bg-white p-3 md:p-4 border border-black/10 rounded-3xl overflow-hidden shadow-xl relative">
          <div className="w-full h-full rounded-2xl overflow-hidden">
            <video src="/images/intro.mp4" controls autoPlay muted loop className="w-full h-full object-cover cursor-pointer" controlsList="nodownload" />
          </div>
        </div>
      </section>

      {/* 3. WHAT WE DO BEST */}
      <section className="py-20 bg-[#fafaf9] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
            className="text-center mb-14"
          >
            <h2 className="font-mirage text-3xl sm:text-5xl uppercase tracking-widest mb-3 text-[#0f0f12] font-bold">What We Do Best</h2>
            <div className="w-20 h-1 bg-[#0f0f12] mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="group relative bg-white rounded-3xl overflow-hidden border border-black/10 shadow-md hover:shadow-2xl transition-all duration-500"
            >
              <div className="h-80 overflow-hidden relative">
                <Swiper modules={[Autoplay, Navigation]} navigation={true} autoplay={{ delay: 3000, disableOnInteraction: false }} loop={true} className="w-full h-full">
                  <SwiperSlide><img src="/images/experience_bg.jpeg" alt="Newborn" className="w-full h-full object-cover" /></SwiperSlide>
                  <SwiperSlide><img src="/images/about_bg.jpeg" alt="Newborn 2" className="w-full h-full object-cover" /></SwiperSlide>
                </Swiper>
              </div>
              <div className="p-7 bg-white">
                <span className="font-lato text-xs text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block font-bold">5-15 Days</span>
                <h3 className="font-mirage text-2xl uppercase tracking-wider text-[#0f0f12] font-bold mb-2">Newborn Shoots</h3>
                <p className="font-lato text-neutral-600 font-light text-sm leading-relaxed">Safe, sleepy, and beautiful poses.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="group relative bg-white rounded-3xl overflow-hidden border border-black/10 shadow-md hover:shadow-2xl transition-all duration-500"
            >
              <div className="h-80 overflow-hidden relative">
                <Swiper modules={[Autoplay, Navigation]} navigation={true} autoplay={{ delay: 3500, disableOnInteraction: false }} loop={true} className="w-full h-full">
                  <SwiperSlide><img src="/images/mobile.jpeg" alt="Milestone" className="w-full h-full object-cover" /></SwiperSlide>
                  <SwiperSlide><img src="/images/studio.jpeg" alt="Milestone 2" className="w-full h-full object-cover" /></SwiperSlide>
                </Swiper>
              </div>
              <div className="p-7 bg-white">
                <span className="font-lato text-xs text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block font-bold">1-12 Months</span>
                <h3 className="font-mirage text-2xl uppercase tracking-wider text-[#0f0f12] font-bold mb-2">Milestone Shoots</h3>
                <p className="font-lato text-neutral-600 font-light text-sm leading-relaxed">Capturing sitting up, crawling, and first teeth.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="group relative bg-white rounded-3xl overflow-hidden border border-black/10 shadow-md hover:shadow-2xl transition-all duration-500"
            >
              <div className="h-80 overflow-hidden relative">
                <Swiper modules={[Autoplay, Navigation]} navigation={true} autoplay={{ delay: 4000, disableOnInteraction: false }} loop={true} className="w-full h-full">
                  <SwiperSlide><img src="/images/banner_bg.webp" alt="Toddler" className="w-full h-full object-cover" /></SwiperSlide>
                  <SwiperSlide><img src="/images/experience_bg.jpeg" alt="Toddler 2" className="w-full h-full object-cover" /></SwiperSlide>
                </Swiper>
              </div>
              <div className="p-7 bg-white">
                <span className="font-lato text-xs text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block font-bold">1 Year+</span>
                <h3 className="font-mirage text-2xl uppercase tracking-wider text-[#0f0f12] font-bold mb-2">Toddler Shoots</h3>
                <p className="font-lato text-neutral-600 font-light text-sm leading-relaxed">Fun-filled first birthday and cake smash celebrations.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. OUR BEST CLICKS */}
      <section className="py-20 border-t border-black/10 overflow-hidden bg-white">
        <div className="px-6 lg:px-12 mb-10 flex flex-col items-center">
          <h2 className="font-mirage font-bold text-3xl md:text-4xl uppercase tracking-[0.2em] text-[#0f0f12]">Our Best Clicks</h2>
        </div>
        
        <div className="relative w-full px-6 lg:px-12 pb-8">
          <Swiper grabCursor={true} simulateTouch={true}
            modules={[Autoplay, FreeMode]}
            slidesPerView="auto"
            spaceBetween={16}
            freeMode={true}
            loop={true}
            autoplay={{ delay: 0, disableOnInteraction: false }}
            speed={3000}
            loopAdditionalSlides={5}
            className="mySwiper"
          >
            {[...portfolioImages, ...portfolioImages, ...portfolioImages, ...portfolioImages].map((img, i) => (
              <SwiperSlide key={i} className="!w-[280px] md:!w-[350px] h-[400px] md:h-[500px] cursor-pointer overflow-hidden rounded-2xl border border-black/10 relative transition-transform duration-500 hover:scale-[1.02] shadow-md">
                <img src={img} alt="Gallery" className="w-full h-full object-cover" />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* 5. WHY PARENTS LOVE OUR STUDIO & PURE COMFORT */}
      <section className="py-24 relative overflow-hidden bg-neutral-100/70 border-y border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="font-mirage text-3xl sm:text-4xl uppercase tracking-widest mb-10 flex items-center gap-4 text-[#0f0f12] font-bold">
                <span className="w-8 h-1 bg-[#0f0f12]"></span> Why Parents Love Our Studio
              </motion.h2>
              
              <div className="space-y-8">
                {[
                  { title: "40+ Premium Themes", description: "Amazing, hand-crafted setups for every mood." },
                  { title: "Certified Newborn Wraps", description: "Done by professionals ensuring 100% baby comfort." },
                  { title: "Cinematic Video & Editing", description: "Premium-grade videos and high-end photo retouching." }
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeInUp} className="flex gap-4 items-start">
                    <div className="mt-1 w-6 h-6 rounded-full bg-[#0f0f12] text-white flex items-center justify-center text-xs shrink-0 font-bold shadow-xs">✓</div>
                    <div>
                      <h4 className="font-mirage text-lg uppercase tracking-widest text-[#0f0f12] font-bold mb-1">{item.title}</h4>
                      <p className="font-lato text-neutral-600 font-light text-sm">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="font-mirage text-3xl sm:text-4xl uppercase tracking-widest mb-10 flex items-center gap-4 text-[#0f0f12] font-bold">
                <span className="w-8 h-1 bg-[#0f0f12]"></span> Pure Comfort for Mother & Baby
              </motion.h2>
              
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-black/15 shadow-xl relative overflow-hidden">
                <div className="space-y-8 relative z-10">
                  {[
                    { title: '100% AC Studio', desc: 'Perfectly temperature-controlled and dust-free.' },
                    { title: 'Private Nursing Room', desc: 'A dedicated, quiet space for baby feeding and makeup.' },
                    { title: 'Super Patient Team', desc: "We work completely around your baby's nap and feeding time." }
                  ].map((item, i) => (
                    <motion.div key={i} variants={fadeInUp} className="flex gap-4 items-start">
                      <div className="mt-1 w-6 h-6 rounded-full bg-[#0f0f12] text-white flex items-center justify-center text-xs shrink-0 font-bold shadow-xs">✓</div>
                      <div>
                        <h4 className="font-mirage text-lg uppercase tracking-widest text-[#0f0f12] font-bold mb-1">{item.title}</h4>
                        <p className="font-lato text-neutral-600 font-light text-sm">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 8. FINAL CTA BANNER - HIGH VISIBILITY BACKGROUND IMAGE */}
      <section className="relative py-28 text-center overflow-hidden border-t border-black/10 bg-black">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-100 scale-105"
          style={{ backgroundImage: `url('/images/studio.jpeg')` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/50 to-black/85" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl px-4 mx-auto text-center"
        >
          <h2 className="font-mirage text-4xl sm:text-6xl uppercase tracking-widest text-white font-bold mb-4 drop-shadow-md">Affordable Premium Baby Shoot</h2>
          <div className="font-spectral text-2xl sm:text-3xl italic text-gray-200 font-normal mb-6 border-y border-white/20 py-4 inline-block">
            Starts From Just ₹3,999/-
          </div>
          <p className="font-lato text-base text-gray-300 font-light mb-8 max-w-xl mx-auto">
            Access to custom themes, wraps, and professional team without breaking your budget.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-10 py-4 bg-white text-[#0f0f12] hover:bg-neutral-200 font-mirage uppercase tracking-[0.2em] transition-all rounded-full text-xs font-bold shadow-2xl transform hover:scale-105"
          >
            Claim Your Spot Now
          </button>
        </motion.div>
      </section>

      <Footer />

      {/* LEAD CAPTURE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-black/15 p-8 sm:p-12 rounded-3xl max-w-md w-full relative overflow-y-auto max-h-[90vh] shadow-2xl text-[#0f0f12]"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-lg transition-colors"
              >
                ✕
              </button>
              
              <h3 className="font-mirage text-2xl uppercase tracking-widest mb-6 text-[#0f0f12] font-bold">Book Your Shoot</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-1.5">Your Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-1.5">Email Address</label>
                  <input 
                    type="email" required
                    className="w-full bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. john@example.com"
                  />
                </div>
                <div>
                  <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-1.5">Phone Number</label>
                  <input 
                    type="tel" required
                    maxLength="10"
                    pattern="[0-9]{10}"
                    title="10 digits"
                    className="w-full bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs"
                    value={formData.phone} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setFormData({...formData, phone: val});
                    }}
                    placeholder="10 digit mobile number"
                  />
                </div>

                <div>
                  <label className="block font-lato text-xs uppercase tracking-wider text-neutral-700 font-bold mb-1.5">Service</label>
                  <select 
                    required
                    className="w-full bg-neutral-50 border border-black/15 rounded-xl px-4 py-3 text-[#0f0f12] font-lato text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all shadow-xs"
                    value={formData.serviceId} 
                    onChange={e => setFormData({...formData, serviceId: e.target.value, subId: ''})}
                  >
                    <option value="">Select Service</option>
                    {services.map(s => (
                      <option key={s._id} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full py-4 bg-[#0f0f12] hover:bg-neutral-800 text-white font-mirage uppercase tracking-[0.2em] text-xs font-bold rounded-xl transition-all shadow-lg mt-3 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Get Callback'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReferenceLandingPage;
