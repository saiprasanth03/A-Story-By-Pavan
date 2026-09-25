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
    <footer className="bg-[#050505] text-white relative overflow-hidden pt-28 pb-12 border-t border-white/10 bg-cover bg-center" style={{ backgroundImage: `url('${siteConfig.brand.logoBackgroundUrl}')` }}>
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/90 via-[#0a0a0a]/95 to-[#050505] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 flex flex-col items-center">

        {/* Brand Header Badge */}
        <div className="text-center mb-16">
          <img src={siteConfig.brand.logoUrl} alt={siteConfig.brand.name} className="h-14 w-auto object-contain mx-auto mb-4 filter drop-shadow-[0_0_12px_rgba(201,162,39,0.3)]" />
          <div className="w-12 h-[1px] bg-[#C9A227] mx-auto opacity-70"></div>
        </div>

        {/* Footer Top Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 w-full mb-20 text-center md:text-left border-b border-white/5 pb-16">
          
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-oswald text-xs text-[#C9A227] uppercase tracking-[0.4em] mb-6">Studio Address</h3>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.footerStudioAddress || siteConfig.contact.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-sans text-gray-400 tracking-widest leading-relaxed whitespace-pre-line text-center md:text-left hover:text-white transition-colors"
            >
              {contact.footerStudioAddress || siteConfig.contact.address}
            </a>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="font-oswald text-xs text-[#C9A227] uppercase tracking-[0.4em] mb-6">Locations</h3>
            <div className="flex flex-col gap-3 items-center">
              {(contact.footerLocations || siteConfig.contact.locations).map(city => (
                <Link key={city} to={`/location/${city.toLowerCase()}`} className="text-xs font-sans text-gray-400 tracking-[0.25em] uppercase hover:text-[#C9A227] transition-colors">
                  {city}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <h3 className="font-oswald text-xs text-[#C9A227] uppercase tracking-[0.4em] mb-6">Socials</h3>
            <div className="flex flex-col gap-3 items-center md:items-end">
              {(contact.footerSocials || [
                { platform: 'Instagram', link: '#' },
                { platform: 'Facebook', link: '#' },
                { platform: 'Pinterest', link: '#' }
              ]).map((social, idx) => (
                <a key={idx} href={social.link} target="_blank" rel="noopener noreferrer" className="text-xs font-sans text-gray-400 tracking-[0.25em] uppercase hover:text-[#C9A227] transition-colors">
                  {social.platform}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center pt-2">
          <p className="text-[10px] font-sans text-gray-500 uppercase tracking-[0.3em] mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} {siteConfig.brand.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-sans text-gray-500 uppercase tracking-[0.3em] hover:text-[#C9A227] transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] font-sans text-gray-500 uppercase tracking-[0.3em] hover:text-[#C9A227] transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
