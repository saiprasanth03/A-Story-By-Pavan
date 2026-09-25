import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const ThankYou = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      if (typeof window.fbq === 'function') {
        const searchParams = new URLSearchParams(window.location.search);
        const pageType = searchParams.get('type') || 'contact';
        if (pageType === 'booking') {
          window.fbq('track', 'Schedule');
          window.fbq('track', 'Lead');
        } else if (pageType === 'contact') {
          window.fbq('track', 'Contact');
        } else {
          window.fbq('track', 'Lead');
        }
      }
    } catch (e) {
      console.warn('Meta Pixel thank you tracking error:', e);
    }
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type') || 'contact'; // 'booking', 'contact', 'lead'

  let heading = "Thank You!";
  let message = "We have received your message and will get back to you shortly.";
  let backText = "Return Home";
  let backLink = "/";

  if (type === 'booking') {
    heading = "Request Sent";
    message = "Your session request has been successfully submitted! A confirmation email has been sent to your inbox. Our team will contact you shortly to confirm the final details.";
    backText = "Return to Portfolio";
    backLink = "/portfolio";
  } else if (type === 'lead') {
    heading = "Thank You!";
    message = "Thank you for your inquiry. Our team will review your details and reach out to you shortly to begin your journey with us.";
  }

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 flex items-center justify-center relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center relative z-10 px-6">
        <div className="w-24 h-24 bg-gradient-to-tr from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_40px_rgba(255,255,255,0.4)]">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="font-mirage font-bold text-4xl sm:text-5xl text-white uppercase tracking-widest mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          {heading}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-gray-400 font-light leading-relaxed max-w-md mx-auto mb-16 tracking-wide">
          {message}
        </p>
        <Link 
          to={backLink}
          className="inline-block text-[10px] sm:text-xs font-sans text-black bg-white px-8 py-4 rounded-full uppercase tracking-[0.3em] hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] font-bold"
        >
          {backText}
        </Link>
      </motion.div>
    </div>
  );
};

export default ThankYou;
