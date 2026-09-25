import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { siteConfig } from '../config/site.config';

const Footer = ({ isLandingPage = false, hideInquiries = false }) => {
  const [contact, setContact] = useState({
    email: siteConfig.contact.email,
    phone: siteConfig.contact.phone,
    footerStudioAddress: siteConfig.contact.address,
    footerSocials: siteConfig.socials
  });

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings`)
      .then(res => {
        if (res.data) {
          setContact({
            email: res.data.contactEmail || siteConfig.contact.email,
            phone: res.data.whatsappNumber || siteConfig.contact.phone,
            footerStudioAddress: res.data.footerStudioAddress || siteConfig.contact.address,
            footerSocials: (res.data.footerSocials && res.data.footerSocials.length > 0) ? res.data.footerSocials : siteConfig.socials,
            footerLocations: res.data.footerLocations || siteConfig.contact.locations
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <footer className="bg-[#030303] text-white relative overflow-hidden pt-14 pb-8 border-t border-white/10 bg-cover bg-center" style={{ backgroundImage: `url('${siteConfig.brand.logoBackgroundUrl}')` }}>
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/95 via-[#080808]/98 to-[#030303] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 flex flex-col items-center">

        {/* Brand Header Badge */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src={siteConfig.brand.logoUrl} alt={siteConfig.brand.name} className="h-20 md:h-24 w-auto object-contain mx-auto mb-4 filter drop-shadow-[0_0_25px_rgba(255,255,255,0.35)] transition-transform duration-500 hover:scale-105" />
          <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
        </div>

        {/* Footer Top Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8 text-center md:text-left border-b border-white/10 pb-8">
          
          <div className="flex flex-col items-center md:items-start bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-500 shadow-xl">
            <h3 className="font-mirage text-xs text-gray-400 uppercase tracking-[0.5em] mb-3 font-bold">Studio Address</h3>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.footerStudioAddress || siteConfig.contact.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-sans text-gray-300 tracking-widest leading-relaxed whitespace-pre-line text-center md:text-left hover:text-white transition-colors"
            >
              {contact.footerStudioAddress || siteConfig.contact.address}
            </a>
          </div>

          <div className="flex flex-col items-center bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-500 shadow-xl">
            <h3 className="font-mirage text-xs text-gray-400 uppercase tracking-[0.5em] mb-3 font-bold">Locations</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {(contact.footerLocations || siteConfig.contact.locations).map(city => (
                <Link key={city} to={`/location/${city.toLowerCase()}`} className="text-xs font-sans text-gray-300 tracking-[0.25em] uppercase hover:text-white px-3.5 py-1 bg-white/5 rounded-full border border-white/10 hover:border-white/30 transition-all">
                  {city}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-5 hover:border-white/20 transition-all duration-500 shadow-xl">
            <h3 className="font-mirage text-xs text-gray-400 uppercase tracking-[0.5em] mb-3 font-bold">Socials</h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
              {(contact.footerSocials || [
                { platform: 'Instagram', link: '#' },
                { platform: 'Facebook', link: '#' },
                { platform: 'Pinterest', link: '#' }
              ]).map((social, idx) => (
                <a key={idx} href={social.link} target="_blank" rel="noopener noreferrer" className="text-xs font-sans text-gray-300 tracking-[0.2em] uppercase hover:text-white px-3.5 py-1 bg-white/5 rounded-full border border-white/10 hover:border-white/30 transition-all">
                  {social.platform}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center pt-1">
          <p className="text-[11px] font-sans text-gray-500 uppercase tracking-[0.3em] mb-3 md:mb-0">
            &copy; {new Date().getFullYear()} {siteConfig.brand.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[11px] font-sans text-gray-500 uppercase tracking-[0.3em] hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-[11px] font-sans text-gray-500 uppercase tracking-[0.3em] hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
