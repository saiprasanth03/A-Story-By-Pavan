import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppButton from './components/WhatsAppButton';
import Footer from './components/Footer';
import NoInternetOverlay from './components/NoInternetOverlay';
import ScrollToTopButton from './components/ScrollToTopButton';

import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import { siteConfig } from './config/site.config';

// Lazy load pages for code splitting and faster load times
const Packages = lazy(() => import('./pages/Packages'));
const Book = lazy(() => import('./pages/Book'));
const Gallery = lazy(() => import('./pages/Gallery'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const LocationPage = lazy(() => import('./pages/LocationPage'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Themes = lazy(() => import('./pages/Themes'));
const Contact = lazy(() => import('./pages/Contact'));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage'));
const ServicePortfolio = lazy(() => import('./pages/ServicePortfolio'));
const ServiceDetails = lazy(() => import('./pages/ServiceDetails'));
const Studio = lazy(() => import('./pages/Studio'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const ReferenceLandingPage = lazy(() => import('./pages/ReferenceLandingPage'));
const Wedding = lazy(() => import('./pages/Wedding'));
const ClientGalleryPage = lazy(() => import('./pages/ClientGalleryPage'));
const GetQuote = lazy(() => import('./pages/GetQuote'));


// Create a layout component to conditionally hide header/footer
const Layout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Scroll to top on route change & track page view
  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', { page_path: location.pathname });
      }
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
      }
    } catch (e) {
      console.warn('Analytics tracking error:', e);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col">
      {!isAdmin && <Navbar />}
      
      <main className="flex-grow">
        {children}
      </main>
      
      {!isAdmin && <Footer />}
      {!isAdmin && siteConfig.features.whatsapp && <WhatsAppButton />}
      {!isAdmin && <ScrollToTopButton />}

    </div>
  );
};

const LuxuryLoader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrameId;
    const startTime = performance.now();
    const duration = 1200; // 1.2s smooth duration

    const updateProgress = (currentTime) => {
      const elapsed = currentTime - startTime;
      const linear = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - linear, 3);
      const currentPct = Math.round(eased * 100);
      
      setProgress(currentPct);

      if (linear < 1) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          onComplete();
        }, 150);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  return (
    <motion.div 
      key="luxury-loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center pointer-events-none select-none"
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Circular Ring Container surrounding the logo */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
          {/* Circular Ambient Glow behind the ring */}
          <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)] pointer-events-none"></div>

          {/* SVG Ring Spinner */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Background Ring Track */}
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="2.5"
            />
            {/* Animated Glowing White Progress Ring */}
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={552.92}
              strokeDashoffset={552.92 - (552.92 * progress) / 100}
              className="transition-[stroke-dashoffset] duration-75 ease-out"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' }}
            />
          </svg>

          {/* Logo inside the Circle */}
          <div className="w-40 sm:w-52 h-28 sm:h-36 p-1 flex items-center justify-center">
            <img 
              src={siteConfig.brand.logoUrl} 
              alt={`${siteConfig.brand.name} Logo`} 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>

        {/* Percentage Text Below Ring */}
        <div className="font-mirage text-lg sm:text-2xl text-white tracking-[0.3em] font-light mt-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
          {progress}%
        </div>
      </div>
    </motion.div>
  );
};

