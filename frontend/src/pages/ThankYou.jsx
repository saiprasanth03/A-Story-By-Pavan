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
    <div className="min-h-screen bg-white pt-32 pb-20 flex items-center justify-center relative overflow-hidden">
      {/* Decorative Light Glow */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-neutral-100 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center relative z-10 px-6 max-w-lg mx-auto bg-[#fafafa] p-10 sm:p-12 rounded-3xl border border-black/10 shadow-xl">
        <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-md">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="font-mirage font-bold text-3xl sm:text-4xl text-[#0f0f12] uppercase tracking-widest mb-4">
          {heading}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-neutral-600 font-normal leading-relaxed max-w-md mx-auto mb-10 tracking-wide">
          {message}
        </p>
        <Link 
          to={backLink}
          className="inline-block text-[11px] font-sans text-white bg-black hover:bg-neutral-800 px-8 py-4 rounded-full uppercase tracking-[0.25em] transition-all duration-300 shadow-md font-semibold"
        >
          {backText}
        </Link>
      </motion.div>
    </div>
  );
};

export default ThankYou;
