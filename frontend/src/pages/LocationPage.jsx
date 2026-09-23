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
      <div className="pt-32 min-h-screen bg-background pb-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-playfair text-white mb-6">
          Premium Photography Studio in <span className="text-primary italic">{cityName}</span>
        </h1>
        <div className="w-20 h-[1px] bg-primary mx-auto mb-8"></div>
        
        <p className="text-white font-sans font-light leading-relaxed mb-8">
          Welcome to {siteConfig.brand.name}, serving {cityName} with the most luxurious and cinematic photography experience.
          Whether you are looking for a Maternity Shoot, Newborn Photography, or a Baby Milestone package in {cityName}, 
          our fully air-conditioned, baby-friendly premium studio is the perfect destination for you and your family.
        </p>

        <p className="text-gray-400 font-sans font-light leading-relaxed mb-12">
          We pride ourselves on offering 30+ creative baby themes, 10+ maternity themes, and hospital-grade hygiene, 
          making us the top choice for families across {cityName} and surrounding areas.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link to="/book" className="px-8 py-4 bg-primary text-black font-sans uppercase tracking-widest text-sm font-bold hover:bg-white transition-colors">
            Book Your Session Now
          </Link>
          <Link to="/packages" className="px-8 py-4 border border-white/30 text-white font-sans uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors">
            Explore Packages
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default LocationPage;
