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
  new:       'text-sky-700 bg-sky-50 border-sky-300 font-semibold',
  contacted: 'text-blue-700 bg-blue-50 border-blue-300 font-semibold',
  converted: 'text-emerald-700 bg-emerald-50 border-emerald-300 font-semibold',
  closed:    'text-rose-700 bg-rose-50 border-rose-300 font-semibold',
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
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all shadow-xs
              ${done ? 'bg-black border-black text-white' : active ? 'border-black bg-black text-white' : 'border-black/20 bg-neutral-100 text-neutral-500'}`}>
              {done ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-[9px] leading-tight tracking-widest uppercase whitespace-pre-line font-bold
              ${active ? 'text-[#0f0f12]' : done ? 'text-neutral-700' : 'text-neutral-400'}`}>
              {label}
            </span>
          </div>
          {i < WIZARD_STEPS.length - 1 && (
            <div className={`h-px mx-3 transition-colors shrink-0 ${done || active ? 'bg-black' : 'bg-black/10'}`} style={{ width: 24 }} />
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

  const inputCls = 'w-full bg-neutral-50 border border-black/15 px-3.5 py-2.5 text-[#0f0f12] text-xs font-medium focus:bg-white focus:border-black outline-none transition rounded-xl placeholder:text-neutral-400 [color-scheme:light] shadow-xs';
  const labelCls = 'block text-[10px] text-neutral-600 font-bold uppercase tracking-widest mb-1.5';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-black/10 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-[#0f0f12]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-black/10">
          <div>
            <h2 className="text-[#0f0f12] text-xl font-mirage font-bold uppercase tracking-widest">Create Custom Quotation</h2>
            <p className="text-neutral-500 text-[10px] tracking-widest uppercase mt-0.5 font-bold">ADMINISTRATIVE QUOTATION WIZARD</p>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-black transition p-1.5 rounded-xl hover:bg-neutral-100"><X size={18} /></button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-5">
          <WizardProgress step={step} />
        </div>

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">

          {/* ── STEP 1: COORDINATES ─────────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <h3 className="text-[#0f0f12] text-xs tracking-widest uppercase font-bold mb-5">
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
                    {DELIVERY_OPTIONS.map(o => <option key={o} className="bg-white text-[#0f0f12]">{o}</option>)}
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
                <h3 className="text-[#0f0f12] text-xs tracking-widest uppercase font-bold">
                  STEP 2: EVENTS & SERVICE CUSTOMIZATIONS
                </h3>
                <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">BASE PRICE: {fmt(basePrice)}</span>
              </div>

              {/* Primary category */}
              <div className="mb-5">
                <p className={labelCls}>Primary Service Category</p>
                <div className="flex flex-wrap gap-2">
                  {[...PRIMARY_CATEGORIES, ...extraCats].map(cat => (
                    <button key={cat} type="button" onClick={() => setPrimaryCat(cat)}
                      className={`px-4 py-2 border text-xs tracking-widest uppercase transition rounded-xl
                        ${primaryCat === cat ? 'bg-black border-black text-white font-bold shadow-xs' : 'border-black/15 bg-neutral-50 text-neutral-700 hover:border-black/40 font-medium'}`}>
                      {cat}
                    </button>
                  ))}
                  <div className="flex gap-1">
                    <input value={newCatInput} onChange={e => setNewCatInput(e.target.value)} placeholder="+ Add Category" className="bg-neutral-50 border border-black/15 px-3 py-2 text-xs text-[#0f0f12] outline-none rounded-xl w-36 placeholder:text-neutral-400" />
                    <button type="button" onClick={() => { if (newCatInput.trim()) { setExtraCats(p => [...p, newCatInput.trim()]); setNewCatInput(''); } }} className="border border-black bg-black text-white px-3 text-xs hover:bg-neutral-800 font-bold transition rounded-xl shadow-xs">+</button>
                  </div>
                </div>
              </div>

              {/* Sub-events */}
              <div className="mb-5">
                <p className={labelCls}>Select Sub-Events / Celebrations ({primaryCat})</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[...ALL_SUB_EVENTS, ...extraSubs].map(sub => {
                    const checked = selectedSubs.includes(sub);
                    return (
                      <label key={sub} className={`flex items-center gap-2 border px-3 py-2 cursor-pointer transition rounded-xl text-xs
                        ${checked ? 'border-black bg-black/5 text-[#0f0f12] font-bold shadow-xs' : 'border-black/15 bg-neutral-50 text-neutral-600 hover:border-black/30'}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleSub(sub)} className="accent-black w-3.5 h-3.5 shrink-0" />
                        {sub}
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  <input value={newSubInput} onChange={e => setNewSubInput(e.target.value)} placeholder="+ Add Sub-Event" className="bg-neutral-50 border border-black/15 px-3 py-2 text-xs text-[#0f0f12] outline-none rounded-xl w-44 placeholder:text-neutral-400" />
                  <button type="button" onClick={() => { if (newSubInput.trim()) { setExtraSubs(p => [...p, newSubInput.trim()]); setNewSubInput(''); } }} className="border border-black bg-black text-white px-3 py-2 text-xs hover:bg-neutral-800 font-bold transition rounded-xl shadow-xs">+ ADD</button>
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
                        <div key={sub} className="border border-black/10 rounded-2xl overflow-hidden bg-neutral-50/50 shadow-xs">
                          {/* Sub-event header */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-100/80 border-b border-black/10">
                            <span className="text-[#0f0f12] text-xs font-bold tracking-wider uppercase">• {sub}</span>
                            <div className="flex gap-1">
                              {['half', 'full'].map(dur => (
                                <button key={dur} type="button" onClick={() => updateSubConfig(sub, 'duration', dur)}
                                  className={`px-3 py-1 text-[9px] tracking-widest uppercase border transition rounded-lg font-bold
                                    ${cfg.duration === dur ? 'bg-black border-black text-white' : 'border-black/20 bg-white text-neutral-600 hover:border-black/40'}`}>
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
                                <tr className="text-neutral-500 text-[9px] uppercase tracking-widest border-b border-black/10 font-bold">
                                  <th className="py-2 text-left w-8">Enable</th>
                                  <th className="py-2 text-left">Service Name</th>
                                  <th className="py-2 text-center w-14">Qty</th>
                                  <th className="py-2 text-right w-28">Unit Price (₹)</th>
                                  <th className="py-2 text-right w-24">Subtotal</th>
                                  <th className="w-6" />
                                </tr>
                              </thead>
                              <tbody>
                                {(cfg.services || []).map((svc, idx) => (
                                  <tr key={idx} className="border-b border-black/5 text-[#0f0f12]">
                                    <td className="py-2">
                                      <input type="checkbox" checked={svc.enabled || false} onChange={() => toggleSubService(sub, idx)} className="accent-black w-3.5 h-3.5" />
                                    </td>
                                    <td className="py-2 font-medium text-neutral-800">{svc.name}</td>
                                    <td className="py-2 text-center">
                                      <input type="number" min="0" value={svc.qty === 0 || svc.qty === '0' || !svc.qty ? '' : svc.qty} placeholder="0" onChange={e => updateSubService(sub, idx, 'qty', e.target.value === '' ? 0 : Number(e.target.value))}
                                        className="w-12 bg-white border border-black/20 text-[#0f0f12] text-center text-xs py-1 outline-none rounded-lg font-semibold shadow-xs" />
                                    </td>
                                    <td className="py-2 text-right">
                                      <input type="number" min="0" value={svc.unitPrice === 0 || svc.unitPrice === '0' || !svc.unitPrice ? '' : svc.unitPrice} placeholder="0" onChange={e => updateSubService(sub, idx, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                                        className="w-24 bg-white border border-black/20 text-[#0f0f12] text-right text-xs py-1 outline-none rounded-lg pr-2 font-semibold shadow-xs" />
                                    </td>
                                    <td className="py-2 text-right font-bold text-[#0f0f12]">{fmt((svc.qty || 0) * (svc.unitPrice || 0))}</td>
                                    <td className="py-2 text-right">
                                      <button type="button" onClick={() => removeService(sub, idx)} className="text-neutral-400 hover:text-rose-600 transition"><Trash2 size={13} /></button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <button type="button" onClick={() => addCustomService(sub)}
                              className="mt-3 text-[#0f0f12] text-[10px] font-bold uppercase border border-black/20 bg-white px-3 py-1.5 hover:bg-neutral-100 transition rounded-xl shadow-xs">
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
                <h3 className="text-[#0f0f12] text-xs tracking-widest uppercase font-bold">
                  STEP 3: ALBUMS & DELIVERABLES SELECTION
                </h3>
                <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">BASE PRICE: {fmt(basePrice)}</span>
              </div>

              {/* Three dropdowns */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="border border-black/10 bg-neutral-50 p-4 rounded-2xl shadow-xs">
                  <p className="text-neutral-800 text-[9px] tracking-widest uppercase font-bold mb-1">PRE-WEDDING STYLE</p>
                  <p className={labelCls}>Style Package</p>
                  <select value={prewedStyle} onChange={e => setPrewedStyle(e.target.value)} className={inputCls + ' appearance-none'}>
                    {PREWEDDING_STYLES.map(o => <option key={o} className="bg-white text-[#0f0f12]">{o}</option>)}
                  </select>
                </div>
                <div className="border border-black/10 bg-neutral-50 p-4 rounded-2xl shadow-xs">
                  <p className="text-neutral-800 text-[9px] tracking-widest uppercase font-bold mb-1">POST-PRODUCTION FILM STYLE</p>
                  <p className={labelCls}>Video Editing Style</p>
                  <select value={postprodStyle} onChange={e => setPostprodStyle(e.target.value)} className={inputCls + ' appearance-none'}>
                    {POSTPROD_STYLES.map(o => <option key={o} className="bg-white text-[#0f0f12]">{o}</option>)}
                  </select>
                </div>
                <div className="border border-black/10 bg-neutral-50 p-4 rounded-2xl shadow-xs">
                  <p className="text-neutral-800 text-[9px] tracking-widest uppercase font-bold mb-1">PRIMARY PHOTO ALBUM</p>
                  <p className={labelCls}>Album Quality / Style</p>
                  <select value={albumStyle} onChange={e => setAlbumStyle(e.target.value)} className={inputCls + ' appearance-none'}>
                    {ALBUM_STYLES.map(o => <option key={o} className="bg-white text-[#0f0f12]">{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Extra albums */}
              <div className="border border-black/10 bg-neutral-50 p-5 rounded-2xl shadow-xs mb-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[#0f0f12] text-[9px] tracking-widest uppercase font-bold">ADDITIONAL / EXTRA PHOTO ALBUMS</p>
                  <button type="button" onClick={() => setExtraAlbums(p => [...p, { name: 'Custom Album', sheets: 30, price: 0 }])}
                    className="border border-black/20 bg-white text-[#0f0f12] font-bold text-[10px] px-3 py-1.5 hover:bg-neutral-100 transition rounded-xl shadow-xs">
                    + ADD EXTRA ALBUM
                  </button>
                </div>
                <p className="text-neutral-500 text-[10px] mb-3 font-medium">Add extra parent albums, mini photo books, or guest albums.</p>
                {extraAlbums.length === 0 ? (
                  <p className="text-center text-neutral-400 text-xs py-4 border border-dashed border-black/20 rounded-xl bg-white font-medium">
                    No extra albums added yet. Click + Add Extra Album to include additional photo albums.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {extraAlbums.map((a, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input value={a.name} onChange={e => setExtraAlbums(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={inputCls + ' flex-1'} />
                        <input type="number" value={a.price || ''} placeholder="Price ₹" onChange={e => setExtraAlbums(p => p.map((x, j) => j === i ? { ...x, price: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={inputCls + ' w-32'} />
                        <button type="button" onClick={() => setExtraAlbums(p => p.filter((_, j) => j !== i))} className="text-neutral-400 hover:text-rose-600 transition p-1"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add-ons table */}
              <div className="border border-black/10 bg-neutral-50 p-5 rounded-2xl shadow-xs">
                <p className={labelCls}>Luxury Event Extras & Add-Ons</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-neutral-500 text-[9px] uppercase tracking-widest border-b border-black/10 font-bold">
                      <th className="py-2 text-left w-8">Enable</th>
                      <th className="py-2 text-left">Add-On Deliverable</th>
                      <th className="py-2 text-center w-20">Quantity</th>
                      <th className="py-2 text-right w-32">Package Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ADDON_LIST.map(ao => (
                      <tr key={ao.id} className="border-b border-black/5 text-[#0f0f12]">
                        <td className="py-2.5">
                          <input type="checkbox" checked={addonSel[ao.id] || false} onChange={() => setAddonSel(p => ({ ...p, [ao.id]: !p[ao.id] }))} className="accent-black w-3.5 h-3.5" />
                        </td>
                        <td className="py-2.5 font-medium text-neutral-800">{ao.name}</td>
                        <td className="py-2.5 text-center text-neutral-500">
                          {ao.defaultQty ? (
                            <input type="number" min={ao.defaultQty} value={addonQtys[ao.id] || ''} placeholder={String(ao.defaultQty)} onChange={e => setAddonQtys(p => ({ ...p, [ao.id]: e.target.value === '' ? 0 : Number(e.target.value) }))}
                              className="w-14 bg-white border border-black/20 text-[#0f0f12] text-center text-xs py-1 outline-none rounded-lg font-semibold shadow-xs" />
                          ) : '—'}
                        </td>
                        <td className="py-2.5 text-right font-bold text-[#0f0f12]">{ao.price.toLocaleString('en-IN')}</td>
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
                <h3 className="text-[#0f0f12] text-xs tracking-widest uppercase font-bold">
                  STEP 4: DELIVERABLES & COMPLIMENTARIES
                </h3>
                <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">BASE PRICE: {fmt(basePrice)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Left: Deliverables */}
                <div className="border border-black/10 bg-neutral-50 p-5 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#0f0f12] text-[9px] tracking-widest uppercase font-bold">INCLUDED DELIVERABLES</p>
                    <span className="text-neutral-600 text-[9px] bg-white border border-black/15 px-2.5 py-0.5 rounded-lg font-bold shadow-xs">{deliverables.length} Items</span>
                  </div>
                  <p className="text-neutral-500 text-[10px] mb-3 font-medium">Final items and media handover promised to client.</p>
                  <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-1">
                    {deliverables.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 border border-black/10 bg-white p-2.5 rounded-xl shadow-xs">
                        <span className="text-black font-bold text-xs shrink-0 mt-0.5">•</span>
                        <p className="text-neutral-800 text-[11px] leading-relaxed flex-1 font-medium">{d}</p>
                        <button type="button" onClick={() => setDeliverables(p => p.filter((_, j) => j !== i))} className="text-neutral-400 hover:text-rose-600 transition shrink-0 p-0.5"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mb-3">
                    <input value={newDeliv} onChange={e => setNewDeliv(e.target.value)} placeholder="e.g. 1-Minute Drone Teaser in 4K" className={inputCls + ' flex-1 text-xs'} />
                    <button type="button" onClick={() => { if (newDeliv.trim()) { setDeliverables(p => [...p, newDeliv.trim()]); setNewDeliv(''); } }} className="bg-black text-white px-3.5 py-2 text-xs font-bold hover:bg-neutral-800 transition rounded-xl shadow-xs uppercase">ADD</button>
                  </div>
                  <p className="text-neutral-500 text-[8px] tracking-widest uppercase font-bold mb-2">QUICK PRESETS</p>
                  <div className="flex flex-wrap gap-1">
                    {DELIVERABLE_PRESETS.map(p => (
                      <button key={p} type="button" onClick={() => !deliverables.includes(p) && setDeliverables(prev => [...prev, p])}
                        className="text-[9px] border border-black/15 bg-white text-neutral-700 px-2.5 py-1 hover:border-black hover:text-black transition rounded-lg font-medium shadow-xs">
                        + {p.length > 30 ? p.slice(0, 28) + '…' : p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Gifts */}
                <div className="border border-black/10 bg-neutral-50 p-5 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#0f0f12] text-[9px] tracking-widest uppercase font-bold">COMPLIMENTARY GIFTS & BONUSES</p>
                    <span className="text-neutral-600 text-[9px] bg-white border border-black/15 px-2.5 py-0.5 rounded-lg font-bold shadow-xs">{gifts.length} Gifts</span>
                  </div>
                  <p className="text-neutral-500 text-[10px] mb-3 font-medium">Free gifts and value additions provided to client.</p>
                  <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-1">
                    {gifts.map((g, i) => (
                      <div key={i} className="flex items-center gap-2 border border-black/10 bg-white p-2.5 rounded-xl shadow-xs">
                        <span className="text-xs shrink-0">🎁</span>
                        <p className="text-neutral-800 text-[11px] flex-1 font-medium">{g}</p>
                        <button type="button" onClick={() => setGifts(p => p.filter((_, j) => j !== i))} className="text-neutral-400 hover:text-rose-600 transition shrink-0 p-0.5"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mb-3">
                    <input value={newGift} onChange={e => setNewGift(e.target.value)} placeholder="e.g. Table Photo Calendar" className={inputCls + ' flex-1 text-xs'} />
                    <button type="button" onClick={() => { if (newGift.trim()) { setGifts(p => [...p, newGift.trim()]); setNewGift(''); } }} className="bg-black text-white px-3.5 py-2 text-xs font-bold hover:bg-neutral-800 transition rounded-xl shadow-xs uppercase">ADD</button>
                  </div>
                  <p className="text-neutral-500 text-[8px] tracking-widest uppercase font-bold mb-2">QUICK PRESETS</p>
                  <div className="flex flex-wrap gap-1">
                    {GIFT_PRESETS.map(p => (
                      <button key={p} type="button" onClick={() => !gifts.includes(p) && setGifts(prev => [...prev, p])}
                        className="text-[9px] border border-black/15 bg-white text-neutral-700 px-2.5 py-1 hover:border-black hover:text-black transition rounded-lg font-medium shadow-xs">
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
              <h3 className="text-[#0f0f12] text-xs tracking-widest uppercase font-bold mb-5">
                STEP 5: DISCOUNT & FINANCIAL PROPOSAL SUMMARY
              </h3>
              <div className="grid grid-cols-2 gap-5">
                {/* Discount panel */}
                <div className="border border-black/10 bg-neutral-50 p-5 rounded-2xl shadow-xs">
                  <p className="text-[#0f0f12] text-[9px] tracking-widest uppercase font-bold mb-4">ADMINISTRATIVE DISCOUNT</p>
                  <p className={labelCls}>Discount Type</p>
                  <div className="flex gap-1 mb-4">
                    {[['flat', 'FLAT AMOUNT (₹)'], ['percent', 'PERCENTAGE (%)']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setDiscountType(val)}
                        className={`flex-1 py-2 text-[9px] tracking-widest uppercase border transition rounded-xl font-bold
                          ${discountType === val ? 'bg-black border-black text-white shadow-xs' : 'border-black/15 bg-white text-neutral-600 hover:border-black/30'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className={labelCls}>Discount Amount {discountType === 'flat' ? '(₹)' : '(%)'}</p>
                  <div className="flex items-center border border-black/20 bg-white rounded-xl overflow-hidden shadow-xs">
                    <span className="px-3.5 text-neutral-500 font-bold text-sm">{discountType === 'flat' ? '₹' : '%'}</span>
                    <input type="number" min="0" value={discountAmount || ''} onChange={e => setDiscountAmount(e.target.value)} placeholder="e.g. 20000" className="flex-1 py-2.5 text-[#0f0f12] font-semibold text-sm outline-none pr-3 bg-transparent" />
                  </div>
                  <p className="text-neutral-500 text-[10px] mt-3 leading-relaxed font-medium">Add discounts directly inside the wizard. Both the client and the admin will receive the updated estimate in the generated proposal PDF.</p>
                </div>

                {/* Summary panel */}
                <div className="border border-black/10 bg-neutral-50 p-5 rounded-2xl shadow-xs">
                  <p className="text-[#0f0f12] text-[9px] tracking-widest uppercase font-bold mb-4">FINANCIAL BREAKDOWN SUMMARY</p>
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 font-medium">Base Package Subtotal:</span>
                      <span className="text-[#0f0f12] font-bold">{fmt(basePrice)}</span>
                    </div>
                    {discountValue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600 font-medium">Applied Discount:</span>
                        <span className="text-rose-600 font-bold">-{fmt(discountValue)}</span>
                      </div>
                    )}
                    <div className="border-t border-black/10 pt-3">
                      <p className="text-neutral-500 text-[9px] uppercase tracking-widest mb-1 font-bold">NEW FINAL ESTIMATE</p>
                      <p className="text-[#0f0f12] font-mirage text-3xl font-bold">{fmt(finalTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary note */}
              <div className="border border-black/10 bg-neutral-100/60 p-4 rounded-2xl mt-4">
                <p className="text-neutral-600 text-xs leading-relaxed font-medium">
                  <span className="text-neutral-900 font-bold uppercase tracking-wider text-[10px]">QUOTATION SUMMARY REVIEW: </span>
                  This action will create and file a new administrative quotation lead for{' '}
                  <span className="text-black font-bold">{coords.name || 'the client'}</span>. You can choose to save the quotation directly or dispatch revised PDF proposal copies automatically via email.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-black/10 px-6 py-4 flex items-center justify-between bg-neutral-50/50 rounded-b-3xl">
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 px-4 py-2.5 text-xs tracking-widest uppercase font-bold transition rounded-xl shadow-xs">
                <ChevronLeft size={14} /> BACK
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 px-4 py-2.5 text-xs tracking-widest uppercase font-bold transition rounded-xl shadow-xs">
              CANCEL
            </button>
            {step < 4 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} disabled={step === 0 && (!coords.name || !coords.email || !coords.phone)}
                className="bg-black text-white hover:bg-neutral-800 px-6 py-2.5 text-xs tracking-widest uppercase font-bold transition disabled:opacity-40 flex items-center gap-1.5 rounded-xl shadow-xs">
                NEXT <ChevronRight size={14} />
              </button>
            ) : (
              <>
                <button type="button" onClick={() => handleSave(false)} disabled={saving}
                  className="border border-black bg-white text-[#0f0f12] hover:bg-neutral-100 px-5 py-2.5 text-xs tracking-widest uppercase font-bold transition flex items-center gap-1.5 rounded-xl shadow-xs">
                  <FileText size={13} /> SAVE QUOTE ONLY
                </button>
                <button type="button" onClick={() => handleSave(true)} disabled={saving}
                  className="bg-black text-white hover:bg-neutral-800 px-6 py-2.5 text-xs tracking-widest uppercase font-bold transition flex items-center gap-1.5 disabled:opacity-40 rounded-xl shadow-xs">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-2xl border border-black/10 shadow-xs gap-4">
        <div>
          <h2 className="text-[#0f0f12] text-xl font-mirage uppercase tracking-widest font-bold">Quote Inquiries</h2>
          <p className="text-neutral-500 text-xs mt-1 font-sans font-medium">Review and manage incoming leads from your Quote Wizard.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-black text-white px-4 py-2.5 text-xs tracking-widest uppercase hover:bg-neutral-800 transition rounded-xl font-bold shadow-xs">
            <Plus size={12} /> CREATE QUOTE
          </button>
          <button type="button" onClick={exportCsv}
            className="flex items-center gap-1.5 border border-black/20 bg-white text-[#0f0f12] px-4 py-2.5 text-xs tracking-widest font-bold uppercase hover:bg-neutral-100 transition rounded-xl shadow-xs">
            <Download size={12} /> EXPORT CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by client name or ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white border border-black/20 pl-9 pr-3 py-2.5 text-[#0f0f12] text-xs focus:border-black outline-none transition rounded-xl placeholder:text-neutral-400 [color-scheme:light] shadow-xs font-medium"
          />
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="bg-white border border-black/20 px-3 py-2.5 text-[#0f0f12] text-xs focus:border-black outline-none transition rounded-xl [color-scheme:light] shadow-xs font-semibold" />
        <span className="text-neutral-500 text-xs font-bold uppercase">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="bg-white border border-black/20 px-3 py-2.5 text-[#0f0f12] text-xs focus:border-black outline-none transition rounded-xl [color-scheme:light] shadow-xs font-semibold" />
      </div>

      {/* Table */}
      <div className="border border-black/10 bg-white rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-neutral-500 text-[10px] uppercase tracking-widest font-bold bg-neutral-50">
              <th className="px-4 py-3.5 text-left">Lead ID</th>
              <th className="px-4 py-3.5 text-left">Client Name</th>
              <th className="px-4 py-3.5 text-left">Event Date</th>
              <th className="px-4 py-3.5 text-left">Selected Events</th>
              <th className="px-4 py-3.5 text-right">Estimate</th>
              <th className="px-4 py-3.5 text-left">Status</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-[#0f0f12]">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-neutral-500">
                <Loader2 size={20} className="animate-spin mx-auto mb-2 text-black" />
                <p className="text-xs font-bold uppercase tracking-widest">Loading quotes…</p>
              </td></tr>
            ) : quotes.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-neutral-400 text-xs font-bold uppercase tracking-widest">
                No quote inquiries yet. Create one or share the public wizard link.
              </td></tr>
            ) : quotes.map(q => (
              <tr key={q._id} className="border-b border-black/5 hover:bg-neutral-50/80 transition text-[#0f0f12]">
                <td className="px-4 py-3.5">
                  <span className="text-[#0f0f12] text-[11px] font-mono font-bold bg-neutral-100 px-2 py-1 rounded-lg border border-black/10">{shortId(q._id)}</span>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-[#0f0f12] text-xs font-bold">{q.clientName}</p>
                  <p className="text-neutral-500 text-[10px] font-medium">{new Date(q.createdAt).toLocaleDateString('en-IN')} {new Date(q.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</p>
                </td>
                <td className="px-4 py-3.5 text-neutral-700 text-xs font-semibold">
                  {q.eventDate ? new Date(q.eventDate).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-neutral-700 text-xs font-medium uppercase tracking-wide">
                    {(q.events || []).map(e => e.eventType).join(', ').slice(0, 40) || '—'}
                    {(q.events || []).map(e => e.eventType).join(', ').length > 40 ? '…' : ''}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-[#0f0f12] text-xs font-bold font-mono">
                  {fmt(q.total)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="relative inline-block">
                    <select
                      value={q.status || 'new'}
                      onChange={e => updateStatus(q._id, e.target.value)}
                      disabled={updatingId === q._id}
                      className={`appearance-none border px-3 pr-7 py-1 text-[10px] tracking-widest uppercase cursor-pointer outline-none transition rounded-lg font-bold shadow-xs
                        ${STATUS_COLORS[q.status] || 'text-neutral-600 bg-neutral-100 border-neutral-300'}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-white text-[#0f0f12]">{s.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current" />
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <button title="Download PDF" onClick={() => downloadPdf(q._id)} className="text-neutral-500 hover:text-black transition p-1.5 rounded-lg hover:bg-neutral-100"><Download size={14} /></button>
                    <button title="Delete" onClick={() => deleteQuote(q._id)} className="text-neutral-500 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-neutral-100"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
          <span>{total} total quotes</span>
          <div className="flex gap-1.5 items-center">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="border border-black/15 bg-white text-[#0f0f12] p-2 hover:bg-neutral-100 transition disabled:opacity-30 rounded-xl shadow-xs">
              <ChevronLeft size={14} />
            </button>
            <span className="border border-black/15 bg-white text-[#0f0f12] font-bold px-3.5 py-1.5 rounded-xl shadow-xs text-xs">{page} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="border border-black/15 bg-white text-[#0f0f12] p-2 hover:bg-neutral-100 transition disabled:opacity-30 rounded-xl shadow-xs">
              <ChevronRight size={14} />
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
