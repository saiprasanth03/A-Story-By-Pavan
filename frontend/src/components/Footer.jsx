import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { siteConfig } from '../config/site.config';

const Footer = ({ isLandingPage = false, hideInquiries = false }) => {
  const [contact, setContact] = useState({
    email: siteConfig.contact.email,
    phone: siteConfig.contact.formattedPhone,
    footerStudioAddress: siteConfig.contact.address,
    footerSocials: siteConfig.socials
  });

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings`)
      .then(res => {
        if (res.data) {
          setContact({
            email: res.data.contactEmail || siteConfig.contact.email,
            phone: res.data.whatsappNumber || siteConfig.contact.formattedPhone,
            footerStudioAddress: res.data.footerStudioAddress || siteConfig.contact.address,
            footerSocials: (res.data.footerSocials && res.data.footerSocials.length > 0) ? res.data.footerSocials : siteConfig.socials,
            footerLocations: res.data.footerLocations || siteConfig.contact.locations
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <footer className="bg-[#050505] text-white relative overflow-hidden pt-32 pb-12 border-t border-white/5 bg-cover bg-center" style={{ backgroundImage: `url('${siteConfig.logoBackgroundUrl}')` }}>
      
      <div className="absolute inset-0 bg-black/80 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 flex flex-col items-center">

        {/* Footer Top Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 w-full mb-24 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-oswald text-2xl uppercase tracking-[0.3em] mb-6">Studio</h3>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.footerStudioAddress || "123 Cinematic Way\nAesthetic District\nNew York, NY 10012")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-sans text-gray-400 tracking-widest leading-relaxed whitespace-pre-line text-center md:text-left hover:text-white transition-colors"
            >
              {contact.footerStudioAddress || "123 Cinematic Way\nAesthetic District\nNew York, NY 10012"}
            </a>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="font-oswald text-2xl uppercase tracking-[0.3em] mb-6">Locations</h3>
            <div className="flex flex-col gap-3">
              {(contact.footerLocations || ['Srikakulam', 'Vizag', 'Vizianagaram']).map(city => (
                <Link key={city} to={`/location/${city.toLowerCase()}`} className="text-xs font-sans text-gray-400 tracking-[0.2em] uppercase hover:text-white transition-colors">
                  {city}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <h3 className="font-oswald text-2xl uppercase tracking-[0.3em] mb-6">Socials</h3>
            <div className="flex flex-col gap-3">
              {(contact.footerSocials || [
                { platform: 'Instagram', link: '#' },
                { platform: 'Facebook', link: '#' },
                { platform: 'Pinterest', link: '#' }
              ]).map((social, idx) => (
                <a key={idx} href={social.link} target="_blank" rel="noopener noreferrer" className="text-xs font-sans text-gray-400 tracking-[0.2em] uppercase hover:text-white transition-colors">
                  {social.platform}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
          <p className="text-[10px] font-sans text-gray-600 uppercase tracking-[0.3em] mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-sans text-gray-600 uppercase tracking-[0.3em] hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] font-sans text-gray-600 uppercase tracking-[0.3em] hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
