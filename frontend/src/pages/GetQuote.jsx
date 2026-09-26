import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Check, Plus, Minus, User, Mail, Phone, Calendar, MapPin, FileText,
  Loader2, ArrowRight, ArrowLeft, Sparkles,
} from 'lucide-react';
import {
  EVENT_TYPES,
  DURATIONS,
  COVERAGE_SERVICES,
  PREWEDDING_PACKAGES,
  POSTPROD_OPTIONS,
  ALBUM_TIERS,
  ADDON_GROUPS,
  RETAINER_TERMS,
} from '../config/quote.config';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ALL_STEP_LABELS = [
  { key: 0, label: 'EVENTS' },
  { key: 1, label: 'COVERAGE' },
  { key: 2, label: 'PRE-WEDDING', requiresPrewed: true },
  { key: 3, label: 'POST-PROD' },
  { key: 4, label: 'ALBUMS' },
  { key: 5, label: 'ADD-ONS' },
  { key: 6, label: 'CLIENT INFO' },
  { key: 7, label: 'SUMMARY' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS & IMAGE RENDERERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}/-`;

const slide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/**
 * Event icon renderer — uses PNG image from /images/quote/ if available, else falls back to emoji.
 */
const EventImageOrEmoji = ({ ev, sel }) => {
  const [imgErr, setImgErr] = useState(false);
  if (ev.image && !imgErr) {
    return (
      <img
        src={ev.image}
        alt={ev.label}
        onError={() => setImgErr(true)}
        style={{ filter: sel ? 'brightness(0) invert(1)' : 'brightness(0)' }}
        className={`w-9 h-9 sm:w-11 sm:h-11 object-contain mb-2 sm:mb-2.5 transition-all group-hover:scale-105 ${sel ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
      />
    );
  }
  return <span className="text-2xl sm:text-3xl mb-2 sm:mb-2.5 leading-none">{ev.emoji}</span>;
};

/**
 * Service icon renderer — uses PNG image from /images/quote/ if available, else falls back to Lucide Icon.
 */
