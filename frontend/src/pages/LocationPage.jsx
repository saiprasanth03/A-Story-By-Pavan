import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { siteConfig } from '../config/site.config';

const LocationPage = () => {
  const { city } = useParams();
  
  // Capitalize city name
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);

  return (
    <>
      <Helmet>
        <title>Photography Studio in {cityName} | {siteConfig.brand.name}</title>
        <meta name="description" content={`Top-rated newborn photography, maternity shoot, and baby studio in ${cityName}. We offer premium themes and packages for your baby milestones.`} />
        <meta name="keywords" content={`Baby shoot in ${cityName}, Maternity shoot studio in ${cityName}, Newborn photography ${cityName}, Birthday shoot studio ${cityName}, Best baby studio in ${cityName}`} />
      </Helmet>
      <div className="pt-32 min-h-screen bg-white pb-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-mirage text-[#0f0f12] mb-6 uppercase tracking-wider">
          Premium Photography Studio in <span className="text-neutral-500 italic">{cityName}</span>
        </h1>
        <div className="w-20 h-[2px] bg-black mx-auto mb-8"></div>
        
        <p className="text-neutral-800 font-sans font-normal leading-relaxed mb-8 text-base">
          Welcome to {siteConfig.brand.name}, serving {cityName} with the most luxurious and cinematic photography experience.
          Whether you are looking for a Maternity Shoot, Newborn Photography, or a Baby Milestone package in {cityName}, 
          our fully air-conditioned, baby-friendly premium studio is the perfect destination for you and your family.
        </p>

        <p className="text-neutral-600 font-sans font-light leading-relaxed mb-12 text-sm">
          We pride ourselves on offering 30+ creative baby themes, 10+ maternity themes, and hospital-grade hygiene, 
          making us the top choice for families across {cityName} and surrounding areas.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link to="/book" className="px-8 py-4 bg-black text-white font-sans uppercase tracking-widest text-xs font-semibold hover:bg-neutral-800 transition-colors rounded-full shadow-md">
            Book Your Session Now
          </Link>
          <Link to="/packages" className="px-8 py-4 border border-black/20 text-[#0f0f12] font-sans uppercase tracking-widest text-xs font-semibold hover:bg-black hover:text-white transition-colors rounded-full">
            Explore Packages
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default LocationPage;
