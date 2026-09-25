import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Search, Plus, Download, Pencil, Percent, Eye,
  Trash2, ChevronDown, ChevronLeft, ChevronRight,
  Check, X, Loader2, FileText,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const token = () => localStorage.getItem('adminToken');
const authHeaders = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}/-`;

const shortId = (id = '') => id.toString().slice(-6).toUpperCase();

const STATUS_OPTIONS = ['new', 'contacted', 'converted', 'closed'];
const STATUS_COLORS = {
  new:       'text-sky-400 border-sky-500/40',
  contacted: 'text-blue-400 border-blue-500/40',
  converted: 'text-emerald-400 border-emerald-500/40',
  closed:    'text-rose-400 border-rose-500/40',
};

// ─── 5-step Admin Create Quote Wizard data ────────────────────────────────────

const PRIMARY_CATEGORIES = ['Wedding', 'Half Saree', 'Maternity', 'Gruhapravesam', 'Sreemantham'];

const ALL_SUB_EVENTS = [
  'Wedding', 'Engagement', 'Haldi', 'Mehendi', 'Sangeet',
  'Pellikoduku', 'Pellikuturu', 'Godumrai', 'Reception', 'Vratham',
  'Cocktail Party', 'Mehandi and Sangeet', 'Groom Pandirirata', 'Bride Pandirirata',
];

const DEFAULT_SERVICES = [
  { name: 'Traditional Photography', qty: 1, unitPrice: 8000 },
  { name: 'Candid Photography',      qty: 0, unitPrice: 12500 },
  { name: 'Traditional Videography', qty: 0, unitPrice: 13000 },
  { name: 'Cinematic Video',         qty: 0, unitPrice: 12500 },
  { name: 'FPV Drone',               qty: 0, unitPrice: 9000  },
  { name: '360° VR Coverage',        qty: 0, unitPrice: 6000  },
];

const PREWEDDING_STYLES = ['None (No Pre-Wedding)', 'Basic Pre-Wedding (₹30,000)', 'Freestyle Pre-Wedding (₹60,000)', 'Conceptual Pre-Wedding (₹1,20,000)'];
const POSTPROD_STYLES   = ['None (Standard Reel/Film)', 'Documentary Style Film (+₹25,000)'];
const ALBUM_STYLES      = ['None (No Album Deliverable)', 'Basic Album 30 Sheets (₹15,000)', 'Standard Album 50 Sheets (₹25,000)', 'Premium Album 80 Sheets (₹40,000)'];
const DELIVERY_OPTIONS  = ['4-6 Weeks (Rush)', '8-12 Weeks (Standard)', '12-16 Weeks (Extended)', '16+ Weeks (Premium Production)'];

const DELIVERABLE_PRESETS = [
  'A 15-to-20-minute Cinematic Wedding Documentary Film (4K)',
  'Standard Wedding Film (Full archive edit)',
  'Wedding Highlights Montage (3-5 Mins)',
  'Social Media Promo Cut (60s Reel)',
  'Traditional Full-Length Video',
  'All RAW Footage & Photos in 2 External HDDs',
  'Color-Graded High-Resolution Photos',
];

const GIFT_PRESETS = [
  'Table Photo Calendar', 'Pocket Album', 'Premium Acrylic Photo Frame',
  'Wall Photo Calendar', 'Wooden Framed Portrait', 'Exclusive Instagram Highlight Reel',
];

const DEFAULT_DELIVERABLES = [
  'Standard Wedding Film: Full-length wedding archive with clean, cinematic edits.',
  'Wedding Highlights Film: Creative cinematic montage capturing core emotional landmarks.',
  'Promo Cut: Energetic, short, social-media-ready teaser.',
  'Traditional Video: Complete chronologically archived coverage.',
];

const ADDON_LIST = [
  { id: 'instant-reels',  name: 'Event Instant Reels (Delivered same day)',            defaultQty: 5,  price: 5000  },
  { id: 'cinematic-reels',name: 'Cinematic Reels (Post-produced high quality)',         defaultQty: 5,  price: 10000 },
  { id: 'led-screen',     name: 'Premium LED Screen (8x12 1 Screen or 6x8 2 Screens)', defaultQty: null, price: 20000 },
  { id: 'yt-full',        name: 'YouTube Live Streaming (Full Day coverage)',           defaultQty: null, price: 15000 },
  { id: 'yt-half',        name: 'YouTube Live Streaming (Half Day coverage)',           defaultQty: null, price: 8000  },
];

// ─── Wizard Step Progress ──────────────────────────────────────────────────────

const WIZARD_STEPS = ['COORDINATES', 'EVENTS &\nOVERRIDES', 'ALBUMS &\nEXTRAS', 'DELIVERABLES &\nGIFTS', 'FINANCIAL\nSUMMARY'];

const WizardProgress = ({ step }) => (
  <div className="flex items-center gap-0 px-1 mb-6">
    {WIZARD_STEPS.map((label, i) => {
      const done   = i < step;
      const active = i === step;
      return (
        <React.Fragment key={i}>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all
              ${done ? 'bg-primary border-primary text-black' : active ? 'border-primary bg-transparent text-primary' : 'border-white/20 bg-transparent text-gray-500'}`}>
              {done ? <Check size={10} /> : i + 1}
            </div>
            <span className={`text-[8px] leading-tight tracking-widest uppercase whitespace-pre-line font-medium
              ${active ? 'text-primary font-semibold' : done ? 'text-primary/70' : 'text-gray-500'}`}>
              {label}
            </span>
          </div>
          {i < WIZARD_STEPS.length - 1 && (
            <div className={`h-px mx-2 transition-colors shrink-0 ${done ? 'bg-primary' : 'bg-white/10'}`} style={{ width: 20 }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Create Quote Modal ────────────────────────────────────────────────────────

const CreateQuoteModal = ({ onClose, onSaved }) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [basePrice, setBasePrice] = useState(0);

  // Step 1: Coordinates
  const [coords, setCoords] = useState({ name:'', email:'', phone:'', date:'', location:'', delivery: DELIVERY_OPTIONS[1], notes:'' });

  // Step 2: Events & Services
  const [primaryCat, setPrimaryCat]       = useState('Wedding');
  const [extraCats, setExtraCats]         = useState([]);
  const [newCatInput, setNewCatInput]     = useState('');
  const [selectedSubs, setSelectedSubs]   = useState([]);
  const [extraSubs, setExtraSubs]         = useState([]);
  const [newSubInput, setNewSubInput]     = useState('');
  // perSubConfig: { [subEvent]: { duration, remarks, services: [{enabled, name, qty, unitPrice}] } }
  const [perSubConfig, setPerSubConfig]   = useState({});

  // Step 3: Albums & Extras
  const [prewedStyle,  setPrewedStyle]  = useState(PREWEDDING_STYLES[0]);
  const [postprodStyle, setPostprodStyle] = useState(POSTPROD_STYLES[0]);
  const [albumStyle,   setAlbumStyle]   = useState(ALBUM_STYLES[0]);
  const [extraAlbums,  setExtraAlbums]  = useState([]);
  const [addonSel,     setAddonSel]     = useState({});
  const [addonQtys,    setAddonQtys]    = useState({});

  // Step 4: Deliverables & Gifts
  const [deliverables,  setDeliverables]  = useState([...DEFAULT_DELIVERABLES]);
  const [newDeliv,      setNewDeliv]      = useState('');
  const [gifts,         setGifts]         = useState(['Studio Gift Box & Photo Frame']);
  const [newGift,       setNewGift]       = useState('');

  // Step 5: Financial
  const [discountType,   setDiscountType]   = useState('flat'); // 'flat' | 'percent'
  const [discountAmount, setDiscountAmount] = useState('');

  // ── Compute basePrice whenever Step 2/3 changes ────────────────────────────
  useEffect(() => {
    let total = 0;
    selectedSubs.forEach(sub => {
      const cfg = perSubConfig[sub];
      if (cfg) {
        cfg.services.forEach(svc => {
          if (svc.enabled) total += (svc.qty || 1) * (svc.unitPrice || 0);
        });
      }
    });
    // Album
    if (albumStyle.includes('₹15,000'))   total += 15000;
    if (albumStyle.includes('₹25,000'))   total += 25000;
    if (albumStyle.includes('₹40,000'))   total += 40000;
    // Pre-wedding
    if (prewedStyle.includes('₹30,000'))   total += 30000;
    if (prewedStyle.includes('₹60,000'))   total += 60000;
    if (prewedStyle.includes('₹1,20,000')) total += 120000;
    // Post-prod
    if (postprodStyle.includes('₹25,000')) total += 25000;
    // Extra albums
    extraAlbums.forEach(a => { total += Number(a.price) || 0; });
    // Add-ons
    ADDON_LIST.forEach(ao => {
      if (addonSel[ao.id]) {
        const qty = addonQtys[ao.id] || ao.defaultQty || 1;
        total += qty * (ao.price / (ao.defaultQty || 1));
      }
    });
    setBasePrice(total);
  }, [selectedSubs, perSubConfig, albumStyle, prewedStyle, postprodStyle, extraAlbums, addonSel, addonQtys]);

  const discountValue = (() => {
    const amt = Number(discountAmount) || 0;
    if (discountType === 'percent') return Math.round(basePrice * amt / 100);
    return amt;
  })();
  const finalTotal = Math.max(0, basePrice - discountValue);

  // ── Sub-event config helpers ───────────────────────────────────────────────
  const initSubConfig = (sub) => {
    if (!perSubConfig[sub]) {
      setPerSubConfig(prev => ({
        ...prev,
        [sub]: { duration: 'half', remarks: '', services: DEFAULT_SERVICES.map(s => ({ ...s, enabled: false })) }
      }));
    }
  };

  const toggleSub = (sub) => {
    setSelectedSubs(prev => {
      if (prev.includes(sub)) return prev.filter(x => x !== sub);
      initSubConfig(sub);
      return [...prev, sub];
    });
  };

  const updateSubConfig = (sub, key, value) => {
    setPerSubConfig(prev => ({ ...prev, [sub]: { ...prev[sub], [key]: value } }));
  };

  const toggleSubService = (sub, idx) => {
    setPerSubConfig(prev => {
      const cfg = { ...prev[sub] };
      cfg.services = cfg.services.map((svc, i) => i === idx ? { ...svc, enabled: !svc.enabled } : svc);
      return { ...prev, [sub]: cfg };
    });
  };

  const updateSubService = (sub, idx, field, val) => {
    setPerSubConfig(prev => {
      const cfg = { ...prev[sub] };
      cfg.services = cfg.services.map((svc, i) => i === idx ? { ...svc, [field]: val } : svc);
      return { ...prev, [sub]: cfg };
    });
  };

  const addCustomService = (sub) => {
    setPerSubConfig(prev => {
      const cfg = { ...prev[sub] };
      cfg.services = [...cfg.services, { enabled: true, name: 'Custom Service', qty: 1, unitPrice: 0 }];
      return { ...prev, [sub]: cfg };
    });
  };

  const removeService = (sub, idx) => {
    setPerSubConfig(prev => {
      const cfg = { ...prev[sub] };
      cfg.services = cfg.services.filter((_, i) => i !== idx);
      return { ...prev, [sub]: cfg };
    });
  };

  // ── Save / Email ───────────────────────────────────────────────────────────
  const buildPayload = (sendEmail = false) => ({
    clientName: coords.name, email: coords.email, phone: coords.phone,
    city: coords.location, eventDate: coords.date, specialRequests: coords.notes,
    events: selectedSubs.map(sub => {
      const cfg = perSubConfig[sub] || {};
      return {
        eventType: sub,
        shootingDays: cfg.duration === 'full' ? 1 : 1,
        services: (cfg.services || []).filter(s => s.enabled).map(s => ({ name: s.name, price: (s.qty || 1) * (s.unitPrice || 0) })),
      };
    }),
    selectedPackage: prewedStyle !== PREWEDDING_STYLES[0] ? { name: prewedStyle, price: prewedStyle.includes('₹30,000') ? 30000 : prewedStyle.includes('₹60,000') ? 60000 : 120000 } : null,
    addOns: [
      ...(postprodStyle.includes('₹25,000') ? [{ name: postprodStyle, price: 25000 }] : []),
      ...ADDON_LIST.filter(ao => addonSel[ao.id]).map(ao => ({ name: ao.name, price: ao.price })),
    ],
    deliverables: deliverables.map(d => ({ name: d, price: 0 })),
    subtotal: basePrice, discount: discountValue, total: finalTotal,
    estimatedDeliveryDays: 60,
    _sendEmail: sendEmail,
  });

  const handleSave = async (sendEmail = false) => {
    if (!coords.name || !coords.email || !coords.phone) {
      alert('Name, email and phone are required.'); return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/quotes`, buildPayload(sendEmail), authHeaders());
      onSaved();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const inputCls = 'w-full bg-[#111] border border-[#2a2a2a] px-3 py-2.5 text-white text-sm focus:border-white/50 outline-none transition rounded-sm placeholder:text-[#444]';
  const labelCls = 'block text-[8px] text-gray-500 uppercase tracking-widest mb-1.5';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#252525] rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-white text-xl font-light">Create Custom Quotation</h2>
            <p className="text-gray-600 text-[9px] tracking-widest uppercase mt-0.5">ADMINISTRATIVE QUOTATION WIZARD</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-white transition mt-1"><X size={16} /></button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <WizardProgress step={step} />
        </div>

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">

          {/* ── STEP 1: COORDINATES ─────────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <h3 className="text-white text-[10px] tracking-widest uppercase font-bold mb-5">
                STEP 1: CLIENT COORDINATES
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Client Name *</label>
                  <input type="text" placeholder="e.g. Priyanshu Sharma" value={coords.name} onChange={e => setCoords(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email Address *</label>
                  <input type="email" placeholder="e.g. client@example.com" value={coords.email} onChange={e => setCoords(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone Number *</label>
                  <input type="tel" placeholder="e.g. +91 98765 43210" value={coords.phone} onChange={e => setCoords(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Event Date *</label>
                  <input type="date" value={coords.date} onChange={e => setCoords(p => ({ ...p, date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Event Location *</label>
                  <input type="text" placeholder="e.g. Taj Deccan, Hyderabad" value={coords.location} onChange={e => setCoords(p => ({ ...p, location: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Delivery Timeline</label>
                  <select value={coords.delivery} onChange={e => setCoords(p => ({ ...p, delivery: e.target.value }))} className={inputCls + ' appearance-none'}>
                    {DELIVERY_OPTIONS.map(o => <option key={o} className="bg-[#111]">{o}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Special Notes / Admin Remarks</label>
                  <textarea rows={4} placeholder="Add any internal remarks, custom arrangements, or client requests..." value={coords.notes} onChange={e => setCoords(p => ({ ...p, notes: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: EVENTS & OVERRIDES ──────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-[10px] tracking-widest uppercase font-bold">
                  STEP 2: EVENTS & SERVICE CUSTOMIZATIONS
                </h3>
                <span className="text-gray-500 text-[9px]">BASE PRICE: {fmt(basePrice)}</span>
              </div>

              {/* Primary category */}
              <div className="mb-5">
                <p className={labelCls}>Primary Service Category</p>
                <div className="flex flex-wrap gap-2">
                  {[...PRIMARY_CATEGORIES, ...extraCats].map(cat => (
                    <button key={cat} type="button" onClick={() => setPrimaryCat(cat)}
                      className={`px-4 py-2 border text-xs tracking-widest uppercase transition rounded-sm
                        ${primaryCat === cat ? 'bg-white border-white text-black font-bold' : 'border-[#333] text-gray-400 hover:border-[#555]'}`}>
                      {cat}
                    </button>
                  ))}
                  <div className="flex gap-1">
                    <input value={newCatInput} onChange={e => setNewCatInput(e.target.value)} placeholder="+ Add Category" className="bg-transparent border border-[#333] px-3 py-2 text-xs text-white outline-none rounded-sm w-36 placeholder:text-[#444]" />
                    <button type="button" onClick={() => { if (newCatInput.trim()) { setExtraCats(p => [...p, newCatInput.trim()]); setNewCatInput(''); } }} className="border border-white text-white px-2 text-xs hover:bg-white hover:text-black transition rounded-sm">+</button>
                  </div>
                </div>
              </div>

              {/* Sub-events */}
              <div className="mb-5">
                <p className={labelCls}>Select Sub-Events / Celebrations ({primaryCat})</p>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[...ALL_SUB_EVENTS, ...extraSubs].map(sub => {
                    const checked = selectedSubs.includes(sub);
                    return (
                      <label key={sub} className={`flex items-center gap-2 border px-3 py-2 cursor-pointer transition rounded-sm text-xs
                        ${checked ? 'border-white bg-white/10 text-white' : 'border-[#2a2a2a] text-gray-500 hover:border-[#444]'}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleSub(sub)} className="accent-white w-3 h-3 shrink-0" />
                        {sub}
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  <input value={newSubInput} onChange={e => setNewSubInput(e.target.value)} placeholder="+ Add Sub-Event" className="bg-transparent border border-[#333] px-3 py-1.5 text-xs text-white outline-none rounded-sm w-44 placeholder:text-[#444]" />
                  <button type="button" onClick={() => { if (newSubInput.trim()) { setExtraSubs(p => [...p, newSubInput.trim()]); setNewSubInput(''); } }} className="border border-white text-white px-2 text-xs hover:bg-white hover:text-black transition rounded-sm">+ ADD</button>
                </div>
              </div>

              {/* Per sub-event service config */}
              {selectedSubs.length > 0 && (
                <div>
                  <p className={labelCls}>Configure Services Per Sub-Event</p>
                  <div className="space-y-4">
                    {selectedSubs.map(sub => {
                      const cfg = perSubConfig[sub] || { duration: 'half', remarks: '', services: [] };
                      return (
                        <div key={sub} className="border border-[#252525] rounded-sm">
                          {/* Sub-event header */}
                          <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#252525]">
                            <span className="text-white text-xs font-medium tracking-wider">• {sub.toUpperCase()}</span>
                            <div className="flex gap-1">
                              {['half', 'full'].map(dur => (
                                <button key={dur} type="button" onClick={() => updateSubConfig(sub, 'duration', dur)}
                                  className={`px-3 py-1 text-[9px] tracking-widest uppercase border transition rounded-sm
                                    ${cfg.duration === dur ? 'bg-white border-white text-black font-bold' : 'border-[#333] text-gray-500 hover:border-[#555]'}`}>
                                  {dur === 'half' ? 'Half Day' : 'Full Day'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="mb-3">
                              <label className={labelCls}>Event Option / Remarks (e.g. "Haldi Subject: Bride")</label>
                              <input type="text" placeholder="Specify sub-event details if any..." value={cfg.remarks || ''} onChange={e => updateSubConfig(sub, 'remarks', e.target.value)} className={inputCls} />
                            </div>
                            <p className={labelCls}>Select Photography & Videography Coverage</p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-600 text-[8px] uppercase tracking-widest border-b border-[#252525]">
                                  <th className="py-1.5 text-left w-8">Enable</th>
                                  <th className="py-1.5 text-left">Service Name</th>
                                  <th className="py-1.5 text-center w-12">Qty</th>
                                  <th className="py-1.5 text-right w-24">Unit Price (₹)</th>
                                  <th className="py-1.5 text-right w-20">Subtotal</th>
                                  <th className="w-6" />
                                </tr>
                              </thead>
                              <tbody>
                                {(cfg.services || []).map((svc, idx) => (
                                  <tr key={idx} className="border-b border-[#1a1a1a]">
                                    <td className="py-2">
                                      <input type="checkbox" checked={svc.enabled || false} onChange={() => toggleSubService(sub, idx)} className="accent-white w-3.5 h-3.5" />
                                    </td>
                                    <td className="py-2 text-gray-300">{svc.name}</td>
                                    <td className="py-2 text-center">
                                      <input type="number" min="0" value={svc.qty || 0} onChange={e => updateSubService(sub, idx, 'qty', Number(e.target.value))}
                                        className="w-10 bg-[#111] border border-[#2a2a2a] text-white text-center text-xs py-0.5 outline-none rounded-sm" />
                                    </td>
                                    <td className="py-2 text-right">
                                      <input type="number" min="0" value={svc.unitPrice || 0} onChange={e => updateSubService(sub, idx, 'unitPrice', Number(e.target.value))}
                                        className="w-20 bg-[#111] border border-[#2a2a2a] text-white text-right text-xs py-0.5 outline-none rounded-sm pr-1" />
                                    </td>
                                    <td className="py-2 text-right text-gray-400">{fmt((svc.qty || 0) * (svc.unitPrice || 0))}</td>
                                    <td className="py-2 text-right">
                                      <button type="button" onClick={() => removeService(sub, idx)} className="text-gray-700 hover:text-red-400 transition"><Trash2 size={11} /></button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <button type="button" onClick={() => addCustomService(sub)}
                              className="mt-2 text-white text-[9px] border border-white px-3 py-1 hover:bg-white hover:text-black transition rounded-sm">
                              + ADD SERVICE OPTION
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: ALBUMS & EXTRAS ─────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-[10px] tracking-widest uppercase font-bold">
                  STEP 3: ALBUMS & DELIVERABLES SELECTION
                </h3>
                <span className="text-gray-500 text-[9px]">BASE PRICE: {fmt(basePrice)}</span>
              </div>

              {/* Three dropdowns */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="border border-[#252525] p-4">
                  <p className="text-white/80 text-[8px] tracking-widest uppercase font-bold mb-1">PRE-WEDDING STYLE</p>
                  <p className={labelCls}>Style Package</p>
                  <select value={prewedStyle} onChange={e => setPrewedStyle(e.target.value)} className={inputCls + ' appearance-none'}>
                    {PREWEDDING_STYLES.map(o => <option key={o} className="bg-[#111]">{o}</option>)}
                  </select>
                </div>
                <div className="border border-[#252525] p-4">
                  <p className="text-white/80 text-[8px] tracking-widest uppercase font-bold mb-1">POST-PRODUCTION FILM STYLE</p>
                  <p className={labelCls}>Video Editing Style</p>
                  <select value={postprodStyle} onChange={e => setPostprodStyle(e.target.value)} className={inputCls + ' appearance-none'}>
                    {POSTPROD_STYLES.map(o => <option key={o} className="bg-[#111]">{o}</option>)}
                  </select>
                </div>
                <div className="border border-[#252525] p-4">
                  <p className="text-white/80 text-[8px] tracking-widest uppercase font-bold mb-1">PRIMARY PHOTO ALBUM</p>
                  <p className={labelCls}>Album Quality / Style</p>
                  <select value={albumStyle} onChange={e => setAlbumStyle(e.target.value)} className={inputCls + ' appearance-none'}>
                    {ALBUM_STYLES.map(o => <option key={o} className="bg-[#111]">{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Extra albums */}
              <div className="border border-[#252525] p-4 mb-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-[8px] tracking-widest uppercase font-bold">ADDITIONAL / EXTRA PHOTO ALBUMS</p>
                  <button type="button" onClick={() => setExtraAlbums(p => [...p, { name: 'Custom Album', sheets: 30, price: 0 }])}
                    className="border border-white/30 text-white text-[9px] px-3 py-1 hover:bg-white hover:text-black transition rounded-sm">
                    + ADD EXTRA ALBUM
                  </button>
                </div>
                <p className="text-gray-600 text-[9px] mb-2">Add extra parent albums, mini photo books, or guest albums.</p>
                {extraAlbums.length === 0 ? (
                  <p className="text-center text-gray-700 text-[9px] py-4 border border-dashed border-[#252525] rounded-sm">
                    No extra albums added yet. Click + Add Extra Album to include additional photo albums.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {extraAlbums.map((a, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input value={a.name} onChange={e => setExtraAlbums(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={inputCls + ' flex-1'} />
                        <input type="number" value={a.price} onChange={e => setExtraAlbums(p => p.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} className={inputCls + ' w-28'} placeholder="Price ₹" />
                        <button type="button" onClick={() => setExtraAlbums(p => p.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 transition"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add-ons table */}
              <div>
                <p className={labelCls}>Luxury Event Extras & Add-Ons</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-600 text-[8px] uppercase tracking-widest border-b border-[#252525]">
                      <th className="py-1.5 text-left w-8">Enable</th>
                      <th className="py-1.5 text-left">Add-On Deliverable</th>
                      <th className="py-1.5 text-center w-16">Quantity</th>
                      <th className="py-1.5 text-right w-28">Package Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ADDON_LIST.map(ao => (
                      <tr key={ao.id} className="border-b border-[#1a1a1a]">
                        <td className="py-2">
                          <input type="checkbox" checked={addonSel[ao.id] || false} onChange={() => setAddonSel(p => ({ ...p, [ao.id]: !p[ao.id] }))} className="accent-white w-3.5 h-3.5" />
                        </td>
                        <td className="py-2 text-gray-300">{ao.name}</td>
                        <td className="py-2 text-center text-gray-500">
                          {ao.defaultQty ? (
                            <input type="number" min={ao.defaultQty} value={addonQtys[ao.id] || ao.defaultQty} onChange={e => setAddonQtys(p => ({ ...p, [ao.id]: Number(e.target.value) }))}
                              className="w-12 bg-[#111] border border-[#2a2a2a] text-white text-center text-xs py-0.5 outline-none rounded-sm" />
                          ) : '—'}
                        </td>
                        <td className="py-2 text-right text-gray-400">{ao.price.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── STEP 4: DELIVERABLES & GIFTS ────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-[10px] tracking-widest uppercase font-bold">
                  STEP 4: DELIVERABLES & COMPLIMENTARIES
                </h3>
                <span className="text-gray-500 text-[9px]">BASE PRICE: {fmt(basePrice)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Left: Deliverables */}
                <div className="border border-[#252525] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-[8px] tracking-widest uppercase font-bold">INCLUDED DELIVERABLES</p>
                    <span className="text-gray-500 text-[8px] border border-[#333] px-2 py-0.5 rounded-sm">{deliverables.length} Items</span>
                  </div>
                  <p className="text-gray-600 text-[8px] mb-3">Final items and media handover promised to client.</p>
                  <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-1">
                    {deliverables.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 border border-[#252525] p-2 rounded-sm">
                        <span className="text-white text-xs shrink-0 mt-0.5">•</span>
                        <p className="text-gray-300 text-[10px] leading-relaxed flex-1">{d}</p>
                        <button type="button" onClick={() => setDeliverables(p => p.filter((_, j) => j !== i))} className="text-gray-700 hover:text-red-400 transition shrink-0"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 mb-3">
                    <input value={newDeliv} onChange={e => setNewDeliv(e.target.value)} placeholder="e.g. 1-Minute Drone Teaser in 4K" className={inputCls + ' flex-1 text-xs'} />
                    <button type="button" onClick={() => { if (newDeliv.trim()) { setDeliverables(p => [...p, newDeliv.trim()]); setNewDeliv(''); } }} className="bg-white text-black px-3 py-1 text-xs font-bold hover:bg-gray-200 transition rounded-sm">ADD</button>
                  </div>
                  <p className="text-gray-600 text-[7px] tracking-widest uppercase mb-2">QUICK PRESETS</p>
                  <div className="flex flex-wrap gap-1">
                    {DELIVERABLE_PRESETS.map(p => (
                      <button key={p} type="button" onClick={() => !deliverables.includes(p) && setDeliverables(prev => [...prev, p])}
                        className="text-[8px] border border-[#333] text-gray-500 px-2 py-0.5 hover:border-white hover:text-white transition rounded-sm">
                        + {p.length > 30 ? p.slice(0, 28) + '…' : p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Gifts */}
                <div className="border border-[#252525] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-[8px] tracking-widest uppercase font-bold">COMPLIMENTARY GIFTS & BONUSES</p>
                    <span className="text-gray-500 text-[8px] border border-[#333] px-2 py-0.5 rounded-sm">{gifts.length} Gifts</span>
                  </div>
                  <p className="text-gray-600 text-[8px] mb-3">Free gifts and value additions provided to client.</p>
                  <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-1">
                    {gifts.map((g, i) => (
                      <div key={i} className="flex items-center gap-2 border border-[#252525] p-2 rounded-sm">
                        <span className="text-white text-xs shrink-0">🎁</span>
                        <p className="text-gray-300 text-[10px] flex-1">{g}</p>
                        <button type="button" onClick={() => setGifts(p => p.filter((_, j) => j !== i))} className="text-gray-700 hover:text-red-400 transition shrink-0"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 mb-3">
                    <input value={newGift} onChange={e => setNewGift(e.target.value)} placeholder="e.g. Table Photo Calendar" className={inputCls + ' flex-1 text-xs'} />
                    <button type="button" onClick={() => { if (newGift.trim()) { setGifts(p => [...p, newGift.trim()]); setNewGift(''); } }} className="bg-white text-black px-3 py-1 text-xs font-bold hover:bg-gray-200 transition rounded-sm">ADD</button>
                  </div>
                  <p className="text-gray-600 text-[7px] tracking-widest uppercase mb-2">QUICK PRESETS</p>
                  <div className="flex flex-wrap gap-1">
                    {GIFT_PRESETS.map(p => (
                      <button key={p} type="button" onClick={() => !gifts.includes(p) && setGifts(prev => [...prev, p])}
                        className="text-[8px] border border-[#333] text-gray-500 px-2 py-0.5 hover:border-white hover:text-white transition rounded-sm">
                        + {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: FINANCIAL SUMMARY ────────────────────────────────────── */}
          {step === 4 && (
            <div>
              <h3 className="text-white text-[10px] tracking-widest uppercase font-bold mb-5">
                STEP 5: DISCOUNT & FINANCIAL PROPOSAL SUMMARY
              </h3>
              <div className="grid grid-cols-2 gap-5">
                {/* Discount panel */}
                <div className="border border-[#252525] p-5">
                  <p className="text-white text-[8px] tracking-widest uppercase font-bold mb-4">ADMINISTRATIVE DISCOUNT</p>
                  <p className={labelCls}>Discount Type</p>
                  <div className="flex gap-0 mb-4">
                    {[['flat', 'FLAT AMOUNT (₹)'], ['percent', 'PERCENTAGE (%)']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setDiscountType(val)}
                        className={`flex-1 py-2 text-[9px] tracking-widest uppercase border transition font-bold
                          ${discountType === val ? 'bg-white border-white text-black' : 'border-[#333] text-gray-500 hover:border-[#555]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className={labelCls}>Discount Amount {discountType === 'flat' ? '(₹)' : '(%)'}</p>
                  <div className="flex items-center border border-[#2a2a2a] rounded-sm overflow-hidden">
                    <span className="px-3 text-gray-600 text-sm">{discountType === 'flat' ? '₹' : '%'}</span>
                    <input type="number" min="0" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="e.g. 20000" className="flex-1 bg-[#111] py-2.5 text-white text-sm outline-none pr-3" />
                  </div>
                  <p className="text-gray-600 text-[8px] mt-2 leading-relaxed">Add discounts directly inside the wizard. Both the client and the admin will receive the updated estimate in the generated proposal PDF.</p>
                </div>

                {/* Summary panel */}
                <div className="border border-[#252525] p-5">
                  <p className="text-white text-[9px] tracking-widest uppercase font-bold mb-4">FINANCIAL BREAKDOWN SUMMARY</p>
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Base Package Subtotal:</span>
                      <span className="text-white">{fmt(basePrice)}</span>
                    </div>
                    {discountValue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Applied Discount:</span>
                        <span className="text-rose-400">-{fmt(discountValue)}</span>
                      </div>
                    )}
                    <div className="border-t border-[#252525] pt-3">
                      <p className="text-gray-500 text-[8px] uppercase tracking-widest mb-1">NEW FINAL ESTIMATE</p>
                      <p className="text-white font-mirage text-3xl">{fmt(finalTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary note */}
              <div className="border border-[#252525] p-4 mt-4">
                <p className="text-gray-500 text-[9px] leading-relaxed">
                  <span className="text-gray-300">QUOTATION SUMMARY REVIEW: </span>
                  This action will create and file a new administrative quotation lead for{' '}
                  <span className="text-white font-semibold">{coords.name || 'the client'}</span>. You can choose to save the quotation directly or dispatch revised PDF proposal copies automatically via email.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 border border-[#333] text-gray-400 hover:text-white px-4 py-2 text-xs tracking-widest uppercase hover:border-[#555] transition rounded-sm">
                <ChevronLeft size={12} /> BACK
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="border border-[#333] text-gray-400 hover:text-white px-4 py-2 text-xs tracking-widest uppercase hover:border-[#555] transition rounded-sm">
              CANCEL
            </button>
            {step < 4 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} disabled={step === 0 && (!coords.name || !coords.email || !coords.phone)}
                className="bg-white text-black px-5 py-2 text-xs tracking-widest uppercase font-bold hover:bg-neutral-200 transition disabled:opacity-40 flex items-center gap-1.5 rounded-sm">
                NEXT <ChevronRight size={12} />
              </button>
            ) : (
              <>
                <button type="button" onClick={() => handleSave(false)} disabled={saving}
                  className="border border-white text-white px-4 py-2 text-xs tracking-widest uppercase hover:bg-white/10 transition flex items-center gap-1.5 rounded-sm">
                  <FileText size={11} /> SAVE QUOTE ONLY
                </button>
                <button type="button" onClick={() => handleSave(true)} disabled={saving}
                  className="bg-white text-black px-5 py-2 text-xs tracking-widest uppercase font-bold hover:bg-neutral-200 transition flex items-center gap-1.5 disabled:opacity-40 rounded-sm">
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
                  SAVE & EMAIL PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: QUOTES PANEL
// ─────────────────────────────────────────────────────────────────────────────

const QuotesPanel = () => {
  const [quotes, setQuotes]           = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [updatingId, setUpdatingId]   = useState(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/quotes?page=${page}&limit=20`, authHeaders());
      let data = res.data.quotes || [];

      // Client-side search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter(r =>
          r.clientName?.toLowerCase().includes(q) ||
          r._id?.toLowerCase().includes(q)
        );
      }

      // Client-side date filter
      if (dateFrom || dateTo) {
        data = data.filter(r => {
          const d = new Date(r.eventDate || r.createdAt);
          if (dateFrom && d < new Date(dateFrom)) return false;
          if (dateTo   && d > new Date(dateTo))   return false;
          return true;
        });
      }

      setQuotes(data);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch { setQuotes([]); }
    finally { setLoading(false); }
  }, [page, search, dateFrom, dateTo]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await axios.patch(`${API}/quotes/${id}`, { status }, authHeaders());
      setQuotes(prev => prev.map(q => q._id === id ? { ...q, status } : q));
    } catch { alert('Update failed.'); }
    finally { setUpdatingId(null); }
  };

  const downloadPdf = async (id) => {
    try {
      const res = await axios.get(`${API}/quotes/${id}/pdf`, { ...authHeaders(), responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `Quote_${shortId(id)}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('PDF download failed.'); }
  };

  const deleteQuote = async (id) => {
    if (!window.confirm('Delete this quote? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/quotes/${id}`, authHeaders());
      fetchQuotes();
    } catch { alert('Delete failed.'); }
  };

  const exportCsv = () => {
    const rows = [
      ['Lead ID', 'Client Name', 'Email', 'Phone', 'Event Date', 'Events', 'Estimate', 'Status', 'Created'],
      ...quotes.map(q => [
        shortId(q._id),
        q.clientName || '',
        q.email || '',
        q.phone || '',
        q.eventDate || '',
        (q.events || []).map(e => e.eventType).join(', '),
        q.total || 0,
        q.status || '',
        new Date(q.createdAt).toLocaleDateString('en-IN'),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'quote_inquiries.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-white text-xl font-light">Quote Inquiries</h2>
          <p className="text-gray-500 text-xs mt-0.5">Review and manage incoming leads from your Quote Wizard.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 border border-white text-white px-4 py-2 text-xs tracking-widest uppercase hover:bg-white hover:text-black transition rounded-sm font-bold">
            <Plus size={12} /> CREATE QUOTE
          </button>
          <button type="button" onClick={exportCsv}
            className="flex items-center gap-1.5 border border-[#333] text-gray-400 px-4 py-2 text-xs tracking-widest uppercase hover:border-[#555] hover:text-white transition rounded-sm">
            <Download size={12} /> EXPORT CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search by client name or ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#0d0d0d] border border-[#252525] pl-8 pr-3 py-2.5 text-white text-xs focus:border-white/40 outline-none transition rounded-sm placeholder:text-[#444]"
          />
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="bg-[#0d0d0d] border border-[#252525] px-3 py-2.5 text-gray-400 text-xs focus:border-white/40 outline-none transition rounded-sm" />
        <span className="text-gray-600 text-xs">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="bg-[#0d0d0d] border border-[#252525] px-3 py-2.5 text-gray-400 text-xs focus:border-white/40 outline-none transition rounded-sm" />
      </div>

      {/* Table */}
      <div className="border border-[#1a1a1a] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a1a1a] text-gray-600 text-[9px] uppercase tracking-widest">
              <th className="px-4 py-3 text-left">Lead ID</th>
              <th className="px-4 py-3 text-left">Client Name</th>
              <th className="px-4 py-3 text-left">Event Date</th>
              <th className="px-4 py-3 text-left">Selected Events</th>
              <th className="px-4 py-3 text-right">Estimate</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-600">
                <Loader2 size={20} className="animate-spin mx-auto mb-2 text-white" />
                <p className="text-xs">Loading quotes…</p>
              </td></tr>
            ) : quotes.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-600 text-xs">
                No quote inquiries yet. Create one or share the public wizard link.
              </td></tr>
            ) : quotes.map(q => (
              <tr key={q._id} className="border-b border-[#0f0f0f] hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">
                  <span className="text-white text-[10px] font-mono">{shortId(q._id)}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white text-[11px] font-medium">{q.clientName}</p>
                  <p className="text-gray-600 text-[9px]">{new Date(q.createdAt).toLocaleDateString('en-IN')} {new Date(q.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</p>
                </td>
                <td className="px-4 py-3 text-gray-400 text-[10px]">
                  {q.eventDate ? new Date(q.eventDate).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-white/80 text-[9px] uppercase tracking-wide">
                    {(q.events || []).map(e => e.eventType).join(', ').slice(0, 40) || '—'}
                    {(q.events || []).map(e => e.eventType).join(', ').length > 40 ? '…' : ''}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-white text-[11px] font-medium">
                  {fmt(q.total)}
                </td>
                <td className="px-4 py-3">
                  <div className="relative inline-block">
                    <select
                      value={q.status || 'new'}
                      onChange={e => updateStatus(q._id, e.target.value)}
                      disabled={updatingId === q._id}
                      className={`appearance-none border px-3 pr-6 py-1 text-[9px] tracking-widest uppercase bg-transparent cursor-pointer outline-none transition rounded-sm
                        ${STATUS_COLORS[q.status] || 'text-gray-400 border-gray-500/40'}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#111] text-white">{s.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown size={8} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button title="Download PDF" onClick={() => downloadPdf(q._id)} className="text-gray-600 hover:text-white transition"><Download size={13} /></button>
                    <button title="Delete" onClick={() => deleteQuote(q._id)} className="text-gray-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{total} total quotes</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="border border-[#252525] p-1.5 hover:border-[#555] transition disabled:opacity-30 rounded-sm">
              <ChevronLeft size={12} />
            </button>
            <span className="border border-[#252525] px-3 py-1 text-white rounded-sm">{page} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="border border-[#252525] p-1.5 hover:border-[#555] transition disabled:opacity-30 rounded-sm">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Create Quote Modal */}
      {showCreate && (
        <CreateQuoteModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { fetchQuotes(); }}
        />
      )}
    </div>
  );
};

export default QuotesPanel;