const CoverageImageOrIcon = ({ svc, sel }) => {
  const [imgErr, setImgErr] = useState(false);
  if (svc.image && !imgErr) {
    return (
      <img
        src={svc.image}
        alt={svc.label}
        onError={() => setImgErr(true)}
        style={{ filter: sel ? 'brightness(0) invert(1)' : 'brightness(0)' }}
        className={`w-9 h-9 sm:w-11 sm:h-11 object-contain mb-2 sm:mb-2.5 transition-all group-hover:scale-105 ${sel ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
      />
    );
  }
  const IconComponent = svc.Icon;
  return <IconComponent size={24} className={`mb-2 sm:mb-2.5 ${sel ? 'text-white' : 'text-neutral-500'}`} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP INDICATOR (Clickable for Visited Steps)
// ─────────────────────────────────────────────────────────────────────────────

const StepIndicator = ({ current, maxReached, steps, onSelectStep }) => (
  <div
    className="flex items-center justify-between max-w-3xl mx-auto mb-8 px-4 py-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
  >
    {steps.map((item, displayIdx) => {
      const stepIndex = item.key;
      const done       = stepIndex < current;
      const active     = stepIndex === current;
      const clickable  = stepIndex <= maxReached;

      return (
        <React.Fragment key={stepIndex}>
          <div className="flex flex-col items-center shrink-0">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onSelectStep(stepIndex)}
              className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-extrabold border-2 transition-all duration-300
                ${clickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                ${done ? 'bg-black border-black text-white shadow-md' :
                  active ? 'bg-black border-black text-white shadow-xl ring-4 ring-black/20' :
                  'bg-white border-neutral-300 text-neutral-800 font-bold hover:border-black hover:text-black'}
              `}
            >
              {done ? <Check size={14} strokeWidth={3.5} /> : displayIdx + 1}
            </button>
            <span className={`text-[9px] sm:text-[10px] tracking-wider uppercase mt-2 font-sans transition-colors leading-tight text-center font-bold
              ${active ? 'text-black font-black' : done ? 'text-neutral-900 font-extrabold' : 'text-neutral-700 font-bold'}
            `}>
              {item.label}
            </span>
          </div>
          {displayIdx < steps.length - 1 && (
            <div className={`h-[2px] flex-1 mx-2 transition-colors shrink-0 ${done ? 'bg-black' : 'bg-neutral-300'}`} style={{ minWidth: 16 }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const GetQuote = () => {
  const [mainStep,       setMainStep]       = useState(0);
  const [eventStep,      setEventStep]      = useState(0); // sub-index within Coverage
  const [maxReachedStep, setMaxReachedStep] = useState(0);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [mainStep, eventStep]);

  // Wizard state
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [coverage,       setCoverage]       = useState({}); // { evId: { duration, services: [], serviceQtys: {} } }
  const [prewedPkg,      setPrewedPkg]      = useState(null);
  const [postProd,       setPostProd]        = useState('standard');
  const [albumTier,      setAlbumTier]      = useState(null);
  const [extraSheets,    setExtraSheets]    = useState(0);
  const [addOnQtys,      setAddOnQtys]      = useState({});
  const [addOnSel,       setAddOnSel]       = useState({});
  const [client,         setClient]         = useState({ name:'', email:'', phone:'', date:'', location:'', notes:'' });
  const [termsOk,        setTermsOk]        = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [error,          setError]          = useState('');
  const [hoveredSvc,     setHoveredSvc]     = useState(null);

  // Check if Pre-Wedding is selected in Step 1
  const hasPrewedding = useMemo(() => selectedEvents.includes('pre-wedding'), [selectedEvents]);

  // Compute visible steps list dynamically
  const visibleSteps = useMemo(() => {
    return ALL_STEP_LABELS.filter(s => !s.requiresPrewed || hasPrewedding);
  }, [hasPrewedding]);

  // Update maxReachedStep as user progresses
  useEffect(() => {
    setMaxReachedStep(prev => Math.max(prev, mainStep));
  }, [mainStep]);

  // Coverage Quantity Helpers
  const getServiceQty = (evId, svcId) => {
    const cfg = coverage[evId] || {};
    if (cfg.serviceQtys && cfg.serviceQtys[svcId] !== undefined) {
      return cfg.serviceQtys[svcId];
    }
    return (cfg.services || []).includes(svcId) ? 1 : 0;
  };

  const updateServiceQty = (evId, svcId, newQty) => {
    const qty = Math.max(0, newQty);
    setCoverage(prev => {
      const cur = prev[evId] || { duration: 'half-day', services: [], serviceQtys: {} };
      const curQtys = { ...(cur.serviceQtys || {}) };
      if (qty > 0) {
        curQtys[svcId] = qty;
      } else {
        delete curQtys[svcId];
      }
      const svcs = Object.keys(curQtys);
      return {
        ...prev,
        [evId]: {
          ...cur,
          services: svcs,
          serviceQtys: curQtys,
        }
      };
    });
  };

  // ── Total calculation ──────────────────────────────────────────────────────
  const total = useMemo(() => {
    let t = 0;
    selectedEvents.forEach(evId => {
      const cfg = coverage[evId] || {};
      const qtys = cfg.serviceQtys || {};
      if (Object.keys(qtys).length > 0) {
        Object.entries(qtys).forEach(([svcId, q]) => {
          const svc = COVERAGE_SERVICES.find(s => s.id === svcId);
          if (svc && q > 0) t += q * svc.price;
        });
      } else {
        (cfg.services || []).forEach(svcId => {
          const svc = COVERAGE_SERVICES.find(s => s.id === svcId);
          if (svc) t += svc.price;
        });
      }
    });
    if (hasPrewedding && prewedPkg) t += prewedPkg.price;
    if (postProd === 'documentary') t += 25000;
    if (albumTier)         t += albumTier.price + extraSheets * 500;
    ADDON_GROUPS.forEach(grp => grp.items.forEach(item => {
      if (item.type === 'qty') {
        const q = addOnQtys[item.id] || 0;
        if (q >= item.minQty) t += q * item.pricePerUnit;
      } else if (addOnSel[item.id]) {
        t += item.price;
      }
    }));
    return t;
  }, [selectedEvents, coverage, hasPrewedding, prewedPkg, postProd, albumTier, extraSheets, addOnQtys, addOnSel]);

  // ── Itemized receipt ───────────────────────────────────────────────────────
  const lineItems = useMemo(() => {
    const items = [];
    selectedEvents.forEach(evId => {
      const ev  = EVENT_TYPES.find(e => e.id === evId);
      const cfg = coverage[evId] || {};
      const dur = DURATIONS.find(d => d.id === (cfg.duration || 'half-day'));
      const qtys = cfg.serviceQtys || {};
      if (Object.keys(qtys).length > 0) {
        Object.entries(qtys).forEach(([svcId, q]) => {
          if (q > 0) {
            const svc = COVERAGE_SERVICES.find(s => s.id === svcId);
            if (svc) {
              items.push({
                label: `${ev?.label} (${dur?.label})`,
                sub: `${svc.label}${q > 1 ? ` (×${q})` : ''}`,
                price: q * svc.price,
              });
            }
          }
        });
      } else {
        (cfg.services || []).forEach(svcId => {
          const svc = COVERAGE_SERVICES.find(s => s.id === svcId);
          if (svc) items.push({ label: `${ev?.label} (${dur?.label})`, sub: svc.label, price: svc.price });
        });
      }
    });
    if (hasPrewedding && prewedPkg) items.push({ label: prewedPkg.name, price: prewedPkg.price });
    if (postProd === 'documentary') items.push({ label: 'Film Post-Production: Documentary Style Wedding Film', price: 25000 });
    if (albumTier) {
      items.push({ label: albumTier.name.replace(/\n/g, ' '), price: albumTier.price });
      if (extraSheets > 0) items.push({ label: `Additional ${extraSheets} Sheets`, price: extraSheets * 500 });
    }
    ADDON_GROUPS.forEach(grp => grp.items.forEach(item => {
      if (item.type === 'qty' && (addOnQtys[item.id] || 0) >= item.minQty) {
        const q = addOnQtys[item.id];
        items.push({ label: `${item.name} (×${q})`, price: q * item.pricePerUnit });
      } else if (item.type === 'toggle' && addOnSel[item.id]) {
        items.push({ label: item.name, price: item.price });
      }
    }));
    return items;
  }, [selectedEvents, coverage, hasPrewedding, prewedPkg, postProd, albumTier, extraSheets, addOnQtys, addOnSel]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goBack = () => {
    if (mainStep === 1 && eventStep > 0) { setEventStep(e => e - 1); return; }
    if (mainStep === 1 && eventStep === 0) { setMainStep(0); return; }
    if (mainStep === 3 && !hasPrewedding) { setMainStep(1); return; } // skip Step 3 if no prewedding
    setMainStep(s => Math.max(0, s - 1));
  };

  const goNext = () => {
    if (mainStep === 1 && eventStep < selectedEvents.length - 1) { setEventStep(e => e + 1); return; }
    if (mainStep === 1 && !hasPrewedding) { setEventStep(0); setMainStep(3); return; } // skip Step 3 if no prewedding
    if (mainStep === 1 && hasPrewedding)  { setEventStep(0); setMainStep(2); return; }
    if (mainStep < 7) { setMainStep(s => s + 1); }
  };

  const canNext = () => {
    if (mainStep === 0) return selectedEvents.length > 0;
    if (mainStep === 6) return client.name && client.email && client.phone;
    if (mainStep === 7) return termsOk;
    return true;
  };

  const setDuration = (evId, dur) => {
    setCoverage(prev => {
      const cur = prev[evId] || { duration: 'half-day', services: [], serviceQtys: {} };
      return { ...prev, [evId]: { ...cur, duration: dur } };
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true); setError('');
    try {
      await axios.post(`${API}/quotes`, {
        clientName: client.name, email: client.email, phone: client.phone,
        city: client.location, eventDate: client.date, specialRequests: client.notes,
        events: selectedEvents.map(evId => {
          const ev  = EVENT_TYPES.find(e => e.id === evId);
          const cfg = coverage[evId] || {};
          const qtys = cfg.serviceQtys || {};
          const serviceList = [];
          if (Object.keys(qtys).length > 0) {
            Object.entries(qtys).forEach(([sid, q]) => {
              if (q > 0) {
                const s = COVERAGE_SERVICES.find(x => x.id === sid);
                serviceList.push({ name: `${s?.label || sid}${q > 1 ? ` (×${q})` : ''}`, quantity: q, unitPrice: s?.price || 0, price: (s?.price || 0) * q });
              }
            });
          } else {
            (cfg.services || []).forEach(sid => {
              const s = COVERAGE_SERVICES.find(x => x.id === sid);
              serviceList.push({ name: s?.label || sid, quantity: 1, unitPrice: s?.price || 0, price: s?.price || 0 });
            });
          }

          return {
            eventType: ev?.label || evId,
            shootingDays: cfg.duration === '2-days' ? 2 : cfg.duration === '3-plus' ? 3 : 1,
            services: serviceList,
          };
        }),
        selectedPackage: (hasPrewedding && prewedPkg) ? { name: prewedPkg.name, price: prewedPkg.price } : null,
        addOns: [
          ...(postProd === 'documentary' ? [{ name: 'Documentary Style Wedding Film', price: 25000 }] : []),
          ...ADDON_GROUPS.flatMap(g => g.items.filter(item =>
            item.type === 'qty' ? (addOnQtys[item.id] || 0) >= item.minQty : addOnSel[item.id]
          ).map(item => ({
            name: item.name,
            price: item.type === 'qty' ? (addOnQtys[item.id] || 0) * item.pricePerUnit : item.price,
          }))),
        ],
        deliverables: albumTier ? [{ name: albumTier.name.replace(/\n/g,' '), price: albumTier.price }] : [],
        subtotal: total, discount: 0, total,
        estimatedDeliveryDays: selectedEvents.length * 21,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setMainStep(0); setEventStep(0); setMaxReachedStep(0); setSelectedEvents([]); setCoverage({});
    setPrewedPkg(null); setPostProd('standard'); setAlbumTier(null); setExtraSheets(0);
    setAddOnQtys({}); setAddOnSel({});
    setClient({ name:'', email:'', phone:'', date:'', location:'', notes:'' });
    setTermsOk(false); setSubmitted(false); setError('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center text-[#0f0f12]">
        <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Check size={36} className="text-white" />
        </div>
        <p className="text-neutral-500 text-xs tracking-[0.4em] uppercase font-sans font-semibold mb-2">REQUEST SUBMITTED</p>
        <h2 className="font-cinzel text-[#0f0f12] text-4xl sm:text-5xl mb-4 font-normal tracking-wide">Quote Sent Successfully!</h2>
        <p className="text-neutral-600 text-sm mb-1 max-w-md">Your personalized proposal has been compiled and emailed to <strong className="text-black">{client.email}</strong></p>
        <p className="text-neutral-500 text-xs">Our creative studio team will be in touch within 24–48 hours.</p>
        <button onClick={resetAll} className="mt-10 px-8 py-3 bg-black hover:bg-neutral-800 text-white text-xs tracking-widest font-bold uppercase rounded-xl transition shadow-md">
          Start New Quote
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WIZARD RENDER (Light High Luxury Theme)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white pt-28 pb-20 text-[#0f0f12]">
      <div className="max-w-4xl mx-auto px-4">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-neutral-100 border border-black/10 text-neutral-800 text-[10px] tracking-[0.3em] uppercase font-sans font-semibold mb-3 shadow-sm">
            <Sparkles size={12} /> CUSTOM PRICING CANVAS
          </span>
          <h1 className="font-cinzel text-[#0f0f12] text-4xl sm:text-5xl md:text-6xl mb-3 font-normal tracking-wide">
            Build Your Quote
          </h1>
          <p className="text-neutral-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-sans">
            Design a tailor-made coverage suite for your landmark celebrations. Every component is dynamically compiled to match your creative vision.
          </p>
        </div>

        {/* ── Step Indicator ──────────────────────────────────────────────────── */}
        <StepIndicator
          current={mainStep}
          maxReached={maxReachedStep}
          steps={visibleSteps}
          onSelectStep={setMainStep}
        />

        {/* ── Main Card Container ────────────────────────────────────────────── */}
        <div className="bg-[#fafafa] border border-black/10 rounded-2xl shadow-xl overflow-hidden">

          {/* Content Body */}
          <div className="p-6 sm:p-8 md:p-10" style={{ minHeight: 480 }}>
            <AnimatePresence mode="wait">
              <motion.div key={`${mainStep}-${eventStep}`} variants={slide} initial="initial" animate="animate" exit="exit">

                {/* ════════════════════════════════════════════════════════════
                    STEP 1 — SELECT EVENTS
                ════════════════════════════════════════════════════════════ */}
                {mainStep === 0 && (
                  <div>
                    <h2 className="font-mirage text-[#0f0f12] text-2xl mb-1 tracking-wide flex items-center gap-2">
                      <span className="text-neutral-400">1.</span> Select Your Events
                    </h2>
                    <p className="text-neutral-500 text-xs tracking-wider uppercase mb-6 font-sans">
                      Choose all celebrations you wish to cover
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {EVENT_TYPES.map(ev => {
                        const sel = selectedEvents.includes(ev.id);
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => setSelectedEvents(prev =>
                              prev.includes(ev.id) ? prev.filter(x => x !== ev.id) : [...prev, ev.id]
                            )}
                            className={`
                              group flex flex-col items-center justify-center p-4 sm:p-6 border transition-all duration-300 cursor-pointer rounded-2xl shadow-xs
                              ${sel ? 'border-black bg-black text-white shadow-md' : 'border-black/10 bg-white text-neutral-800 hover:border-black/30 hover:bg-neutral-50'}
                            `}
                            style={{ minHeight: 145 }}
                          >
                            <EventImageOrEmoji ev={ev} sel={sel} />
                            <span className={`font-mirage text-xs sm:text-sm tracking-wider uppercase text-center leading-tight font-semibold
                              ${sel ? 'text-white' : 'text-neutral-900'}`}>
                              {ev.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 2 — CONFIGURE COVERAGE
                ════════════════════════════════════════════════════════════ */}
                {mainStep === 1 && selectedEvents.length > 0 && (() => {
                  const evId = selectedEvents[eventStep];
                  const ev   = EVENT_TYPES.find(e => e.id === evId);
                  const cfg  = coverage[evId] || { duration: 'half-day', services: [], serviceQtys: {} };
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h2 className="font-mirage text-[#0f0f12] text-2xl tracking-wide flex items-center gap-2">
                          <span className="text-neutral-400">2.</span> Configure Coverage
                        </h2>
                        {/* Event dot navigation */}
                        <div className="flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-full border border-black/10">
                          {selectedEvents.map((_, i) => (
                            <button key={i} type="button" onClick={() => setEventStep(i)}
                              className={`transition-all duration-300 ${i === eventStep ? 'w-3.5 h-3.5 bg-black rounded-full shadow-sm' : 'w-2.5 h-2.5 bg-neutral-300 rounded-full hover:bg-neutral-500'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[#0f0f12] text-xs tracking-widest uppercase mb-6 font-sans font-semibold">
                        EVENT {eventStep + 1} OF {selectedEvents.length}: <span className="text-neutral-600">{ev?.label}</span>
                      </p>

                      <div className="border border-black/10 bg-white p-5 sm:p-7 rounded-2xl shadow-xs">
                        {/* Event label + duration selector */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                          <h3 className="font-mirage text-[#0f0f12] text-sm tracking-wider uppercase font-semibold">{ev?.label} Duration</h3>
                          <select
                            value={cfg.duration || 'half-day'}
                            onChange={e => setDuration(evId, e.target.value)}
                            className="bg-neutral-50 border border-black/15 text-[#0f0f12] text-xs tracking-wider uppercase px-4 py-2.5 outline-none cursor-pointer rounded-xl focus:border-black transition font-semibold"
                          >
                            {DURATIONS.map(d => (
                              <option key={d.id} value={d.id} className="bg-white text-black">{d.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Services grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                          {COVERAGE_SERVICES.map(svc => {
                            const qty       = getServiceQty(evId, svc.id);
                            const sel       = qty > 0;
                            const isHovered = hoveredSvc === svc.id;

                            return (
                              <div
                                key={svc.id}
                                onMouseEnter={() => setHoveredSvc(svc.id)}
                                onMouseLeave={() => setHoveredSvc(null)}
                                onClick={() => { if (qty === 0) updateServiceQty(evId, svc.id, 1); }}
                                className={`
                                  group relative p-4 border transition-all duration-300 cursor-pointer rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs
                                  ${sel ? 'border-black bg-black text-white shadow-md' : 'border-black/10 bg-[#fafafa] text-neutral-800 hover:border-black/30 hover:bg-neutral-100'}
                                `}
                                style={{ minHeight: 155 }}
                              >
                                {/* HOVERED STATE */}
                                {isHovered ? (
                                  <div className="flex flex-col justify-between h-full w-full animate-fade-in">
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sel ? 'bg-white text-black border-white' : 'bg-black text-white border-black'}`}>
                                        {fmt(svc.price * (qty > 0 ? qty : 1))}
                                      </span>

                                      {qty === 0 ? (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); updateServiceQty(evId, svc.id, 1); }}
                                          className="w-6 h-6 rounded border border-black/30 bg-black text-white flex items-center justify-center hover:bg-neutral-800 transition"
                                        >
                                          <Plus size={12} />
                                        </button>
                                      ) : (
                                        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded p-0.5" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); updateServiceQty(evId, svc.id, qty - 1); }}
                                            className="w-5 h-5 rounded bg-neutral-800 flex items-center justify-center text-white hover:bg-white hover:text-black transition"
                                          >
                                            <Minus size={10} />
                                          </button>
                                          <span className="text-[11px] font-bold text-white w-3 text-center">{qty}</span>
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); updateServiceQty(evId, svc.id, qty + 1); }}
                                            className="w-5 h-5 rounded bg-neutral-800 flex items-center justify-center text-white hover:bg-white hover:text-black transition"
                                          >
                                            <Plus size={10} />
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    <h4 className={`font-mirage text-xs font-bold tracking-wider uppercase my-0.5 leading-tight ${sel ? 'text-white' : 'text-[#0f0f12]'}`}>
                                      {svc.label}
                                    </h4>

                                    <p className={`text-[10px] leading-tight font-sans line-clamp-3 ${sel ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                      {svc.desc}
                                    </p>
                                  </div>
                                ) : (
                                  /* UNHOVERED STATE */
                                  <div className="relative flex flex-col items-center justify-center h-full w-full py-1">
                                    <CoverageImageOrIcon svc={svc} sel={sel} />
                                    <span className={`font-mirage text-xs tracking-wider uppercase text-center leading-tight font-semibold ${sel ? 'text-white' : 'text-neutral-800'}`}>
                                      {svc.label}
                                    </span>

                                    {sel && (
                                      <span className="absolute bottom-0 right-0 text-[9px] font-mono text-black bg-white border border-black/20 px-2 py-0.5 rounded shadow-xs font-bold">
                                        Qty: {qty}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ════════════════════════════════════════════════════════════
                    STEP 3 — PRE-WEDDING STYLE
                ════════════════════════════════════════════════════════════ */}
                {mainStep === 2 && hasPrewedding && (
                  <div>
                    <h2 className="font-mirage text-[#0f0f12] text-2xl mb-1 tracking-wide flex items-center gap-2">
                      <span className="text-neutral-400">3.</span> Pre-Wedding Style
                    </h2>
                    <p className="text-neutral-500 text-xs tracking-wider uppercase mb-6 font-sans">
                      Select a pre-wedding conceptual package (optional)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {PREWEDDING_PACKAGES.map(pkg => {
                        const sel = prewedPkg?.id === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setPrewedPkg(sel ? null : pkg)}
                            className={`text-left p-6 border transition-all duration-300 relative rounded-2xl flex flex-col justify-between shadow-xs
                              ${sel ? 'border-black bg-black text-white shadow-md' : 'border-black/10 bg-white hover:border-black/30 hover:bg-neutral-50'}`}
                          >
                            <div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {pkg.tags.map((t, i) => (
                                  <span key={t} className={`text-[9px] tracking-widest uppercase font-semibold ${sel ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {t}{i < pkg.tags.length - 1 ? ' •' : ''}
                                  </span>
                                ))}
                              </div>
                              <h3 className={`font-mirage text-xl mb-2 ${sel ? 'text-white' : 'text-[#0f0f12]'}`}>{pkg.name}</h3>
                              <p className={`text-xs leading-relaxed mb-4 font-sans ${sel ? 'text-neutral-300' : 'text-neutral-600'}`}>{pkg.desc}</p>
                              <ul className="space-y-1.5 mb-6">
                                {pkg.features.map(f => (
                                  <li key={f} className={`text-xs flex items-center gap-2 ${sel ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                    <span className="text-xs leading-none">•</span>{f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-black/10">
                              <span className={`font-bold text-base ${sel ? 'text-white' : 'text-[#0f0f12]'}`}>{fmt(pkg.price)}</span>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition
                                ${sel ? 'border-white bg-white text-black' : 'border-neutral-400'}`}>
                                {sel && <Check size={13} strokeWidth={3} />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button type="button" onClick={() => setPrewedPkg(null)}
                      className="mt-6 text-neutral-500 text-xs hover:text-black transition tracking-wider uppercase font-sans font-medium">
                      Skip — no pre-wedding shoot
                    </button>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 4 — POST-PRODUCTION
                ════════════════════════════════════════════════════════════ */}
                {mainStep === 3 && (
                  <div>
                    <h2 className="font-mirage text-[#0f0f12] text-2xl mb-1 tracking-wide flex items-center gap-2">
                      <span className="text-neutral-400">4.</span> Video Post-Production
                    </h2>
                    <p className="text-neutral-500 text-xs tracking-wider uppercase mb-6 font-sans">
                      Choose your editing formats and custom movie lengths
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {POSTPROD_OPTIONS.map(opt => {
                        const sel = postProd === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPostProd(opt.id)}
                            className={`text-left p-6 border transition-all duration-300 rounded-2xl flex flex-col justify-between shadow-xs
                              ${sel ? 'border-black bg-black text-white shadow-md' : 'border-black/10 bg-white hover:border-black/30 hover:bg-neutral-50'}`}
                          >
                            <div>
                              <p className={`text-[10px] tracking-widest uppercase mb-3 font-bold ${sel ? 'text-neutral-300' : 'text-neutral-500'}`}>{opt.badge}</p>
                              <h3 className={`font-mirage text-xl tracking-wide mb-2 ${sel ? 'text-white' : 'text-[#0f0f12]'}`}>{opt.name}</h3>
                              <p className={`text-xs leading-relaxed mb-4 font-sans ${sel ? 'text-neutral-300' : 'text-neutral-600'}`}>{opt.intro}</p>
                              <ul className="space-y-2 mb-6">
                                {opt.features.map(f => (
                                  <li key={f} className={`text-xs flex gap-2 leading-relaxed ${sel ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                    <span className="shrink-0">•</span>{f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-black/10">
                              <span className={`text-base font-bold ${sel ? 'text-white' : 'text-[#0f0f12]'}`}>{opt.priceLabel}</span>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition
                                ${sel ? 'border-white bg-white text-black' : 'border-neutral-400'}`}>
                                {sel && <Check size={13} strokeWidth={3} />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 5 — LUXURY ALBUMS
                ════════════════════════════════════════════════════════════ */}
                {mainStep === 4 && (
                  <div>
                    <h2 className="font-mirage text-[#0f0f12] text-2xl mb-1 tracking-wide flex items-center gap-2">
                      <span className="text-neutral-400">5.</span> Luxury Album Deliverables
                    </h2>
                    <p className="text-neutral-500 text-xs tracking-wider uppercase mb-5 font-sans">
                      Configure dynamic sheets and physical albums
                    </p>

                    {/* Complimentary note */}
                    <div className="border border-black/10 bg-white p-5 rounded-2xl mb-6 shadow-xs">
                      <p className="text-[#0f0f12] text-[10px] tracking-widest uppercase mb-1.5 font-bold flex items-center gap-1.5">
                        <Sparkles size={12} /> COMPLIMENTARY PROFESSIONAL PHOTO EDITING
                      </p>
                      <p className="text-neutral-600 text-xs leading-relaxed font-sans">
                        150–300 Edited Photos: Price includes Candid photography. All photos are professionally color graded and retouched to enhance natural skin tones, lighting balance, and overall visual appeal, while maintaining a clean and realistic look.
                      </p>
                    </div>

                    {/* Tier cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {ALBUM_TIERS.map(tier => {
                        const sel = albumTier?.id === tier.id;
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => { setAlbumTier(sel ? null : tier); if (sel) setExtraSheets(0); }}
                            className={`text-left p-6 border transition-all duration-300 rounded-2xl flex flex-col justify-between shadow-xs
                              ${sel ? 'border-black bg-black text-white shadow-md' : 'border-black/10 bg-white hover:border-black/30 hover:bg-neutral-50'}`}
                          >
                            <div>
                              <h3 className={`font-mirage text-sm tracking-wider uppercase whitespace-pre-line mb-2 font-bold
                                ${sel ? 'text-white' : 'text-[#0f0f12]'}`}>
                                {tier.name}
                              </h3>
                              <p className={`text-xs leading-relaxed mb-4 font-sans ${sel ? 'text-neutral-300' : 'text-neutral-600'}`}>{tier.desc}</p>
                              <div className="mb-4">
                                <p className={`text-[9px] tracking-widest uppercase mb-1.5 font-bold ${sel ? 'text-neutral-300' : 'text-neutral-500'}`}>COMPLIMENTARY GIFTS:</p>
                                {tier.gifts.map(g => (
                                  <p key={g} className={`text-xs flex items-center gap-1.5 ${sel ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                    <span className="text-xs">•</span>{g}
                                  </p>
                                ))}
                              </div>
                            </div>
                            <div className="pt-4 border-t border-black/10">
                              <p className={`text-base font-bold ${sel ? 'text-white' : 'text-[#0f0f12]'}`}>{fmt(tier.price)}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Extra sheets */}
                    {albumTier && (
                      <div className="border border-black/10 bg-white p-5 rounded-2xl shadow-xs">
                        <p className="text-[#0f0f12] text-[10px] tracking-widest uppercase mb-1 font-bold">ALBUM PRINTING CONFIGURATIONS</p>
                        <p className="text-neutral-600 text-xs mb-4 leading-relaxed">
                          Signature albums include standard premium printing sheets. Adjust sheets below to accommodate more landmark celebrations (₹500/- per sheet).
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-neutral-600 text-xs uppercase tracking-wider font-sans font-semibold">Extra Sheets:</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setExtraSheets(s => Math.max(0, s - 1))}
                              className="w-8 h-8 border border-black/20 bg-neutral-100 flex items-center justify-center text-black hover:bg-black hover:text-white transition rounded-xl">
                              <Minus size={13} />
                            </button>
                            <span className="text-[#0f0f12] text-base font-bold w-6 text-center">{extraSheets}</span>
                            <button type="button" onClick={() => setExtraSheets(s => s + 1)}
                              className="w-8 h-8 border border-black/20 bg-neutral-100 flex items-center justify-center text-black hover:bg-black hover:text-white transition rounded-xl">
                              <Plus size={13} />
                            </button>
                          </div>
                          {extraSheets > 0 && (
                            <span className="text-black font-bold text-sm">+{fmt(extraSheets * 500)}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 6 — ADD-ON SERVICES
                ════════════════════════════════════════════════════════════ */}
                {mainStep === 5 && (
                  <div>
                    <h2 className="font-mirage text-[#0f0f12] text-2xl mb-1 tracking-wide flex items-center gap-2">
                      <span className="text-neutral-400">6.</span> Add-On Services
                    </h2>
                    <p className="text-neutral-500 text-xs tracking-wider uppercase mb-6 font-sans">
                      Enhance your coverage with premium event additions
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {ADDON_GROUPS.map(grp => (
                        <div key={grp.label}>
                          <p className="text-[#0f0f12] text-[10px] tracking-widest uppercase mb-3 font-bold">{grp.label}</p>
                          <div className="space-y-3">
                            {grp.items.map(item => {
                              if (item.type === 'qty') {
                                const qty    = addOnQtys[item.id] || 0;
                                const active = qty >= item.minQty;
                                return (
                                  <div key={item.id}
                                    className={`border p-4 transition-all duration-300 rounded-2xl shadow-xs ${active ? 'border-black bg-black text-white' : 'border-black/10 bg-white'}`}>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div>
                                        <h4 className={`text-sm font-semibold leading-tight ${active ? 'text-white' : 'text-[#0f0f12]'}`}>{item.name}</h4>
                                        <p className={`text-[10px] mt-0.5 font-medium ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>{item.priceLabel}</p>
                                      </div>
                                      {qty === 0 ? (
                                        <button type="button"
                                          onClick={() => setAddOnQtys(p => ({ ...p, [item.id]: item.minQty }))}
                                          className="border border-black text-black text-[10px] tracking-widest font-bold px-4 py-1.5 hover:bg-black hover:text-white transition shrink-0 rounded-xl">
                                          ADD
                                        </button>
                                      ) : (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button type="button"
                                            onClick={() => setAddOnQtys(p => ({ ...p, [item.id]: Math.max(0, (p[item.id] || 0) - 1) }))}
                                            className="w-7 h-7 border border-white/20 bg-neutral-800 flex items-center justify-center text-white hover:bg-white hover:text-black transition rounded-lg">
                                            <Minus size={12} />
                                          </button>
                                          <span className="text-white text-sm font-bold w-5 text-center">{qty}</span>
                                          <button type="button"
                                            onClick={() => setAddOnQtys(p => ({ ...p, [item.id]: (p[item.id] || 0) + 1 }))}
                                            className="w-7 h-7 border border-white/20 bg-neutral-800 flex items-center justify-center text-white hover:bg-white hover:text-black transition rounded-lg">
                                            <Plus size={12} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <p className={`text-xs leading-relaxed font-sans ${active ? 'text-neutral-300' : 'text-neutral-600'}`}>{item.desc}</p>
                                  </div>
                                );
                              } else {
                                const sel = addOnSel[item.id] || false;
                                return (
                                  <div key={item.id}
                                    className={`border p-4 transition-all duration-300 rounded-2xl shadow-xs ${sel ? 'border-black bg-black text-white' : 'border-black/10 bg-white'}`}>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div>
                                        <h4 className={`text-sm font-semibold leading-tight ${sel ? 'text-white' : 'text-[#0f0f12]'}`}>{item.name}</h4>
                                        <p className={`text-[10px] mt-0.5 font-bold ${sel ? 'text-neutral-300' : 'text-neutral-600'}`}>{item.priceLabel}</p>
                                      </div>
                                      <button type="button"
                                        onClick={() => setAddOnSel(p => ({ ...p, [item.id]: !p[item.id] }))}
                                        className={`border text-[10px] tracking-widest font-bold px-4 py-1.5 transition shrink-0 rounded-xl
                                          ${sel ? 'border-white bg-white text-black' : 'border-black text-black hover:bg-black hover:text-white'}`}>
                                        {sel ? 'REMOVE' : 'ADD'}
                                      </button>
                                    </div>
                                    <p className={`text-xs leading-relaxed font-sans ${sel ? 'text-neutral-300' : 'text-neutral-600'}`}>{item.desc}</p>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 7 — CLIENT DETAILS
                ════════════════════════════════════════════════════════════ */}
                {mainStep === 6 && (
                  <div>
                    <h2 className="font-mirage text-[#0f0f12] text-2xl mb-1 tracking-wide flex items-center gap-2">
                      <span className="text-neutral-400">7.</span> Client Details
                    </h2>
                    <p className="text-neutral-500 text-xs tracking-wider uppercase mb-6 font-sans">
                      Please provide coordinates to lock shoot schedule calculations
                    </p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold uppercase tracking-wider mb-1.5">
                            <User size={12} className="text-black" /> Full Name *
                          </label>
                          <input type="text" placeholder="Enter your full name"
                            value={client.name} onChange={e => setClient(p => ({ ...p, name: e.target.value }))}
                            className="w-full bg-white border border-black/15 px-4 py-3 text-[#0f0f12] text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition rounded-xl placeholder:text-neutral-400 shadow-xs" />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold uppercase tracking-wider mb-1.5">
                            <Mail size={12} className="text-black" /> Email Address *
                          </label>
                          <input type="email" placeholder="Enter your email"
                            value={client.email} onChange={e => setClient(p => ({ ...p, email: e.target.value }))}
                            className="w-full bg-white border border-black/15 px-4 py-3 text-[#0f0f12] text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition rounded-xl placeholder:text-neutral-400 shadow-xs" />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold uppercase tracking-wider mb-1.5">
                            <Phone size={12} className="text-black" /> Mobile Number *
                          </label>
                          <input type="tel" placeholder="Enter mobile number"
                            value={client.phone} onChange={e => setClient(p => ({ ...p, phone: e.target.value }))}
                            className="w-full bg-white border border-black/15 px-4 py-3 text-[#0f0f12] text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition rounded-xl placeholder:text-neutral-400 shadow-xs" />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold uppercase tracking-wider mb-1.5">
                            <Calendar size={12} className="text-black" /> Event Start Date (Optional)
                          </label>
                          <input type="date"
                            value={client.date} onChange={e => setClient(p => ({ ...p, date: e.target.value }))}
                            className="w-full bg-white border border-black/15 px-4 py-3 text-[#0f0f12] text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition rounded-xl shadow-xs" />
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold uppercase tracking-wider mb-1.5">
                          <MapPin size={12} className="text-black" /> Shoot Location (Optional)
                        </label>
                        <input type="text" placeholder="City, Venue, or State"
                          value={client.location} onChange={e => setClient(p => ({ ...p, location: e.target.value }))}
                          className="w-full bg-white border border-black/15 px-4 py-3 text-[#0f0f12] text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition rounded-xl placeholder:text-neutral-400 shadow-xs" />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold uppercase tracking-wider mb-1.5">
                          <FileText size={12} className="text-black" /> Additional Notes
                        </label>
                        <textarea rows={3} placeholder="E.g., Special arrival timings, dynamic venue logistics..."
                          value={client.notes} onChange={e => setClient(p => ({ ...p, notes: e.target.value }))}
                          className="w-full bg-white border border-black/15 px-4 py-3 text-[#0f0f12] text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition rounded-xl placeholder:text-neutral-400 resize-none shadow-xs" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 8 — SUMMARY & PROPOSAL
                ════════════════════════════════════════════════════════════ */}
                {mainStep === 7 && (
                  <div>
                    <h2 className="font-mirage text-[#0f0f12] text-2xl mb-1 tracking-wide flex items-center gap-2">
                      <span className="text-neutral-400">8.</span> Summary & Proposal
                    </h2>
                    <p className="text-neutral-500 text-xs tracking-wider uppercase mb-5 font-sans">
                      Review itemized quotations & complete submission
                    </p>

                    {/* Itemized Receipt */}
                    <div className="border border-black/10 bg-white p-6 rounded-2xl mb-4 shadow-xs">
                      <p className="text-[#0f0f12] text-[10px] tracking-widest uppercase font-bold mb-4">ITEMIZED RECEIPT</p>
                      {lineItems.length === 0 ? (
                        <p className="text-neutral-500 text-xs">No items selected.</p>
                      ) : (
                        <div className="space-y-3">
                          {lineItems.map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-4 border-b border-black/5 pb-2.5 last:border-0 last:pb-0">
                              <div>
                                <span className="text-[#0f0f12] text-xs font-semibold">{item.label}</span>
                                {item.sub && <span className="text-neutral-500 text-[11px] block mt-0.5 font-sans">{item.sub}</span>}
                              </div>
                              <span className="text-[#0f0f12] text-xs font-bold shrink-0">{fmt(item.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Date & Location */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="border border-black/10 bg-white p-4 rounded-2xl shadow-xs">
                        <p className="text-neutral-500 text-[9px] tracking-widest uppercase mb-1 flex items-center gap-1.5 font-sans font-bold">
                          <Calendar size={11} className="text-black" /> Event Date
                        </p>
                        <p className="text-[#0f0f12] text-sm font-semibold">{client.date || '—'}</p>
                      </div>
                      <div className="border border-black/10 bg-white p-4 rounded-2xl shadow-xs">
                        <p className="text-neutral-500 text-[9px] tracking-widest uppercase mb-1 flex items-center gap-1.5 font-sans font-bold">
                          <MapPin size={11} className="text-black" /> Location
                        </p>
                        <p className="text-[#0f0f12] text-sm font-semibold">{client.location || 'Not Set'}</p>
                      </div>
                    </div>

                    {/* Retainer Terms */}
                    <div className="border border-black/10 bg-white p-6 rounded-2xl mb-4 shadow-xs">
                      <p className="text-[#0f0f12] text-[10px] tracking-widest uppercase font-bold mb-3">RETAINER AGREEMENT TERMS</p>
                      <ul className="space-y-2">
                        {RETAINER_TERMS.map((t, i) => (
                          <li key={i} className="text-neutral-600 text-xs flex gap-2 leading-relaxed font-sans">
                            <span className="text-black shrink-0">•</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Grand Total */}
                    <div className="bg-black text-white p-6 rounded-2xl mb-4 text-center shadow-md">
                      <p className="text-neutral-400 text-[10px] tracking-widest uppercase mb-1 font-sans font-semibold">ESTIMATED GRAND TOTAL</p>
                      <p className="font-mirage text-white text-4xl sm:text-5xl font-bold tracking-wide">{fmt(total)}</p>
                      <p className="text-neutral-400 text-[10px] mt-2 font-sans">Price may vary based on exact event logistics</p>
                    </div>

                    {/* Terms checkbox */}
                    <label className="flex items-start gap-3 border border-black/10 bg-white p-4 rounded-2xl cursor-pointer hover:border-black/30 transition shadow-xs">
                      <input type="checkbox" checked={termsOk} onChange={e => setTermsOk(e.target.checked)}
                        className="mt-0.5 accent-black w-4 h-4 shrink-0 rounded cursor-pointer" />
                      <span className="text-neutral-700 text-xs leading-relaxed font-sans font-medium">
                        I accept the retainer agreement terms & conditions above and confirm these quotation parameters.
                      </span>
                    </label>

                    {error && <p className="text-red-600 text-xs mt-3 text-center font-bold">{error}</p>}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Bottom Navigation Bar ──────────────────────────────────────────── */}
          <div className="border-t border-black/10 bg-white px-6 py-4 flex items-center justify-between">
            {/* BACK */}
            {mainStep === 0 ? <div /> : (
              <button type="button" onClick={goBack}
                className="flex items-center gap-1.5 text-neutral-600 hover:text-black text-xs tracking-widest uppercase transition font-sans font-medium">
                <ArrowLeft size={13} /> BACK
              </button>
            )}

            {/* Running total */}
            <div className="text-center">
              <p className="text-neutral-500 text-[9px] tracking-widest uppercase font-sans">ESTIMATED TOTAL</p>
              <p className="font-cinzel text-[#0f0f12] text-xl font-bold leading-tight">{fmt(total)}</p>
            </div>

            {/* NEXT / SUBMIT */}
            {mainStep === 7 ? (
              <button type="button" onClick={handleSubmit} disabled={!termsOk || submitting}
                className="bg-black hover:bg-neutral-800 text-white px-7 py-2.5 text-xs tracking-widest uppercase font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 rounded-xl shadow-md">
                {submitting && <Loader2 size={13} className="animate-spin" />}
                SUBMIT REQUEST
              </button>
            ) : (
              <button type="button" onClick={goNext} disabled={!canNext()}
                className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-6 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md">
                NEXT STEP <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetQuote;
