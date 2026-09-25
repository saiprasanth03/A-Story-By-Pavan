import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { siteConfig } from '../config/site.config';

const Book = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialService = searchParams.get('service') || '';
  const initialSub = searchParams.get('sub') || '';

  const [step, setStep] = useState(initialService ? 2 : 1);
  const [formData, setFormData] = useState({
    serviceId: initialService,
    subId: initialSub,
    package: '',
    date: '',
    slot: '',
    name: '',
    email: '',
    countryCode: '91',
    phone: '',
    babyAge: '',
    notes: ''
  });

  const [servicesData, setServicesData] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedParentService, setSelectedParentService] = useState(null);
  const [blockedWeekdays, setBlockedWeekdays] = useState([]);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`)
      .then(res => {
        if (res.data) {
          const activeServices = res.data.filter(s => s.slotsActive !== false).map(s => {
            if (s.subServices) {
              return { ...s, subServices: s.subServices.filter(sub => sub.slotsActive !== false) };
            }
            return s;
          });
          setServicesData(activeServices);
        }
      })
      .catch(err => console.error(err));

    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings`)
      .then(res => {
         if (res.data?.blockedWeekdays) setBlockedWeekdays(res.data.blockedWeekdays);
      })
      .catch(err => console.error(err));
  }, []);

  // Scroll to top whenever the step changes so the user isn't stuck at the bottom
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => {
    if (step === 2 && selectedParentService) {
      setSelectedParentService(null);
      setFormData({...formData, serviceId: ''});
      setStep(1);
    } else {
      setStep(s => Math.max(1, s - 1));
    }
  };

  const fetchSlots = async (date) => {
    setIsLoadingSlots(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/slots/${date}?serviceId=${formData.serviceId}`).catch(() => null);
      let fetchedSlots = [];
      if (res && res.data) {
        fetchedSlots = res.data;
      } else {
        fetchedSlots = [
          { slot: 'Morning', capacity: 3, status: 'Available' },
          { slot: 'Afternoon', capacity: 1, status: 'Available' },
          { slot: 'Evening', capacity: 0, status: 'Fully Booked' },
        ];
      }

      setAvailableSlots(fetchedSlots);
    } catch (error) {
      console.error(error);
      setAvailableSlots([]);
    }
    setIsLoadingSlots(false);
  };

  useEffect(() => {
    if (step === 4 && formData.date) {
      fetchSlots(formData.date);
    }
  }, [step, formData.date]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings`, {
        ...formData,
        phone: `${formData.countryCode}${formData.phone}`,
        shootType: getActiveTitle(),
      });
      navigate('/thank-you?type=booking');
    } catch (error) {
      alert('There was an error saving your booking. This slot might have just been taken by someone else. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get active packages
  const getActivePackages = () => {
    const s = servicesData.find(p => p.slug === formData.serviceId || p._id === formData.serviceId);
    if (!s) return [];
    if (formData.subId) {
      const sub = s.subServices?.find(sub => sub.slug === formData.subId || sub._id === formData.subId);
      if (sub && sub.packages && sub.packages.length > 0) return sub.packages;
    }
    return s.packages || [];
  };

  // Helper to get active title
  const getActiveTitle = () => {
    const s = servicesData.find(p => p.slug === formData.serviceId || p._id === formData.serviceId);
    if (!s) return 'Loading Experience...';
    if (formData.subId) {
      const sub = s.subServices?.find(sub => sub.slug === formData.subId || sub._id === formData.subId);
      if (sub) return `${s.name} - ${sub.name}`;
    }
    return s.name;
  };

  return (
    <div className="relative min-h-screen bg-[#050505] flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Ambient glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gray-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gray-500/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Background Image overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity" 
        style={{ backgroundImage: 'url(/images/banner_bg.webp)' }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]"></div>

      <div className="relative z-10 w-full max-w-2xl bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 sm:p-12 md:p-16 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Glow effect inside card */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

        <h1 className="font-mirage font-light text-2xl md:text-3xl text-center text-white uppercase tracking-[0.2em] mb-12">
          Book The Slot
        </h1>

        <div className="mb-14 flex justify-center items-center gap-2 sm:gap-3">
          {[1,2,3,4,5,6].map(s => (
            <div key={s} className="flex items-center">
              <div className={`transition-all duration-700 rounded-full ${
                step === s ? 'w-10 sm:w-12 h-1.5 bg-gradient-to-r from-gray-300 to-white shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 
                step > s ? 'w-2 sm:w-3 h-1.5 bg-white/40' : 'w-1.5 sm:w-2 h-1.5 bg-white/10'
              }`}></div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Service / SubService */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <h2 className="font-mirage font-bold text-3xl sm:text-4xl text-white uppercase tracking-[0.2em] mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                {selectedParentService ? 'Select Specialization' : 'Select Experience'}
              </h2>
              {servicesData.length === 0 ? <p className="text-center font-sans tracking-widest uppercase text-xs text-gray-500 animate-pulse">Loading Collections...</p> : (
                <div className="space-y-4">
                  {!selectedParentService ? (
                    servicesData.map(pkg => (
                      <div 
                        key={pkg.slug}
                        onClick={() => { 
                          if (pkg.subServices && pkg.subServices.length > 0) {
                            setSelectedParentService(pkg);
                          } else {
                            setFormData({ ...formData, serviceId: pkg.slug, subId: '', package: '' }); 
                            handleNext();
                          }
                        }}
                        className="group cursor-pointer bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/10 hover:border-gray-300/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all flex justify-between items-center"
                      >
                        <h3 className="text-xl sm:text-2xl text-gray-300 group-hover:text-white font-mirage uppercase tracking-widest transition-colors">{pkg.name}</h3>
                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-gray-300/50 group-hover:bg-gray-500/20 transition-all shadow-inner">
                          <span className="text-white text-xs opacity-50 group-hover:opacity-100 transition-opacity">→</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {selectedParentService.subServices.map(sub => (
                         <div 
                            key={sub.slug}
                            onClick={() => { 
                              setFormData({ ...formData, serviceId: selectedParentService.slug, subId: sub.slug, package: '' }); 
                              handleNext(); 
                            }}
                            className="group cursor-pointer bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/10 hover:border-gray-300/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all flex justify-between items-center"
                          >
                            <h3 className="text-xl sm:text-2xl text-gray-300 group-hover:text-white font-mirage uppercase tracking-widest transition-colors">{sub.name}</h3>
                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-gray-300/50 group-hover:bg-white/20 transition-all shadow-inner">
                              <span className="text-white text-xs opacity-50 group-hover:opacity-100 transition-opacity">→</span>
                            </div>
                          </div>
                      ))}
                      <div className="flex justify-center mt-8">
                        <button onClick={() => setSelectedParentService(null)} className="text-[10px] sm:text-xs font-sans text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-colors py-2 px-6 rounded-full border border-transparent hover:border-white/20 hover:bg-white/5">← Back to Experiences</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Select Package */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              {formData.serviceId && (
                <p className="text-center font-sans tracking-[0.3em] uppercase text-[10px] text-gray-300 mb-3">
                  {getActiveTitle()}
                </p>
              )}
              <h2 className="font-mirage font-bold text-3xl sm:text-4xl text-white uppercase tracking-[0.2em] mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Choose Package</h2>
              <div className="space-y-4">
                {getActivePackages().map((t, i) => (
                  <div 
                    key={i}
                    onClick={() => { setFormData({ ...formData, package: t.name }); handleNext(); }}
                    className="group relative overflow-hidden cursor-pointer bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 p-6 sm:p-8 rounded-2xl hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    <div className="absolute left-0 top-0 w-1 h-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-mirage text-white uppercase tracking-widest mb-2">{t.name}</h3>
                      {t.price && (
                        <p className="font-mirage text-4xl sm:text-5xl tracking-[0.1em] text-white mb-4">₹{t.price}</p>
                      )}
                      {t.features && t.features.length > 0 && (
                         <ul className="text-xs text-gray-400 space-y-2 tracking-wide font-sans">
                           {t.features.map((f, idx) => (
                             <li key={idx} className="flex items-start gap-2">
                               <span className="text-gray-400 mt-0.5 opacity-60">✦</span> 
                               <span>{f}</span>
                             </li>
                           ))}
                         </ul>
                      )}
                    </div>
                    <div className="self-end md:self-center shrink-0">
                      <span className="text-gray-400 group-hover:text-black group-hover:bg-white group-hover:border-transparent transition-all border border-white/20 px-6 py-3 text-[10px] uppercase tracking-widest rounded-full font-bold">Select</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-10">
                <button onClick={handleBack} className="text-[10px] sm:text-xs font-sans text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-colors py-2 px-6 rounded-full border border-transparent hover:border-white/20 hover:bg-white/5">← Back</button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Select Date */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <h2 className="font-mirage font-bold text-3xl sm:text-4xl text-white uppercase tracking-[0.2em] mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Pick a Date</h2>
              <div className="max-w-md mx-auto relative">
                <div className="bg-black/40 p-1 rounded-2xl border border-white/10 hover:border-white/30 transition-colors">
                  <input 
                    id="date"
                    type="date" 
                    min={new Date().toLocaleDateString('en-CA')}
                    className="w-full bg-transparent p-6 font-sans text-lg sm:text-xl text-white focus:outline-none transition-colors [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                    value={formData.date}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDateError('');
                      if (!val) {
                        setFormData({ ...formData, date: '' });
                        return;
                      }
                      const [year, month, day] = val.split('-');
                      const selectedDate = new Date(year, month - 1, day);
                      if (blockedWeekdays.includes(selectedDate.getDay())) {
                        setDateError(`${siteConfig.brand.name} is closed on this day of the week. Please select another date.`);
                        setFormData({ ...formData, date: '' });
                      } else {
                        setFormData({ ...formData, date: val });
                      }
                    }}
                  />
                </div>
                
                {dateError && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-[10px] font-sans tracking-widest uppercase mt-6 text-center bg-red-900/20 py-4 px-6 border border-red-500/20 rounded-xl">
                    {dateError}
                  </motion.p>
                )}

                <div className="flex justify-between items-center mt-12">
                  <button onClick={handleBack} className="text-[10px] sm:text-xs font-sans text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-colors py-2 px-4 rounded-full border border-transparent hover:border-white/20 hover:bg-white/5">← Back</button>
                  <button 
                    onClick={handleNext} 
                    disabled={!formData.date}
                    className="text-[10px] sm:text-xs font-sans font-bold text-white bg-white/10 px-8 py-3 rounded-full uppercase tracking-[0.3em] hover:bg-white hover:text-black disabled:opacity-20 disabled:hover:bg-white/10 disabled:hover:text-white disabled:cursor-not-allowed transition-all"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Select Slot */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <h2 className="font-mirage font-bold text-3xl sm:text-4xl text-white uppercase tracking-[0.2em] mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Select Slot</h2>
              <p className="text-center font-sans tracking-[0.3em] uppercase text-[10px] text-gray-300 mb-12">{formData.date}</p>
              
              {isLoadingSlots ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
                  {availableSlots.map((slot, i) => {
                      let isPast = false;
                      const today = new Date().toLocaleDateString('en-CA');
                      if (formData.date === today) {
                        const now = new Date();
                        const currentHour = now.getHours();
                        if (slot.slot === 'Morning' && currentHour >= 12) isPast = true;
                        if (slot.slot === 'Afternoon' && currentHour >= 16) isPast = true;
                        if (slot.slot === 'Evening' && currentHour >= 20) isPast = true;
                      }
                      
                      const isAvailable = slot.status === 'Available' && !isPast;
                      
                      return (
                    <div 
                      key={i}
                      onClick={() => {
                        if (isAvailable) {
                          setFormData({ ...formData, slot: slot.slot });
                          handleNext();
                        }
                      }}
                      className={`p-6 rounded-2xl border transition-all flex justify-between items-center ${
                        isAvailable 
                        ? 'border-white/10 bg-white/5 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] cursor-pointer group' 
                        : 'border-white/5 bg-black/40 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <h3 className={`text-xl font-mirage uppercase tracking-widest ${isAvailable ? 'text-gray-300 group-hover:text-white' : 'text-gray-600'}`}>
                        {slot.slot === 'Morning' ? 'Morning Slot (9 AM - 12 PM)' : slot.slot === 'Afternoon' ? 'Afternoon Slot (1 PM - 4 PM)' : slot.slot === 'Evening' ? 'Evening Slot (5 PM - 8 PM)' : slot.slot}
                      </h3>
                      <span className={`font-sans text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full ${isAvailable ? 'bg-white/10 text-gray-300 group-hover:bg-white/20' : 'bg-red-500/10 text-red-500/70'}`}>
                        {isPast ? 'Passed' : slot.status}
                      </span>
                    </div>
                  );})}
                </div>
              )}
              <div className="flex justify-center mt-12">
                <button onClick={handleBack} className="text-[10px] sm:text-xs font-sans text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-colors py-2 px-6 rounded-full border border-transparent hover:border-white/20 hover:bg-white/5">← Back</button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Fill Details */}
          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <h2 className="font-mirage font-bold text-3xl sm:text-4xl text-white uppercase tracking-[0.2em] mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Your Details</h2>
              {sessionStorage.getItem('portfolioMode') === 'true' ? (
                <div className="bg-white/5 border border-white/10 p-8 rounded-xl text-center max-w-md mx-auto">
                    <p className="text-white font-sans text-sm tracking-widest uppercase mb-2">
                      {sessionStorage.getItem('portfolioDescription') || 'You have entered here from the Saiprasanth portfolio or LinkedIn.'}
                    </p>
                    {!sessionStorage.getItem('portfolioDescription') && (
                      <p className="text-gray-400 text-xs font-sans">
                        Booking submissions are disabled in this preview mode.
                      </p>
                    )}
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
                <div className="space-y-6">
                  <input type="text" placeholder="FULL NAME *" required className="w-full bg-black/40 border border-white/10 rounded-xl p-5 font-sans text-xs tracking-[0.2em] uppercase text-white placeholder-gray-600 focus:outline-none focus:border-white/50 focus:bg-white/5 transition-all"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  
                  <input type="email" placeholder="EMAIL ADDRESS *" required className="w-full bg-black/40 border border-white/10 rounded-xl p-5 font-sans text-xs tracking-[0.2em] text-white placeholder-gray-600 focus:outline-none focus:border-white/50 focus:bg-white/5 transition-all"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  <div className="flex gap-2">
                    <select
                      value={formData.countryCode}
                      onChange={e => setFormData({...formData, countryCode: e.target.value})}
                      className="w-24 bg-black/40 border border-white/10 rounded-xl p-5 font-sans text-xs tracking-[0.2em] text-white focus:outline-none focus:border-white/50 focus:bg-white/5 transition-all appearance-none text-center cursor-pointer"
                    >
                      <option value="91" className="bg-[#111] text-white tracking-widest">IN (+91)</option>
                      <option value="1" className="bg-[#111] text-white tracking-widest">US (+1)</option>
                      <option value="44" className="bg-[#111] text-white tracking-widest">UK (+44)</option>
                      <option value="971" className="bg-[#111] text-white tracking-widest">UAE (+971)</option>
                      <option value="61" className="bg-[#111] text-white tracking-widest">AU (+61)</option>
                      <option value="65" className="bg-[#111] text-white tracking-widest">SG (+65)</option>
                    </select>
                    <input type="tel" placeholder="PHONE NUMBER *" required pattern="[0-9]{10}" maxLength="10" title="Phone number must be exactly 10 digits" className="flex-1 bg-black/40 border border-white/10 rounded-xl p-5 font-sans text-xs tracking-[0.2em] uppercase text-white placeholder-gray-600 focus:outline-none focus:border-white/50 focus:bg-white/5 transition-all"
                      value={formData.phone} onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setFormData({...formData, phone: val});
                      }} />
                  </div>
                    
                  <textarea placeholder="SPECIAL NOTES OR REQUESTS" className="w-full bg-black/40 border border-white/10 rounded-xl p-5 font-sans text-xs tracking-[0.2em] uppercase text-white placeholder-gray-600 focus:outline-none focus:border-white/50 focus:bg-white/5 transition-all min-h-[120px] resize-none"
                    value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                </div>
                
                <div className="flex justify-between items-center pt-8">
                  <button type="button" onClick={handleBack} disabled={isSubmitting} className="text-[10px] sm:text-xs font-sans text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-colors py-2 px-4 rounded-full border border-transparent hover:border-white/20 hover:bg-white/5">← Back</button>
                  <button type="submit" disabled={isSubmitting} className={`text-[10px] sm:text-xs font-sans font-bold text-black bg-white px-8 py-3 rounded-full uppercase tracking-[0.3em] hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isSubmitting ? 'Submitting...' : 'Submit Booking →'}
                  </button>
                </div>
              </form>
              )}
            </motion.div>
          )}

          {/* Step 6: Payment UI */}
          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="text-center">
              <h2 className="font-mirage font-bold text-3xl sm:text-4xl text-white uppercase tracking-[0.2em] mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Finalize Session</h2>
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-10">Advance Payment Required</p>
              
              <div className="relative border border-white/10 rounded-3xl p-10 mb-12 max-w-sm mx-auto text-center flex flex-col items-center bg-gradient-to-b from-white/10 to-transparent backdrop-blur-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-gray-500/20 blur-[50px] rounded-full"></div>
                
                <h3 className="relative z-10 text-2xl text-white font-mirage uppercase tracking-widest mb-3">{formData.package}</h3>
                <p className="relative z-10 text-gray-300 text-[10px] font-bold font-sans tracking-[0.3em] uppercase mb-4">{getActiveTitle()}</p>
                
                <div className="relative z-10 w-full h-[1px] bg-white/10 my-4"></div>
                
                <p className="relative z-10 text-gray-400 text-[10px] font-sans tracking-[0.2em] uppercase mb-1 flex items-center gap-2 justify-center">
                  <span className="text-white">🗓️ {formData.date}</span>
                </p>
                <p className="relative z-10 text-gray-400 text-[10px] font-sans tracking-[0.2em] uppercase mb-6 flex items-center gap-2 justify-center">
                  <span className="text-white">⏰ {formData.slot}</span>
                </p>

                <div className="relative z-10 mt-4 text-white font-mirage text-5xl tracking-widest bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                  ₹1,000
                </div>
                <span className="relative z-10 text-[9px] tracking-[0.4em] text-gray-500 block mt-3 uppercase font-bold">Advance Deposit</span>
              </div>

              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={async () => {
                     try {
                       await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings`, {
                         ...formData,
                         shootType: getActiveTitle(),
                       });
                       const message = `Hello ${siteConfig.brand.name}! I'd like to pay the advance of ₹1000 for my booking.\n\nDetails:\nExperience: ${getActiveTitle()}\nPackage: ${formData.package}\nDate: ${formData.date}\nSlot: ${formData.slot}\nName: ${formData.name}\nPhone: ${formData.phone}`;
                       window.open(`https://wa.me/910000000000?text=${encodeURIComponent(message)}`, '_blank');
                       setStep(7);
                     } catch (error) {
                       alert('There was an error saving your booking. This slot might have just been taken by someone else. Please try again.');
                       console.error(error);
                     }
                  }} 
                  className="group relative px-10 py-5 bg-white text-black font-mirage text-sm font-bold uppercase tracking-[0.3em] rounded-full overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#25D366] to-[#128C7E] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10 group-hover:text-white transition-colors flex items-center gap-3">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                    Pay via WhatsApp
                  </span>
                </button>
                <button onClick={handleBack} className="text-[10px] sm:text-xs font-sans text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-colors py-2 px-6 rounded-full border border-transparent hover:border-white/20 hover:bg-white/5">← Back to Details</button>
              </div>
            </motion.div>
          )}

          {/* Step 7: Confirmation */}
          {step === 7 && (
            <motion.div key="step7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-tr from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="font-mirage font-bold text-4xl sm:text-5xl text-white uppercase tracking-widest mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Request Sent</h2>
              <p className="font-sans text-xs sm:text-sm text-gray-400 font-light leading-relaxed max-w-md mx-auto mb-16 tracking-wide">
                Thank you, <span className="text-white font-bold">{formData.name}</span>. Your session request for <span className="text-white font-bold">{formData.date}</span> has been successfully submitted! A confirmation email has been sent to your inbox. Our team will contact you shortly to confirm the final details.
              </p>
              <Link 
                to="/"
                className="text-[10px] sm:text-xs font-sans text-black bg-white px-8 py-4 rounded-full uppercase tracking-[0.3em] hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] font-bold"
              >
                Return to Portfolio
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Book;