function App() {
  const [analyticsInitialized, setAnalyticsInitialized] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceEndTime, setMaintenanceEndTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);

  useEffect(() => {
    // Check for admin bypass in localStorage
    if (localStorage.getItem('adminBypass') === 'true') {
      setAdminBypass(true);
    }

    const initAnalytics = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings`);
        const settings = res.data;
        if (settings) {
          if (settings.googleAnalyticsId && typeof settings.googleAnalyticsId === 'string' && settings.googleAnalyticsId.trim() !== '' && !settings.googleAnalyticsId.includes('XXXX')) {
            try {
              const gaScript = document.createElement('script');
              gaScript.async = true;
              gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(settings.googleAnalyticsId)}`;
              document.head.appendChild(gaScript);

              const gaInit = document.createElement('script');
              gaInit.innerHTML = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', ${JSON.stringify(settings.googleAnalyticsId)});
              `;
              document.head.appendChild(gaInit);
            } catch (e) {
              console.warn('GA injection error:', e);
            }
          }
          if (settings.metaPixelId && typeof settings.metaPixelId === 'string' && settings.metaPixelId.trim() !== '' && settings.metaPixelId !== 'null' && !settings.metaPixelId.includes('XXXX')) {
            try {
              const pixelScript = document.createElement('script');
              pixelScript.innerHTML = `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', ${JSON.stringify(settings.metaPixelId)});
                fbq('track', 'PageView');
              `;
              document.head.appendChild(pixelScript);

              const pixelNoscript = document.createElement('noscript');
              pixelNoscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${encodeURIComponent(settings.metaPixelId)}&ev=PageView&noscript=1" />`;
              document.head.appendChild(pixelNoscript);
            } catch (e) {
              console.warn('Meta Pixel injection error:', e);
            }
          }
            if (settings.maintenanceMode) {
              setMaintenanceMode(true);
              setMaintenanceEndTime(settings.maintenanceEndTime);
            }
            if (settings.portfolioReferrers && settings.portfolioReferrers.length > 0) {
              const referrer = document.referrer.toLowerCase();
              const isPortfolioMode = settings.portfolioReferrers.some(ref => referrer.includes(ref.toLowerCase()));
              if (isPortfolioMode || window.location.search.includes('source=portfolio')) {
                sessionStorage.setItem('portfolioMode', 'true');
                
                if (settings.displays && settings.displays.length > 0) {
                  const matchedDisplay = settings.displays.find(d => referrer.includes(d.websiteLink.toLowerCase()));
                  if (matchedDisplay) {
                    sessionStorage.setItem('portfolioDescription', matchedDisplay.description);
                  }
                }
              }
            }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
        setAnalyticsInitialized(true);
      }
    };

    initAnalytics();
  }, []);

  const showLoader = !animationFinished;

  return (
    <HelmetProvider>
      <AnimatePresence>
        {showLoader && (
          <LuxuryLoader onComplete={() => setAnimationFinished(true)} />
        )}
      </AnimatePresence>

      <Router>
        <NoInternetOverlay />
        
        {adminBypass && maintenanceMode && (
          <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-xs text-center py-1 z-[9999] uppercase tracking-widest font-bold">
            Maintenance Mode Active - Admin Bypass Enabled
          </div>
        )}

        <Suspense fallback={null}>
          <Routes>
            {/* Admin routes bypass maintenance mode */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />

            {/* If maintenance mode is active, intercept all other routes */}
            {maintenanceMode && !adminBypass ? (
              <Route path="*" element={<Maintenance endTime={maintenanceEndTime} />} />
            ) : (
              <>
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/about" element={<Layout><AboutUs /></Layout>} />
                <Route path="/packages" element={<Layout><Packages /></Layout>} />
                {siteConfig.features.services && <Route path="/portfolio" element={<Layout><ServicePortfolio /></Layout>} />}
                {siteConfig.features.services && <Route path="/services/:slug" element={<Layout><ServiceDetails /></Layout>} />}
                {siteConfig.features.themes && <Route path="/themes" element={<Layout><Themes /></Layout>} />}
                {siteConfig.features.gallery && <Route path="/gallery" element={<Layout><Gallery /></Layout>} />}
                {siteConfig.features.booking && <Route path="/book" element={<Layout><Book /></Layout>} />}
                {siteConfig.features.contact && <Route path="/contact" element={<Layout><Contact /></Layout>} />}
                <Route path="/thank-you" element={<Layout><ThankYou /></Layout>} />
                <Route path="/location/:city" element={<Layout><LocationPage /></Layout>} />
                {siteConfig.features.studio && <Route path="/studio" element={<Layout><Studio /></Layout>} />}
                {siteConfig.features.testimonials && <Route path="/testimonials" element={<Layout><TestimonialsPage /></Layout>} />}
                <Route path="/reference" element={<ReferenceLandingPage />} />
                <Route path="/wedding" element={<Layout><Wedding /></Layout>} />
                {siteConfig.features.clientGallery && <Route path="/my-gallery" element={<ClientGalleryPage />} />}
                {siteConfig.features.getQuote && <Route path="/get-quote" element={<Layout><GetQuote /></Layout>} />}
                <Route path="/:slug" element={<LandingPage />} />

                {/* Catch-all for 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </Suspense>
      </Router>
    </HelmetProvider>
  );
}

export default App;
