import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DragDropImageUploader from '../DragDropImageUploader';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const BusinessView = ({ bookings = [], expenses = [], partners = [], teamMembers = [], highlightedBookingId, onAddPartner, onAddExpense, onEditPartner, onEditExpense, onDeletePartner, onDeleteExpense, defaultViewMode = 'overview', hideTabsAndOverview = false, userPermissions = [], isSuperAdmin = false }) => {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [viewMode, setViewMode] = useState(defaultViewMode); // 'overview', 'studio_shoots', 'props', 'events'
  const [propsData, setPropsData] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [rentalItems, setRentalItems] = useState([]);
  const [editingProp, setEditingProp] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEventId, setViewingEventId] = useState(null);
  const [eventNoteInput, setEventNoteInput] = useState('');
  const [eventTeamMembers, setEventTeamMembers] = useState([]);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [inventoryImageUrl, setInventoryImageUrl] = useState('');
  const [viewShootExpenses, setViewShootExpenses] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [sendingPdfId, setSendingPdfId] = useState(null);
  const [predefinedServices, setPredefinedServices] = useState([]);
  const [predefinedDeliverables, setPredefinedDeliverables] = useState([]);
  const [predefinedComplimentries, setPredefinedComplimentries] = useState([]);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isDeliverablesModalOpen, setIsDeliverablesModalOpen] = useState(false);
  const [isComplimentriesModalOpen, setIsComplimentriesModalOpen] = useState(false);
  const [paymentMethodForEvent, setPaymentMethodForEvent] = useState({});

  useEffect(() => {
    fetchProps();
    fetchEvents();
    fetchRentalItems();
    fetchPredefinedServices();
    fetchEventTeamMembers();
  }, [defaultViewMode]);

  const fetchEventTeamMembers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/team`);
      setEventTeamMembers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPredefinedServices = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings`);
      if (res.data) {
        if (res.data.predefinedServices) {
          setPredefinedServices(res.data.predefinedServices);
        }
        if (res.data.predefinedDeliverables && res.data.predefinedDeliverables.length > 0) {
          setPredefinedDeliverables(res.data.predefinedDeliverables);
        } else {
          setPredefinedDeliverables([
            'Traditional Video',
            'Traditional Photos',
            'Candid Photos',
            'Candid Video',
            'Cinematic Wedding Film',
            'Teaser / Highlights Video',
            'Drone Footage',
            'Premium Wedding Album',
            'RAW Data Handover',
            'Hard Drive Backup'
          ]);
        }
        if (res.data.predefinedComplimentries && res.data.predefinedComplimentries.length > 0) {
          setPredefinedComplimentries(res.data.predefinedComplimentries);
        } else {
          setPredefinedComplimentries([
            'Free Photo Album (30 Pages)',
            'Mini Photobook for Parents',
            'Complimentary Pre-wedding Teaser',
            'Framed Canvas Print (16x24)',
            'Instagram Reels Edit (3 Reels)',
            'Live Streaming Setup'
          ]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSavePredefinedServices = async (updatedServices) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/predefined-services`, { predefinedServices: updatedServices });
      setPredefinedServices(updatedServices);
    } catch (error) {
      console.error(error);
      alert('Failed to save predefined services');
    }
  };

  const handleSavePredefinedDeliverables = async (updatedDeliverables) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/predefined-options`, { predefinedDeliverables: updatedDeliverables });
      setPredefinedDeliverables(updatedDeliverables);
    } catch (error) {
      console.error(error);
      alert('Failed to save predefined deliverables');
    }
  };

  const handleSavePredefinedComplimentries = async (updatedComplimentries) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/predefined-options`, { predefinedComplimentries: updatedComplimentries });
      setPredefinedComplimentries(updatedComplimentries);
    } catch (error) {
      console.error(error);
      alert('Failed to save predefined complimentries');
    }
  };

  useEffect(() => {
    setViewMode(defaultViewMode);
  }, [defaultViewMode]);

  useEffect(() => {
    if (highlightedBookingId && viewMode === 'studio_shoots') {
      setTimeout(() => {
        const el = document.getElementById(`business-booking-${highlightedBookingId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [highlightedBookingId, viewMode]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events`);
      setEventsData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRentalItems = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/rental-items`);
      setRentalItems(res.data);
    } catch (error) {
      console.error("Error fetching rental items:", error);
    }
  };

  const fetchProps = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/props`);
      setPropsData(res.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
         console.warn("Props endpoint not found. Backend needs restart.");
      }
    }
  };

  const handleSaveProp = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const calculatedTotal = (editingProp?.items || []).reduce((sum, item) => sum + item.price, 0);
    const totalAmount = Number(formData.get('totalAmount') || calculatedTotal);
    const paidAmount = Number(formData.get('paidAmount') || 0);
    const pendingAmount = totalAmount - paidAmount;

    const data = {
      customerName: formData.get('customerName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      photo: editingProp?.photo || '',
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      pendingAmount: pendingAmount,
      items: editingProp?.items || []
    };
    
    try {
      if (editingProp._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/props/${editingProp._id}`, data);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/props`, data);
      }
      setEditingProp(null);
      fetchProps();
    } catch (error) {
      console.error(error);
      alert('Failed to save prop rental: ' + (error.response?.data?.error || error.message || 'Server not reachable. Did you restart the backend?'));
    }
  };

  const handleDeleteProp = async (id) => {
    if(!window.confirm('Delete this prop rental?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/props/${id}`);
      fetchProps();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const totalAmount = Number(formData.get('totalAmount') || 0);
    const paidAmount = Number(formData.get('paidAmount') || 0);
    const pendingAmount = totalAmount - paidAmount;
    const albumEnabled = editingEvent?.album?.enabled || false;
    const albumSheets = Number(editingEvent?.album?.sheets || 0);
    const albumCost = albumEnabled ? albumSheets * 500 : 0;

    const data = {
        name: formData.get('name'),
        clientName: formData.get('clientName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        date: formData.get('date'),
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
        discount: Number(formData.get('discount') || 0),
        status: formData.get('status'),
        subEvents: formData.get('subEvents'),
        services: editingEvent?.services || [],
        subEventList: editingEvent?.subEventList || [],
        deliverables: editingEvent?.deliverables || [],
        complimentries: editingEvent?.complimentries || [],
        album: {
          enabled: albumEnabled,
          sheets: albumSheets,
          pricePerSheet: 500
        }
    };
    
    try {
      if (editingEvent._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${editingEvent._id}`, data);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events`, data);
      }
      setEditingEvent(null);
      fetchEvents();
    } catch (error) {
      console.error(error);
      alert('Failed to save event: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEventPayment = async (eventId, e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const total = Number(formData.get('totalAmount'));
    const newAmount = Number(formData.get('newPaymentAmount'));
    const event = eventsData.find(ev => ev._id === eventId);
    let updatedPayments = [...(event.payments || [])];
    if (newAmount > 0) {
      const method = formData.get('newPaymentMethod');
      const receivedBy = formData.get('newPaymentReceivedBy');
      updatedPayments.push({ amount: newAmount, method, receivedBy, date: new Date() });
    }
    const paid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const payload = { totalAmount: total, paidAmount: paid, pendingAmount: total - paid, payments: updatedPayments };
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${eventId}/payment`, payload);
      setEventsData(prev => prev.map(ev => ev._id === eventId ? res.data : ev));
      e.target.reset();
      alert('Payment updated!');
    } catch (error) {
      alert('Error updating payment');
    }
  };

  const handleDeleteEventInstallment = async (eventId, paymentId) => {
    if (!window.confirm('Delete this installment?')) return;
    const event = eventsData.find(ev => ev._id === eventId);
    const updatedPayments = (event.payments || []).filter(p => p._id !== paymentId);
    const paid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const payload = { totalAmount: event.totalAmount, paidAmount: paid, pendingAmount: (event.totalAmount || 0) - paid, payments: updatedPayments };
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${eventId}/payment`, payload);
      setEventsData(prev => prev.map(ev => ev._id === eventId ? res.data : ev));
    } catch (error) {
      alert('Error deleting installment');
    }
  };

  const handleAddEventNote = async (eventId) => {
    if (!eventNoteInput.trim()) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${eventId}/followup`, { note: eventNoteInput });
      setEventsData(prev => prev.map(ev => ev._id === eventId ? res.data : ev));
      setEventNoteInput('');
    } catch (error) {
      alert('Error adding note');
    }
  };

  const handleDeleteEventNote = async (eventId, noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${eventId}/followups/${noteId}`);
      setEventsData(prev => prev.map(ev => ev._id === eventId ? res.data : ev));
    } catch (error) {
      alert('Error deleting note');
    }
  };

  const handleUpdateEventStatus = async (eventId, status) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${eventId}`, { status });
      setEventsData(prev => prev.map(ev => ev._id === eventId ? res.data : ev));
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateEventTeam = async (eventId, memberId) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${eventId}`, { assignedTeamMember: memberId || null });
      setEventsData(prev => prev.map(ev => ev._id === eventId ? res.data : ev));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEvent = async (id) => {
    if(!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${id}`);
      fetchEvents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateEventField = async (id, field, value) => {
    try {
      const data = { [field]: value };
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${id}`, data);
      
      // Update local state without full refetch for snappiness
      setEventsData(prev => prev.map(ev => 
        ev._id === id ? { ...ev, ...data } : ev
      ));
    } catch (error) {
      console.error('Error updating event field:', error);
      alert('Failed to update event field');
    }
  };

  const handleSaveInventoryItem = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      price: Number(formData.get('price') || 0),
      imageUrl: inventoryImageUrl
    };
    
    try {
      if (editingInventoryItem?._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/rental-items/${editingInventoryItem._id}`, data);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/rental-items`, data);
      }
      setEditingInventoryItem(null);
      setInventoryImageUrl('');
      e.target.reset();
      fetchRentalItems();
    } catch (error) {
      console.error(error);
      alert('Failed to save item');
    }
  };

  const handleDeleteInventoryItem = async (id) => {
    if(!window.confirm('Delete this inventory item?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/rental-items/${id}`);
      fetchProps();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendEventPdf = async (id) => {
    setSendingPdfId(id);
    try {
      await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${id}/send-pdf`);
      alert("PDF Sent successfully!");
    } catch (error) {
      console.error(error);
      alert('Failed to send PDF: ' + (error.response?.data?.error || error.message));
    } finally {
      setSendingPdfId(null);
    }
  };

  const handleDownloadEventPdf = async (id) => {
    setDownloadingPdfId(id);
    try {
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${id}/download-pdf`, '_blank');
      // Simulate download time for UI since window.open is instant
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(error);
      alert('Failed to download PDF');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const filterByDate = (items, dateField = 'date') => {
    return items.filter(item => {
      if (!item[dateField] && !item.createdAt) return true;
      const itemDate = new Date(item[dateField] || item.createdAt);
      itemDate.setHours(0,0,0,0);
      const today = new Date();
      today.setHours(0,0,0,0);

      if (filterType === 'all') return true;

      if (filterType === 'weekly') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return itemDate >= startOfWeek;
      }

      if (filterType === 'monthly') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return itemDate >= startOfMonth;
      }

      if (filterType === 'custom') {
        let start = customStartDate ? new Date(customStartDate) : null;
        let end = customEndDate ? new Date(customEndDate) : null;
        if (start) start.setHours(0,0,0,0);
        if (end) end.setHours(23,59,59,999);
        if (start && end) return itemDate >= start && itemDate <= end;
        if (start) return itemDate >= start;
        if (end) return itemDate <= end;
      }
      return true;
    });
  };

  // Base Data
  const applySearch = (items) => {
    if (!searchQuery) return items;
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter(item => 
      (item.name && item.name.toLowerCase().includes(lowerQuery)) ||
      (item.customerName && item.customerName.toLowerCase().includes(lowerQuery)) ||
      (item.clientName && item.clientName.toLowerCase().includes(lowerQuery)) ||
      (item.phone && item.phone.includes(searchQuery)) ||
      (item.email && item.email.toLowerCase().includes(lowerQuery))
    );
  };

  const allBookings = applySearch(filterByDate(bookings, 'date').filter(b => b.status !== 'Cancelled'));
  const confirmedBookings = applySearch(filterByDate(bookings.filter(b => b.status === 'Confirmed' || b.status === 'Finished'), 'date'));
  const filteredExpenses = filterByDate(expenses, 'date');
  const filteredProps = applySearch(filterByDate(propsData, 'date'));
  const filteredEvents = applySearch(filterByDate(eventsData, 'date'));

  // Calculations
    const getTotals = () => {
      let shootEarnings = 0;
      let propEarnings = 0;
      let eventEarnings = 0;
      
      let pendingShoots = 0;
      let pendingProps = 0;
      let pendingEvents = 0;
  
      let studioExpenses = 0;
      let shootExpenses = 0;
      let propExpenses = 0;
      let eventExpenses = 0;
  
      if (viewMode === 'overview') {
        // Overall Earnings: All bookings + Props + Events
        if (isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'studio shoots')) {
          allBookings.forEach(b => {
            shootEarnings += (b.totalAmount || 0) - (b.pendingAmount || 0);
            pendingShoots += (b.pendingAmount || 0);
          });
          shootExpenses = filteredExpenses.filter(e => e.type === 'Shoot' && allBookings.some(cb => cb._id === e.bookingId)).reduce((a, b) => a + b.amount, 0);
        }

        if (isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'props rentals')) {
          filteredProps.forEach(p => {
            propEarnings += p.paidAmount || p.totalAmount || 0;
            pendingProps += p.pendingAmount || 0;
          });
          propExpenses = filteredExpenses.filter(e => e.type === 'Prop' && filteredProps.some(cp => cp._id === e.bookingId)).reduce((a, b) => a + b.amount, 0);
        }

        if (isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'events')) {
          filteredEvents.forEach(e => {
            eventEarnings += e.paidAmount || 0;
            pendingEvents += e.pendingAmount || 0;
          });
          eventExpenses = filteredExpenses.filter(e => e.type === 'Event' && filteredEvents.some(ce => ce._id === e.bookingId)).reduce((a, b) => a + b.amount, 0);
        }
        
        studioExpenses = filteredExpenses.filter(e => e.type === 'Studio').reduce((a, b) => a + b.amount, 0);
      } 
      else if (viewMode === 'studio_shoots') {
        // Earnings from studio shoots only
        allBookings.forEach(b => {
          shootEarnings += (b.totalAmount || 0) - (b.pendingAmount || 0);
          pendingShoots += (b.pendingAmount || 0);
        });
        shootExpenses = filteredExpenses.filter(e => e.type === 'Shoot' && allBookings.some(cb => cb._id === e.bookingId)).reduce((a, b) => a + b.amount, 0);
      }
      else if (viewMode === 'props') {
        // Earnings from props only
        filteredProps.forEach(p => {
          propEarnings += p.paidAmount || p.totalAmount || 0;
          pendingProps += p.pendingAmount || 0;
        });
        propExpenses = filteredExpenses.filter(e => e.type === 'Prop' && filteredProps.some(cp => cp._id === e.bookingId)).reduce((a, b) => a + b.amount, 0);
      }
      else if (viewMode === 'events') {
        // Earnings from events only
        filteredEvents.forEach(e => {
          eventEarnings += e.paidAmount || 0;
          pendingEvents += e.pendingAmount || 0;
        });
        eventExpenses = filteredExpenses.filter(e => e.type === 'Event' && filteredEvents.some(ce => ce._id === e.bookingId)).reduce((a, b) => a + b.amount, 0);
      }
  
      const earnings = shootEarnings + propEarnings + eventEarnings;
      const pending = pendingShoots + pendingProps + pendingEvents;
      let totalExpenses = studioExpenses + shootExpenses + propExpenses + eventExpenses;
      
      // If we're not in overview, and looking at specific tabs, their expenses only represent their specific category
      if (viewMode === 'studio_shoots') totalExpenses = shootExpenses;
      if (viewMode === 'props') totalExpenses = propExpenses;
      if (viewMode === 'events') totalExpenses = eventExpenses;
  
      const profit = earnings - totalExpenses;
      
      // Total Business = Amount Received + Pending Amount
      const totalBusiness = earnings + pending;
      
      // Gross Amount = Total Business - Expenses
      const grossAmount = totalBusiness - totalExpenses;
      
      // Profit per category (approximate for overview breakdown)
      const profitShoots = shootEarnings - shootExpenses;
      const profitProps = propEarnings - propExpenses;
      const profitEvents = eventEarnings - eventExpenses;
  
      return { 
        earnings, shootEarnings, propEarnings, eventEarnings, 
        pending, pendingShoots, pendingProps, pendingEvents,
        studioExpenses, shootExpenses, propExpenses, eventExpenses, totalExpenses, 
        profit, profitShoots, profitProps, profitEvents,
        totalBusiness, grossAmount
      };
  };

  const totals = getTotals();

  const renderPartnerProfits = () => (
    <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xs uppercase tracking-widest text-neutral-500 font-bold">
            Partner Profits ({viewMode.replace('_', ' ')})
          </h4>

        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {partners.map(p => {
          const shareAmount = totals.profit * (p.sharePercentage / 100);
          const grossAmount = totals.grossAmount * (p.sharePercentage / 100);
          return (
            <div key={p._id} className="p-4 border border-black/10 rounded-xl relative group bg-neutral-50">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-[#0f0f12] text-sm">{p.name}</h5>
                  <p className="text-xs text-neutral-500">{p.sharePercentage}% Share</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-cyan-700 font-bold">Gross: ₹{grossAmount.toLocaleString()}</p>
                  <p className="text-sm text-emerald-700 font-bold">Net: ₹{shareAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button onClick={() => onEditPartner(p)} className="text-xs text-orange-600 font-bold hover:underline">Edit</button>
                <button onClick={() => onDeletePartner(p._id)} className="text-xs text-red-600 font-bold hover:underline">Delete</button>
              </div>
            </div>
          )
        })}
        {partners.length === 0 && <p className="text-neutral-400 text-xs italic">No partners added yet.</p>}
      </div>
    </div>
  );

  const renderOverviewCards = () => {
    let barData = [];
    if (viewMode === 'overview') {
       barData = [
         (isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'studio shoots')) ? { name: 'Shoot Profits', value: Math.max(0, totals.profitShoots), fill: '#059669' } : null,
         (isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'props rentals')) ? { name: 'Prop Profits', value: Math.max(0, totals.profitProps), fill: '#2563eb' } : null,
         (isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'events')) ? { name: 'Event Profits', value: Math.max(0, totals.profitEvents), fill: '#d97706' } : null,
         { name: 'Expenditure', value: Math.max(0, totals.totalExpenses), fill: '#dc2626' }
       ].filter(Boolean);
    } else {
       barData = [
         { name: 'Total Business', value: Math.max(0, totals.totalBusiness), fill: '#7c3aed' },
         { name: 'Amount Received', value: Math.max(0, totals.earnings), fill: '#2563eb' },
         { name: 'Pending', value: Math.max(0, totals.pending), fill: '#d97706' },
         { name: 'Expenses', value: Math.max(0, totals.totalExpenses), fill: '#dc2626' },
         { name: 'Gross Amount', value: Math.max(0, totals.grossAmount), fill: '#0891b2' },
         { name: 'Net Profit', value: Math.max(0, totals.profit), fill: '#059669' },
       ];
    }

    return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Business card */}
      <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-xs text-[#0f0f12]">
        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-2">Total Business</p>
        <p className="text-3xl font-bold text-purple-700">₹{totals.totalBusiness.toLocaleString()}</p>
        <p className="text-xs text-neutral-400 mt-2 font-medium">Received + Pending</p>
      </div>
      {/* Amount Received card */}
      <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-xs text-[#0f0f12]">
        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-2">Amount Received</p>
        <p className="text-3xl font-bold text-emerald-700">₹{totals.earnings.toLocaleString()}</p>
        <p className="text-xs text-neutral-500 mt-2 font-medium">
          {viewMode === 'overview' && (
            <>
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'studio shoots')) && `Shoots: ₹${totals.shootEarnings}`}
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'props rentals')) && ` | Rentals: ₹${totals.propEarnings}`}
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'events')) && ` | Events: ₹${totals.eventEarnings}`}
            </>
          )}
          {viewMode === 'studio_shoots' && `Shoots: ₹${totals.shootEarnings}`}
          {viewMode === 'props' && `Rentals: ₹${totals.propEarnings}`}
          {viewMode === 'events' && `Events: ₹${totals.eventEarnings}`}
        </p>
      </div>
      {/* Pending Amount card */}
      <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-xs text-[#0f0f12]">
        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-2">Pending Amount</p>
        <p className="text-3xl font-bold text-amber-600">₹{totals.pending.toLocaleString()}</p>
        <p className="text-xs text-neutral-500 mt-2 font-medium">
          {viewMode === 'overview' && (
            <>
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'studio shoots')) && `Shoots: ₹${totals.pendingShoots}`}
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'props rentals')) && ` | Rentals: ₹${totals.pendingProps}`}
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'events')) && ` | Events: ₹${totals.pendingEvents}`}
            </>
          )}
          {viewMode === 'studio_shoots' && `Shoots: ₹${totals.pendingShoots}`}
          {viewMode === 'props' && `Rentals: ₹${totals.pendingProps}`}
          {viewMode === 'events' && `Events: ₹${totals.pendingEvents}`}
        </p>
      </div>
      {/* Total Expenses card */}
      <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-xs text-[#0f0f12]">
        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-2">Total Expenses</p>
        <p className="text-3xl font-bold text-rose-600">₹{totals.totalExpenses.toLocaleString()}</p>
        <p className="text-xs text-neutral-500 mt-2 font-medium">
          {viewMode === 'overview' && (
            <>
              Studio: ₹{totals.studioExpenses}
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'studio shoots')) && ` | Shoot: ₹${totals.shootExpenses}`}
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'props rentals')) && ` | Rentals: ₹${totals.propExpenses}`}
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'events')) && ` | Events: ₹${totals.eventExpenses}`}
            </>
          )}
          {viewMode === 'studio_shoots' && `Shoot Expenses: ₹${totals.shootExpenses}`}
          {viewMode === 'props' && `No Expenses tracked`}
          {viewMode === 'events' && `Events: ₹${totals.eventExpenses}`}
        </p>
      </div>
      {/* Gross Amount card */}
      <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-xs text-[#0f0f12]">
        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-2">Gross Amount</p>
        <p className="text-3xl font-bold text-cyan-700">₹{totals.grossAmount.toLocaleString()}</p>
        <p className="text-xs text-neutral-400 mt-2 font-medium">Total Business − Expenses</p>
      </div>
      {/* Net Profit card */}
      <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-xs text-[#0f0f12]">
        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-2">Net Profit</p>
        <p className="text-3xl font-bold text-[#0f0f12]">₹{totals.profit.toLocaleString()}</p>
        <p className="text-xs text-neutral-500 mt-2 font-medium">
          {viewMode === 'overview' && (
            <>
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'studio shoots')) && `Shoots: ₹${totals.profitShoots}`}
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'props rentals')) && ` | Rentals: ₹${totals.profitProps}`}
              {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'events')) && ` | Events: ₹${totals.profitEvents}`}
            </>
          )}
          {viewMode === 'studio_shoots' && `Shoots: ₹${totals.profitShoots}`}
          {viewMode === 'props' && `Rentals: ₹${totals.profitProps}`}
          {viewMode === 'events' && `Events: ₹${totals.eventEvents}`}
        </p>
      </div>

      {/* Chart Section: Bar for all */}
      <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-2xl border border-black/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8 text-[#0f0f12]">
        <div className="w-full md:w-1/3">
           <h4 className="text-sm font-mirage text-[#0f0f12] font-bold uppercase tracking-widest mb-2">Financial Breakdown</h4>
           <p className="text-xs text-neutral-500 mb-6 font-sans">Visual representation of earnings and expenses for the current view.</p>
           
           <div className="space-y-4">
             {(() => {
               const legendData = barData;
               if (legendData.length === 0) return <p className="text-xs text-neutral-400 italic">No financial data to display.</p>;
               return legendData.filter(d => d.value > 0).map((d, i) => (
                 <div key={i} className="flex justify-between items-center text-xs font-medium">
                   <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }}></span>
                     <span className="text-neutral-700">{d.name}</span>
                   </div>
                   <span className="font-mono font-bold text-[#0f0f12]">₹{d.value.toLocaleString()}</span>
                 </div>
               ));
             })()}
           </div>
        </div>
        <div className="w-full md:w-2/3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#0f0f12', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => `₹${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#0f0f12', fontWeight: 600 }}
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header Tabs */}
      {!hideTabsAndOverview && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black/10 pb-4">
           <div className="flex gap-4">
             {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'overview')) && (
               <button onClick={() => setViewMode('overview')} className={`text-xs uppercase font-bold tracking-widest ${viewMode === 'overview' ? 'text-[#0f0f12] border-b-2 border-black pb-1' : 'text-neutral-400 hover:text-black'}`}>Overview</button>
             )}
             {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'studio shoots')) && (
               <button onClick={() => setViewMode('studio_shoots')} className={`text-xs uppercase font-bold tracking-widest ${viewMode === 'studio_shoots' ? 'text-[#0f0f12] border-b-2 border-black pb-1' : 'text-neutral-400 hover:text-black'}`}>Studio Shoots</button>
             )}
             {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'props rentals')) && (
               <button onClick={() => setViewMode('props')} className={`text-xs uppercase font-bold tracking-widest ${viewMode === 'props' ? 'text-[#0f0f12] border-b-2 border-black pb-1' : 'text-neutral-400 hover:text-black'}`}>Props Rentals</button>
             )}
             {(isSuperAdmin || userPermissions.some(p => p.toLowerCase() === 'events')) && (
               <button onClick={() => setViewMode('events')} className={`text-xs uppercase font-bold tracking-widest ${viewMode === 'events' ? 'text-[#0f0f12] border-b-2 border-black pb-1' : 'text-neutral-400 hover:text-black'}`}>Events</button>
             )}
           </div>
        </div>
      )}

      {/* Shared Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-black/10 shadow-xs">
        <div className="flex flex-wrap gap-2 items-center">
          {['all', 'weekly', 'monthly', 'custom'].map(type => (
            <button 
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${filterType === type ? 'bg-black text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              {type === 'all' ? 'All Time' : type === 'weekly' ? 'This Week' : type === 'monthly' ? 'This Month' : 'Date Range'}
            </button>
          ))}
          <input 
            type="text" 
            placeholder="Search name, phone, email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border border-black/20 rounded-xl px-4 py-2 text-xs text-[#0f0f12] placeholder-neutral-400 outline-none focus:border-black [color-scheme:light] shadow-xs w-64 ml-2"
          />
        </div>
        {filterType === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-white border border-black/20 rounded-xl px-3 py-1.5 text-xs text-[#0f0f12] [color-scheme:light] shadow-xs" />
            <span className="text-neutral-400 text-xs font-semibold">to</span>
            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-white border border-black/20 rounded-xl px-3 py-1.5 text-xs text-[#0f0f12] [color-scheme:light] shadow-xs" />
          </div>
        )}
      </div>

      {/* Shared Overview Cards */}
      {!hideTabsAndOverview && renderOverviewCards()}

      {/* Tab Content */}
      {viewMode === 'overview' && (
        <div className="space-y-8">
          {renderPartnerProfits()}
          
          {/* Expenses Table */}
          <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Studio Expenditures</h4>
              <button onClick={() => onAddExpense({date: new Date().toISOString().split('T')[0], items: [{description: '', amount: 0}], type: 'Studio'})} className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xs">Add Expense</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#0f0f12]">
                <thead className="border-b border-black/10 bg-neutral-100/70 text-neutral-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-bold">Date</th>
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Expense Name</th>
                    <th className="p-4 font-bold">Price</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredExpenses.filter(e => e.type === 'Studio').map(expense => (
                    <tr key={expense._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-mono font-medium">{expense.date}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase ${
                          expense.type === 'Studio' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                          expense.type === 'Shoot' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          expense.type === 'Event' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>{expense.type}</span>
                        {expense.bookingId && <span className="ml-2 text-[11px] text-neutral-400 font-medium">Linked to Shoot</span>}
                      </td>
                      <td className="p-4 font-semibold">{expense.description}</td>
                      <td className="p-4 text-rose-600 font-bold">₹{expense.amount.toLocaleString()}</td>
                      <td className="p-4 text-right space-x-3">
                        <button onClick={() => onEditExpense(expense)} className="text-neutral-500 hover:text-black font-bold text-xs">Edit</button>
                        <button onClick={() => onDeleteExpense(expense._id)} className="text-red-600 hover:text-red-700 font-bold text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.filter(e => e.type === 'Studio').length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-neutral-400 italic">No studio expenses found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'studio_shoots' && (
        <div className="space-y-8">
          {renderPartnerProfits()}
          
          <div className="bg-[#111] p-6 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm uppercase tracking-widest text-white/70">Studio Shoots Details</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white/70">
                <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="p-4 font-normal">Name / Date</th>
                    <th className="p-4 font-normal">Total Amount</th>
                    <th className="p-4 font-normal">Paid</th>
                    <th className="p-4 font-normal">Pending</th>
                    <th className="p-4 font-normal">Shoot Expenditure</th>
                    <th className="p-4 font-normal">Shoot Profit</th>
                    <th className="p-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allBookings.map(shoot => {
                    const shootExpenses = expenses.filter(e => e.bookingId === shoot._id);
                    const totalShootExp = shootExpenses.reduce((acc, curr) => acc + curr.amount, 0);
                    const paidAmt = (shoot.totalAmount || 0) - (shoot.pendingAmount || 0);
                    const pendingAmt = shoot.pendingAmount || 0;
                    const shootProfit = (shoot.totalAmount || 0) - paidAmt - totalShootExp;
                    
                    return (
                      <tr key={shoot._id} id={`business-booking-${shoot._id}`} className={`transition-all duration-500 ${highlightedBookingId === shoot._id ? 'bg-emerald-900/30 border-l-4 border-emerald-500' : 'hover:bg-white/[0.02]'}`}>
                        <td className="p-4">
                          <div className="text-[15px] font-bold text-white mb-1">{shoot.name} <span className="text-[9px] uppercase ml-2 px-1 py-0.5 rounded bg-white/5">{shoot.status}</span></div>
                          <div className="text-xs text-white/50">{shoot.date}</div>
                        </td>
                        <td className="p-4">₹{shoot.totalAmount?.toLocaleString()}</td>
                        <td className="p-4 text-emerald-400">₹{paidAmt.toLocaleString()}</td>
                        <td className="p-4 text-amber-500">₹{pendingAmt.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-red-400">₹{totalShootExp.toLocaleString()}</span>
                            {shootExpenses.length > 0 && (
                              <button 
                                onClick={() => setViewShootExpenses({ shootName: shoot.name, expenses: shootExpenses })} 
                                className="text-[10px] bg-white/5 hover:bg-white/10 text-white/70 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-widest"
                              >
                                Detail
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-white">₹{shootProfit.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => {
                            onAddExpense({
                              date: shoot.date,
                              items: [{description: `Expense for ${shoot.name}`, amount: 0}],
                              type: 'Shoot',
                              bookingId: shoot._id
                            })
                          }} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded">
                            + Expense
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {allBookings.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-white/30">No studio shoots found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'props' && (
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/70">Prop Rentals Details</h3>
              <div className="flex gap-4">
                <button onClick={() => setIsInventoryModalOpen(true)} className="px-4 py-2 bg-black/40 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">
                  Manage Inventory
                </button>
                <button onClick={() => setEditingProp({ items: [] })} className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors">
                  New Prop Rental
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProps.map(prop => (
                <div key={prop._id} className="bg-[#111] border border-white/10 rounded-xl overflow-hidden relative group">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white">{prop.customerName}</h4>
                        <p className="text-xs text-white/50">{prop.email}</p>
                        {prop.phone && <p className="text-xs text-white/50">{prop.phone}</p>}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-white/40 uppercase tracking-widest block mb-1">Total</span>
                        <span className="text-white font-bold">₹{prop.totalAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5">
                      <div>
                        <p className="text-[11px] text-white/40 uppercase tracking-widest">Paid</p>
                        <p className="text-sm text-emerald-400">₹{(prop.paidAmount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/40 uppercase tracking-widest">Pending</p>
                        <p className="text-sm text-amber-500">₹{(prop.pendingAmount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/40 uppercase tracking-widest">Profit</p>
                        <p className="text-sm font-bold text-white">₹{(prop.paidAmount || prop.totalAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">Items Rented</p>
                      <div className="space-y-1">
                        {prop.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-white/70 bg-white/5 px-2 py-1 rounded">
                            <span>{item.name}</span>
                            <span>₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur p-2 rounded">
                    <button onClick={() => setEditingProp(prop)} className="text-amber-500 hover:text-white text-xs">Edit</button>
                    <button onClick={() => handleDeleteProp(prop._id)} className="text-red-500 hover:text-white text-xs">Delete</button>
                  </div>
                </div>
              ))}
              {filteredProps.length === 0 && (
                <div className="col-span-full py-12 text-center text-white/30 border border-white/5 rounded-xl border-dashed">
                  No prop rentals found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prop Modal */}
      {editingProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111] border border-white/10 p-6 shadow-2xl rounded-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <h3 className="text-xl font-light uppercase tracking-widest text-white">
                {editingProp._id ? 'Edit Prop Rental' : 'New Prop Rental'}
              </h3>
              <button onClick={() => setEditingProp(null)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveProp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Customer Name</label>
                  <input type="text" name="customerName" defaultValue={editingProp.customerName} required className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Phone (Optional)</label>
                  <input type="text" name="phone" defaultValue={editingProp.phone} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Email</label>
                  <input type="email" name="email" defaultValue={editingProp.email} required className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Total Amount</label>
                  <input 
                    type="number" 
                    name="totalAmount"
                    value={editingProp.totalAmount !== undefined ? editingProp.totalAmount : (editingProp.items || []).reduce((sum, item) => sum + item.price, 0)} 
                    onChange={e => setEditingProp({...editingProp, totalAmount: Number(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Paid Amount</label>
                  <input 
                    type="number" 
                    name="paidAmount" 
                    value={editingProp.paidAmount || 0} 
                    onChange={e => setEditingProp({...editingProp, paidAmount: Number(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-emerald-400 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Pending Amount</label>
                  <input 
                    type="number" 
                    name="pendingAmount" 
                    value={(editingProp.totalAmount !== undefined ? editingProp.totalAmount : (editingProp.items || []).reduce((sum, item) => sum + item.price, 0)) - (editingProp.paidAmount || 0)} 
                    readOnly
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-amber-500 text-sm cursor-not-allowed opacity-50" 
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs uppercase tracking-widest text-white/50">Rented Items</label>
                  <button type="button" onClick={() => setEditingProp({...editingProp, items: [...(editingProp.items||[]), {name:'', price:0}]})} className="text-[11px] uppercase text-emerald-400 hover:text-emerald-300 tracking-widest">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {(editingProp.items||[]).map((item, idx) => {
                    const selectedInventoryItem = rentalItems.find(r => r.name === item.name);
                    return (
                    <div key={idx} className="flex gap-2 items-center">
                      {selectedInventoryItem?.imageUrl ? (
                        <img src={selectedInventoryItem.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded border border-white/10 bg-white/5 shrink-0 flex items-center justify-center text-[10px] text-white/30 uppercase">Img</div>
                      )}
                      <select 
                        value={item.name} 
                        onChange={e => {
                          const newItems = [...editingProp.items];
                          const selectedItem = rentalItems.find(r => r.name === e.target.value);
                          newItems[idx].name = e.target.value;
                          if (selectedItem) newItems[idx].price = selectedItem.price;
                          setEditingProp({...editingProp, items: newItems});
                        }}
                        className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded px-3 py-1.5 text-xs text-white" 
                        required
                      >
                        <option value="">Select Item...</option>
                        {rentalItems.map(rItem => (
                          <option key={rItem._id} value={rItem.name}>{rItem.name}</option>
                        ))}
                      </select>
                      <input 
                        type="number" 
                        placeholder="Price" 
                        value={item.price} 
                        onChange={e => {
                          const newItems = [...editingProp.items];
                          newItems[idx].price = Number(e.target.value);
                          setEditingProp({...editingProp, items: newItems});
                        }}
                        className="w-24 bg-black/50 border border-white/10 rounded px-3 py-1.5 text-xs text-emerald-400" 
                        required
                      />
                      <button type="button" onClick={() => {
                        const newItems = editingProp.items.filter((_, i) => i !== idx);
                        setEditingProp({...editingProp, items: newItems});
                      }} className="text-red-500 hover:text-red-400 shrink-0">✕</button>
                    </div>
                  )})}
                  {(!editingProp.items || editingProp.items.length === 0) && (
                    <p className="text-xs text-white/30 italic">No items added. Click + Add Item.</p>
                  )}
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-4 border-t border-white/10">
                <button type="button" onClick={() => setEditingProp(null)} className="px-4 py-2 text-white/50 hover:text-white uppercase tracking-widest text-xs">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-white text-black hover:bg-white/90 uppercase tracking-widest text-xs font-bold rounded transition-colors">Save Prop Rental</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'events' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-black/10 shadow-xs">
            <h3 className="text-base font-bold uppercase tracking-widest text-[#0f0f12]">Events ({filteredEvents.length})</h3>
            <div className="flex gap-2.5 flex-wrap">
              <button onClick={() => setIsServicesModalOpen(true)} className="px-4 py-2 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 uppercase tracking-widest text-xs font-bold rounded-xl transition-all shadow-xs">
                Services
              </button>
              <button onClick={() => setIsDeliverablesModalOpen(true)} className="px-4 py-2 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 uppercase tracking-widest text-xs font-bold rounded-xl transition-all shadow-xs">
                Deliverables
              </button>
              <button onClick={() => setIsComplimentriesModalOpen(true)} className="px-4 py-2 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 uppercase tracking-widest text-xs font-bold rounded-xl transition-all shadow-xs">
                Complimentries
              </button>
              <button onClick={() => setEditingEvent({name: '', services: [], deliverables: [], complimentries: [], paidAmount: 0, status: 'Scheduled'})} className="px-5 py-2 bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-bold rounded-xl transition-all shadow-xs">
                + New Event
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/10 shadow-xs p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => {
                const eventExpenses = expenses?.filter(e => e.bookingId === event._id && e.type === 'Event') || [];
                const eventTotalExpenses = eventExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                const eventProfit = (event.paidAmount || event.totalAmount || 0) - eventTotalExpenses;

                const isSearched = searchQuery && (
                  (event.name && event.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (event.clientName && event.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (event.phone && event.phone.includes(searchQuery)) ||
                  (event.email && event.email.toLowerCase().includes(searchQuery.toLowerCase()))
                );

                return (
                <div key={event._id} className={`bg-white border ${isSearched ? 'border-black ring-2 ring-black/10' : 'border-black/10'} rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all group relative flex flex-col`}>
                  <div className="p-5 space-y-3 flex-1 text-[#0f0f12]">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-mirage text-[#0f0f12] text-lg font-bold tracking-wide">{event.clientName || event.name}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md mt-1 inline-block ${
                          event.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          event.status === 'shoot done' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          event.status === 'editing in progress' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
                          event.status === 'finished' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          event.status === 'cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          event.status === 'payment pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-neutral-100 text-neutral-700 border border-black/10'
                        }`}>{event.status || 'pending'}</span>
                        {event.subEventList && event.subEventList.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {event.subEventList.map((sub, si) => (
                              <span key={si} className="text-[10px] bg-purple-50 text-purple-900 border border-purple-200 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide">
                                {sub.name || `Event ${si + 1}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-neutral-400 font-bold uppercase tracking-widest block">Total</span>
                        <span className="text-[#0f0f12] font-bold text-base">₹{(event.totalAmount || 0).toLocaleString()}</span>
                        {(event.pendingAmount || 0) > 0 && (
                          <span className="text-xs text-amber-600 font-bold block mt-0.5">Pending: ₹{(event.pendingAmount || 0).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    
                    {(event.name || event.clientName) && (
                      <div className="text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded-xl border border-black/10">
                        <p><span className="text-neutral-400 font-bold uppercase">Event:</span> <span className="text-emerald-700 font-bold">{event.name}</span></p>
                        {event.phone && <p><span className="text-neutral-400 font-bold uppercase">Phone:</span> {event.phone}</p>}
                        {event.email && <p><span className="text-neutral-400 font-bold uppercase">Email:</span> {event.email}</p>}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-4 gap-2 py-2 border-y border-black/10">
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Total</p>
                        <p className="text-xs font-bold text-[#0f0f12]">₹{(event.totalAmount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Discount</p>
                        <p className="text-xs font-bold text-rose-600">₹{(event.discount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Paid</p>
                        <p className="text-xs font-bold text-emerald-700">₹{(event.paidAmount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Pending</p>
                        <p className="text-xs font-bold text-amber-600">₹{(event.pendingAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    {event.album?.enabled && (
                      <div className="flex justify-between text-xs bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                        <span className="text-amber-900 font-bold uppercase tracking-widest text-[10px]">📷 Album: {event.album.sheets} sheets</span>
                        <span className="text-amber-900 font-bold">₹{((event.album.sheets || 0) * 500).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 pt-0 space-y-2 flex-grow flex flex-col justify-end">
                    {event.followUps && event.followUps.filter(n => n.isPinned).length > 0 && (
                      <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 font-medium flex flex-col gap-1 w-full">
                        {event.followUps.filter(n => n.isPinned).map(n => (
                          <div key={n._id} className="flex gap-2 items-start leading-tight">
                            <span className="shrink-0 mt-0.5">📌</span>
                            <span>{n.note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setViewingEventId(event._id)}
                      className="w-full py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-xs"
                    >
                      View Details
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => onAddExpense({ date: event.date || new Date().toISOString().split('T')[0], items: [{description: `Expense for ${event.name}`, amount: 0}], type: 'Event', bookingId: event._id })} className="flex-1 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-2 py-1.5 rounded-xl border border-black/10 transition-colors">
                        + Expense
                      </button>
                      <button onClick={() => handleDownloadEventPdf(event._id)} disabled={downloadingPdfId === event._id} className={`flex-1 text-xs px-2 py-1.5 rounded-xl border font-bold transition-colors ${downloadingPdfId === event._id ? 'text-neutral-400 border-black/10 cursor-not-allowed' : 'text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100'}`}>
                        {downloadingPdfId === event._id ? '...' : 'PDF'}
                      </button>
                      <button onClick={() => setEditingEvent(event)} className="flex-1 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-2 py-1.5 rounded-xl border border-black/10 transition-colors">Edit</button>
                      <button onClick={() => handleDeleteEvent(event._id)} className="flex-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-1.5 rounded-xl border border-rose-200 transition-colors">Delete</button>
                    </div>
                  </div>
                </div>
              );
              })}
              {filteredEvents.length === 0 && (
                <div className="col-span-full py-12 text-center text-neutral-400 border border-black/10 rounded-2xl border-dashed bg-neutral-50/50">
                  No events found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event View Details Modal */}
      {viewingEventId && (() => {
        const event = eventsData.find(ev => ev._id === viewingEventId);
        if (!event) return null;
        const paid = (event.payments && event.payments.length > 0) ? event.payments.reduce((sum, p) => sum + p.amount, 0) : (event.paidAmount || 0);
        const pending = (event.totalAmount || 0) - paid;
        return (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex justify-center items-start p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-white border border-black/10 rounded-3xl p-6 relative shadow-2xl mt-4 mb-10 text-[#0f0f12]">
              <div className="sticky top-0 z-50 flex justify-end -mt-2 -mr-2 mb-2">
                <button onClick={() => { setViewingEventId(null); setEventNoteInput(''); }} className="text-neutral-400 hover:text-black text-xl w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full shadow-xs border border-black/10 transition-colors">✕</button>
              </div>
              <div className="mb-4">
                <h2 className="text-xl font-mirage text-[#0f0f12] font-bold uppercase tracking-widest">{event.name}</h2>
                {event.clientName && <p className="text-sm text-neutral-500 font-medium mt-1">{event.clientName} {event.phone && `· ${event.phone}`}</p>}
                {event.date && <p className="text-xs text-emerald-700 font-bold mt-0.5">{event.date}</p>}
              </div>

              {/* Status & Team */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-neutral-50 border border-black/10 rounded-2xl p-4">
                  <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 font-bold">Status</h4>
                  <select
                    value={event.status || 'pending'}
                    onChange={(e) => handleUpdateEventStatus(event._id, e.target.value)}
                    className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#0f0f12] outline-none shadow-xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="converted">Converted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shoot done">Shoot Done</option>
                    <option value="editing in progress">Editing In Progress</option>
                    <option value="payment pending">Payment Pending</option>
                    <option value="finished">Finished</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="bg-neutral-50 border border-black/10 rounded-2xl p-4">
                  <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 font-bold">Team Assignment</h4>
                  <select
                    value={(event.assignedTeamMember?._id || event.assignedTeamMember) || ''}
                    onChange={(e) => handleUpdateEventTeam(event._id, e.target.value)}
                    className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#0f0f12] outline-none shadow-xs"
                  >
                    <option value="">-- Unassigned --</option>
                    {eventTeamMembers.map(tm => (
                      <option key={tm._id} value={tm._id}>{tm.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Tracking */}
              <div className="mb-4 bg-neutral-50 border border-black/10 rounded-2xl p-5">
                <h4 className="text-sm font-mirage text-[#0f0f12] font-bold uppercase tracking-widest mb-3">Payment Tracking</h4>
                {event.payments && event.payments.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-[10px] uppercase text-neutral-500 font-bold mb-2">Installments</h5>
                    <div className="space-y-1.5">
                      {event.payments.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-black/10 text-xs text-[#0f0f12] font-medium shadow-xs">
                          <span className="text-sm font-medium">{new Date(p.date).toLocaleDateString()} - {p.method} {p.receivedBy ? `(Rcvd by: ${eventTeamMembers.find(tm => tm._id === p.receivedBy)?.name || p.receivedBy})` : ''}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-emerald-700">₹{p.amount}</span>
                            <button onClick={() => handleDeleteEventInstallment(event._id, p._id)} className="text-rose-600 hover:text-rose-800 shrink-0 font-bold p-1" title="Delete">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white p-3 rounded-xl border border-black/10 text-center shadow-xs">
                    <p className="text-[10px] uppercase text-neutral-500 font-bold mb-1">Total Amount</p>
                    <p className="text-sm font-bold text-[#0f0f12]">₹{(event.totalAmount || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-black/10 text-center shadow-xs">
                    <p className="text-[10px] uppercase text-neutral-500 font-bold mb-1">Paid So Far</p>
                    <p className="text-sm font-bold text-emerald-700">₹{paid.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-black/10 text-center shadow-xs">
                    <p className="text-[10px] uppercase text-neutral-500 font-bold mb-1">Pending</p>
                    <p className="text-sm font-bold text-amber-600">₹{pending.toLocaleString()}</p>
                  </div>
                </div>
                <form onSubmit={(e) => handleEventPayment(event._id, e)} className="space-y-3">
                  <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Add Installment</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase text-neutral-500 font-bold block mb-1">Total Amount</label>
                      <input type="number" name="totalAmount" defaultValue={event.totalAmount || 0} className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#0f0f12] outline-none shadow-xs" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-neutral-500 font-bold block mb-1">New Payment Amount</label>
                      <input type="number" name="newPaymentAmount" placeholder="0" className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#0f0f12] outline-none shadow-xs" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-neutral-500 font-bold block mb-1">Method</label>
                      <select 
                        name="newPaymentMethod" 
                        value={paymentMethodForEvent[event._id] || 'Cash'}
                        onChange={(e) => setPaymentMethodForEvent({...paymentMethodForEvent, [event._id]: e.target.value})}
                        className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#0f0f12] outline-none shadow-xs">
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </div>
                    {paymentMethodForEvent[event._id] === 'UPI' && (
                      <div>
                        <label className="text-[9px] uppercase text-neutral-500 font-bold block mb-1">UTR Number (Optional)</label>
                        <input type="text" name="newPaymentUTR" placeholder="UTR (If UPI/Studio QR)" className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#0f0f12] outline-none shadow-xs" />
                      </div>
                    )}
                    <div>
                      <label className="text-[9px] uppercase text-neutral-500 font-bold block mb-1">Received By</label>
                      <select name="newPaymentReceivedBy" className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#0f0f12] outline-none shadow-xs">
                        <option value="">Select Member</option>
                        {paymentMethodForEvent[event._id] === 'UPI' && <option value="Studio QR">Studio QR</option>}
                        {eventTeamMembers.map(tm => <option key={tm._id} value={tm._id}>{tm.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs uppercase font-bold tracking-widest transition-all shadow-xs">Update Payment</button>
                </form>
              </div>

              {/* Notes — directly displayed */}
              <div className="mb-4 bg-neutral-50 border border-black/10 rounded-2xl p-5">
                <h4 className="text-sm font-mirage text-[#0f0f12] font-bold uppercase tracking-widest mb-3">Notes</h4>
                {event.followUps && event.followUps.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {event.followUps.map((fu, idx) => (
                      <div key={fu._id || idx} className="flex justify-between items-start bg-white p-3 rounded-xl border border-black/10 shadow-xs">
                        <div>
                          <p className="text-xs text-[#0f0f12] font-medium">{fu.note}</p>
                          <p className="text-[10px] text-neutral-400 font-medium mt-1">
                            {new Date(fu.date).toLocaleString()}
                            {fu.isPinned && <span className="text-amber-600 font-bold ml-2">📌 PINNED</span>}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center ml-3 shrink-0">
                          <button onClick={async () => {
                            try {
                              const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${event._id}/followups/${fu._id}`, { note: fu.note, isPinned: !fu.isPinned });
                              setEventsData(prev => prev.map(ev => ev._id === event._id ? res.data : ev));
                            } catch (error) {
                              console.error(error);
                              alert('Error updating note');
                            }
                          }} className={`${fu.isPinned ? 'text-amber-600' : 'text-neutral-400 hover:text-black'} text-xs transition-colors`} title={fu.isPinned ? "Unpin note" : "Pin note"}>
                            📌
                          </button>
                          <button onClick={() => handleDeleteEventNote(event._id, fu._id)} className="text-rose-600 hover:text-rose-800 text-xs font-bold p-1">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic mb-3">No notes yet.</p>
                )}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const noteInput = e.target.note.value;
                  const isPinned = e.target.isPinned.checked;
                  if (!noteInput.trim()) return;
                  try {
                    const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/events/${event._id}/followup`, { note: noteInput, isPinned });
                    setEventsData(prev => prev.map(ev => ev._id === event._id ? res.data : ev));
                    e.target.reset();
                  } catch (error) {
                    alert('Error adding note');
                  }
                }} className="flex gap-2 items-center">
                  <input
                    type="text"
                    name="note"
                    placeholder="Add a note..."
                    className="flex-1 bg-white border border-black/15 rounded-xl px-3.5 py-2 text-xs font-medium text-[#0f0f12] outline-none shadow-xs"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-neutral-500 font-bold cursor-pointer hover:text-black transition-colors">
                    <input type="checkbox" name="isPinned" className="accent-amber-500" />
                    Pin
                  </label>
                  <button type="submit" className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs uppercase font-bold tracking-widest transition-all shadow-xs">+ Add</button>
                </form>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditingEvent(event)} className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-[#0f0f12] font-bold border border-black/10 rounded-xl text-xs uppercase tracking-widest transition-all shadow-xs">Edit Event</button>
                <button onClick={() => handleDownloadEventPdf(event._id)} disabled={downloadingPdfId === event._id} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all shadow-xs ${downloadingPdfId === event._id ? 'text-neutral-400 border-black/10 cursor-not-allowed bg-neutral-100' : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'}`}>
                  {downloadingPdfId === event._id ? 'Downloading...' : 'Download PDF'}
                </button>
                <button onClick={() => handleSendEventPdf(event._id)} disabled={sendingPdfId === event._id} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all shadow-xs ${sendingPdfId === event._id ? 'text-neutral-400 border-black/10 cursor-not-allowed bg-neutral-100' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
                  {sendingPdfId === event._id ? 'Sending...' : 'Send PDF'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Events Edit Modal */}
      {editingEvent && (() => {
        const calculateEventTotal = (evt) => {
          let sum = 0;
          if (evt.subEventList && evt.subEventList.length > 0) {
            evt.subEventList.forEach(sub => {
              (sub.services || []).forEach(s => sum += (Number(s.price) || 0) * (Number(s.quantity) || 1));
            });
          } else if (evt.services && evt.services.length > 0) {
            evt.services.forEach(s => sum += (Number(s.price) || 0) * (Number(s.quantity) || 1));
          }
          (evt.deliverables || []).forEach(d => sum += (Number(d.price) || 0) * (Number(d.quantity) || 1));
          (evt.complimentries || []).forEach(c => sum += (Number(c.price) || 0) * (Number(c.quantity) || 1));
          (evt.addOns || []).forEach(a => sum += (Number(a.price) || 0) * (Number(a.quantity) || 1));
          if (evt.album && evt.album.enabled) {
            sum += (Number(evt.album.sheets) || 0) * (Number(evt.album.pricePerSheet) || 500);
          }
          return sum;
        };
        const currentCalculatedTotal = calculateEventTotal(editingEvent);

        return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white border border-black/10 p-6 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto text-[#0f0f12]">
            <div className="sticky top-0 z-50 flex justify-between items-center mb-6 pb-4 border-b border-black/10 bg-white -mt-6 pt-6">
              <h3 className="text-xl font-mirage font-bold uppercase tracking-widest text-[#0f0f12]">
                {editingEvent._id ? 'Edit Event' : 'New Event'}
              </h3>
              <button onClick={() => setEditingEvent(null)} className="text-neutral-400 hover:text-black text-2xl w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-100 transition-all">&times;</button>
            </div>
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Event Name</label>
                  <input type="text" name="name" defaultValue={editingEvent.name} required className="w-full bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-[#0f0f12] text-xs font-semibold focus:bg-white focus:border-black outline-none shadow-xs" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Status</label>
                  <select name="status" defaultValue={editingEvent.status || 'pending'} className="w-full bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-[#0f0f12] text-xs font-semibold focus:bg-white focus:border-black outline-none shadow-xs">
                    <option value="pending">Pending</option>
                    <option value="converted">Converted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shoot done">Shoot Done</option>
                    <option value="editing in progress">Editing In Progress</option>
                    <option value="payment pending">Payment Pending</option>
                    <option value="finished">Finished</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Client Name (Optional)</label>
                  <input type="text" name="clientName" defaultValue={editingEvent.clientName} className="w-full bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-[#0f0f12] text-xs font-semibold focus:bg-white focus:border-black outline-none shadow-xs" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Phone (Optional)</label>
                  <input type="text" name="phone" defaultValue={editingEvent.phone} className="w-full bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-[#0f0f12] text-xs font-semibold focus:bg-white focus:border-black outline-none shadow-xs" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Event Date</label>
                  <input type="date" name="date" defaultValue={editingEvent.date || new Date().toISOString().split('T')[0]} required className="w-full bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-[#0f0f12] text-xs font-semibold focus:bg-white focus:border-black outline-none shadow-xs" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Email (Optional)</label>
                  <input type="email" name="email" defaultValue={editingEvent.email} className="w-full bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-[#0f0f12] text-xs font-semibold focus:bg-white focus:border-black outline-none shadow-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Total Amount</label>
                  <input 
                    type="number" 
                    name="totalAmount" 
                    value={currentCalculatedTotal} 
                    readOnly
                    className="w-full bg-neutral-100 border border-black/10 rounded-xl px-3.5 py-2 text-neutral-700 text-xs font-bold cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Paid Amount</label>
                  <input 
                    type="number" 
                    name="paidAmount" 
                    value={editingEvent.paidAmount || 0} 
                    onChange={e => setEditingEvent({...editingEvent, paidAmount: Number(e.target.value)})}
                    className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-3.5 py-2 text-emerald-800 text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none shadow-xs" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Pending Amount</label>
                  <input 
                    type="number" 
                    name="pendingAmount" 
                    value={currentCalculatedTotal - (editingEvent.discount || 0) - (editingEvent.paidAmount || 0)} 
                    readOnly
                    className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 text-amber-700 text-xs font-bold cursor-not-allowed" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Discount (%)</label>
                  <input 
                    type="number" 
                    value={editingEvent.discountPercentage || ''} 
                    onChange={e => {
                      const pct = Number(e.target.value);
                      const flatDiscount = Math.round((pct / 100) * currentCalculatedTotal);
                      setEditingEvent({...editingEvent, discountPercentage: pct, discount: flatDiscount});
                    }}
                    placeholder="e.g. 10" 
                    className="w-full bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-[#0f0f12] text-xs font-semibold focus:bg-white focus:border-black outline-none shadow-xs" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Discount (₹)</label>
                  <input 
                    type="number" 
                    name="discount" 
                    value={editingEvent.discount || 0} 
                    onChange={e => {
                      const flatDiscount = Number(e.target.value);
                      const pct = currentCalculatedTotal > 0 ? Number(((flatDiscount / currentCalculatedTotal) * 100).toFixed(2)) : 0;
                      setEditingEvent({...editingEvent, discount: flatDiscount, discountPercentage: pct});
                    }}
                    placeholder="0" 
                    className="w-full bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-[#0f0f12] text-xs font-semibold focus:bg-white focus:border-black outline-none shadow-xs" 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs uppercase tracking-widest text-[#0f0f12] font-bold">Sub Events & Services</label>
                  <button type="button" onClick={() => setEditingEvent({
                    ...editingEvent, 
                    subEventList: [...(editingEvent.subEventList || []), { name: '', services: [] }]
                  })} className="px-3 py-1.5 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 uppercase tracking-widest text-[10px] font-bold rounded-xl transition-all shadow-xs">+ Add Sub Event</button>
                </div>
                <div className="space-y-4">
                  {(editingEvent.subEventList || []).map((sub, sIdx) => (
                    <div key={sIdx} className="bg-neutral-50 p-4 rounded-2xl border border-black/10 space-y-3">
                      <div className="flex justify-between items-center mb-3">
                        <input 
                          type="text" 
                          placeholder="Sub Event Name (e.g., Haldi)" 
                          value={sub.name}
                          onChange={e => {
                            const newList = [...(editingEvent.subEventList || [])];
                            newList[sIdx].name = e.target.value;
                            setEditingEvent({...editingEvent, subEventList: newList});
                          }}
                          className="bg-white border border-black/15 rounded-xl px-3.5 py-1.5 text-xs text-[#0f0f12] font-semibold w-2/3 shadow-xs"
                          required
                        />
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => {
                            const newList = [...(editingEvent.subEventList || [])];
                            newList[sIdx].services.push({ name: '', price: 0, quantity: 1, isCustom: false });
                            setEditingEvent({...editingEvent, subEventList: newList});
                          }} className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition shadow-xs">+ Service</button>
                          <button type="button" onClick={() => {
                            const newList = editingEvent.subEventList.filter((_, i) => i !== sIdx);
                            setEditingEvent({...editingEvent, subEventList: newList});
                          }} className="text-rose-600 hover:text-rose-800 shrink-0 font-bold p-1">✕</button>
                        </div>
                      </div>
                      <div className="space-y-2 pl-4 border-l-2 border-black/10">
                        {(sub.services || []).map((svc, svcIdx) => (
                          <div key={svcIdx} className="flex gap-2">
                            <select 
                              value={svc.isCustom ? 'Custom' : svc.name}
                              onChange={e => {
                                const val = e.target.value;
                                const newList = [...(editingEvent.subEventList || [])];
                                if (val === 'Custom') {
                                  newList[sIdx].services[svcIdx].isCustom = true;
                                  newList[sIdx].services[svcIdx].name = '';
                                } else {
                                  newList[sIdx].services[svcIdx].isCustom = false;
                                  newList[sIdx].services[svcIdx].name = val;
                                  const predefined = predefinedServices?.find(ps => ps.name === val);
                                  if (predefined) {
                                    newList[sIdx].services[svcIdx].price = predefined.price;
                                  }
                                }
                                setEditingEvent({...editingEvent, subEventList: newList});
                              }}
                              className="flex-1 min-w-0 bg-white border border-black/15 rounded-xl px-3 py-1.5 text-xs text-[#0f0f12] font-semibold shadow-xs"
                              required
                            >
                              <option value="">Select Service</option>
                              {predefinedServices?.map((ps, i) => (
                                <option key={i} value={ps.name}>{ps.name}</option>
                              ))}
                              <option value="Custom">Custom</option>
                            </select>
                            
                            {svc.isCustom && (
                              <input
                                type="text"
                                placeholder="Custom Service Name"
                                value={svc.name}
                                onChange={e => {
                                  const newList = [...(editingEvent.subEventList || [])];
                                  newList[sIdx].services[svcIdx].name = e.target.value;
                                  setEditingEvent({...editingEvent, subEventList: newList});
                                }}
                                className="flex-1 min-w-0 bg-white border border-black/15 rounded-xl px-3 py-1.5 text-xs text-[#0f0f12] font-semibold shadow-xs"
                                required
                              />
                            )}

                            <input 
                              type="number" 
                              placeholder="Price" 
                              value={svc.price}
                              onChange={e => {
                                const newList = [...(editingEvent.subEventList || [])];
                                newList[sIdx].services[svcIdx].price = Number(e.target.value);
                                setEditingEvent({...editingEvent, subEventList: newList});
                              }}
                              className="w-24 bg-white border border-black/15 rounded-xl px-3 py-1.5 text-xs text-[#0f0f12] font-semibold shadow-xs"
                              required
                            />
                            
                            <input 
                              type="number" 
                              placeholder="Qty" 
                              value={svc.quantity === undefined ? 1 : svc.quantity}
                              min="1"
                              onChange={e => {
                                const newList = [...(editingEvent.subEventList || [])];
                                newList[sIdx].services[svcIdx].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                setEditingEvent({...editingEvent, subEventList: newList});
                              }}
                              className="w-16 bg-white border border-black/15 rounded-xl px-2 py-1.5 text-xs text-[#0f0f12] font-semibold shadow-xs"
                              required
                            />
                            <button type="button" onClick={() => {
                              const newList = [...(editingEvent.subEventList || [])];
                              newList[sIdx].services = newList[sIdx].services.filter((_, i) => i !== svcIdx);
                              setEditingEvent({...editingEvent, subEventList: newList});
                            }} className="text-rose-600 hover:text-rose-800 shrink-0 font-bold p-1">✕</button>
                          </div>
                        ))}
                        {(!sub.services || sub.services.length === 0) && (
                          <p className="text-xs text-neutral-400 italic">No services added for this sub event.</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!editingEvent.subEventList || editingEvent.subEventList.length === 0) && (
                    <p className="text-xs text-neutral-400 italic">No sub events added. Click + Add Sub Event.</p>
                  )}
                  
                  {/* Add-ons */}
                  <div className="pt-4 border-t border-black/10 mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-xs uppercase tracking-widest text-[#0f0f12] font-bold">Add-ons</label>
                      <button 
                        type="button" 
                        onClick={() => setEditingEvent({
                          ...editingEvent, 
                          addOns: [...(editingEvent.addOns || []), { name: '', price: 0 }]
                        })} 
                        className="px-3 py-1.5 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 uppercase tracking-widest text-[10px] font-bold rounded-xl transition-all shadow-xs"
                      >
                        + Add Add-on
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(editingEvent.addOns || []).map((addon, aIdx) => (
                        <div key={aIdx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Add-on Name"
                            value={addon.name}
                            onChange={e => {
                              const newList = [...(editingEvent.addOns || [])];
                              newList[aIdx].name = e.target.value;
                              setEditingEvent({...editingEvent, addOns: newList});
                            }}
                            className="flex-1 min-w-0 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-xs text-[#0f0f12] font-semibold focus:bg-white focus:border-black outline-none shadow-xs"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={addon.price || ''}
                            onChange={e => {
                              const newList = [...(editingEvent.addOns || [])];
                              newList[aIdx].price = Number(e.target.value);
                              setEditingEvent({...editingEvent, addOns: newList});
                            }}
                            className="w-24 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-xs text-[#0f0f12] font-semibold focus:bg-white focus:border-black outline-none shadow-xs"
                            required
                          />
                          <button type="button" onClick={() => {
                            const newList = editingEvent.addOns.filter((_, i) => i !== aIdx);
                            setEditingEvent({...editingEvent, addOns: newList});
                          }} className="text-rose-600 hover:text-rose-800 p-1 shrink-0 font-bold">✕</button>
                        </div>
                      ))}
                      {(!editingEvent.addOns || editingEvent.addOns.length === 0) && (
                        <p className="text-xs text-neutral-400 italic">No add-ons added.</p>
                      )}
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="pt-4 border-t border-black/10 mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-xs uppercase tracking-widest text-[#0f0f12] font-bold">Deliverables</label>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setIsDeliverablesModalOpen(true)} 
                          className="px-3 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 uppercase tracking-widest text-[10px] font-bold rounded-xl transition-all shadow-xs"
                        >
                          ⚙️ Manage Options
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingEvent({
                            ...editingEvent, 
                            deliverables: [...(editingEvent.deliverables || []), { name: predefinedDeliverables[0] || '', price: 0, isCustom: false }]
                          })} 
                          className="px-3 py-1.5 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 uppercase tracking-widest text-[10px] font-bold rounded-xl transition-all shadow-xs"
                        >
                          + Add Deliverable
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(editingEvent.deliverables || []).map((delObj, dIdx) => {
                        const isObj = typeof delObj === 'object' && delObj !== null;
                        const name = isObj ? delObj.name : delObj;
                        const price = isObj ? delObj.price : 0;
                        const isCustom = isObj ? delObj.isCustom : false;

                        return (
                        <div key={dIdx} className="flex gap-2 items-center">
                          <select 
                            value={isCustom ? 'Custom' : name}
                            onChange={e => {
                              const val = e.target.value;
                              const newList = [...(editingEvent.deliverables || [])].map(item => (typeof item === 'object' ? item : {name: item, price: 0}));
                              if (val === 'Custom') {
                                newList[dIdx] = { ...newList[dIdx], isCustom: true, name: '' };
                              } else {
                                newList[dIdx] = { ...newList[dIdx], isCustom: false, name: val, price: 0 };
                              }
                              setEditingEvent({...editingEvent, deliverables: newList});
                            }}
                            className="flex-1 min-w-0 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-xs text-[#0f0f12] font-semibold focus:bg-white focus:border-black outline-none shadow-xs"
                          >
                            <option value="">-- Select Deliverable --</option>
                            {predefinedDeliverables.map((dOpt, i) => (
                              <option key={i} value={dOpt}>{dOpt}</option>
                            ))}
                            <option value="Custom">Custom</option>
                          </select>
                          
                          {isCustom && (
                            <input
                              type="text"
                              placeholder="Custom Name"
                              value={name}
                              onChange={e => {
                                const newList = [...(editingEvent.deliverables || [])].map(item => (typeof item === 'object' ? item : {name: item, price: 0}));
                                newList[dIdx].name = e.target.value;
                                setEditingEvent({...editingEvent, deliverables: newList});
                              }}
                              className="flex-1 min-w-0 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-xs text-[#0f0f12] font-semibold focus:bg-white focus:border-black outline-none shadow-xs"
                            />
                          )}

                          {isCustom && (
                            <input
                              type="number"
                              placeholder="Price"
                              value={price}
                              onChange={e => {
                                const newList = [...(editingEvent.deliverables || [])].map(item => (typeof item === 'object' ? item : {name: item, price: 0}));
                                newList[dIdx].price = Number(e.target.value);
                                setEditingEvent({...editingEvent, deliverables: newList});
                              }}
                              className="w-24 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-xs text-[#0f0f12] font-semibold focus:bg-white focus:border-black outline-none shadow-xs"
                            />
                          )}
                          <button type="button" onClick={() => {
                            const newList = editingEvent.deliverables.filter((_, i) => i !== dIdx);
                            setEditingEvent({...editingEvent, deliverables: newList});
                          }} className="text-rose-600 hover:text-rose-800 p-1 shrink-0 font-bold">✕</button>
                        </div>
                      )})}
                      {(!editingEvent.deliverables || editingEvent.deliverables.length === 0) && (
                        <p className="text-xs text-neutral-400 italic">No deliverables added. Click + Add Deliverable.</p>
                      )}
                    </div>
                  </div>

                  {/* Complimentries */}
                  <div className="pt-4 border-t border-black/10 mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-xs uppercase tracking-widest text-[#0f0f12] font-bold">Complimentries</label>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setIsComplimentriesModalOpen(true)} 
                          className="px-3 py-1.5 border border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100 uppercase tracking-widest text-[10px] font-bold rounded-xl transition-all shadow-xs"
                        >
                          ⚙️ Manage Options
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingEvent({
                            ...editingEvent, 
                            complimentries: [...(editingEvent.complimentries || []), { name: predefinedComplimentries[0] || '', price: 0, isCustom: false }]
                          })} 
                          className="px-3 py-1.5 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 uppercase tracking-widest text-[10px] font-bold rounded-xl transition-all shadow-xs"
                        >
                          + Add Complimentry
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(editingEvent.complimentries || []).map((compObj, cIdx) => {
                        const isObj = typeof compObj === 'object' && compObj !== null;
                        const name = isObj ? compObj.name : compObj;
                        const price = isObj ? compObj.price : 0;
                        const isCustom = isObj ? compObj.isCustom : false;

                        return (
                        <div key={cIdx} className="flex gap-2 items-center">
                          <select 
                            value={isCustom ? 'Custom' : name}
                            onChange={e => {
                              const val = e.target.value;
                              const newList = [...(editingEvent.complimentries || [])].map(item => (typeof item === 'object' ? item : {name: item, price: 0}));
                              if (val === 'Custom') {
                                newList[cIdx] = { ...newList[cIdx], isCustom: true, name: '' };
                              } else {
                                newList[cIdx] = { ...newList[cIdx], isCustom: false, name: val, price: 0 };
                              }
                              setEditingEvent({...editingEvent, complimentries: newList});
                            }}
                            className="flex-1 min-w-0 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-xs text-[#0f0f12] font-semibold focus:bg-white focus:border-black outline-none shadow-xs"
                          >
                            <option value="">-- Select Complimentry --</option>
                            {predefinedComplimentries.map((cOpt, i) => (
                              <option key={i} value={cOpt}>{cOpt}</option>
                            ))}
                            <option value="Custom">Custom</option>
                          </select>

                          {isCustom && (
                            <input
                              type="text"
                              placeholder="Custom Name"
                              value={name}
                              onChange={e => {
                                const newList = [...(editingEvent.complimentries || [])].map(item => (typeof item === 'object' ? item : {name: item, price: 0}));
                                newList[cIdx].name = e.target.value;
                                setEditingEvent({...editingEvent, complimentries: newList});
                              }}
                              className="flex-1 min-w-0 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-xs text-[#0f0f12] font-semibold focus:bg-white focus:border-black outline-none shadow-xs"
                            />
                          )}

                          {isCustom && (
                            <input
                              type="number"
                              placeholder="Price"
                              value={price}
                              onChange={e => {
                                const newList = [...(editingEvent.complimentries || [])].map(item => (typeof item === 'object' ? item : {name: item, price: 0}));
                                newList[cIdx].price = Number(e.target.value);
                                setEditingEvent({...editingEvent, complimentries: newList});
                              }}
                              className="w-24 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2 text-xs text-[#0f0f12] font-semibold focus:bg-white focus:border-black outline-none shadow-xs"
                            />
                          )}
                          <button type="button" onClick={() => {
                            const newList = editingEvent.complimentries.filter((_, i) => i !== cIdx);
                            setEditingEvent({...editingEvent, complimentries: newList});
                          }} className="text-rose-600 hover:text-rose-800 p-1 shrink-0 font-bold">✕</button>
                        </div>
                      )})}
                      {(!editingEvent.complimentries || editingEvent.complimentries.length === 0) && (
                        <p className="text-xs text-neutral-400 italic">No complimentries added. Click + Add Complimentry.</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Album Option */}
              <div className="pt-4 border-t border-black/10 mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-amber-600"
                      checked={editingEvent.album?.enabled || false}
                      onChange={e => setEditingEvent({...editingEvent, album: {...(editingEvent.album || {}), enabled: e.target.checked, pricePerSheet: 500}})}
                    />
                    <span className="text-xs uppercase tracking-widest text-amber-900 font-bold">Include Album (₹500 per sheet)</span>
                  </label>
                </div>
                {editingEvent.album?.enabled && (
                  <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase text-amber-900 font-bold block mb-1">Number of Albums</label>
                        <input
                          type="number"
                          min="1"
                          value={editingEvent.album?.numberOfAlbums || ''}
                          onChange={e => {
                            const val = e.target.value;
                            const newCount = val === '' ? '' : Math.max(1, Number(val));
                            const countForArray = Number(newCount) || 1;
                            const currentSheets = editingEvent.album?.sheetsPerAlbum || [editingEvent.album?.sheets || 0];
                            const newSheets = Array(countForArray).fill(0).map((_, i) => currentSheets[i] || 0);
                            const totalSheets = newSheets.reduce((a, b) => a + b, 0);
                            setEditingEvent({...editingEvent, album: {...(editingEvent.album || {}), numberOfAlbums: newCount, sheetsPerAlbum: newSheets, sheets: totalSheets, pricePerSheet: 500}});
                          }}
                          className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-1.5 text-[#0f0f12] text-xs font-semibold shadow-xs"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-amber-800 font-bold">Total Album Cost</p>
                        <p className="text-base font-bold text-amber-900">₹{((editingEvent.album?.sheets || 0) * 500).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {Array.from({ length: editingEvent.album?.numberOfAlbums || 1 }).map((_, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs">
                        <label className="text-[10px] uppercase text-amber-900 font-bold block mb-1">Number of Sheets for Album {idx + 1}</label>
                        <input
                          type="number"
                          min="0"
                          value={(editingEvent.album?.sheetsPerAlbum || [])[idx] ?? (idx === 0 ? (editingEvent.album?.sheets || 0) : 0)}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const currentSheets = [...(editingEvent.album?.sheetsPerAlbum || [editingEvent.album?.sheets || 0])];
                            while (currentSheets.length < (editingEvent.album?.numberOfAlbums || 1)) currentSheets.push(0);
                            currentSheets[idx] = val;
                            const totalSheets = currentSheets.reduce((a, b) => a + b, 0);
                            setEditingEvent({...editingEvent, album: {...(editingEvent.album || {}), sheetsPerAlbum: currentSheets, sheets: totalSheets, pricePerSheet: 500}});
                          }}
                          className="w-full bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-1.5 text-[#0f0f12] text-xs font-semibold shadow-xs"
                        />
                      </div>
                    ))}
                    <p className="text-[10px] text-amber-800 font-medium">Note: Album cost will be reflected in total amount.</p>
                  </div>
                )}
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-black/10 mt-4">
                <button type="button" onClick={() => setEditingEvent(null)} className="px-4 py-2 text-neutral-500 hover:text-black uppercase tracking-widest text-xs font-bold transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white uppercase tracking-widest text-xs font-bold rounded-xl shadow-xs transition-all">Save Event</button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {viewShootExpenses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111] border border-white/10 p-6 shadow-2xl rounded-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <h3 className="text-xl font-light uppercase tracking-widest text-white">
                Expenses for {viewShootExpenses.shootName}
              </h3>
              <button onClick={() => setViewShootExpenses(null)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {viewShootExpenses.expenses.map((expense, idx) => (
                <div key={idx} className="flex justify-between items-center bg-black/40 border border-white/5 p-4 rounded-lg">
                  <div>
                    <div className="text-xs text-white/50 mb-1">{expense.date}</div>
                    <div className="text-sm text-white">{expense.description}</div>
                  </div>
                  <div className="text-red-400 font-bold">
                    ₹{expense.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    {isInventoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#111] border border-white/10 p-6 shadow-2xl rounded-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <h3 className="text-xl font-light uppercase tracking-widest text-white">Manage Rental Inventory</h3>
              <button onClick={() => setIsInventoryModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-8">
              <div>
                <h4 className="text-sm uppercase tracking-widest text-emerald-400 mb-6">{editingInventoryItem ? 'Edit Item' : 'Add New Item'}</h4>
                <form onSubmit={handleSaveInventoryItem} className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                  <div className="w-full">
                    <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Item Name</label>
                    <input type="text" name="name" defaultValue={editingInventoryItem?.name} required className="w-full bg-black/20 focus:bg-black/40 border border-white/10 focus:border-white/30 rounded-lg px-4 py-2.5 text-sm text-white transition-colors outline-none" />
                  </div>
                  <div className="w-full">
                    <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Default Price</label>
                    <input type="number" name="price" defaultValue={editingInventoryItem?.price} required className="w-full bg-black/20 focus:bg-black/40 border border-white/10 focus:border-white/30 rounded-lg px-4 py-2.5 text-sm text-white transition-colors outline-none" />
                  </div>
                  <div className="w-full sm:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Image (Optional)</label>
                    <div className="h-32 rounded-lg overflow-hidden">
                      <DragDropImageUploader onUploadSuccess={(url) => setInventoryImageUrl(url)} currentImage={inventoryImageUrl || editingInventoryItem?.imageUrl} />
                    </div>
                  </div>
                  <div className="w-full sm:col-span-2 flex justify-end gap-3 mt-4">
                    {editingInventoryItem && (
                      <button type="button" onClick={() => { setEditingInventoryItem(null); setInventoryImageUrl(''); }} className="px-6 py-2.5 border border-white/20 text-white rounded-lg text-xs tracking-widest uppercase hover:bg-white/5 transition-colors">Cancel</button>
                    )}
                    <button type="submit" className="px-6 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-emerald-500/30 transition-colors whitespace-nowrap">Save Item</button>
                  </div>
                </form>
              </div>

              <div>
                <h4 className="text-sm uppercase text-white/70 mb-4 border-b border-white/10 pb-2">Current Inventory</h4>
                <div className="space-y-2">
                  <div className="flex justify-between px-4 py-2 text-xs uppercase text-white/40 border-b border-white/5">
                    <span>Item Name</span>
                    <span>Default Price</span>
                  </div>
                  {rentalItems.map(item => (
                    <div key={item._id} className="flex justify-between items-center p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg group">
                      <div className="flex items-center gap-4">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded" />
                        )}
                        <div className="font-medium text-white">{item.name}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-emerald-400 font-mono">₹{item.price.toLocaleString()}</div>
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingInventoryItem(item); setInventoryImageUrl(item.imageUrl || ''); }} className="text-amber-500 hover:text-amber-400 text-xs uppercase tracking-widest">Edit</button>
                          <button onClick={() => handleDeleteInventoryItem(item._id)} className="text-red-500 hover:text-red-400 text-xs uppercase tracking-widest">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {rentalItems.length === 0 && (
                    <div className="text-center py-8 text-white/30 text-sm">Inventory is empty. Add some items above.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isServicesModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-black/10 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl text-[#0f0f12]">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-black/10">
              <h3 className="font-mirage text-lg font-bold uppercase tracking-widest text-[#0f0f12]">Manage Predefined Services</h3>
              <button onClick={() => setIsServicesModalOpen(false)} className="text-neutral-400 hover:text-black transition p-1 text-base">✕</button>
            </div>
            <div className="space-y-4">
              {predefinedServices.map((ps, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={ps.name} 
                    onChange={e => {
                      const newSvcs = [...predefinedServices];
                      newSvcs[idx].name = e.target.value;
                      setPredefinedServices(newSvcs);
                    }} 
                    className="flex-1 min-w-0 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2.5 text-[#0f0f12] text-xs font-medium focus:bg-white focus:border-black outline-none shadow-xs"
                    placeholder="Service Name"
                  />
                  <input 
                    type="number" 
                    value={ps.price || ''} 
                    onChange={e => {
                      const newSvcs = [...predefinedServices];
                      newSvcs[idx].price = e.target.value === '' ? 0 : Number(e.target.value);
                      setPredefinedServices(newSvcs);
                    }} 
                    className="w-28 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2.5 text-[#0f0f12] text-xs font-semibold focus:bg-white focus:border-black outline-none shadow-xs"
                    placeholder="Price ₹"
                  />
                  <button onClick={() => {
                    const newSvcs = predefinedServices.filter((_, i) => i !== idx);
                    setPredefinedServices(newSvcs);
                  }} className="text-neutral-400 hover:text-rose-600 transition p-2">✕</button>
                </div>
              ))}
              <button onClick={() => setPredefinedServices([...predefinedServices, {name: '', price: 0}])} className="w-full py-2.5 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-xs">+ Add Service Option</button>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => {
                handleSavePredefinedServices(predefinedServices);
                setIsServicesModalOpen(false);
              }} className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-xs transition-all">
                Save Services
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliverables Management Modal */}
      {isDeliverablesModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-black/10 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl text-[#0f0f12]">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-black/10">
              <h3 className="font-mirage text-lg font-bold uppercase tracking-widest text-[#0f0f12]">Manage Deliverables</h3>
              <button onClick={() => setIsDeliverablesModalOpen(false)} className="text-neutral-400 hover:text-black transition p-1 text-base">✕</button>
            </div>
            <div className="space-y-3">
              {predefinedDeliverables.map((del, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={del} 
                    onChange={e => {
                      const newDel = [...predefinedDeliverables];
                      newDel[idx] = e.target.value;
                      setPredefinedDeliverables(newDel);
                    }} 
                    className="flex-1 min-w-0 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2.5 text-[#0f0f12] text-xs font-medium focus:bg-white focus:border-black outline-none shadow-xs"
                    placeholder="Deliverable Name (e.g., Candid Video)"
                  />
                  <button onClick={() => {
                    const newDel = predefinedDeliverables.filter((_, i) => i !== idx);
                    setPredefinedDeliverables(newDel);
                  }} className="text-neutral-400 hover:text-rose-600 transition p-2">✕</button>
                </div>
              ))}
              <button onClick={() => setPredefinedDeliverables([...predefinedDeliverables, ''])} className="w-full py-2.5 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-xs">+ Add Deliverable Option</button>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => {
                const cleaned = predefinedDeliverables.filter(d => d.trim() !== '');
                handleSavePredefinedDeliverables(cleaned);
                setIsDeliverablesModalOpen(false);
              }} className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-xs transition-all">
                Save Deliverables
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complimentries Management Modal */}
      {isComplimentriesModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-black/10 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl text-[#0f0f12]">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-black/10">
              <h3 className="font-mirage text-lg font-bold uppercase tracking-widest text-[#0f0f12]">Manage Complimentries</h3>
              <button onClick={() => setIsComplimentriesModalOpen(false)} className="text-neutral-400 hover:text-black transition p-1 text-base">✕</button>
            </div>
            <div className="space-y-3">
              {predefinedComplimentries.map((comp, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={comp} 
                    onChange={e => {
                      const newComp = [...predefinedComplimentries];
                      newComp[idx] = e.target.value;
                      setPredefinedComplimentries(newComp);
                    }} 
                    className="flex-1 min-w-0 bg-neutral-50 border border-black/15 rounded-xl px-3.5 py-2.5 text-[#0f0f12] text-xs font-medium focus:bg-white focus:border-black outline-none shadow-xs"
                    placeholder="Complimentry Name (e.g., Free Album)"
                  />
                  <button onClick={() => {
                    const newComp = predefinedComplimentries.filter((_, i) => i !== idx);
                    setPredefinedComplimentries(newComp);
                  }} className="text-neutral-400 hover:text-rose-600 transition p-2">✕</button>
                </div>
              ))}
              <button onClick={() => setPredefinedComplimentries([...predefinedComplimentries, ''])} className="w-full py-2.5 border border-black/20 bg-white text-[#0f0f12] hover:bg-neutral-100 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-xs">+ Add Complimentry Option</button>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => {
                const cleaned = predefinedComplimentries.filter(c => c.trim() !== '');
                handleSavePredefinedComplimentries(cleaned);
                setIsComplimentriesModalOpen(false);
              }} className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-xs transition-all">
                Save Complimentries
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BusinessView;
