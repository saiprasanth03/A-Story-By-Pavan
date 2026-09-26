import React from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import About from '../components/About';
import WhatWeDo from '../components/WhatWeDo';
import WhatWeOffer from '../components/WhatWeOffer';
import Testimonials from '../components/Testimonials';
import OfferingsText from '../components/OfferingsText';
import { siteConfig } from '../config/site.config';

const Home = () => {
  return (
    <div className="min-h-screen bg-white text-[#0f0f12]">
      <Hero />
      <About />
      {siteConfig.features.services && <WhatWeOffer />}
      <WhatWeDo />
      {siteConfig.features.testimonials && <Testimonials />}
      {siteConfig.features.services && <OfferingsText />}
    </div>
  );
};

export default Home;
