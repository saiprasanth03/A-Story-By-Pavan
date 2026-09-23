import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <ScrollToTopButton />}

    </div>
  );
};

function App() {
  const [analyticsInitialized, setAnalyticsInitialized] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceEndTime, setMaintenanceEndTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animationFinished, setAnimationFinished] = useState(() => {
    const path = window.location.pathname;
    const isKnownCoreRoute = [
      '/', '/about', '/packages', '/portfolio', '/themes', '/gallery', 
      '/book', '/contact', '/thank-you', '/studio', '/testimonials', 
      '/wedding', '/my-gallery', '/admin', '/admin/login'
    ].includes(path);
    
    const isKnownPrefixRoute = path.startsWith('/services/') || path.startsWith('/location/') || path.startsWith('/admin/');
    
    if (isKnownCoreRoute || isKnownPrefixRoute) {
      return false;
    }
    return true;
  });
  const [adminBypass, setAdminBypass] = useState(false);

  useEffect(() => {
    if (animationFinished) return;
    const timer = setTimeout(() => {
      setAnimationFinished(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [animationFinished]);

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
    <>
      {showLoader && (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center opacity-100">
          <div className="relative w-40 sm:w-64 h-20 sm:h-24">
            <img src={siteConfig.logoUrl} alt={`${siteConfig.name} Logo`} className="absolute inset-0 w-full h-full object-contain opacity-20" />
            <div 
              className="absolute top-0 left-0 h-full overflow-hidden" 
              style={{ animation: 'fillLogo 2.5s ease-in-out forwards' }}
            >
              <img src={siteConfig.logoUrl} alt={`${siteConfig.name} Logo`} className="w-40 sm:w-64 h-20 sm:h-24 object-contain max-w-none origin-left" />
            </div>
          </div>
          <style>{`
            @keyframes fillLogo {
              0% { width: 0%; }
              100% { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {!showLoader && (
      <HelmetProvider>
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
                <Route path="/portfolio" element={<Layout><ServicePortfolio /></Layout>} />
                <Route path="/services/:slug" element={<Layout><ServiceDetails /></Layout>} />
                <Route path="/themes" element={<Layout><Themes /></Layout>} />
                <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
                <Route path="/book" element={<Layout><Book /></Layout>} />
                <Route path="/contact" element={<Layout><Contact /></Layout>} />
                <Route path="/thank-you" element={<Layout><ThankYou /></Layout>} />
                <Route path="/location/:city" element={<Layout><LocationPage /></Layout>} />
                <Route path="/studio" element={<Layout><Studio /></Layout>} />
                <Route path="/testimonials" element={<Layout><TestimonialsPage /></Layout>} />
                <Route path="/reference" element={<ReferenceLandingPage />} />
                <Route path="/wedding" element={<Layout><Wedding /></Layout>} />
                <Route path="/my-gallery" element={<ClientGalleryPage />} />
                <Route path="/:slug" element={<LandingPage />} />

                {/* Catch-all for 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </Suspense>
      </Router>
    </HelmetProvider>
    )}
    </>
  );
}

export default App;
