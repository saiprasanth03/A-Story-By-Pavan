import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { siteConfig } from '../config/site.config';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Builds Google Drive thumbnail URL with customizable size
const getDriveThumbnail = (driveId, size = 'w600') =>
  `https://drive.google.com/thumbnail?id=${driveId}&sz=${size}`;

const ClientGalleryPage = () => {
  const [email, setEmail] = useState('');
  const [galleries, setGalleries] = useState([]);
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // Active Event Tab for clients with multiple shoots (e.g. 'all' or specific galleryId)
  const [activeEventTab, setActiveEventTab] = useState('all');

  // Per-gallery selection state: { [galleryId]: Set<driveId> }
  const [selections, setSelections] = useState({});
  // Per-gallery submission state
  const [submitted, setSubmitted] = useState({});
  const [submitting, setSubmitting] = useState({});

  // Lightbox Modal state: { galleryId: string, index: number } | null
  const [lightbox, setLightbox] = useState(null);

  // Touch gesture support for mobile swipe in lightbox
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Auto-login from URL query parameter (?email=...&galleryId=...) or localStorage on initial page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const galleryIdParam = params.get('galleryId');
    const savedEmail = emailParam || localStorage.getItem('clientGalleryEmail');

    if (savedEmail) {
      setEmail(savedEmail);
      verifyEmail(savedEmail, galleryIdParam);
    }

    // Clean URL params after reading them so page refresh doesn't re-lock to a single gallery
    if (emailParam || galleryIdParam) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  const verifyEmail = async (emailToVerify, targetGalleryId = null) => {
    const cleanEmail = emailToVerify.toLowerCase().trim();
    if (!cleanEmail) return;

    setVerifyError('');
    setIsVerifying(true);
    try {
      const res = await axios.post(`${API}/client-gallery/verify`, { email: cleanEmail });
      const fetchedGalleries = res.data;
      setGalleries(fetchedGalleries);
      
      // Save email in localStorage for persistent session
      localStorage.setItem('clientGalleryEmail', cleanEmail);

      // If a specific galleryId was requested in URL, activate that tab (only for the initial deep-link)
      // We do NOT read galleryId from the URL here again — it was passed as targetGalleryId argument
      if (targetGalleryId && fetchedGalleries.some(g => g._id === targetGalleryId)) {
        setActiveEventTab(targetGalleryId);
      } else {
        // Default to the first gallery tab (newest first from server)
        setActiveEventTab(fetchedGalleries[0]._id);
      }

      // Initialize selections, checking localStorage drafts first
      const initial = {};
      const sub = {};

      fetchedGalleries.forEach(g => {
        const isSub = g.status === 'Submitted';
        if (isSub) sub[g._id] = true;

        // Try restoring local draft selections if not yet submitted
        let restoredIds = [];
        if (!isSub) {
          try {
            const savedDraft = localStorage.getItem(`gallerySelections_${g._id}`);
            if (savedDraft) {
              restoredIds = JSON.parse(savedDraft);
            }
          } catch (e) {
            console.error('Failed to parse draft selections', e);
          }
        }

        // If no draft in localStorage, fallback to server selections
        if (!restoredIds || restoredIds.length === 0) {
          restoredIds = g.images.filter(i => i.isSelected).map(i => i.driveId);
        }

        initial[g._id] = new Set(restoredIds);
      });

      setSelections(initial);
      setSubmitted(sub);
      setVerified(true);
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'No galleries found for this email.');
      localStorage.removeItem('clientGalleryEmail');
      setVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    verifyEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('clientGalleryEmail');
    setVerified(false);
    setGalleries([]);
    setSelections({});
    setEmail('');
    setActiveEventTab('all');
  };

  const toggleImage = useCallback((galleryId, driveId) => {
    if (submitted[galleryId]) return; // Can't change after submission
    setSelections(prev => {
      const next = new Set(prev[galleryId] || []);
      if (next.has(driveId)) {
        next.delete(driveId);
      } else {
        next.add(driveId);
      }
      
      // Persist draft selections to localStorage immediately
      try {
        localStorage.setItem(`gallerySelections_${galleryId}`, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Failed to persist selection draft', e);
      }

      return { ...prev, [galleryId]: next };
    });
  }, [submitted]);

  const handleSubmit = async (galleryId) => {
    const selectedDriveIds = Array.from(selections[galleryId] || []);
    if (selectedDriveIds.length === 0) {
      alert('Please select at least one photo before submitting.');
      return;
    }
    const confirmSubmit = window.confirm(
      `You have selected ${selectedDriveIds.length} photos. Once submitted, selections cannot be changed. Proceed?`
    );
    if (!confirmSubmit) return;

    setSubmitting(prev => ({ ...prev, [galleryId]: true }));
    try {
      await axios.put(`${API}/client-gallery/${galleryId}/submit`, { selectedDriveIds });
      setSubmitted(prev => ({ ...prev, [galleryId]: true }));
      setGalleries(prev => prev.map(g => g._id === galleryId ? { ...g, status: 'Submitted' } : g));
      localStorage.removeItem(`gallerySelections_${galleryId}`);
      if (lightbox && lightbox.galleryId === galleryId) {
        setLightbox(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(prev => ({ ...prev, [galleryId]: false }));
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;

    const currentGallery = galleries.find(g => g._id === lightbox.galleryId);
    if (!currentGallery) return;

    const images = currentGallery.images;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightbox(null);
      } else if (e.key === 'ArrowRight') {
        setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % images.length } : null);
      } else if (e.key === 'ArrowLeft') {
        setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + images.length) % images.length } : null);
      } else if (e.key === ' ') {
        e.preventDefault();
        const currentImg = images[lightbox.index];
        if (currentImg) {
          toggleImage(lightbox.galleryId, currentImg.driveId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox, galleries, toggleImage]);

  // Preload adjacent images for faster swiping
  useEffect(() => {
    if (!lightbox) return;
    const currentGallery = galleries.find(g => g._id === lightbox.galleryId);
    if (!currentGallery || !currentGallery.images || currentGallery.images.length === 0) return;
    
    const images = currentGallery.images;
    const prevIdx = (lightbox.index - 1 + images.length) % images.length;
    const nextIdx = (lightbox.index + 1) % images.length;

    const img1 = new Image();
    img1.src = getDriveThumbnail(images[prevIdx].driveId, 'w1920');
    
    const img2 = new Image();
    img2.src = getDriveThumbnail(images[nextIdx].driveId, 'w1920');
  }, [lightbox, galleries]);

  // Touch gesture handlers for mobile swipe in lightbox
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !lightbox) return;
    const diff = touchStartX.current - touchEndX.current;
    const currentGallery = galleries.find(g => g._id === lightbox.galleryId);
    if (!currentGallery) return;

    const images = currentGallery.images;
    if (diff > 50) {
      setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % images.length } : null);
    } else if (diff < -50) {
      setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + images.length) % images.length } : null);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Active image for lightbox
  const activeGallery = lightbox ? galleries.find(g => g._id === lightbox.galleryId) : null;
  const activeImage = (activeGallery && lightbox) ? activeGallery.images[lightbox.index] : null;
  const isImageSelected = (activeGallery && activeImage)
    ? (selections[activeGallery._id] || new Set()).has(activeImage.driveId)
    : false;

  // Filter galleries by active tab (always shows one specific event)
  const displayedGalleries = galleries.filter(g => g._id === activeEventTab);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 pb-28 md:pb-16">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] md:w-[60vw] h-[80vw] md:h-[60vw] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] md:w-[50vw] h-[70vw] md:h-[50vw] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 px-3 sm:px-6 py-8 md:py-16 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-10">
          <img src={siteConfig.brand.logoUrl} alt={siteConfig.brand.name} className="h-8 md:h-10 mx-auto mb-4 md:mb-6 opacity-90" />
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-oswald font-bold uppercase tracking-widest text-white mb-2 md:mb-3">
            Client Photo Gallery
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm tracking-wider max-w-lg mx-auto px-4">
            Select your favourite images and submit them to the studio.
          </p>

          {verified && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-[11px] text-gray-300 font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                👤 {email}
              </span>
              <button
                onClick={handleLogout}
                className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-white underline underline-offset-4 transition-colors"
              >
                Change Email
              </button>
            </div>
          )}
        </div>

        {/* Email Verification Card */}
        {!verified && (
          <div className="max-w-md mx-auto px-2">
            <form onSubmit={handleVerifySubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Your Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:border-white/40 focus:outline-none transition-all mb-4"
              />
              {verifyError && (
                <p className="text-red-400 text-xs mb-4 tracking-wider leading-relaxed">{verifyError}</p>
              )}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 bg-white text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-gray-200 active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg"
              >
                {isVerifying ? 'Verifying...' : 'Access My Gallery →'}
              </button>
            </form>
          </div>
        )}

        {/* Event Navigation Tabs — shown when client has multiple galleries */}
        {verified && galleries.length > 1 && (
          <div className="flex items-center justify-start md:justify-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar px-1">
            {galleries.map(g => (
              <button
                key={g._id}
                onClick={() => setActiveEventTab(g._id)}
                className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeEventTab === g._id
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                <span>{g.eventName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                  activeEventTab === g._id ? 'bg-black/15 text-black font-bold' : 'bg-white/10 text-gray-300'
                }`}>
                  {g.images.length}
                </span>
                {submitted[g._id] && <span className="text-emerald-500 font-bold">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Galleries List */}
        {verified && displayedGalleries.map(gallery => {
          const gallerySelections = selections[gallery._id] || new Set();
          const isSubmitted = submitted[gallery._id];
          const isSubmittingThis = submitting[gallery._id];
          const selectedCount = gallerySelections.size;

          return (
            <div key={gallery._id} className="mb-12 md:mb-16">
              {/* Gallery Header Card */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 md:p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">
                      Event Gallery {galleries.length > 1 && `(${galleries.indexOf(gallery) + 1} of ${galleries.length})`}
                    </span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-oswald font-bold uppercase tracking-widest text-white">
                      {gallery.eventName}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{gallery.clientName}</p>
                  </div>

                  {/* Desktop Action Buttons */}
                  <div className="hidden md:flex items-center gap-3">
                    {isSubmitted ? (
                      <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <span>✓</span> Selections Submitted ({selectedCount} photos)
                      </span>
                    ) : (
                      <>
                        <span className="text-xs text-gray-400 tracking-wider">
                          <strong className="text-white font-semibold">{selectedCount}</strong> of {gallery.images.length} selected
                        </span>
                        <button
                          onClick={() => handleSubmit(gallery._id)}
                          disabled={isSubmittingThis || selectedCount === 0}
                          className="px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                        >
                          {isSubmittingThis ? 'Submitting...' : `Submit Selection (${selectedCount})`}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isSubmitted && (
                  <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-emerald-400 text-xs sm:text-sm tracking-wider">
                      ✓ Your selection of {selectedCount} images for <strong className="text-white">{gallery.eventName}</strong> has been submitted to the studio!
                    </p>
                  </div>
                )}
              </div>

              {/* Instructions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-gray-400 mb-3 px-1">
                <span>💡 Tap any photo to view full size. Tap circle to select.</span>
                <span className="font-mono">{gallery.images.length} Photos</span>
              </div>

              {/* Responsive Image Grid (2 cols on mobile, 3 sm, 4 md, 5 lg) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                {gallery.images.map((img, idx) => {
                  const isSelected = gallerySelections.has(img.driveId);
                  return (
                    <div
                      key={img.driveId}
                      className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-all duration-200 bg-neutral-900 select-none ${
                        isSelected
                          ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {/* Clickable Image Thumbnail to open Lightbox */}
                      <div
                        onClick={() => setLightbox({ galleryId: gallery._id, index: idx })}
                        className="w-full h-full cursor-zoom-in"
                        title="Click to view full size"
                      >
                        <img
                          src={getDriveThumbnail(img.driveId, 'w400')}
                          alt={img.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={e => {
                            const proxyUrl = `${API}/client-gallery/image/${img.driveId}`;
                            if (e.target.src !== proxyUrl) {
                              e.target.src = proxyUrl;
                            } else {
                              e.target.style.display = 'none';
                              if (e.target.parentElement) e.target.parentElement.style.background = '#18181b';
                            }
                          }}
                        />
                      </div>

                      {/* Overlay gradient */}
                      <div
                        onClick={() => setLightbox({ galleryId: gallery._id, index: idx })}
                        className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
                          isSelected ? 'bg-emerald-950/20' : 'bg-black/20 group-hover:bg-black/30'
                        }`}
                      />

                      {/* Selection Button (Top Right, touch-friendly 36px) */}
                      {!isSubmitted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleImage(gallery._id, img.driveId);
                          }}
                          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 shadow-lg active:scale-90 ${
                            isSelected
                              ? 'bg-emerald-500 text-black ring-2 ring-white/60'
                              : 'bg-black/70 text-white/70 hover:bg-black hover:text-white border border-white/30'
                          }`}
                          title={isSelected ? 'Deselect photo' : 'Select photo'}
                        >
                          {isSelected ? (
                            <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/60" />
                          )}
                        </button>
                      )}

                      {/* Submitted checkmark indicator */}
                      {isSubmitted && isSelected && (
                        <div className="absolute top-2 right-2 w-7 h-7 bg-emerald-500 text-black rounded-full flex items-center justify-center z-20 shadow-md">
                          <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      {/* Image Filename (Bottom) */}
                      <div
                        onClick={() => setLightbox({ galleryId: gallery._id, index: idx })}
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 py-1.5 cursor-pointer flex items-center justify-between"
                      >
                        <p className="text-[9px] sm:text-[10px] text-white/90 truncate font-mono">{img.name}</p>
                        <span className="text-[8px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                          🔍
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {gallery.images.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-12">No images found in this gallery folder.</p>
              )}

              {/* Mobile Floating Bottom Bar for Single Active Gallery */}
              {!isSubmitted && (activeEventTab === gallery._id || (activeEventTab === 'all' && displayedGalleries.length === 1)) && (
                <div className="md:hidden fixed bottom-4 left-3 right-3 z-40 bg-black/85 backdrop-blur-xl border border-white/20 rounded-2xl p-3 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white tracking-wider">
                      {selectedCount} Selected
                    </span>
                    <span className="text-[9px] text-gray-400 truncate max-w-[150px]">
                      {gallery.eventName}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSubmit(gallery._id)}
                    disabled={isSubmittingThis || selectedCount === 0}
                    className="px-5 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    {isSubmittingThis ? 'Submitting...' : 'Submit Choice'}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* FULL-SCREEN LIGHTBOX MODAL */}
        {lightbox && activeGallery && activeImage && (
          <div
            className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl animate-fade-in select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-black/60">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-gray-400 font-mono">
                  {lightbox.index + 1} / {activeGallery.images.length}
                </span>
                <span className="text-xs text-white/80 font-mono hidden sm:inline max-w-xs truncate">
                  {activeImage.name}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Select / Deselect Button in Lightbox */}
                {!submitted[activeGallery._id] && (
                  <button
                    onClick={() => toggleImage(activeGallery._id, activeImage.driveId)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
                      isImageSelected
                        ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    {isImageSelected ? (
                      <>
                        <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Selected</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 rounded-full border border-white/60" />
                        <span>Select</span>
                      </>
                    )}
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setLightbox(null)}
                  className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all text-xl"
                  title="Close (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Main Image Viewer Area */}
            <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-hidden">
              {/* Previous Image Button (Desktop) */}
              <button
                onClick={() => setLightbox(prev => ({
                  ...prev,
                  index: (prev.index - 1 + activeGallery.images.length) % activeGallery.images.length
                }))}
                className="hidden sm:flex absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/20 items-center justify-center transition-all shadow-xl"
                title="Previous Photo (Left Arrow)"
              >
                ◀
              </button>

              {/* Full-res Photo */}
              <div className="max-w-full max-h-[75vh] sm:max-h-[82vh] flex items-center justify-center">
                <img
                  src={getDriveThumbnail(activeImage.driveId, 'w1920')}
                  alt={activeImage.name}
                  className="max-w-full max-h-[75vh] sm:max-h-[82vh] object-contain rounded-lg shadow-2xl transition-all duration-150"
                  onError={e => {
                    const proxyUrl = `${API}/client-gallery/image/${activeImage.driveId}`;
                    if (e.target.src !== proxyUrl) {
                      e.target.src = proxyUrl;
                    }
                  }}
                />
              </div>

              {/* Next Image Button (Desktop) */}
              <button
                onClick={() => setLightbox(prev => ({
                  ...prev,
                  index: (prev.index + 1) % activeGallery.images.length
                }))}
                className="hidden sm:flex absolute right-3 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/20 items-center justify-center transition-all shadow-xl"
                title="Next Photo (Right Arrow)"
              >
                ▶
              </button>
            </div>

            {/* Mobile Bottom Navigation Bar in Lightbox */}
            <div className="sm:hidden px-4 py-3 border-t border-white/10 bg-black/80 flex items-center justify-between">
              <button
                onClick={() => setLightbox(prev => ({
                  ...prev,
                  index: (prev.index - 1 + activeGallery.images.length) % activeGallery.images.length
                }))}
                className="px-4 py-2 bg-white/10 rounded-xl text-xs uppercase font-bold text-white active:bg-white/20"
              >
                ◀ Prev
              </button>

              <span className="text-[10px] text-gray-400 font-mono truncate max-w-[140px]">
                {activeImage.name}
              </span>

              <button
                onClick={() => setLightbox(prev => ({
                  ...prev,
                  index: (prev.index + 1) % activeGallery.images.length
                }))}
                className="px-4 py-2 bg-white/10 rounded-xl text-xs uppercase font-bold text-white active:bg-white/20"
              >
                Next ▶
              </button>
            </div>

            {/* Desktop Bottom Info Bar */}
            <div className="hidden sm:flex px-6 py-3 border-t border-white/10 bg-black/60 items-center justify-between text-[11px] text-gray-400">
              <span className="font-mono text-white/70 truncate">{activeImage.name}</span>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-gray-500">
                <span>Navigate: <strong>← →</strong></span>
                <span>Select: <strong>Space</strong></span>
                <span>Close: <strong>Esc</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 md:mt-16 text-gray-600 text-[10px] uppercase tracking-widest">
          © {new Date().getFullYear()} {siteConfig.brand.name} · All Rights Reserved
        </div>
      </div>
    </div>
  );
};

export default ClientGalleryPage;
