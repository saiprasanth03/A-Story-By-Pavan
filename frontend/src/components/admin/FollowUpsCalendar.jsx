import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const FollowUpsCalendar = ({ leads, inquiries, setActiveTab, setLeadSearch, setLeadFilter, setInquirySearch, setInquiryFilter, setHighlightedItemId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  
  // Combine follow-ups
  const allFollowUps = [];
  
  const extractFollowUps = (items, type) => {
    items?.forEach(item => {
      item.followUps?.forEach(fu => {
        if (fu.scheduledDate) {
          allFollowUps.push({
            ...fu,
            parentType: type,
            parentName: item.name,
            parentPhone: item.phone,
            parentId: item._id,
            dateObj: new Date(fu.scheduledDate)
          });
        }
      });
    });
  };
  
  extractFollowUps(leads, 'leads');
  extractFollowUps(inquiries, 'inquiries');
  
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const renderDays = () => {
    const days = [];
    const today = new Date();
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-[#0a0a0a]/50 border border-white/5 opacity-50"></div>);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      
      const dayFollowUps = allFollowUps.filter(f => 
        f.dateObj.getDate() === d && 
        f.dateObj.getMonth() === month && 
        f.dateObj.getFullYear() === year
      );

      days.push(
        <div key={d} className={`min-h-[100px] border border-white/5 p-2 transition-colors ${isToday ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-[#111] hover:bg-[#1a1a1a]'}`}>
          <div className={`text-xs font-bold mb-2 ${isToday ? 'text-emerald-400' : 'text-white/50'}`}>
            {d}
          </div>
          <div className="space-y-1">
            {dayFollowUps.map((fu, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedFollowUp(fu)}
                className={`text-[10px] p-1.5 rounded cursor-pointer truncate transition-colors ${
                  fu.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 
                  'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                }`}
                title={`${fu.parentName} - ${fu.note}`}
              >
                <div className="font-bold uppercase tracking-wider">{fu.parentType === 'leads' ? 'L' : 'I'}: {fu.parentName}</div>
                <div className="truncate opacity-75">{fu.note}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111] p-4 rounded-xl border border-white/10">
        <h3 className="text-lg font-mirage uppercase tracking-widest text-white">Follow-ups Calendar</h3>
        <div className="flex items-center gap-2 md:gap-4 self-center md:self-auto">
          <button onClick={prevMonth} className="text-white/50 hover:text-white px-2 md:px-3 py-1 bg-white/5 rounded border border-white/10 text-sm">← Prev</button>
          <span className="text-white font-medium uppercase tracking-widest min-w-[120px] md:min-w-[150px] text-center text-sm md:text-base">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="text-white/50 hover:text-white px-2 md:px-3 py-1 bg-white/5 rounded border border-white/10 text-sm">Next →</button>
        </div>
      </div>
      
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-7 border-b border-white/5 bg-black/20">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-white/40 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {renderDays()}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 text-xs uppercase tracking-widest">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/50"></span> Pending</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50"></span> Completed</div>
        <div className="flex items-center gap-2 ml-4"><span className="text-white/50">L = Lead, I = Inquiry</span></div>
      </div>
      
      {selectedFollowUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111] border border-emerald-500/20 rounded-2xl p-6 w-full max-w-md relative shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <button onClick={() => setSelectedFollowUp(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">&times;</button>
            <h2 className="text-lg font-mirage text-white uppercase tracking-widest mb-4">Follow-up Details</h2>
            
            <div className="mb-6 bg-white/5 rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-widest">
                  {selectedFollowUp.parentType === 'leads' ? 'Lead' : 'Inquiry'}
                </span>
              </div>
              <p className="text-lg font-bold text-white uppercase tracking-widest mb-1">{selectedFollowUp.parentName}</p>
              {selectedFollowUp.parentPhone && <p className="text-xs text-gray-400 mb-4">{selectedFollowUp.parentPhone}</p>}
              
              <div className="bg-black/50 rounded p-3 text-sm text-gray-300 border border-white/5 italic">
                "{selectedFollowUp.note}"
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSelectedFollowUp(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded text-xs uppercase tracking-widest transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  if (selectedFollowUp.parentType === 'leads') {
                    if (setLeadSearch) setLeadSearch('');
                    if (setLeadFilter) setLeadFilter('All');
                  } else {
                    if (setInquirySearch) setInquirySearch('');
                    if (setInquiryFilter) setInquiryFilter('All');
                  }
                  if (setHighlightedItemId) setHighlightedItemId(selectedFollowUp.parentId);
                  setActiveTab(selectedFollowUp.parentType);
                  setSelectedFollowUp(null);
                }}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-black border border-emerald-500 rounded text-xs uppercase tracking-widest transition-colors font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                Go to {selectedFollowUp.parentType === 'leads' ? 'Lead' : 'Inquiry'} →
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FollowUpsCalendar;
