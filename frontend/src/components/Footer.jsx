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
    <footer className="bg-white text-[#0f0f12] relative overflow-hidden pt-16 pb-12 border-t border-black/10">
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 flex flex-col items-center">

        {/* Brand Header Badge */}
        <div className="text-center mb-12 flex flex-col items-center">
          <img 
            src={siteConfig.brand.logoUrl} 
            alt={siteConfig.brand.name} 
            className="h-20 md:h-24 w-auto object-contain mx-auto mb-4 transition-transform duration-500 hover:scale-105" 
            style={{ filter: 'brightness(0)' }}
          />
          <div className="w-16 h-[2px] bg-black mx-auto"></div>
        </div>

        {/* Footer Top Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10 text-center md:text-left border-b border-black/10 pb-12">
          
          {/* Card 1: Studio Address */}
          <div className="flex flex-col items-center md:items-start bg-[#fafafa] border border-black/10 rounded-2xl p-7 hover:border-black/25 transition-all duration-500 shadow-sm">
            <h3 className="font-mirage text-xs text-neutral-500 uppercase tracking-[0.4em] mb-3 font-bold">Studio Address</h3>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.footerStudioAddress || siteConfig.contact.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-sans text-[#0f0f12] tracking-widest leading-relaxed whitespace-pre-line text-center md:text-left hover:text-neutral-600 transition-colors font-medium"
            >
              {contact.footerStudioAddress || siteConfig.contact.address}
            </a>
          </div>

          {/* Card 2: Locations */}
          <div className="flex flex-col items-center bg-[#fafafa] border border-black/10 rounded-2xl p-7 hover:border-black/25 transition-all duration-500 shadow-sm">
            <h3 className="font-mirage text-xs text-neutral-500 uppercase tracking-[0.4em] mb-4 font-bold">Locations</h3>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {(contact.footerLocations || siteConfig.contact.locations).map(city => (
                <Link key={city} to={`/location/${city.toLowerCase()}`} className="text-xs font-sans text-white font-semibold tracking-[0.2em] uppercase bg-black hover:bg-neutral-800 px-4 py-2 rounded-full transition-all shadow-sm">
                  {city}
                </Link>
              ))}
            </div>
          </div>

          {/* Card 3: Socials */}
          <div className="flex flex-col items-center md:items-end bg-[#fafafa] border border-black/10 rounded-2xl p-7 hover:border-black/25 transition-all duration-500 shadow-sm">
            <h3 className="font-mirage text-xs text-neutral-500 uppercase tracking-[0.4em] mb-4 font-bold">Socials</h3>
            <div className="flex flex-wrap gap-2.5 justify-center md:justify-end">
              {(contact.footerSocials || [
                { platform: 'Instagram', link: '#' },
                { platform: 'Facebook', link: '#' },
                { platform: 'Pinterest', link: '#' }
              ]).map((social, idx) => (
                <a key={idx} href={social.link} target="_blank" rel="noopener noreferrer" className="text-xs font-sans text-white font-semibold tracking-[0.2em] uppercase bg-black hover:bg-neutral-800 px-4 py-2 rounded-full transition-all shadow-sm">
                  {social.platform}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center pt-2">
          <p className="text-[11px] font-sans text-neutral-500 uppercase tracking-[0.25em] mb-3 md:mb-0 font-medium">
            &copy; {new Date().getFullYear()} {siteConfig.brand.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[11px] font-sans text-neutral-500 uppercase tracking-[0.25em] hover:text-black transition-colors font-semibold">Privacy Policy</a>
            <a href="#" className="text-[11px] font-sans text-neutral-500 uppercase tracking-[0.25em] hover:text-black transition-colors font-semibold">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
