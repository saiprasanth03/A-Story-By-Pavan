import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarView = ({ allBookings, setActiveTab, setHighlightedBookingId, settings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyCapacities, setMonthlyCapacities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchMonthData();
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const fetchMonthData = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/calendar/${year}/${month}`);
      setMonthlyCapacities(res.data);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getDayStatus = (dateStr) => {
    const dayCapacities = monthlyCapacities.filter(c => c.date === dateStr);
    let totalBooked = 0;
    dayCapacities.forEach(c => totalBooked += c.currentBookings);
    
    // Dynamic background color based on global capacity max bounds
    const dayIndex = new Date(dateStr).getUTCDay();
    const isHoliday = settings?.blockedWeekdays?.includes(dayIndex);
    let maxCap = 3;
    if (isHoliday) {
      maxCap = 0;
    } else if (settings?.weekdayCapacities) {
      const capNum = typeof settings.weekdayCapacities.get === 'function' 
        ? settings.weekdayCapacities.get(dayIndex.toString()) 
        : settings.weekdayCapacities[dayIndex.toString()];
      if (capNum !== undefined && capNum !== null) maxCap = capNum;
    }
    
    const maxDailyLimit = maxCap * 3;
    
    if (totalBooked === 0) return 'green';
    if (totalBooked >= maxDailyLimit) return 'red';
    return 'yellow';
  };

  const handleDateClick = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const renderDailyGrid = () => {
    if (!selectedDate) return null;
    
    const dayCaps = monthlyCapacities.filter(c => c.date === selectedDate);
    const dayBookings = allBookings.filter(b => b.date === selectedDate && b.status !== 'Cancelled');
    
    let totalBooked = 0;
    dayCaps.forEach(c => totalBooked += c.currentBookings);
    
    // Dynamic max capacity
    const dayIndex = new Date(selectedDate).getUTCDay();
    const isHoliday = settings?.blockedWeekdays?.includes(dayIndex);
    let maxCap = 3;
    if (isHoliday) {
      maxCap = 0;
    } else if (settings?.weekdayCapacities) {
      const capNum = typeof settings.weekdayCapacities.get === 'function' 
        ? settings.weekdayCapacities.get(dayIndex.toString()) 
        : settings.weekdayCapacities[dayIndex.toString()];
      if (capNum !== undefined && capNum !== null) maxCap = capNum;
    }
    
    const maxDailyLimit = maxCap * 3;
    let bgCol = totalBooked === 0 ? 'bg-green-500' : (totalBooked >= maxDailyLimit ? 'bg-red-500' : 'bg-yellow-500');

    const slotTypes = ['Morning', 'Afternoon', 'Evening'];
    const grid = [];
    
    slotTypes.forEach(type => {
      const bookingsForSlot = dayBookings.filter(b => b.slot === type || (b.slots && b.slots.includes(type)));
      const capRecord = dayCaps.find(c => c.slot === type);
      const manualBlocks = capRecord ? capRecord.currentBookings - bookingsForSlot.length : 0;
      
      for (let i = 0; i < maxCap; i++) {
        if (i < bookingsForSlot.length) {
          const b = bookingsForSlot[i];
          grid.push({ type, booked: true, text: b.shootType || b.studioName || 'Booked', status: b.status, isManual: false, booking: b });
        } else if (i < bookingsForSlot.length + manualBlocks) {
          grid.push({ type, booked: true, text: 'Blocked', status: 'Blocked', isManual: true });
        } else {
          grid.push({ type, booked: false, text: 'Available', status: 'Open', isManual: false });
        }
      }
    });

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full md:w-1/3 bg-black/40 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-mirage text-xl uppercase tracking-widest text-white">{selectedDate}</h3>
          <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="space-y-6">
          {slotTypes.map((type, rIdx) => (
            <div key={type}>
              <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{type}</h4>
              <div className={`grid gap-2 ${maxCap === 1 ? 'grid-cols-1' : maxCap === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {grid.slice(rIdx * maxCap, rIdx * maxCap + maxCap).map((spot, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => spot.booked && !spot.isManual && setSelectedEvent(spot.booking)}
                    className={`h-16 flex items-center justify-center rounded border text-center p-1 transition-colors ${
                      spot.booked && !spot.isManual ? 'cursor-pointer hover:scale-105 ' : ''
                    }${
                      spot.booked ? `${bgCol} border-transparent text-white shadow-lg` : 'bg-transparent border-white/20 text-gray-500'
                    }`}
                  >
                    <span className={`text-[9px] uppercase font-bold tracking-wider leading-tight line-clamp-2`}>
                      {spot.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-transparent p-6 rounded-2xl border border-blue-500/20">
        <div>
          <h2 className="text-lg font-mirage text-white uppercase tracking-widest mb-1">Booking Calendar</h2>
          <p className="text-xs text-blue-300/70 tracking-wide">Visualize and manage your daily slot capacity.</p>
        </div>
      </div>
      
      <AnimatePresence>
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111] border border-white/20 p-8 rounded-2xl w-full max-w-md relative text-white shadow-2xl">
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
            <h3 className="text-xl font-mirage uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Booking Details</h3>
            <div className="space-y-4 text-sm mb-8">
              <p className="flex justify-between"><span className="text-gray-500 uppercase text-xs tracking-widest">Name</span> <span>{selectedEvent.name}</span></p>
              <p className="flex justify-between"><span className="text-gray-500 uppercase text-xs tracking-widest">Phone</span> <span>{selectedEvent.phone}</span></p>
              <p className="flex justify-between"><span className="text-gray-500 uppercase text-xs tracking-widest">Service</span> <span className="text-right">{selectedEvent.shootType || selectedEvent.studioName}</span></p>
              <p className="flex justify-between"><span className="text-gray-500 uppercase text-xs tracking-widest">Package</span> <span>{selectedEvent.package}</span></p>
              <p className="flex justify-between items-center"><span className="text-gray-500 uppercase text-xs tracking-widest">Status</span> <span className="uppercase tracking-widest text-[10px] border border-white/20 px-3 py-1 rounded-full">{selectedEvent.status}</span></p>
            </div>
            <button 
              onClick={() => {
                if (setHighlightedBookingId) setHighlightedBookingId(selectedEvent._id);
                setSelectedEvent(null);
                if (setActiveTab) setActiveTab('bookings');
                // Optional: Scroll to it after a short delay to let the tab render
                setTimeout(() => {
                  const el = document.getElementById(`booking-${selectedEvent._id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }}
              className="w-full bg-white text-black font-mirage text-xs font-bold uppercase tracking-[0.2em] py-3 rounded hover:bg-gray-200 transition-colors"
            >
              View In Bookings Tab &rarr;
            </button>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className={`w-full ${selectedDate ? 'md:w-2/3' : ''} transition-all duration-300 bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-mirage text-2xl text-white uppercase tracking-widest">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-4">
              <button onClick={prevMonth} className="p-2 border border-white/20 rounded hover:bg-white hover:text-black transition-colors">&lt;</button>
              <button onClick={nextMonth} className="p-2 border border-white/20 rounded hover:bg-white hover:text-black transition-colors">&gt;</button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] uppercase text-gray-500 tracking-widest py-2">
                {day}
              </div>
            ))}
          </div>
          
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {Array(firstDay).fill(null).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-20 sm:h-24 bg-transparent"></div>
              ))}
              {Array(daysInMonth).fill(null).map((_, idx) => {
                const day = idx + 1;
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const status = getDayStatus(dateStr);
                const isSelected = selectedDate === dateStr;
                
                // Block past dates
                const todayStr = new Date().toLocaleDateString('en-CA');
                const isPast = false; // dateStr < todayStr;
                
                let desktopBg = '';
                let textColor = '';
                let dotColor = '';
                
                if (isPast) {
                  desktopBg = 'sm:bg-gray-800/20 sm:border-gray-800/50';
                  textColor = 'text-gray-600 sm:text-gray-600';
                  dotColor = 'hidden';
                } else if (status === 'green') {
                  desktopBg = 'sm:bg-green-500/20 sm:border-green-500/50';
                  textColor = 'sm:text-green-400';
                  dotColor = 'bg-green-500';
                } else if (status === 'red') {
                  desktopBg = 'sm:bg-red-500/20 sm:border-red-500/50';
                  textColor = 'sm:text-red-400';
                  dotColor = 'bg-red-500';
                } else {
                  desktopBg = 'sm:bg-yellow-500/20 sm:border-yellow-500/50';
                  textColor = 'sm:text-yellow-400';
                  dotColor = 'bg-yellow-500';
                }
                
                return (
                  <div 
                    key={day} 
                    onClick={() => { if (!isPast) handleDateClick(day) }}
                    className={`h-16 sm:h-24 rounded-lg border border-transparent sm:border-solid flex flex-col items-center sm:items-start p-2 ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-[1.02]'} transition-all duration-300 ${desktopBg} ${isSelected ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}`}
                  >
                    <span className={`text-sm sm:text-sm font-mirage ${isPast ? textColor : 'text-white ' + textColor} mb-1 sm:mb-0`}>{day}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColor} sm:hidden mt-auto mb-1`}></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <AnimatePresence>
          {renderDailyGrid()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarView;
