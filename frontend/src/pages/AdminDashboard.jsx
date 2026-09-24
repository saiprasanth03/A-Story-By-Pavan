import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { siteConfig } from '../config/site.config';
import DragDropImageUploader from '../components/DragDropImageUploader';
import DragDropVideoUploader from '../components/DragDropVideoUploader';
import CalendarView from '../components/admin/CalendarView';
import BusinessView from '../components/admin/BusinessView';
import FollowUpsCalendar from '../components/admin/FollowUpsCalendar';
import QuotesPanel from '../components/admin/QuotesPanel';
import { packagesData } from '../data/packages';

export const getTypeBadgeClass = (type) => {
  const t = String(type || '').toUpperCase();
  if (t === 'LEAD') return 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10';
  if (t === 'BOOKING') return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10';
  if (t === 'INQUIRY') return 'border-purple-500/40 text-purple-400 bg-purple-500/10';
  return 'border-white/20 text-white/70 bg-white/5';
};

export const getStatusBadgeClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'new') return 'border-sky-500/40 text-sky-400 bg-sky-500/10';
  if (s === 'contacted') return 'border-blue-500/40 text-blue-400 bg-blue-500/10';
  if (s === 'pending') return 'border-amber-500/40 text-amber-400 bg-amber-500/10';
  if (s === 'negotiation') return 'border-orange-500/40 text-orange-400 bg-orange-500/10';
  if (s === 'confirmed' || s === 'converted') return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10';
  if (s === 'shoot done') return 'border-purple-500/40 text-purple-400 bg-purple-500/10';
  if (s === 'editing in process') return 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10';
  if (s === 'finished' || s === 'completed') return 'border-teal-500/40 text-teal-400 bg-teal-500/10';
  if (s === 'cancelled' || s === 'lost') return 'border-rose-500/40 text-rose-400 bg-rose-500/10';
  if (s === 'junk lead' || s === 'junk') return 'border-gray-500/40 text-gray-400 bg-gray-500/10';
  return 'border-white/20 text-white/70 bg-white/5';
};

const AdminDashboard = () => {
  const storedUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const userPermissions = storedUser.permissions || [];
  const isSuperAdmin = storedUser.isSuperAdmin === true || localStorage.getItem('adminBypass') === 'true';
  const allTabs = ['dashboard', 'leads', 'quotes', 'inquiries', 'follow ups', 'studio bookings', 'props rentals', 'events', 'calendar', 'slots', 'business', 'customers', 'testimonials', 'team', 'cms', 'hero', 'landing pages', 'studio', 'services', 'themes', 'gallery', 'client gallery', 'permissions', 'developer options'];
  const allowedTabs = isSuperAdmin ? allTabs : allTabs.filter(tab => userPermissions.includes(tab));
  const initialTab = allowedTabs.includes('dashboard') ? 'dashboard' : (allowedTabs[0] || 'dashboard');

  const [activeTab, setActiveTab] = useState(initialTab);

  const [dashboardStartDate, setDashboardStartDate] = useState('');
  const [dashboardEndDate, setDashboardEndDate] = useState('');
  const [dashboardTypeFilter, setDashboardTypeFilter] = useState('all'); // 'all', 'leads', 'inquiries'
  const [dashboardDateFilter, setDashboardDateFilter] = useState('all'); // 'all', 'today', 'thisWeek'
  const [filterBookings, setFilterBookings] = useState('all');
  const [filterLeads, setFilterLeads] = useState('all');
  const [filterInquiries, setFilterInquiries] = useState('all');
  const [filterPending, setFilterPending] = useState('all');
  const [filterConfirmed, setFilterConfirmed] = useState('all');
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const [viewingDetailsBookingId, setViewingDetailsBookingId] = useState(null);

  // Data States
  const [content, setContent] = useState([]);
  const [services, setServices] = useState([]);
  const [themes, setThemes] = useState([]);
  const [themeCategories, setThemeCategories] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [galleryCategoriesData, setGalleryCategoriesData] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);


  const [leads, setLeads] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [landingPages, setLandingPages] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [editingAdminUser, setEditingAdminUser] = useState(null);
  const [partners, setPartners] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [viewingExpensesBookingId, setViewingExpensesBookingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGlobalSubmitting, setIsGlobalSubmitting] = useState(false);

  const filterByDate = (items) => {
    if (!dashboardStartDate && !dashboardEndDate) return items;
    return items.filter(item => {
      const itemDate = new Date(item.createdAt || item.date);
      // Reset time to start of day for comparison
      itemDate.setHours(0,0,0,0);
      
      let start = dashboardStartDate ? new Date(dashboardStartDate) : null;
      let end = dashboardEndDate ? new Date(dashboardEndDate) : null;
      
      if (start) start.setHours(0,0,0,0);
      if (end) end.setHours(23,59,59,999);

      if (start && end) return itemDate >= start && itemDate <= end;
      if (start) return itemDate >= start;
      if (end) return itemDate <= end;
      return true;
    });
  };

  const dashboardFilteredLeads = filterByDate(leads);
  const dashboardFilteredInquiries = filterByDate(inquiries);
  const dashboardFilteredBookings = filterByDate(bookings);

  const combinedRecent = [
    ...dashboardFilteredLeads.map(l => ({...l, isType: 'LEAD', created: l.createdAt || l.date})),
    ...dashboardFilteredInquiries.map(i => ({...i, isType: 'INQUIRY', created: i.createdAt || i.date})),
    ...dashboardFilteredBookings.map(b => ({...b, isType: 'BOOKING', created: b.createdAt || b.date}))
  ]
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .filter(item => dashboardTypeFilter === 'all' ? true : (dashboardTypeFilter === 'leads' ? item.isType === 'LEAD' : dashboardTypeFilter === 'bookings' ? item.isType === 'BOOKING' : item.isType === 'INQUIRY'))
    .filter(item => {
      if (dashboardDateFilter === 'all') return true;
      const itemDate = new Date(item.created);
      const today = new Date();
      if (dashboardDateFilter === 'today') {
        return itemDate.toDateString() === today.toDateString();
      }
      if (dashboardDateFilter === 'thisWeek') {
        const pastWeek = new Date();
        pastWeek.setDate(pastWeek.getDate() - 7);
        pastWeek.setHours(0, 0, 0, 0); 
        return itemDate >= pastWeek;
      }
      return true;
    })
    .slice(0, 10);

  useEffect(() => {
    if (highlightedItemId) {
      let attempts = 0;
      const tryScroll = setInterval(() => {
        const el = document.getElementById(`row-${highlightedItemId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          clearInterval(tryScroll);
          setTimeout(() => setHighlightedItemId(null), 5000);
        }
        attempts++;
        if (attempts > 20) clearInterval(tryScroll); // Stop after 2 seconds
      }, 100);
    }
  }, [highlightedItemId, activeTab]);
  
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use(config => {
      if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
        setIsGlobalSubmitting(true);
      }
      return config;
    });
    const resInterceptor = axios.interceptors.response.use(
      response => {
        setIsGlobalSubmitting(false);
        return response;
      },
      error => {
        setIsGlobalSubmitting(false);
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);
  
  // Edit States
  const [editingContent, setEditingContent] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingSubService, setEditingSubService] = useState(null); // For nested subservices
  const [selectedImageIndices, setSelectedImageIndices] = useState([]);
  const [editingThemeCategory, setEditingThemeCategory] = useState(null);
  const [editingTheme, setEditingTheme] = useState(null);
  const [editingHero, setEditingHero] = useState(null);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [editingLandingPage, setEditingLandingPage] = useState(null);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Gallery Upload State
  const [galleryCategory, setGalleryCategory] = useState('Maternity');
  const [galleryMediaType, setGalleryMediaType] = useState('image');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [selectedThemeCategory, setSelectedThemeCategory] = useState(null);

  // Slots & Settings State
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeekdayConfig, setSelectedWeekdayConfig] = useState(new Date().getDay());
  const [slotData, setSlotData] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [settings, setSettings] = useState({ blockedWeekdays: [], metaPixelId: '', googleAnalyticsId: '' });

  // CRM States
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryFilter, setInquiryFilter] = useState('All');
  const [customersSearch, setCustomersSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadFilter, setLeadFilter] = useState('All');
  const [followUpModal, setFollowUpModal] = useState(null); // { type: 'booking' | 'inquiry', id: string }
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  
  // Bookings Filter and Modal State
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingMonthFilter, setBookingMonthFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All Bookings');
  const [bookingSearchText, setBookingSearchText] = useState('');
  
  // Subscriptions Feature
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState(null);

  // Test Email State
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState('');

  // Client Gallery State
  const [clientGalleries, setClientGalleries] = useState([]);
  const [isLoadingClientGalleries, setIsLoadingClientGalleries] = useState(false);
  const [newGalleryForm, setNewGalleryForm] = useState({ clientEmail: '', clientName: '', eventName: '', folderLink: '' });
  const [isCreatingGallery, setIsCreatingGallery] = useState(false);
  const [galleryCreateError, setGalleryCreateError] = useState('');
  const [galleryCreateSuccess, setGalleryCreateSuccess] = useState('');
  const [expandedEmail, setExpandedEmail] = useState(null);
  const [syncingGalleryId, setSyncingGalleryId] = useState(null);

  const getMonthDateString = (monthsOffset) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsOffset);
    return d.toISOString().split('T')[0];
  };

  const [subscriptionData, setSubscriptionData] = useState({
    name: '',
    email: '',
    phone: '',
    duration: 1,
    months: [{ date: getMonthDateString(0), slot: 'Morning', mainService: '', shootType: '', package: '' }]
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [showSubscriptionsView, setShowSubscriptionsView] = useState(false);
  
  // Studio Page State
  const [studioData, setStudioData] = useState({
    name: siteConfig.brand.name,
    description: '',
    heroImageDesktop: '',
    heroImageMobile: '',
    threeSixtyImage: '',
    mapEmbedUrl: '',
    images: [],
    videos: []
  });

  // Studio Booking State
  const [bookingStudio, setBookingStudio] = useState(false);
  const [studioBookingData, setStudioBookingData] = useState({ name: '', email: '', phone: '', studioName: '', date: '', slots: [] });
  const [studioAvailableSlots, setStudioAvailableSlots] = useState([]);

  useEffect(() => {
    if (bookingStudio && studioBookingData.date) {
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/slots/${studioBookingData.date}`)
        .then(res => setStudioAvailableSlots(res.data))
        .catch(err => console.error(err));
    }
  }, [studioBookingData.date, bookingStudio]);

  useEffect(() => {
    fetchData();
    // Increase base font size for admin portal on large screens
    document.documentElement.classList.add('admin-html');
    return () => document.documentElement.classList.remove('admin-html');
  }, []);

  useEffect(() => {
    setEditingContent(null);
    setEditingService(null);
    setEditingSubService(null);
    setEditingThemeCategory(null);
    setEditingTheme(null);
    setEditingHero(null);
    setEditingTestimonial(null);
    setEditingLandingPage(null);
    setEditingTeamMember(null);
  }, [activeTab]);

  
  const fetchAdminUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin-users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}` }
      });
      setAdminUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch admin users', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'permissions') {
      fetchAdminUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'client gallery') {
      fetchClientGalleries();
    }
  }, [activeTab]);
  
  const fetchData = async () => {
    try {
      // setIsLoading(true); // Removed to prevent page jumping to top on background refreshes
      const [
        contentRes, 
        servicesRes, 
        themesRes, 
        themeCatsRes, 
        galleryRes, 
        galleryCatsRes,
        bookingsRes,
        inquiriesRes,
        heroRes,
        settingsRes,
        testimonialsRes,
        landingPagesRes,
        teamRes,
        studioRes,
        subscriptionsRes,
        leadsRes,
        partnersRes,
        expensesRes
      ] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/content`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/themes`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/theme-categories`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery-categories`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/inquiries`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hero`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/testimonials`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/landing-pages`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/team`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/studio`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/subscriptions`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/partners`).catch(e => ({data: []})),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/expenses`).catch(e => ({data: []}))
      ]);
      setContent(contentRes.data);
      setServices(servicesRes.data);
      setThemes(themesRes.data);
      setThemeCategories(themeCatsRes.data);
      setGallery(galleryRes.data);
      setGalleryCategoriesData(galleryCatsRes.data);
      setBookings(bookingsRes.data);
      setInquiries(inquiriesRes.data);
      setLeads(leadsRes.data);
      setHeroSlides(heroRes.data);
      setSettings(settingsRes.data);
      setTestimonials(testimonialsRes.data);
      setLandingPages(landingPagesRes.data);
      setTeamMembers(teamRes.data);
      if(studioRes.data) setStudioData(studioRes.data);
      setSubscriptions(subscriptionsRes.data);
      setPartners(partnersRes ? partnersRes.data : []);
      setExpenses(expensesRes ? expensesRes.data : []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };

  const exportCustomersCSV = () => {
    const customerMap = {};
    bookings.forEach(b => {
      const key = b.phone || b.name;
      if (!customerMap[key]) customerMap[key] = { name: b.name, phone: b.phone, email: 'N/A', bookings: 0, inquiries: 0 };
      customerMap[key].bookings += 1;
    });
    inquiries.forEach(inq => {
      const key = inq.phone || inq.name;
      if (!customerMap[key]) customerMap[key] = { name: inq.name, phone: inq.phone, email: inq.email || 'N/A', bookings: 0, inquiries: 0 };
      customerMap[key].inquiries += 1;
      if (customerMap[key].email === 'N/A' && inq.email) customerMap[key].email = inq.email;
    });
    
    let customersList = Object.values(customerMap);
    if (customersSearch) {
      const s = customersSearch.toLowerCase();
      customersList = customersList.filter(c => 
        (c.name && c.name.toLowerCase().includes(s)) ||
        (c.phone && c.phone.toLowerCase().includes(s)) ||
        (c.email && c.email.toLowerCase().includes(s))
      );
    }
    
    // Add BOM for Excel UTF-8 compatibility
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + "Name,Phone,Email,Bookings,Inquiries\n"
      + customersList.map(e => `"${e.name || ''}","${e.phone || ''}","${e.email || ''}","${e.bookings}","${e.inquiries}"`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveContent = async (e, sectionData) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/content/${sectionData.section}`, sectionData);
      alert('Content saved successfully to the database!');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to save content: ' + (error.response?.data?.message || error.message));
    }
    setEditingContent(null);
  };

  const handleSaveService = async (e, serviceData) => {
    e.preventDefault();

    // Clean up empty feature lines so they aren't saved as blank dots
    const cleanedServiceData = JSON.parse(JSON.stringify(serviceData));
    if (cleanedServiceData.packages) {
      cleanedServiceData.packages = cleanedServiceData.packages.map(pkg => ({
        ...pkg,
        features: (pkg.features || []).filter(f => f.trim() !== '')
      }));
    }
    if (cleanedServiceData.subServices) {
      cleanedServiceData.subServices = cleanedServiceData.subServices.map(sub => ({
        ...sub,
        packages: (sub.packages || []).map(pkg => ({
          ...pkg,
          features: (pkg.features || []).filter(f => f.trim() !== '')
        }))
      }));
    }

    try {
      if (cleanedServiceData._id && !cleanedServiceData._id.includes('-')) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services/${cleanedServiceData._id}`, cleanedServiceData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`, cleanedServiceData);
      }
      fetchData();
    } catch (error) {
      console.error(error);
    }
    setEditingService(null);
  };

  const handleDeleteService = async (id) => {
    if(window.confirm('Delete this service and all its sub-experiences?')) {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services/${id}`).catch(console.error);
      fetchData();
    }
  };

  const handleSaveLandingPage = async (e, pageData) => {
    e.preventDefault();
    try {
      if (pageData._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/landing-pages/${pageData._id}`, pageData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/landing-pages`, pageData);
      }
      fetchData();
    } catch (error) {
      console.error(error);
    }
    setEditingLandingPage(null);
  };

  const handleDeleteLandingPage = async (id) => {
    if(window.confirm('Delete this landing page?')) {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/landing-pages/${id}`).catch(console.error);
      fetchData();
    }
  };

  const handleSaveTheme = async (e, themeData) => {
    e.preventDefault();
    try {
      if (themeData._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/themes/${themeData._id}`, themeData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/themes`, themeData);
      }
      fetchData();
    } catch (error) {
      console.error(error);
    }
    setEditingTheme(null);
  };

  const handleDeleteTheme = async (id) => {
    if(window.confirm('Delete theme?')) {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/themes/${id}`).catch(console.error);
      fetchData();
    }
  };

  const handleSaveThemeCategory = async (e, catData) => {
    e.preventDefault();
    try {
      if (catData._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/theme-categories/${catData._id}`, catData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/theme-categories`, catData);
      }
      fetchData();
    } catch (error) {
      console.error(error);
    }
    setEditingThemeCategory(null);
  };

  const handleDeleteThemeCategory = async (id) => {
    if(window.confirm('Delete this theme category? Themes inside it will NOT be deleted automatically, but they will be hidden until reassigned.')) {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/theme-categories/${id}`).catch(console.error);
      fetchData();
    }
  };

  const handleSaveHero = async (e, heroData) => {
    e.preventDefault();
    try {
      if (heroData._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hero/${heroData._id}`, heroData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hero`, heroData);
      }
      fetchData();
    } catch (error) {
      console.error(error);
    }
    setEditingHero(null);
  };

  const handleDeleteHero = async (id) => {
    if(window.confirm('Delete this slide?')) {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hero/${id}`).catch(console.error);
      fetchData();
    }
  };

  const handleMoveHeroSlide = async (index, direction) => {
    const newSlides = [...heroSlides];
    if (direction === 'up' && index > 0) {
      [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
    } else if (direction === 'down' && index < newSlides.length - 1) {
      [newSlides[index + 1], newSlides[index]] = [newSlides[index], newSlides[index + 1]];
    } else {
      return; // Can't move
    }

    // Assign new order values
    newSlides.forEach((s, i) => { s.order = i; });
    setHeroSlides(newSlides); // Optimistic UI update

    try {
      await Promise.all([
        axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hero/${newSlides[index]._id}`, { order: newSlides[index].order }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}` } }),
        axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hero/${newSlides[direction === 'up' ? index - 1 : index + 1]._id}`, { order: newSlides[direction === 'up' ? index - 1 : index + 1].order }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}` } })
      ]);
    } catch (err) {
      console.error('Failed to update hero order', err);
      // Revert if failed
      fetchData();
    }
  };

  const handleSaveBookingDetails = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editingBooking };
      if (payload.shootType === 'Custom') payload.shootType = payload.customShootTypeValue;
      if (payload.package === 'Custom') payload.package = payload.customPackageValue;

      if (editingBooking._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${editingBooking._id}/details`, payload);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings`, payload);
      }
      fetchData();
      setEditingBooking(null);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to save booking');
    }
  };

  // Client Gallery Handlers
  const fetchClientGalleries = async () => {
    setIsLoadingClientGalleries(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-gallery`);
      setClientGalleries(res.data);
    } catch (err) {
      console.error('Failed to fetch client galleries', err);
    } finally {
      setIsLoadingClientGalleries(false);
    }
  };

  const handleCreateGallery = async (e) => {
    e.preventDefault();
    setGalleryCreateError('');
    setGalleryCreateSuccess('');
    setIsCreatingGallery(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-gallery`, newGalleryForm);
      setGalleryCreateSuccess('Gallery created successfully!');
      setNewGalleryForm({ clientEmail: '', clientName: '', eventName: '', folderLink: '' });
      fetchClientGalleries();
    } catch (err) {
      setGalleryCreateError(err.response?.data?.error || 'Failed to create gallery.');
    } finally {
      setIsCreatingGallery(false);
    }
  };

  const handleDeleteGallery = async (id) => {
    if (!window.confirm('Delete this client gallery? This cannot be undone.')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-gallery/${id}`);
      fetchClientGalleries();
    } catch (err) {
      alert('Failed to delete gallery.');
    }
  };

  const handleExportGalleryCSV = async (id, clientName, eventName) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-gallery/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeName = (clientName || 'client').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const safeEvent = (eventName || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.setAttribute('download', `${safeName}_${safeEvent}_selections.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('No selected images to export, or export failed.');
    }
  };

  const handleSyncGallery = async (id) => {
    setSyncingGalleryId(id);
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-gallery/${id}/sync`);
      alert(res.data.message || 'Gallery successfully synced from Google Drive!');
      fetchClientGalleries();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to sync gallery from Drive.');
    } finally {
      setSyncingGalleryId(null);
    }
  };

  const handleUnlockGallery = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-gallery/${id}`, { status: 'Draft' });
      alert('Gallery unlocked! The client can now edit their selections.');
      fetchClientGalleries();
    } catch (err) {
      alert('Failed to unlock gallery.');
    }
  };

  const handleUploadGalleryImage = async (urls) => {
    try {
      if (Array.isArray(urls)) {
        await Promise.all(urls.map(url => axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery`, { url, category: galleryCategory, type: 'image' })));
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery`, { url: urls, category: galleryCategory, type: 'image' });
      }
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadGalleryVideo = async (e) => {
    e.preventDefault();
    if (!youtubeLink) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery`, { url: youtubeLink, category: galleryCategory, type: 'video' });
      setYoutubeLink('');
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGalleryImage = async (id) => {
    await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery/${id}`).catch(console.error);
    fetchData();
  };

  const handleToggleFeaturedGalleryImage = async (img) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery/${img._id}`, { isFeatured: !img.isFeatured });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddGalleryCategory = async () => {
    const name = window.prompt('Enter new category name:');
    if (name) {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery-categories`, { name });
        setGalleryCategoriesData(prev => [...prev, res.data]);
        setGalleryCategory(res.data.name);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || error.message);
      }
    }
  };

  const handleDeleteGalleryCategory = async (id) => {
    if (window.confirm('Delete this category? Images inside it will remain but may lose their category filter.')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery-categories/${id}`);
        setGalleryCategoriesData(prev => prev.filter(c => c._id !== id));
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleUpdateBookingStatus = async (id, status) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${id}`, { status });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateBookingDetails = async (id, data) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${id}/details`, data);
      
      // Update local state without full refetch for snappy UI
      setBookings(prev => prev.map(booking => 
        booking._id === id ? { ...booking, ...data } : booking
      ));
    } catch (error) {
      console.error('Error updating booking details:', error);
      alert('Failed to update booking details: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateBookingProgress = async (id, field, value) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${id}/details`, { [field]: value });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm('Delete this booking forever?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${id}`);
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newShare = Number(formData.get('sharePercentage'));
    const totalCurrentShares = partners.reduce((sum, p) => sum + p.sharePercentage, 0);
    if (totalCurrentShares + newShare > 100) {
      alert(`Cannot add partner. Total shares would exceed 100% (currently ${totalCurrentShares}%).`);
      return;
    }
    const data = {
      name: formData.get('name'),
      sharePercentage: newShare
    };
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/partners`, data);
      setPartners([...partners, res.data]);
      setEditingPartner(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePartner = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newShare = Number(formData.get('sharePercentage'));
    const totalCurrentShares = partners.reduce((sum, p) => p._id === editingPartner._id ? sum : sum + p.sharePercentage, 0);
    if (totalCurrentShares + newShare > 100) {
      alert(`Cannot update partner. Total shares would exceed 100% (other partners hold ${totalCurrentShares}%).`);
      return;
    }
    const data = {
      name: formData.get('name'),
      sharePercentage: newShare
    };
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/partners/${editingPartner._id}`, data);
      setPartners(partners.map(p => p._id === res.data._id ? res.data : p));
      setEditingPartner(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePartner = async (id) => {
    if(!window.confirm('Delete partner?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/partners/${id}`);
      setPartners(partners.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!editingExpense.items || editingExpense.items.length === 0) return;
    try {
      const newExpenses = [];
      for (const item of editingExpense.items) {
        if (!item.description || item.amount <= 0) continue;
        const data = {
          date: editingExpense.date,
          amount: Number(item.amount),
          type: editingExpense.type,
          description: item.description
        };
        if (editingExpense.bookingId) {
          data.bookingId = editingExpense.bookingId;
        }
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/expenses`, data);
        newExpenses.push(res.data);
      }
      setExpenses([...newExpenses, ...expenses]);
      setEditingExpense(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      date: formData.get('date'),
      amount: Number(formData.get('amount')),
      type: formData.get('type'),
      description: formData.get('description')
    };
    if (editingExpense && editingExpense.bookingId) {
      data.bookingId = editingExpense.bookingId;
    }
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/expenses/${editingExpense._id}`, data);
      setExpenses(expenses.map(exp => exp._id === res.data._id ? res.data : exp));
      setEditingExpense(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id) => {
    if(!window.confirm('Delete expense?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/expenses/${id}`);
      setExpenses(expenses.filter(exp => exp._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSlotsForAdmin = async (date) => {
    setIsLoadingSlots(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/slots/${date}`);
      setSlotData(res.data);
    } catch (error) {
      console.error(error);
    }
    setIsLoadingSlots(false);
  };

  useEffect(() => {
    if (activeTab === 'slots') {
      fetchSlotsForAdmin(slotDate);
    }
  }, [activeTab, slotDate]);

  const handleBlockSlot = async (slot, action) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/slots/block`, { date: slotDate, slot, action });
      fetchSlotsForAdmin(slotDate);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleBlockedWeekday = async (dayIndex) => {
    try {
      const currentBlocked = settings.blockedWeekdays || [];
      const newBlocked = currentBlocked.includes(dayIndex) 
        ? currentBlocked.filter(d => d !== dayIndex) 
        : [...currentBlocked, dayIndex];
      
      setSettings({...settings, blockedWeekdays: newBlocked});
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/blocked-weekdays`, { blockedWeekdays: newBlocked });
      
      // Refresh the slots view for the currently selected date to reflect the new global setting
      if (activeTab === 'slots') {
        fetchSlotsForAdmin(slotDate);
      }
    } catch (error) {
      console.error(error);
      alert('Error updating blocked weekdays');
    }
  };

  const handleSaveAnalytics = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/analytics`, {
        metaPixelId: settings.metaPixelId,
        googleAnalyticsId: settings.googleAnalyticsId
      });
      alert('Analytics settings saved!');
    } catch (error) {
      console.error(error);
      alert('Error saving Analytics IDs');
    }
  };

  const handleSaveContactSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/contact`, {
        contactEmail: settings.contactEmail,
        whatsappNumber: settings.whatsappNumber,
        contactNumber: settings.contactNumber,
        teamEmails: settings.teamEmails,
        footerStudioAddress: settings.footerStudioAddress,
        footerSocials: settings.footerSocials,
        footerLocations: settings.footerLocations
      });
      alert('Contact and Footer settings saved!');
    } catch (error) {
      console.error(error);
      alert('Error saving Contact/Footer Settings');
    }
  };

  const handleSaveWeddingSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/wedding`, {
        weddingHeroHeading: settings.weddingHeroHeading,
        weddingHeroSubheading: settings.weddingHeroSubheading,
        weddingHeroDescription: settings.weddingHeroDescription,
        weddingHeroButtonText: settings.weddingHeroButtonText,
        weddingHeroButtonLink: settings.weddingHeroButtonLink,
        weddingHeroBackground: settings.weddingHeroBackground
      });
      alert('Wedding page settings saved!');
    } catch (error) {
      console.error(error);
      alert('Error saving Wedding Page Settings');
    }
  };

  const handleSaveWhatWeDo = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/whatwedo`, {
        whatWeDo: settings.whatWeDo || []
      });
      alert('What We Do settings saved!');
    } catch (error) {
      console.error(error);
      alert('Error saving What We Do settings');
    }
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpNote.trim()) return;
    
    try {
      const endpoint = followUpModal.type === 'booking' ? 'bookings' : (followUpModal.type === 'lead' ? 'leads' : 'inquiries');
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/${endpoint}/${followUpModal.id}/followup`, { note: followUpNote, scheduledDate: followUpDate || undefined });
      fetchData();
      setFollowUpNote('');
      setFollowUpDate('');
      // Don't close modal to allow seeing the new note instantly
    } catch (error) {
      console.error(error);
      alert('Error adding follow-up note');
    }
  };

  const handleUpdateFollowUp = async (noteId, newNoteText) => {
    if (!newNoteText.trim()) return;
    try {
      const endpoint = followUpModal.type === 'booking' ? 'bookings' : (followUpModal.type === 'lead' ? 'leads' : 'inquiries');
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/${endpoint}/${followUpModal.id}/followups/${noteId}`, { note: newNoteText });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error updating follow-up note');
    }
  };

  const handleDeleteFollowUp = async (noteId) => {
    if (!window.confirm('Delete this note forever?')) return;
    try {
      const endpoint = followUpModal.type === 'booking' ? 'bookings' : (followUpModal.type === 'lead' ? 'leads' : 'inquiries');
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/${endpoint}/${followUpModal.id}/followups/${noteId}`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error deleting follow-up note');
    }
  };

  const handleDeleteInstallment = async (bookingId, paymentId) => {
    if (!window.confirm('Are you sure you want to delete this installment?')) return;
    
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) return;
    
    const updatedPayments = booking.payments.filter(p => p._id !== paymentId);
    const advance = updatedPayments.length > 0 
      ? updatedPayments.reduce((sum, p) => sum + p.amount, 0)
      : 0;
      
    const payload = {
      totalAmount: booking.totalAmount,
      advanceAmount: advance,
      pendingAmount: (booking.totalAmount || 0) - advance,
      payments: updatedPayments
    };
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${bookingId}/payment`, payload);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error deleting installment');
    }
  };

  const handleUpdatePayment = async (bookingId, e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const total = Number(formData.get('totalAmount'));
    const newAmount = Number(formData.get('newPaymentAmount'));
    
    const booking = bookings.find(b => b._id === bookingId);
    let updatedPayments = [...(booking.payments || [])];
    
    if (newAmount > 0) {
      const method = formData.get('newPaymentMethod');
      const utrNumber = formData.get('newPaymentUTR');
      const receivedBy = formData.get('newPaymentReceivedBy');
      
      if (!receivedBy) {
         alert('Please select who received the payment.');
         return;
      }
      // UTR is optional as per request
      
      updatedPayments.push({
        amount: newAmount,
        method,
        utrNumber,
        receivedBy,
        date: new Date()
      });
    }

    const advance = updatedPayments.length > 0 
      ? updatedPayments.reduce((sum, p) => sum + p.amount, 0)
      : Number(formData.get('advanceAmount') || 0);
      
    const payload = {
      totalAmount: total,
      advanceAmount: advance,
      pendingAmount: total - advance,
      payments: updatedPayments
    };
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${bookingId}/payment`, payload);
      fetchData();
      alert('Payment tracking updated');
      e.target.reset();
      // Reset the UTR visibility
      const utrContainer = e.target.querySelector('.utr-container');
      if(utrContainer) utrContainer.classList.add('hidden');
    } catch (error) {
      console.error(error);
      alert('Error updating payment tracking');
    }
  };

  const handleAddBookingAddOn = async (bookingId, e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('addOnName');
    const price = Number(formData.get('addOnPrice'));
    
    const booking = bookings.find(b => b._id === bookingId);
    const updatedAddOns = [...(booking.addOns || []), { name, price }];
    const newTotal = (booking.totalAmount || 0) + price;
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${bookingId}/details`, {
        addOns: updatedAddOns,
        totalAmount: newTotal
      });
      fetchData();
      e.target.reset();
    } catch (err) {
      console.error(err);
      alert('Error adding add-on');
    }
  };

  const handleDeleteBookingAddOn = async (bookingId, addOnId) => {
    if (!window.confirm('Delete this add-on?')) return;
    const booking = bookings.find(b => b._id === bookingId);
    const addOnToDelete = booking.addOns.find(a => a._id === addOnId);
    const updatedAddOns = booking.addOns.filter(a => a._id !== addOnId);
    const newTotal = Math.max(0, (booking.totalAmount || 0) - (addOnToDelete ? addOnToDelete.price : 0));
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${bookingId}/details`, {
        addOns: updatedAddOns,
        totalAmount: newTotal
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error deleting add-on');
    }
  };

  const handleUpdateInquiryStatus = async (id, status) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/inquiries/${id}`, { status });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteInquiry = async (id) => {
    if (window.confirm('Delete this inquiry forever?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/inquiries/${id}`);
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const filteredInquiries = inquiries.filter(inq => {
    const searchString = `${inq.name || ''} ${inq.email || ''} ${inq.phone || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(inquirySearch.toLowerCase());
    const matchesFilter = inquiryFilter === 'All' || 
      (inq.status && inq.status.toLowerCase() === inquiryFilter.toLowerCase()) ||
      (inquiryFilter.toLowerCase() === 'confirmed' && inq.status?.toLowerCase() === 'converted') ||
      (inquiryFilter.toLowerCase() === 'cancelled' && inq.status?.toLowerCase() === 'lost');
    return matchesSearch && matchesFilter;
  });

  // Handle Subscription Form
  const handleSubscriptionDurationChange = (e) => {
    const newDuration = parseInt(e.target.value);
    const newMonths = [...subscriptionData.months];
    if (newDuration > newMonths.length) {
      for (let i = newMonths.length; i < newDuration; i++) {
        // Inherit service options from the first month if available
        const template = newMonths[0] || { mainService: '', shootType: '', package: '' };
        newMonths.push({ 
          date: getMonthDateString(i), 
          slot: 'Morning', 
          mainService: template.mainService, 
          shootType: template.shootType, 
          package: template.package 
        });
      }
    } else {
      newMonths.length = newDuration;
    }
    setSubscriptionData({ ...subscriptionData, duration: newDuration, months: newMonths });
  };

  const handleSubscriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate all required fields
      for (const m of subscriptionData.months) {
        if (!m.date || !m.slot || !m.shootType || !m.package || !m.mainService) {
          alert('Please fill out all fields for every month.');
          return;
        }
      }

      if (editingSubscriptionId) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/subscriptions/${editingSubscriptionId}`, subscriptionData);
        alert('Subscription updated successfully!');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/subscriptions`, subscriptionData);
        alert('Subscription created successfully!');
      }
      
      setIsSubscriptionModalOpen(false);
      setEditingSubscriptionId(null);
      setSubscriptionData({
        name: '', email: '', phone: '', duration: 1,
        months: [{ date: getMonthDateString(0), slot: 'Morning', mainService: '', shootType: '', package: '' }]
      });
      fetchData();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error creating subscription');
    }
  };

  const handleDeleteSubscription = async (id) => {
    if (window.confirm('Delete this subscription and all its associated bookings?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/subscriptions/${id}`);
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleUpdateSubscriptionStatus = async (id, status) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/subscriptions/${id}/status`, { status });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditSubscription = (sub) => {
    setEditingSubscriptionId(sub._id);
    setSubscriptionData({
      name: sub.name,
      email: sub.email,
      phone: sub.phone,
      duration: sub.duration,
      months: sub.bookings.map(b => {
        // Find main service id for the booking
        let mainSvcId = '';
        services.forEach(s => {
          if (s.subServices && s.subServices.find(subSvc => subSvc.name === b.shootType)) {
            mainSvcId = s._id;
          }
        });

        return {
          date: b.date,
          slot: b.slot,
          mainService: mainSvcId,
          shootType: b.shootType,
          package: b.package,
          status: b.status
        };
      })
    });
    setIsSubscriptionModalOpen(true);
  };

  const handleToggleSessionStatus = async (bookingId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Finished' ? 'Pending' : 'Finished';
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${bookingId}`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // Glassmorphism classes
  const glassPanel = "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl";
  const handleSaveTestimonial = async (e, tData) => {
    e.preventDefault();
    try {
      if (tData._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/testimonials/${tData._id}`, tData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/testimonials`, tData);
      }
      alert('Testimonial saved!');
      fetchData();
      setEditingTestimonial(null);
    } catch (error) {
      console.error(error);
      alert('Failed to save testimonial');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/testimonials/${id}`);
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete testimonial');
      }
    }
  };

  const handleSaveTeamMember = async (e, tData) => {
    e.preventDefault();
    try {
      if (tData._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/team/${tData._id}`, tData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/team`, tData);
      }
      
      if (tData.hasAccess && tData.email && tData.password) {
        try {
           await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin-users`, { email: tData.email, password: tData.password, permissions: tData.permissions || [] }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}` } });
           alert('Team member saved and Dashboard Access granted successfully!');
        } catch (err) {
           console.error('Failed to create admin user access:', err);
           alert('Team member saved, but failed to grant dashboard access (Email might already be in use).');
        }
      } else {
        alert('Team member saved!');
      }

      fetchData();
      setEditingTeamMember(null);
    } catch (error) {
      console.error(error);
      alert('Failed to save team member');
    }
  };

  const handleDeleteTeamMember = async (id) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/team/${id}`);
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete team member');
      }
    }
  };

  const handleSaveStudio = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/studio`, studioData);
      alert('Studio settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving studio settings');
    }
  };

  const glassInput = "w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-primary/50 focus:bg-white/5 outline-none transition-all";

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden selection:bg-primary/30 relative">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar with Glassmorphism */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-300 ease-in-out z-40 w-72 bg-black/80 md:bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)]`}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-2xl font-oswald font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 tracking-widest uppercase">
            {siteConfig.brand.shortName}
          </h2>
        </div>
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
          {allowedTabs.map(tab => (
            <button 
              key={tab}
              onClick={async () => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-sans uppercase tracking-[0.2em] transition-all duration-300 ${
                activeTab === tab 
                ? 'bg-gradient-to-r from-white/10 to-transparent text-white border-l-2 border-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]' 
                : 'text-gray-500 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5 bg-gradient-to-t from-black/50 to-transparent">
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-gray-500 text-xs tracking-widest uppercase hover:text-white transition-colors flex items-center gap-2">
            <span>←</span> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden w-full">
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black/40 backdrop-blur-md z-20">
          <h2 className="text-lg font-oswald font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 tracking-widest uppercase">
            {siteConfig.brand.shortName}
          </h2>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Decorative Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none"></div>


        <header className="h-20 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-10 relative z-10">
          <h1 className="text-xl font-oswald text-white uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {activeTab.replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-2 md:gap-6">
            <span className="hidden md:inline-block text-xs text-white tracking-widest font-sans px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">{storedUser.email}</span>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              <span className="text-xs text-gray-400 tracking-widest uppercase hidden md:inline">System Online</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 relative custom-scrollbar">
          {isLoading ? (
             <div className="flex items-center justify-center h-full">
               <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
                 <span className="text-xs font-sans tracking-[0.3em] text-gray-500 uppercase">Syncing Database...</span>
               </div>
             </div>
          ) : (
            <>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-6xl mx-auto space-y-8 pb-20"
              >

                {/* CMS TAB */}
                
          {activeTab === 'quotes' && (
            <div className="space-y-8 animate-fade-in">
              <QuotesPanel />
            </div>
          )}
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-oswald uppercase tracking-widest text-white">Performance Overview</h2>
                  <p className="text-gray-400 font-sans font-light text-sm mt-1">Track your inquiries and conversion metrics.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase text-gray-500 mb-1">Start Date</span>
                    <input 
                      type="date" 
                      className="bg-black/40 border border-white/20 text-white font-sans text-xs px-3 py-2 outline-none focus:border-white/50 rounded [color-scheme:dark]"
                      value={dashboardStartDate}
                      onChange={(e) => setDashboardStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase text-gray-500 mb-1">End Date</span>
                    <input 
                      type="date" 
                      className="bg-black/40 border border-white/20 text-white font-sans text-xs px-3 py-2 outline-none focus:border-white/50 rounded [color-scheme:dark]"
                      value={dashboardEndDate}
                      onChange={(e) => setDashboardEndDate(e.target.value)}
                    />
                  </div>
                  {(dashboardStartDate || dashboardEndDate) && (
                    <button 
                      onClick={() => { setDashboardStartDate(''); setDashboardEndDate(''); }}
                      className="mt-5 text-[11px] uppercase text-gray-400 hover:text-white underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Total Bookings */}
                <div className={glassPanel + " p-6 flex flex-col relative group"}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-gray-500 font-sans text-[11px] uppercase tracking-widest">Total Bookings</div>
                    <select className="bg-transparent border border-white/10 text-gray-400 text-[9px] uppercase outline-none focus:border-white/30 rounded py-0.5 px-1" value={filterBookings} onChange={(e) => setFilterBookings(e.target.value)}>
                      <option value="all" className="bg-black">All</option>
                      <option value="today" className="bg-black">Today</option>
                      <option value="past7" className="bg-black">Past 7 Days</option>
                    </select>
                  </div>
                  <div className="text-5xl font-oswald text-white mb-4">
                    {(() => {
                      const now = new Date();
                      return dashboardFilteredBookings.filter(b => {
                        if (filterBookings === 'today') return new Date(b.created || b.createdAt || b.date).toDateString() === now.toDateString();
                        if (filterBookings === 'past7') return new Date(b.created || b.createdAt || b.date) >= new Date(now.setDate(now.getDate() - 7));
                        return true;
                      }).length;
                    })()}
                  </div>
                  <div className="text-emerald-500 font-sans text-[11px] tracking-widest mt-auto">All scheduled shoots</div>
                </div>

                {/* Total Leads */}
                <div className={glassPanel + " p-6 flex flex-col relative group"}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-gray-500 font-sans text-[11px] uppercase tracking-widest">Total Leads</div>
                    <select className="bg-transparent border border-white/10 text-gray-400 text-[9px] uppercase outline-none focus:border-white/30 rounded py-0.5 px-1" value={filterLeads} onChange={(e) => setFilterLeads(e.target.value)}>
                      <option value="all" className="bg-black">All</option>
                      <option value="today" className="bg-black">Today</option>
                      <option value="past7" className="bg-black">Past 7 Days</option>
                    </select>
                  </div>
                  <div className="text-5xl font-oswald text-white mb-4">
                    {(() => {
                      const now = new Date();
                      return dashboardFilteredLeads.filter(l => {
                        if (filterLeads === 'today') return new Date(l.created || l.createdAt).toDateString() === now.toDateString();
                        if (filterLeads === 'past7') return new Date(l.created || l.createdAt) >= new Date(now.setDate(now.getDate() - 7));
                        return true;
                      }).length;
                    })()}
                  </div>
                  <div className="text-emerald-500 font-sans text-[11px] tracking-widest mt-auto">Landing page inquiries</div>
                </div>

                {/* Total Inquiries */}
                <div className={glassPanel + " p-6 flex flex-col relative group"}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-gray-500 font-sans text-[11px] uppercase tracking-widest">Total Inquiries</div>
                    <select className="bg-transparent border border-white/10 text-gray-400 text-[9px] uppercase outline-none focus:border-white/30 rounded py-0.5 px-1" value={filterInquiries} onChange={(e) => setFilterInquiries(e.target.value)}>
                      <option value="all" className="bg-black">All</option>
                      <option value="today" className="bg-black">Today</option>
                      <option value="past7" className="bg-black">Past 7 Days</option>
                    </select>
                  </div>
                  <div className="text-5xl font-oswald text-white mb-4">
                    {(() => {
                      const now = new Date();
                      return dashboardFilteredInquiries.filter(i => {
                        if (filterInquiries === 'today') return new Date(i.created || i.createdAt).toDateString() === now.toDateString();
                        if (filterInquiries === 'past7') return new Date(i.created || i.createdAt) >= new Date(now.setDate(now.getDate() - 7));
                        return true;
                      }).length;
                    })()}
                  </div>
                  <div className="text-emerald-500 font-sans text-[11px] tracking-widest mt-auto">General inquiries</div>
                </div>

                {/* Pending */}
                <div className={glassPanel + " p-6 flex flex-col relative group"}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-gray-500 font-sans text-[11px] uppercase tracking-widest">Pending</div>
                    <select className="bg-transparent border border-white/10 text-gray-400 text-[9px] uppercase outline-none focus:border-white/30 rounded py-0.5 px-1" value={filterPending} onChange={(e) => setFilterPending(e.target.value)}>
                      <option value="all" className="bg-black">All</option>
                      <option value="today" className="bg-black">Today</option>
                      <option value="past7" className="bg-black">Past 7 Days</option>
                    </select>
                  </div>
                  <div className="text-5xl font-oswald text-white mb-4">
                    {(() => {
                      const now = new Date();
                      const filterFunc = (item) => {
                        if (filterPending === 'today') return new Date(item.created || item.createdAt || item.date).toDateString() === now.toDateString();
                        if (filterPending === 'past7') return new Date(item.created || item.createdAt || item.date) >= new Date(now.setDate(now.getDate() - 7));
                        return true;
                      };
                      return dashboardFilteredLeads.filter(l => (l.status === 'PENDING' || l.status === 'Pending') && filterFunc(l)).length + 
                             dashboardFilteredInquiries.filter(i => (i.status === 'PENDING' || i.status === 'Pending') && filterFunc(i)).length + 
                             dashboardFilteredBookings.filter(b => (b.status === 'PENDING' || b.status === 'Pending') && filterFunc(b)).length;
                    })()}
                  </div>
                  <div className="text-emerald-500 font-sans text-[11px] tracking-widest mt-auto">Needs review (Combined)</div>
                </div>

                {/* Confirmed */}
                <div className={glassPanel + " p-6 flex flex-col relative group"}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-gray-500 font-sans text-[11px] uppercase tracking-widest">Confirmed</div>
                    <select className="bg-transparent border border-white/10 text-gray-400 text-[9px] uppercase outline-none focus:border-white/30 rounded py-0.5 px-1" value={filterConfirmed} onChange={(e) => setFilterConfirmed(e.target.value)}>
                      <option value="all" className="bg-black">All</option>
                      <option value="today" className="bg-black">Today</option>
                      <option value="past7" className="bg-black">Past 7 Days</option>
                    </select>
                  </div>
                  <div className="text-5xl font-oswald text-white mb-4">
                    {(() => {
                      const now = new Date();
                      const filterFunc = (item) => {
                        if (filterConfirmed === 'today') return new Date(item.created || item.createdAt || item.date).toDateString() === now.toDateString();
                        if (filterConfirmed === 'past7') return new Date(item.created || item.createdAt || item.date) >= new Date(now.setDate(now.getDate() - 7));
                        return true;
                      };
                      return dashboardFilteredLeads.filter(l => (l.status === 'CONFIRMED' || l.status === 'CONTACTED' || l.status === 'Confirmed' || l.status === 'Contacted') && filterFunc(l)).length + 
                             dashboardFilteredInquiries.filter(i => (i.status === 'CONFIRMED' || i.status === 'Confirmed') && filterFunc(i)).length + 
                             dashboardFilteredBookings.filter(b => (b.status === 'CONFIRMED' || b.status === 'Confirmed' || b.status === 'COMPLETED') && filterFunc(b)).length;
                    })()}
                  </div>
                  <div className="text-emerald-500 font-sans text-[11px] tracking-widest mt-auto">Converted (Combined)</div>
                </div>
              </div>
              <div className={glassPanel + " p-8 mt-8"}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h3 className="text-xl font-oswald uppercase tracking-widest text-white">Recent Inquiries</h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
                    <select 
                      className="bg-[#121212] border border-white/20 text-white font-sans text-[11px] uppercase tracking-widest px-2 md:px-4 py-2 outline-none focus:border-white/50 rounded cursor-pointer flex-1 md:flex-none"
                      value={dashboardDateFilter}
                      onChange={(e) => setDashboardDateFilter(e.target.value)}
                    >
                      <option value="all" className="bg-[#121212] text-white">All Time</option>
                      <option value="today" className="bg-[#121212] text-white">Today</option>
                      <option value="thisWeek" className="bg-[#121212] text-white">Past 7 Days</option>
                    </select>
                    <select 
                      className="bg-[#121212] border border-white/20 text-white font-sans text-[11px] uppercase tracking-widest px-2 md:px-4 py-2 outline-none focus:border-white/50 rounded cursor-pointer flex-1 md:flex-none"
                      value={dashboardTypeFilter}
                      onChange={(e) => setDashboardTypeFilter(e.target.value)}
                    >
                      <option value="all" className="bg-[#121212] text-white">All Types</option>
                      <option value="bookings" className="bg-[#121212] text-white">Bookings Only</option>
                      <option value="leads" className="bg-[#121212] text-white">Leads Only</option>
                      <option value="inquiries" className="bg-[#121212] text-white">Inquiries Only</option>
                    </select>
                    <button onClick={() => setActiveTab('inquiries')} className="text-[11px] uppercase tracking-widest border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors rounded text-white whitespace-nowrap">View All</button>
                  </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left font-sans text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-500 text-[11px] uppercase tracking-widest">
                        <th className="py-4 px-2 font-normal">Type</th>
                        <th className="py-4 px-2 font-normal">Client Name</th>
                        <th className="py-4 px-2 font-normal">Event Date</th>
                        <th className="py-4 px-2 font-normal">Details</th>
                        <th className="py-4 px-2 font-normal">Status</th>
                        <th className="py-4 px-2 font-normal">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedRecent.map((item, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4"><span className={`text-[9px] uppercase tracking-widest border px-2 py-1 rounded font-semibold ${getTypeBadgeClass(item.isType)}`}>{item.isType}</span></td>
                          <td className="py-4 text-white">{item.name}</td>
                          <td className="py-4 text-gray-400">{item.eventDate || item.date || 'N/A'}</td>
                          <td className="py-4 text-gray-400">{item.interestedIn || item.package || item.service || 'N/A'}</td>
                          <td className="py-4"><span className={`text-[9px] uppercase tracking-widest border px-2 py-1 rounded font-semibold ${getStatusBadgeClass(item.status)}`}>{item.status}</span></td>
                          <td className="py-4"><button onClick={() => setActiveTab(item.isType === 'LEAD' ? 'leads' : item.isType === 'BOOKING' ? 'studio bookings' : 'inquiries')} className="text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Review</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cms' && (
                  <div className="space-y-6">
                    {/* Settings / Analytics */}
                    <div className={`${glassPanel} p-8 hover:border-white/20 transition-all duration-300 border border-blue-500/20 bg-gradient-to-br from-blue-900/10 to-transparent`}>
                      <h3 className="text-xl text-white font-oswald tracking-[0.2em] uppercase mb-4">Tracking & Analytics Settings</h3>
                      <form onSubmit={handleSaveAnalytics} className="space-y-4 max-w-2xl">
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Meta Pixel ID (Facebook)</label>
                          <input type="text" className={glassInput} placeholder="e.g. 123456789012345" value={settings.metaPixelId || ''} onChange={e => setSettings({...settings, metaPixelId: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Google Analytics Measurement ID</label>
                          <input type="text" className={glassInput} placeholder="e.g. G-XXXXXXXXXX" value={settings.googleAnalyticsId || ''} onChange={e => setSettings({...settings, googleAnalyticsId: e.target.value})} />
                        </div>
                        <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save Tracking IDs'}</button>
                      </form>
                    </div>

                    {/* Contact Settings */}
                    <div className={`${glassPanel} p-8 hover:border-white/20 transition-all duration-300 border border-green-500/20 bg-gradient-to-br from-green-900/10 to-transparent`}>
                      <h3 className="text-xl text-white font-oswald tracking-[0.2em] uppercase mb-4">Contact Settings</h3>
                      <form onSubmit={handleSaveContactSettings} className="space-y-4 max-w-2xl">
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">WhatsApp Number</label>
                          <input type="text" className={glassInput} placeholder="e.g. +919999999999" value={settings.whatsappNumber || ''} onChange={e => setSettings({...settings, whatsappNumber: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Contact Number (Calls)</label>
                          <input type="text" className={glassInput} placeholder="e.g. +919999999999" value={settings.contactNumber || ''} onChange={e => setSettings({...settings, contactNumber: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Contact Email</label>
                          <input type="email" className={glassInput} placeholder="e.g. hello@example.com" value={settings.contactEmail || ''} onChange={e => setSettings({...settings, contactEmail: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Team Notification Emails (comma separated)</label>
                          <textarea className={glassInput} rows="2" placeholder="e.g. member1@example.com, member2@example.com" value={settings.teamEmails ? settings.teamEmails.join(', ') : ''} onChange={e => setSettings({...settings, teamEmails: e.target.value.split(',').map(em => em.trim()).filter(em => em)})}>
                          </textarea>
                          <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-widest">These emails will receive new booking notifications.</p>
                        </div>
                        <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save Contact Info'}</button>
                      </form>
                    </div>
                    {/* Wedding Page Settings */}
                    <div className={`${glassPanel} p-8 hover:border-white/20 transition-all duration-300 border border-pink-500/20 bg-gradient-to-br from-pink-900/10 to-transparent`}>
                      <h3 className="text-xl text-white font-oswald tracking-[0.2em] uppercase mb-4">Wedding Page Settings</h3>
                      <form onSubmit={handleSaveWeddingSettings} className="space-y-4 max-w-2xl">
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Heading</label>
                          <input type="text" className={glassInput} placeholder="e.g. Your Studio Weddings" value={settings.weddingHeroHeading || ''} onChange={e => setSettings({...settings, weddingHeroHeading: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Subheading</label>
                          <input type="text" className={glassInput} placeholder="e.g. Premium Wedding Photography" value={settings.weddingHeroSubheading || ''} onChange={e => setSettings({...settings, weddingHeroSubheading: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Description</label>
                          <textarea className={glassInput} rows="3" placeholder="Description..." value={settings.weddingHeroDescription || ''} onChange={e => setSettings({...settings, weddingHeroDescription: e.target.value})}></textarea>
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Background Image</label>
                          <DragDropImageUploader currentImage={settings.weddingHeroBackground || ''} aspect={16/9} onUploadSuccess={(url) => setSettings({...settings, weddingHeroBackground: url})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase text-gray-500 mb-2">Button Text</label>
                            <input type="text" className={glassInput} placeholder="e.g. Visit Our Partners" value={settings.weddingHeroButtonText || ''} onChange={e => setSettings({...settings, weddingHeroButtonText: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs uppercase text-gray-500 mb-2">Button Link</label>
                            <input type="text" className={glassInput} placeholder="e.g. https://example.com" value={settings.weddingHeroButtonLink || ''} onChange={e => setSettings({...settings, weddingHeroButtonLink: e.target.value})} />
                          </div>
                        </div>
                        <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save Wedding Settings'}</button>
                      </form>
                    </div>
                    {/* Footer Settings */}
                    <div className={`${glassPanel} p-8 hover:border-white/20 transition-all duration-300 border border-purple-500/20 bg-gradient-to-br from-purple-900/10 to-transparent`}>
                      <h3 className="text-xl text-white font-oswald tracking-[0.2em] uppercase mb-4">Footer Settings</h3>
                      <form onSubmit={handleSaveContactSettings} className="space-y-4 max-w-2xl">
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Studio Address</label>
                          <textarea className={glassInput} rows="3" placeholder="e.g. 123 Cinematic Way..." value={settings.footerStudioAddress || ''} onChange={e => setSettings({...settings, footerStudioAddress: e.target.value})}></textarea>
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Social Links</label>
                          <div className="space-y-3">
                            {(settings.footerSocials || []).map((social, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input type="text" className={`${glassInput.replace('w-full', '')} w-1/3`} placeholder="Platform (e.g. Instagram)" value={social.platform} onChange={e => {
                                  const newSocials = [...settings.footerSocials];
                                  newSocials[idx].platform = e.target.value;
                                  setSettings({...settings, footerSocials: newSocials});
                                }} />
                                <input type="text" className={`${glassInput.replace('w-full', '')} flex-1`} placeholder="Link (e.g. https://...)" value={social.link} onChange={e => {
                                  const newSocials = [...settings.footerSocials];
                                  newSocials[idx].link = e.target.value;
                                  setSettings({...settings, footerSocials: newSocials});
                                }} />
                                <button type="button" onClick={() => {
                                  const newSocials = [...settings.footerSocials];
                                  newSocials.splice(idx, 1);
                                  setSettings({...settings, footerSocials: newSocials});
                                }} className="text-red-500 hover:text-red-400 p-2">&times;</button>
                              </div>
                            ))}
                            <button type="button" onClick={() => {
                              setSettings({...settings, footerSocials: [...(settings.footerSocials || []), { platform: '', link: '' }]});
                            }} className="text-[11px] text-gray-400 hover:text-white uppercase tracking-widest">+ Add Social Link</button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs uppercase text-gray-500 mb-2">Locations (comma separated)</label>
                          <input type="text" className={glassInput} placeholder="e.g. Srikakulam, Vizag, Vizianagaram" value={(settings.footerLocations || []).join(', ')} onChange={e => setSettings({...settings, footerLocations: e.target.value.split(',').map(l => l.trim()).filter(l => l)})} />
                        </div>

                        <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save Footer Info'}</button>
                      </form>
                    </div>

                    {/* What We Do (Home Page) Settings */}
                    <div className={`${glassPanel} p-8 hover:border-white/20 transition-all duration-300`}>
                      <h3 className="text-xl text-white font-oswald tracking-[0.2em] uppercase mb-4">What We Do (Home Page)</h3>
                      <form onSubmit={handleSaveWhatWeDo} className="space-y-4 max-w-4xl">
                        <div className="space-y-4">
                          {(settings.whatWeDo || []).map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/10">
                              <div className="flex-1 space-y-3">
                                <input type="text" className={glassInput} placeholder="Title" value={item.title || ''} onChange={e => {
                                  const newArr = [...settings.whatWeDo];
                                  newArr[idx].title = e.target.value;
                                  setSettings({...settings, whatWeDo: newArr});
                                }} />
                                <textarea className={glassInput} rows="3" placeholder="Description" value={item.description || ''} onChange={e => {
                                  const newArr = [...settings.whatWeDo];
                                  newArr[idx].description = e.target.value;
                                  setSettings({...settings, whatWeDo: newArr});
                                }}></textarea>
                              </div>
                              <button type="button" onClick={() => {
                                const newArr = [...settings.whatWeDo];
                                newArr.splice(idx, 1);
                                setSettings({...settings, whatWeDo: newArr});
                              }} className="text-red-500 hover:text-red-400 p-2 text-2xl leading-none">&times;</button>
                            </div>
                          ))}
                          <button type="button" onClick={() => {
                            setSettings({...settings, whatWeDo: [...(settings.whatWeDo || []), { title: '', description: '' }]});
                          }} className="text-[11px] text-gray-400 hover:text-white uppercase tracking-widest">+ Add Item</button>
                        </div>
                        <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save What We Do'}</button>
                      </form>
                    </div>

                    {/* Standard Content Blocks */}
                    {content.map(c => (
                      <div key={c._id} className={`${glassPanel} p-8 hover:border-white/20 transition-all duration-300`}>
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-xl text-white font-oswald tracking-[0.2em] uppercase">{c.section}</h3>
                           <button onClick={() => setEditingContent(c)} className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white text-gray-300 hover:text-black text-xs uppercase tracking-widest transition-all">Edit</button>
                        </div>
                        {editingContent && editingContent._id === c._id ? (
                          <form onSubmit={(e) => handleSaveContent(e, editingContent)} className="space-y-5 border-t border-white/5 pt-6">
                             {c.title !== undefined && (
                               <div><label className="block text-xs uppercase text-gray-500 mb-2">Title</label><input type="text" className={glassInput} value={editingContent.title || ''} onChange={e => setEditingContent({...editingContent, title: e.target.value})} /></div>
                             )}
                             {(c.section === 'About' || c.section === 'Offerings') && (
                               <>
                                 {c.section === 'About' && (
                                   <div>
                                     <label className="block text-xs uppercase text-gray-500 mb-2">Side Image</label>
                                     <DragDropImageUploader currentImage={editingContent.imageUrl || 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=1400&auto=format&fit=crop'} aspect={4/5} onUploadSuccess={(url) => setEditingContent(prev => ({...prev, imageUrl: url}))} />
                                   </div>
                                 )}
                                 <div className="mt-4">
                                   <label className="block text-xs uppercase text-gray-500 mb-2">Background Image (Parallax)</label>
                                   <DragDropImageUploader currentImage={editingContent.backgroundImageUrl || ''} aspect={16/9} onUploadSuccess={(url) => setEditingContent(prev => ({...prev, backgroundImageUrl: url}))} />
                                 </div>
                               </>
                             )}
                             {c.description !== undefined && (
                               <div><label className="block text-xs uppercase text-gray-500 mb-2">Description</label><textarea className={`${glassInput} h-32`} value={editingContent.description || ''} onChange={e => setEditingContent({...editingContent, description: e.target.value})}></textarea></div>
                             )}
                             {c.features && (
                               <div><label className="block text-xs uppercase text-gray-500 mb-2">Features (Line by line)</label><textarea className={`${glassInput} h-40`} value={editingContent.features.join('\n')} onChange={e => setEditingContent({...editingContent, features: e.target.value.split('\n')})}></textarea></div>
                             )}
                             <div className="flex justify-end gap-3 pt-4">
                               <button type="button" onClick={() => setEditingContent(null)} className="px-6 py-3 rounded-xl bg-transparent border border-white/10 text-xs uppercase hover:bg-white/5 transition-colors">Cancel</button>
                               <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save Changes'}</button>
                             </div>
                          </form>
                        ) : (
                          <div className="text-gray-400 text-sm space-y-3 border-t border-white/5 pt-6">
                            {(c.imageUrl || c.section === 'About') && (
                              <div className="mb-4">
                                <img src={c.imageUrl || 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=1400&auto=format&fit=crop'} alt={c.section} className="h-32 object-cover rounded border border-white/10" />
                              </div>
                            )}
                            {c.title && <p><strong className="text-white font-sans uppercase tracking-wider text-xs mr-2">Title:</strong> {c.title}</p>}
                            {c.description && <p><strong className="text-white font-sans uppercase tracking-wider text-xs mr-2">Description:</strong> {c.description.substring(0, 150)}...</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* HERO SLIDES TAB */}
                {activeTab === 'hero' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-transparent p-6 rounded-2xl border border-blue-500/20">
                      <div>
                        <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">Hero Slider Config</h2>
                        <p className="text-xs text-blue-300/70 tracking-wide">Manage the massive full-screen images on the homepage.</p>
                      </div>
                      <button onClick={() => setEditingHero({ img: '', mobileImg: '', title: '', titleOutline: '', text: '', order: 0 })} className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        + Add Slide
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {heroSlides.map((slide, i) => (
                        <div key={slide._id} className={`${glassPanel} overflow-hidden group`}>
                          <div className="h-48 relative overflow-hidden">
                            <img src={slide.img} alt="Hero" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 right-4 text-center">
                              <h3 className="text-xs text-white font-oswald uppercase tracking-[0.3em]">{slide.text}</h3>
                            </div>
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleMoveHeroSlide(i, 'up')} className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center hover:scale-110 transition-transform">↑</button>
                              <button onClick={() => handleMoveHeroSlide(i, 'down')} className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center hover:scale-110 transition-transform">↓</button>
                              <button onClick={() => setEditingHero(slide)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">✎</button>
                              <button onClick={() => handleDeleteHero(slide._id)} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform">×</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EDIT HERO MODAL */}
                {editingHero && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${glassPanel} p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>
                       <div className="flex justify-between items-center mb-6">
                         <h2 className="text-xl font-oswald text-white uppercase tracking-widest">{editingHero._id ? 'Edit Slide' : 'New Slide'}</h2>
                         <button onClick={() => setEditingHero(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                       </div>
                       <form onSubmit={(e) => handleSaveHero(e, editingHero)} className="space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-xs uppercase text-gray-400 mb-2">Desktop Image (Horizontal)</label>
                             <DragDropImageUploader currentImage={editingHero.img} aspect={16/9} onUploadSuccess={(url) => setEditingHero({...editingHero, img: url})} />
                           </div>
                           <div>
                             <label className="block text-xs uppercase text-gray-400 mb-2">Mobile Image (Vertical)</label>
                             <DragDropImageUploader currentImage={editingHero.mobileImg} aspect={9/16} onUploadSuccess={(url) => setEditingHero({...editingHero, mobileImg: url})} />
                           </div>
                         </div>
                         <div>
                           <label className="block text-xs uppercase text-gray-400 mb-2">Main Large Title (Solid White)</label>
                           <input type="text" className={glassInput} placeholder="e.g. TIMELESS" value={editingHero.title || ''} onChange={e => setEditingHero({...editingHero, title: e.target.value})} />
                         </div>
                         <div>
                           <label className="block text-xs uppercase text-gray-400 mb-2">Main Large Title (Outlined)</label>
                           <input type="text" className={glassInput} placeholder="e.g. & CINEMATIC MEMORIES." value={editingHero.titleOutline || ''} onChange={e => setEditingHero({...editingHero, titleOutline: e.target.value})} />
                         </div>
                         <div>
                           <label className="block text-xs uppercase text-gray-400 mb-2">Small Subtitle (Top)</label>
                           <input type="text" className={glassInput} value={editingHero.text} onChange={e => setEditingHero({...editingHero, text: e.target.value})} required />
                         </div>
                         <div className="flex justify-end gap-3 pt-6">
                           <button type="button" onClick={() => setEditingHero(null)} className="px-6 py-3 rounded-xl bg-white/5 text-xs uppercase hover:bg-white/10 transition-colors">Cancel</button>
                           <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-blue-500 text-white font-bold text-xs uppercase hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save Slide'}</button>
                         </div>
                       </form>
                     </motion.div>
                  </div>
                )}

                {/* LANDING PAGES TAB */}
                {activeTab === 'landing pages' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center bg-gradient-to-r from-emerald-900/20 to-transparent p-6 rounded-2xl border border-emerald-500/20">
                      <div>
                        <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">Landing Pages</h2>
                        <p className="text-xs text-emerald-300/70 tracking-wide">Manage standalone landing pages for campaigns and promotions.</p>
                      </div>
                      <button onClick={() => setEditingLandingPage({ name: '', slug: '', heroImage: '', cardImage: '', mobileHeroImage: '', landingAbout: { title: '', description: '', imageUrl: '' }, features: [], faqs: [], portfolioImages: [], portfolioVideos: [], callToActionLink: '', isActive: true })} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        + New Page
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {landingPages.map(page => (
                        <div key={page._id} className={`${glassPanel} overflow-hidden group relative h-[250px]`}>
                          <img src={page.cardImage || page.heroImage || page.landingAbout?.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'} alt={page.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 cursor-pointer" />
                          <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none">
                            <h3 className="text-xl text-white font-oswald uppercase tracking-widest">{page.name}</h3>
                            <span className="mt-1 text-[11px] text-emerald-400 font-sans tracking-widest uppercase">/{page.slug}</span>
                            <span className={`mt-1 text-[11px] font-sans tracking-widest uppercase ${page.isActive ? 'text-green-500' : 'text-red-500'}`}>
                              {page.isActive ? 'Active' : 'Draft'}
                            </span>
                          </div>
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0">
                            <button onClick={() => window.open(`/${page.slug}`, '_blank')} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:scale-110 shadow-lg" title="Preview">👁</button>
                            <button onClick={() => setEditingLandingPage(page)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 shadow-lg" title="Edit">✎</button>
                            <button onClick={() => handleDeleteLandingPage(page._id)} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 shadow-lg" title="Delete">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EDIT LANDING PAGE MODAL */}
                {editingLandingPage && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${glassPanel} p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>
                      <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-oswald text-white uppercase tracking-[0.2em]">{editingLandingPage._id ? 'Edit Landing Page' : 'New Landing Page'}</h2>
                        <button type="button" onClick={() => setEditingLandingPage(null)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                      </div>
                      <form onSubmit={(e) => handleSaveLandingPage(e, editingLandingPage)} className="space-y-8">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Page Name</label>
                              <input type="text" className={glassInput} value={editingLandingPage.name} onChange={e => setEditingLandingPage({...editingLandingPage, name: e.target.value})} required />
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Slug (URL)</label>
                              <input type="text" className={glassInput} value={editingLandingPage.slug} onChange={e => setEditingLandingPage({...editingLandingPage, slug: e.target.value})} required />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-[11px] text-gray-500 uppercase tracking-widest">Desktop Hero Image</label>
                                {editingLandingPage.heroImage && (
                                  <button type="button" onClick={() => setEditingLandingPage({...editingLandingPage, heroImage: ''})} className="text-[9px] text-red-500 hover:text-red-400 uppercase tracking-widest">Remove</button>
                                )}
                              </div>
                              <DragDropImageUploader currentImage={editingLandingPage.heroImage} aspect={16/9} onUploadSuccess={(url) => setEditingLandingPage({...editingLandingPage, heroImage: url})} />
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-[11px] text-gray-500 uppercase tracking-widest">Admin Card Image</label>
                                {editingLandingPage.cardImage && (
                                  <button type="button" onClick={() => setEditingLandingPage({...editingLandingPage, cardImage: ''})} className="text-[9px] text-red-500 hover:text-red-400 uppercase tracking-widest">Remove</button>
                                )}
                              </div>
                              <DragDropImageUploader currentImage={editingLandingPage.cardImage} aspect={16/9} onUploadSuccess={(url) => setEditingLandingPage({...editingLandingPage, cardImage: url})} />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs uppercase text-gray-400 mb-2 mt-4">Call to Action Link</label>
                            <input type="text" className={glassInput} placeholder="e.g., https://wa.me/..." value={editingLandingPage.callToActionLink || ''} onChange={e => setEditingLandingPage({...editingLandingPage, callToActionLink: e.target.value})} />
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-6 mt-4">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" id="isActive" checked={editingLandingPage.isActive} onChange={e => setEditingLandingPage({...editingLandingPage, isActive: e.target.checked})} className="w-5 h-5 accent-emerald-500" />
                              <label htmlFor="isActive" className="text-xs uppercase text-gray-400">Page is Active (Published)</label>
                            </div>
                            <div className="flex items-center gap-3">
                              <input type="checkbox" id="showTestimonials" checked={editingLandingPage.showTestimonials !== false} onChange={e => setEditingLandingPage({...editingLandingPage, showTestimonials: e.target.checked})} className="w-5 h-5 accent-emerald-500" />
                              <label htmlFor="showTestimonials" className="text-xs uppercase text-gray-400">Show Testimonials</label>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <input type="checkbox" id="showPackages" checked={editingLandingPage.showPackages || false} onChange={e => setEditingLandingPage({...editingLandingPage, showPackages: e.target.checked})} className="w-5 h-5 accent-emerald-500" />
                              <label htmlFor="showPackages" className="text-xs uppercase text-gray-400">Show Packages</label>
                            </div>
                          </div>
                          {editingLandingPage.showPackages && (
                            <>
                            <div className="mt-4">
                              <label className="block text-[9px] text-gray-500 mb-1 uppercase">Packages Heading</label>
                              <input type="text" className={glassInput + " py-2 text-sm"} placeholder="e.g. Investment" value={editingLandingPage.packagesHeading || ""} onChange={e => setEditingLandingPage({...editingLandingPage, packagesHeading: e.target.value})} />
                            </div>
                            
                            <div className="mt-4 border border-white/10 p-4 rounded-xl">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs uppercase text-gray-400 tracking-widest">Custom Packages</h4>
                                <button type="button" onClick={() => setEditingLandingPage({...editingLandingPage, customPackages: [...(editingLandingPage.customPackages || []), {name: '', price: '', description: ''}]})} className="text-[11px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded uppercase tracking-widest">+ Add Package</button>
                              </div>
                              {(editingLandingPage.customPackages || []).map((pkg, idx) => (
                                <div key={idx} className="mb-4 bg-black/30 p-3 rounded border border-white/5 relative">
                                  <button type="button" onClick={() => {
                                    const newPkgs = [...editingLandingPage.customPackages];
                                    newPkgs.splice(idx, 1);
                                    setEditingLandingPage({...editingLandingPage, customPackages: newPkgs});
                                  }} className="absolute top-2 right-2 text-red-500 hover:text-red-400">&times;</button>
                                  <div className="grid grid-cols-2 gap-3 mb-2">
                                    <input type="text" className={glassInput + " py-1 text-xs"} placeholder="Package Name (e.g. Silver)" value={pkg.name} onChange={e => {
                                      const newPkgs = [...editingLandingPage.customPackages];
                                      newPkgs[idx].name = e.target.value;
                                      setEditingLandingPage({...editingLandingPage, customPackages: newPkgs});
                                    }} />
                                    <input type="text" className={glassInput + " py-1 text-xs"} placeholder="Price (e.g. 10000)" value={pkg.price} onChange={e => {
                                      const newPkgs = [...editingLandingPage.customPackages];
                                      newPkgs[idx].price = e.target.value;
                                      setEditingLandingPage({...editingLandingPage, customPackages: newPkgs});
                                    }} />
                                  </div>
                                  <textarea className={glassInput + " py-1 text-xs"} rows="2" placeholder="Features (one per line)" value={pkg.description} onChange={e => {
                                    const newPkgs = [...editingLandingPage.customPackages];
                                    newPkgs[idx].description = e.target.value;
                                    setEditingLandingPage({...editingLandingPage, customPackages: newPkgs});
                                  }}></textarea>
                                </div>
                              ))}
                            </div>
                            </>
                          )}
                          
                          {/* HERO TEXT SETTINGS */}
                          <div className="border-t border-white/5 pt-6 mt-6 mb-6">
                            <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase mb-4">Hero Section Text</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] text-gray-500 mb-1 uppercase">Hero Subheading</label>
                                <input type="text" className={glassInput + " py-2 text-xs"} placeholder="e.g. Your Studio Name" value={editingLandingPage.heroSubheading || ""} onChange={e => setEditingLandingPage({...editingLandingPage, heroSubheading: e.target.value})} />
                              </div>
                              <div>
                                <label className="block text-[9px] text-gray-500 mb-1 uppercase">Hero Heading</label>
                                <input type="text" className={glassInput + " py-2 text-xs"} placeholder="e.g. Beautiful Baby Photography" value={editingLandingPage.heroHeading || ""} onChange={e => setEditingLandingPage({...editingLandingPage, heroHeading: e.target.value})} />
                              </div>
                              <div className="col-span-full">
                                <label className="block text-[9px] text-gray-500 mb-1 uppercase">Hero Quote</label>
                                <input type="text" className={glassInput + " py-2 text-xs"} placeholder="e.g. Your Baby's Smile..." value={editingLandingPage.heroQuote || ""} onChange={e => setEditingLandingPage({...editingLandingPage, heroQuote: e.target.value})} />
                              </div>
                              <div className="col-span-full">
                                <label className="block text-[9px] text-gray-500 mb-1 uppercase">Hero Description</label>
                                <textarea className={glassInput + " py-2 text-xs"} rows="2" placeholder="Professional baby shoots..." value={editingLandingPage.heroDescription || ""} onChange={e => setEditingLandingPage({...editingLandingPage, heroDescription: e.target.value})}></textarea>
                              </div>
                              <div>
                                <label className="block text-[9px] text-gray-500 mb-1 uppercase">Price Text</label>
                                <input type="text" className={glassInput + " py-2 text-xs"} placeholder="Packages Start From Just" value={editingLandingPage.heroPriceText || ""} onChange={e => setEditingLandingPage({...editingLandingPage, heroPriceText: e.target.value})} />
                              </div>
                              <div>
                                <label className="block text-[9px] text-gray-500 mb-1 uppercase">Price Amount</label>
                                <input type="text" className={glassInput + " py-2 text-xs"} placeholder="₹3,999/-" value={editingLandingPage.heroPriceAmount || ""} onChange={e => setEditingLandingPage({...editingLandingPage, heroPriceAmount: e.target.value})} />
                              </div>
                              <div className="col-span-full">
                                <label className="block text-[9px] text-gray-500 mb-1 uppercase">Button Text</label>
                                <input type="text" className={glassInput + " py-2 text-xs"} placeholder="Book Your Shoot Now" value={editingLandingPage.heroButtonText || ""} onChange={e => setEditingLandingPage({...editingLandingPage, heroButtonText: e.target.value})} />
                              </div>
                            </div>
                          </div>
                          
                        {/* HERO CAROUSEL */}
   <div className="mb-4">
     <label className="block text-[9px] text-gray-500 mb-1 uppercase">Hero Text Alignment</label>
     <select className={glassInput + ' py-2 text-xs'} value={editingLandingPage.heroTextAlign || 'center'} onChange={e => setEditingLandingPage({...editingLandingPage, heroTextAlign: e.target.value})}>
       <option value="left" className="bg-black text-white">Left</option>
       <option value="center" className="bg-black text-white">Center</option>
       <option value="right" className="bg-black text-white">Right</option>
     </select>
   </div>
  
                        <div className="border-t border-white/5 pt-6 mt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase">Hero Carousel</h3>
                            <button type="button" onClick={() => {
                              const newSlides = [...(editingLandingPage.heroSlides || []), { imageUrl: '', mobileImageUrl: '', heading: '', description: '' }];
                              setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                            }} className="text-xs uppercase bg-white/10 px-3 py-1 rounded hover:bg-white hover:text-black transition-colors">+ Add Slide</button>
                          </div>
                          <div className="space-y-6">
                            {(editingLandingPage.heroSlides || []).map((slide, idx) => (
                              <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-4 relative">
                                <button type="button" onClick={() => {
                                  const newSlides = [...editingLandingPage.heroSlides];
                                  newSlides.splice(idx, 1);
                                  setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                }} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs uppercase">Remove</button>
                                <div className="absolute top-2 right-16 flex gap-2">
                                  <button type="button" onClick={() => {
                                    if(idx > 0) {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      [newSlides[idx-1], newSlides[idx]] = [newSlides[idx], newSlides[idx-1]];
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }
                                  }} className="text-gray-400 hover:text-white text-xs">↑</button>
                                  <button type="button" onClick={() => {
                                    if(idx < editingLandingPage.heroSlides.length - 1) {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      [newSlides[idx+1], newSlides[idx]] = [newSlides[idx], newSlides[idx+1]];
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }
                                  }} className="text-gray-400 hover:text-white text-xs">↓</button>
                                </div>
  
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="block text-[9px] text-gray-500 uppercase">Desktop Image</label>
                                      {slide.imageUrl && (
                                        <button type="button" onClick={() => {
                                          const newSlides = [...editingLandingPage.heroSlides];
                                          newSlides[idx].imageUrl = '';
                                          setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                        }} className="text-[9px] text-red-500 hover:text-red-400 uppercase">Remove</button>
                                      )}
                                    </div>
                                    <DragDropImageUploader currentImage={slide.imageUrl} aspect={16/9} onUploadSuccess={(url) => {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      newSlides[idx].imageUrl = url;
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }} />
                                  </div>
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="block text-[9px] text-gray-500 uppercase">Mobile Image</label>
                                      {slide.mobileImageUrl && (
                                        <button type="button" onClick={() => {
                                          const newSlides = [...editingLandingPage.heroSlides];
                                          newSlides[idx].mobileImageUrl = '';
                                          setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                        }} className="text-[9px] text-red-500 hover:text-red-400 uppercase">Remove</button>
                                      )}
                                    </div>
                                    <DragDropImageUploader currentImage={slide.mobileImageUrl} aspect={9/16} onUploadSuccess={(url) => {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      newSlides[idx].mobileImageUrl = url;
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }} />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase">Heading</label>
                                  <input type="text" className={glassInput + ' py-2 text-xs'} value={slide.heading} onChange={e => {
                                    const newSlides = [...editingLandingPage.heroSlides];
                                    newSlides[idx].heading = e.target.value;
                                    setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                  }} />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase">Description</label>
                                  <textarea className={`${glassInput} h-16 text-xs`} value={slide.description} onChange={e => {
                                    const newSlides = [...editingLandingPage.heroSlides];
                                    newSlides[idx].description = e.target.value;
                                    setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                  }}></textarea>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SERVICE CARDS (WHAT WE DO BEST) */}
                        <div className="border-t border-white/5 pt-6 mt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase">What We Do Best (Service Cards)</h3>
                            <button type="button" onClick={() => {
                              const newCards = [...(editingLandingPage.serviceCards || []), { category: '', title: '', description: '', images: [] }];
                              setEditingLandingPage({...editingLandingPage, serviceCards: newCards});
                            }} className="text-xs uppercase bg-white/10 px-3 py-1 rounded hover:bg-white hover:text-black transition-colors">+ Add Card</button>
                          </div>
                          <div className="mb-4">
                              <label className="block text-xs uppercase text-gray-400 mb-2">Section Heading</label>
                              <input type="text" className={glassInput} value={editingLandingPage.serviceCardsHeading || ''} onChange={e => setEditingLandingPage({...editingLandingPage, serviceCardsHeading: e.target.value})} placeholder="e.g. What We Do Best" />
                          </div>
                          
                          <div className="space-y-6">
                            {(editingLandingPage.serviceCards || []).map((card, idx) => (
                              <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-4 relative">
                                <button type="button" onClick={() => {
                                  const newCards = [...editingLandingPage.serviceCards];
                                  newCards.splice(idx, 1);
                                  setEditingLandingPage({...editingLandingPage, serviceCards: newCards});
                                }} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs uppercase">Remove</button>
                                <div className="absolute top-2 right-16 flex gap-2">
                                  <button type="button" onClick={() => {
                                    if(idx > 0) {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      [newSlides[idx-1], newSlides[idx]] = [newSlides[idx], newSlides[idx-1]];
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }
                                  }} className="text-gray-400 hover:text-white text-xs">↑</button>
                                  <button type="button" onClick={() => {
                                    if(idx < editingLandingPage.heroSlides.length - 1) {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      [newSlides[idx+1], newSlides[idx]] = [newSlides[idx], newSlides[idx+1]];
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }
                                  }} className="text-gray-400 hover:text-white text-xs">↓</button>
                                </div>
  
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">Category Label</label>
                                    <input type="text" className={glassInput + ' py-2 text-xs'} value={card.category || ''} onChange={e => {
                                      const newCards = [...editingLandingPage.serviceCards];
                                      newCards[idx].category = e.target.value;
                                      setEditingLandingPage({...editingLandingPage, serviceCards: newCards});
                                    }} placeholder="e.g. 5-15 Days" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">Title</label>
                                    <input type="text" className={glassInput + ' py-2 text-xs'} value={card.title || ''} onChange={e => {
                                      const newCards = [...editingLandingPage.serviceCards];
                                      newCards[idx].title = e.target.value;
                                      setEditingLandingPage({...editingLandingPage, serviceCards: newCards});
                                    }} placeholder="e.g. Newborn Shoots" />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase">Description</label>
                                  <textarea className={glassInput + ' py-2 text-xs'} value={card.description || ''} onChange={e => {
                                    const newCards = [...editingLandingPage.serviceCards];
                                    newCards[idx].description = e.target.value;
                                    setEditingLandingPage({...editingLandingPage, serviceCards: newCards});
                                  }} />
                                </div>
                                
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase">Card Background Images</label>
                                  <DragDropImageUploader currentImage={''} multiple={true} disableCompression={true} onUploadSuccess={(urls) => {
                                    const newCards = [...editingLandingPage.serviceCards];
                                    newCards[idx].images = [...(newCards[idx].images || []), ...urls];
                                    setEditingLandingPage({...editingLandingPage, serviceCards: newCards});
                                  }} />
                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    {(card.images || []).map((img, i) => (
                                      <div key={i} className="relative group">
                                        <img src={img} className="w-full h-16 object-cover rounded" />
                                        <button type="button" onClick={() => {
                                          const newCards = [...editingLandingPage.serviceCards];
                                          newCards[idx].images.splice(i, 1);
                                          setEditingLandingPage({...editingLandingPage, serviceCards: newCards});
                                        }} className="absolute top-1 right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[11px] flex justify-center items-center opacity-0 group-hover:opacity-100">×</button>
                                        <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100">
                                          <button type="button" onClick={() => {
                                            if(i > 0) {
                                              const newCards = [...editingLandingPage.serviceCards];
                                              [newCards[idx].images[i-1], newCards[idx].images[i]] = [newCards[idx].images[i], newCards[idx].images[i-1]];
                                              setEditingLandingPage({...editingLandingPage, serviceCards: newCards});
                                            }
                                          }} className="bg-black/50 text-white w-4 h-4 rounded-full text-[11px] flex justify-center items-center">↑</button>
                                          <button type="button" onClick={() => {
                                            if(i < card.images.length - 1) {
                                              const newCards = [...editingLandingPage.serviceCards];
                                              [newCards[idx].images[i+1], newCards[idx].images[i]] = [newCards[idx].images[i], newCards[idx].images[i+1]];
                                              setEditingLandingPage({...editingLandingPage, serviceCards: newCards});
                                            }
                                          }} className="bg-black/50 text-white w-4 h-4 rounded-full text-[11px] flex justify-center items-center">↓</button>
                                        </div>
  
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* DISPLAY VIDEO */}
                        <div className="border-t border-white/5 pt-6 mt-6">
                           <div className="flex justify-between items-center mb-4">
                             <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase">Display Video</h3>
                             <label className="flex items-center gap-2 cursor-pointer">
                               <input type="checkbox" className="form-checkbox text-blue-500 rounded bg-black border-white/20" checked={editingLandingPage.showDisplayVideo !== false} onChange={e => setEditingLandingPage({...editingLandingPage, showDisplayVideo: e.target.checked})} />
                               <span className="text-[11px] uppercase text-gray-400 tracking-widest">Show Video</span>
                             </label>
                           </div>
                           <input type="text" className="bg-transparent border border-white/10 text-white font-sans outline-none focus:border-white/50 rounded transition-colors [color-scheme:dark] py-2 text-sm w-full mb-4" placeholder="Paste YouTube Link here (e.g. https://youtu.be/...)" value={editingLandingPage.displayVideoUrl || ""} onChange={e => setEditingLandingPage({...editingLandingPage, displayVideoUrl: e.target.value})} />
                           <DragDropVideoUploader currentVideo={editingLandingPage.displayVideoUrl || editingLandingPage.localVideoUrl} onUploadSuccess={(url) => setEditingLandingPage({...editingLandingPage, displayVideoUrl: url})} />
                        </div>

                        {/* APPROACH SECTIONS */}
                        <div className="border-t border-white/5 pt-6 mt-6">
                          <div className="space-y-4 mb-6">
                            <div>
                              <label className="block text-[9px] text-gray-500 mb-1 uppercase">Main Heading</label>
                              <input type="text" className="bg-transparent border border-white/10 text-white font-sans outline-none focus:border-white/50 rounded transition-colors [color-scheme:dark] py-2 text-sm" placeholder="e.g. Our Approach" value={editingLandingPage.approachHeading || ""} onChange={e => setEditingLandingPage({...editingLandingPage, approachHeading: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-[9px] text-gray-500 mb-1 uppercase">Main Description</label>
                              <textarea className="bg-transparent border border-white/10 text-white font-sans outline-none focus:border-white/50 rounded transition-colors [color-scheme:dark] py-2 text-sm" rows="2" placeholder="e.g. Capturing the purest moments..." value={editingLandingPage.approachDescription || ""} onChange={e => setEditingLandingPage({...editingLandingPage, approachDescription: e.target.value})}></textarea>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase">Our Approach Sections</h3>
                            <button type="button" onClick={() => {
                              const newSections = [...(editingLandingPage.approachSections || []), { heading: '', description: '', align: 'center' }];
                              setEditingLandingPage({...editingLandingPage, approachSections: newSections});
                            }} className="text-xs uppercase bg-white/10 px-3 py-1 rounded hover:bg-white hover:text-black transition-colors">+ Add Section</button>
                          </div>
                          <div className="space-y-6">
                            {(editingLandingPage.approachSections || []).map((section, idx) => (
                              <div key={idx} className="p-4 border border-white/10 rounded bg-black/40 relative">
                                <button type="button" onClick={() => {
                                  const newSections = [...editingLandingPage.approachSections];
                                  newSections.splice(idx, 1);
                                  setEditingLandingPage({...editingLandingPage, approachSections: newSections});
                                }} className="absolute top-2 right-2 text-red-500 hover:text-red-400">&times;</button>
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Heading</label>
                                    <input type="text" className={glassInput} value={section.heading || ''} onChange={e => {
                                      const newSections = [...editingLandingPage.approachSections];
                                      newSections[idx].heading = e.target.value;
                                      setEditingLandingPage({...editingLandingPage, approachSections: newSections});
                                    }} />
                                  </div>
                                  <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Description</label>
                                    <textarea className={`${glassInput} h-32`} value={section.description || ''} onChange={e => {
                                      const newSections = [...editingLandingPage.approachSections];
                                      newSections[idx].description = e.target.value;
                                      setEditingLandingPage({...editingLandingPage, approachSections: newSections});
                                    }}></textarea>
                                  </div>
                                  <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Text Alignment</label>
                                    <select className={glassInput} value={section.align || 'center'} onChange={e => {
                                      const newSections = [...editingLandingPage.approachSections];
                                      newSections[idx].align = e.target.value;
                                      setEditingLandingPage({...editingLandingPage, approachSections: newSections});
                                    }}>
                                      <option value="left" className="bg-black text-white">Left</option>
                                      <option value="center" className="bg-black text-white">Center</option>
                                      <option value="right" className="bg-black text-white">Right</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

{/* WHY CHOOSE US */}
                        <div className="border-t border-white/5 pt-6 mt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase">Why Choose Us? (Features)</h3>
                            <button type="button" onClick={() => {
                              const newFeatures = [...(editingLandingPage.features || []), { title: '', description: '' }];
                              setEditingLandingPage({...editingLandingPage, features: newFeatures});
                            }} className="text-xs uppercase bg-white/10 px-3 py-1 rounded hover:bg-white hover:text-black transition-colors">+ Add Feature</button>
                          </div>
                          <div className="mb-4">
                              <label className="block text-xs uppercase text-gray-400 mb-2">Section Heading</label>
                              <input type="text" className={glassInput} value={editingLandingPage.whyChooseHeading || ''} onChange={e => setEditingLandingPage({...editingLandingPage, whyChooseHeading: e.target.value})} placeholder="e.g. Why Choose Us?" />
                          </div>
                          <div className="mb-4">
                            <label className="block text-[9px] text-gray-500 mb-1 uppercase">Text Alignment</label>
                            <select className={glassInput + ' py-2 text-xs'} value={editingLandingPage.featuresAlign || 'left'} onChange={e => setEditingLandingPage({...editingLandingPage, featuresAlign: e.target.value})}>
                              <option value="left" className="bg-black text-white">Left</option>
                              <option value="center" className="bg-black text-white">Center</option>
                              <option value="right" className="bg-black text-white">Right</option>
                            </select>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {(editingLandingPage.features || []).map((feature, idx) => (
                              <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 relative">
                                <button type="button" onClick={() => {
                                  const newF = [...editingLandingPage.features];
                                  newF.splice(idx, 1);
                                  setEditingLandingPage({...editingLandingPage, features: newF});
                                }} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs uppercase">Remove</button>
                                <div className="absolute top-2 right-16 flex gap-2">
                                  <button type="button" onClick={() => {
                                    if(idx > 0) {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      [newSlides[idx-1], newSlides[idx]] = [newSlides[idx], newSlides[idx-1]];
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }
                                  }} className="text-gray-400 hover:text-white text-xs">↑</button>
                                  <button type="button" onClick={() => {
                                    if(idx < editingLandingPage.heroSlides.length - 1) {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      [newSlides[idx+1], newSlides[idx]] = [newSlides[idx], newSlides[idx+1]];
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }
                                  }} className="text-gray-400 hover:text-white text-xs">↓</button>
                                </div>
  
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase">Title</label>
                                  <input type="text" className={glassInput + ' py-2 text-xs'} value={feature.title} onChange={e => {
                                    const newF = [...editingLandingPage.features];
                                    newF[idx].title = e.target.value;
                                    setEditingLandingPage({...editingLandingPage, features: newF});
                                  }} />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase">Description</label>
                                  <textarea className={`${glassInput} h-16 text-xs`} value={feature.description} onChange={e => {
                                    const newF = [...editingLandingPage.features];
                                    newF[idx].description = e.target.value;
                                    setEditingLandingPage({...editingLandingPage, features: newF});
                                  }}></textarea>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* COMFORT SECTIONS */}
                        <div className="border-t border-white/5 pt-6 mt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase">Pure Comfort for Mother & Baby</h3>
                            <button type="button" onClick={() => {
                              const newItems = [...(editingLandingPage.comfortItems || []), { title: '', desc: '' }];
                              setEditingLandingPage({...editingLandingPage, comfortItems: newItems});
                            }} className="text-xs uppercase bg-white/10 px-3 py-1 rounded hover:bg-white hover:text-black transition-colors">+ Add Item</button>
                          </div>
                          <div className="mb-4">
                              <label className="block text-xs uppercase text-gray-400 mb-2">Section Heading</label>
                              <input type="text" className={glassInput} value={editingLandingPage.comfortHeading || ''} onChange={e => setEditingLandingPage({...editingLandingPage, comfortHeading: e.target.value})} placeholder="e.g. Pure Comfort for Mother & Baby" />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {(editingLandingPage.comfortItems || []).map((item, idx) => (
                              <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 relative">
                                <button type="button" onClick={() => {
                                  const newItems = [...editingLandingPage.comfortItems];
                                  newItems.splice(idx, 1);
                                  setEditingLandingPage({...editingLandingPage, comfortItems: newItems});
                                }} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs uppercase">Remove</button>
                                <div className="absolute top-2 right-16 flex gap-2">
                                  <button type="button" onClick={() => {
                                    if(idx > 0) {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      [newSlides[idx-1], newSlides[idx]] = [newSlides[idx], newSlides[idx-1]];
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }
                                  }} className="text-gray-400 hover:text-white text-xs">↑</button>
                                  <button type="button" onClick={() => {
                                    if(idx < editingLandingPage.heroSlides.length - 1) {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      [newSlides[idx+1], newSlides[idx]] = [newSlides[idx], newSlides[idx+1]];
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }
                                  }} className="text-gray-400 hover:text-white text-xs">↓</button>
                                </div>
  
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase">Title</label>
                                  <input type="text" className={glassInput + ' py-2 text-xs'} value={item.title || ''} onChange={e => {
                                    const newItems = [...editingLandingPage.comfortItems];
                                    newItems[idx].title = e.target.value;
                                    setEditingLandingPage({...editingLandingPage, comfortItems: newItems});
                                  }} />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase">Description</label>
                                  <textarea className={glassInput + ' py-2 text-xs'} value={item.desc || ''} onChange={e => {
                                    const newItems = [...editingLandingPage.comfortItems];
                                    newItems[idx].desc = e.target.value;
                                    setEditingLandingPage({...editingLandingPage, comfortItems: newItems});
                                  }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* PORTFOLIO IMAGES */}
                        <div className="border-t border-white/5 pt-6 mt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase">Images Gallery</h3>
                          </div>
                          <div className="mb-4">
                              <label className="block text-xs uppercase text-gray-400 mb-2">Section Heading</label>
                              <input type="text" className={glassInput} value={editingLandingPage.portfolioImagesHeading || ''} onChange={e => setEditingLandingPage({...editingLandingPage, portfolioImagesHeading: e.target.value})} placeholder="e.g. Our Portfolio" />
                          </div>
                          <div className="mb-4">
                            <label className="block text-[9px] text-gray-500 mb-1 uppercase">Heading Alignment</label>
                            <select className={glassInput + ' py-2 text-xs'} value={editingLandingPage.portfolioImagesAlign || 'center'} onChange={e => setEditingLandingPage({...editingLandingPage, portfolioImagesAlign: e.target.value})}>
                              <option value="left" className="bg-black text-white">Left</option>
                              <option value="center" className="bg-black text-white">Center</option>
                              <option value="right" className="bg-black text-white">Right</option>
                            </select>
                          </div>
                          <DragDropImageUploader currentImage={''} multiple={true} disableCompression={true} onUploadSuccess={(urls) => {
                            const newImgs = [...(editingLandingPage.portfolioImages || []), ...urls];
                            setEditingLandingPage({...editingLandingPage, portfolioImages: newImgs});
                          }} />
                          <div className="mt-4 columns-2 sm:columns-3 gap-2 space-y-2">
                            {(editingLandingPage.portfolioImages || []).map((img, idx) => (
                              <div key={idx} className="relative group break-inside-avoid">
                                <img src={img} className="w-full h-auto object-cover rounded border border-white/10" />
                                <button type="button" onClick={() => {
                                  const newImgs = [...editingLandingPage.portfolioImages];
                                  newImgs.splice(idx, 1);
                                  setEditingLandingPage({...editingLandingPage, portfolioImages: newImgs});
                                }} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                              </div>
                            ))}
                          </div>
                        </div>

                        
                        {/* PORTFOLIO VIDEOS */}
                        <div className="border-t border-white/5 pt-6 mt-6">
                           <div className="flex justify-between items-center mb-4">
                             <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase">Videos Gallery</h3>
                             <label className="flex items-center gap-2 cursor-pointer">
                               <input type="checkbox" className="form-checkbox text-emerald-500 rounded bg-black border-white/20" checked={editingLandingPage.showVideoGallery !== false} onChange={e => setEditingLandingPage({...editingLandingPage, showVideoGallery: e.target.checked})} />
                               <span className="text-[11px] uppercase text-gray-400 tracking-widest">Show Gallery</span>
                             </label>
                           </div>
                           <div className="mb-4">
                              <label className="block text-xs uppercase text-gray-400 mb-2">Section Heading</label>
                              <input type="text" className={glassInput} value={editingLandingPage.portfolioVideosHeading || ''} onChange={e => setEditingLandingPage({...editingLandingPage, portfolioVideosHeading: e.target.value})} placeholder="e.g. Memorable Client Stories" />
                          </div>
                          <div className="mb-4">
                            <label className="block text-[9px] text-gray-500 mb-1 uppercase">Heading Alignment</label>
                            <select className={glassInput + ' py-2 text-xs'} value={editingLandingPage.portfolioVideosAlign || 'center'} onChange={e => setEditingLandingPage({...editingLandingPage, portfolioVideosAlign: e.target.value})}>
                              <option value="left" className="bg-black text-white">Left</option>
                              <option value="center" className="bg-black text-white">Center</option>
                              <option value="right" className="bg-black text-white">Right</option>
                            </select>
                          </div>
                           <div className="flex justify-between items-center mb-2">
                             <label className="block text-xs uppercase text-gray-400">YouTube Links</label>
                             <button type="button" onClick={() => {
                               const newVids = [...(editingLandingPage.portfolioVideos || []), ''];
                               setEditingLandingPage({...editingLandingPage, portfolioVideos: newVids});
                             }} className="text-[11px] uppercase text-emerald-400">+ Add Link</button>
                           </div>
                           <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                             {(editingLandingPage.portfolioVideos || []).map((vid, idx) => (
                               <div key={idx} className="flex gap-2">
                                 <input type="text" className={glassInput} placeholder="https://youtube.com/..." value={vid} onChange={e => {
                                   const newVids = [...editingLandingPage.portfolioVideos];
                                   newVids[idx] = e.target.value;
                                   setEditingLandingPage({...editingLandingPage, portfolioVideos: newVids});
                                 }} />
                                 <button type="button" onClick={() => {
                                   const newVids = [...editingLandingPage.portfolioVideos];
                                   newVids.splice(idx, 1);
                                   setEditingLandingPage({...editingLandingPage, portfolioVideos: newVids});
                                 }} className="bg-red-500/20 text-red-400 px-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors">×</button>
                               </div>
                             ))}
                           </div>
                        </div>

                        </div>

                        {/* PARALLAX FOOTER */}
                        <div className="border-t border-white/5 pt-6 mt-6">
                          <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase mb-4">Parallax Footer</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Heading</label>
                              <input type="text" className={glassInput} value={editingLandingPage.parallaxFooter?.heading || ''} onChange={e => setEditingLandingPage({...editingLandingPage, parallaxFooter: {...(editingLandingPage.parallaxFooter || {}), heading: e.target.value}})} placeholder="e.g. Ready to Begin Your Story?" />
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Subheading</label>
                              <input type="text" className={glassInput} value={editingLandingPage.parallaxFooter?.subheading || ''} onChange={e => setEditingLandingPage({...editingLandingPage, parallaxFooter: {...(editingLandingPage.parallaxFooter || {}), subheading: e.target.value}})} placeholder="e.g. Starts From Just ₹3,999/-" />
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Button Text</label>
                              <input type="text" className={glassInput} value={editingLandingPage.parallaxFooter?.buttonText || ''} onChange={e => setEditingLandingPage({...editingLandingPage, parallaxFooter: {...(editingLandingPage.parallaxFooter || {}), buttonText: e.target.value}})} placeholder="e.g. Claim Your Spot Now" />
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Description</label>
                              <textarea className={glassInput} value={editingLandingPage.parallaxFooter?.description || ''} onChange={e => setEditingLandingPage({...editingLandingPage, parallaxFooter: {...(editingLandingPage.parallaxFooter || {}), description: e.target.value}})} placeholder="e.g. Let us capture your beautiful moments..." rows="3"></textarea>
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Background Image</label>
                              <DragDropImageUploader currentImage={editingLandingPage.parallaxFooter?.imageUrl || ''} aspect={16/9} onUploadSuccess={(url) => setEditingLandingPage({...editingLandingPage, parallaxFooter: {...(editingLandingPage.parallaxFooter || {}), imageUrl: url}})} />
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Text Alignment</label>
                              <select className={glassInput} value={editingLandingPage.parallaxFooter?.align || 'center'} onChange={e => setEditingLandingPage({...editingLandingPage, parallaxFooter: {...(editingLandingPage.parallaxFooter || {}), align: e.target.value}})}>
                                <option value="left" className="bg-black text-white">Left</option>
                                <option value="center" className="bg-black text-white">Center</option>
                                <option value="right" className="bg-black text-white">Right</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        
                        {/* 360 VIEWER IMAGES */}
                        <div className="bg-[#1a1a1a] p-4 md:p-6 rounded-2xl border border-white/5 relative overflow-hidden group/card mb-8">
                          <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase mb-4">360 Viewer Images</h3>
                          <DragDropImageUploader 
                            currentImage={''}
                            multiple={true}
                            disableCompression={true}
                            onUploadSuccess={(urls) => {
                              const newImages = Array.isArray(urls) ? urls : [urls];
                              setEditingLandingPage({...editingLandingPage, threeSixtyImages: [...(editingLandingPage.threeSixtyImages || []), ...newImages]});
                            }} 
                          />
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            {(editingLandingPage.threeSixtyImages || []).map((img, idx) => (
                              <div key={idx} className="relative group">
                                <img src={img} className="w-full aspect-video object-cover border border-white/20" alt="360" />
                                <button type="button" onClick={() => setEditingLandingPage({...editingLandingPage, threeSixtyImages: editingLandingPage.threeSixtyImages.filter((_, i) => i !== idx)})} className="absolute top-2 right-2 bg-red-500/80 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center">×</button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* FLOATING BUTTONS */}
                        <div className="border-t border-white/5 pt-6 mt-6 mb-6">
                            <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase mb-4">Floating Buttons</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Floating Bubble Text (Top)</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors text-xs" value={editingLandingPage.floatingBubbleText || ''} onChange={e => setEditingLandingPage({...editingLandingPage, floatingBubbleText: e.target.value})} placeholder="e.g. Hurry, Limited Slots Available!" />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Floating Button Text (Bottom)</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors text-xs" value={editingLandingPage.floatingButtonText || ''} onChange={e => setEditingLandingPage({...editingLandingPage, floatingButtonText: e.target.value})} placeholder="e.g. BOOK NOW" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                          <button type="button" onClick={() => setEditingLandingPage(null)} className="px-6 py-3 rounded-xl bg-white/5 text-xs uppercase hover:bg-white/10 transition-colors">Cancel</button>
                          <button type="submit" disabled={isGlobalSubmitting} className="px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold text-xs uppercase shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save Landing Page'}</button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}

                {/* STUDIO TAB */}
                {activeTab === 'studio' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center bg-gradient-to-r from-amber-900/20 to-transparent p-6 rounded-2xl border border-amber-500/20">
                      <div>
                        <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">Studio Page Settings</h2>
                        <p className="text-xs text-amber-300/70 tracking-wide">Manage the dedicated Studio page content, images, videos, maps and 360 view.</p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveStudio} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={glassPanel}>
                          <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4">Basic Info</h3>
                          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Studio Name</label>
                          <input type="text" required className={`${glassInput} mb-4`} value={studioData.name} onChange={e => setStudioData({...studioData, name: e.target.value})} />
                          
                          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Description</label>
                          <textarea rows="3" className={`${glassInput} mb-4`} value={studioData.description} onChange={e => setStudioData({...studioData, description: e.target.value})}></textarea>
                          
                          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2 mt-4">360° Image URL</label>
                          <DragDropImageUploader disableCompression={true} currentImage={studioData.threeSixtyImage} onUploadSuccess={(url) => setStudioData({...studioData, threeSixtyImage: url})} />

                          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Google Map Embed URL / src</label>
                          <input type="text" className={`${glassInput} mb-4`} placeholder="https://www.google.com/maps/embed?pb=..." value={studioData.mapEmbedUrl} onChange={e => setStudioData({...studioData, mapEmbedUrl: e.target.value})} />
                        </div>

                        <div className={glassPanel}>
                          <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4">Hero Images</h3>
                          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Desktop Hero URL</label>
                          <DragDropImageUploader currentImage={studioData.heroImageDesktop} aspect={16/9} onUploadSuccess={(url) => setStudioData({...studioData, heroImageDesktop: url})} />
                          
                          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2 mt-4">Mobile Hero URL</label>
                          <DragDropImageUploader currentImage={studioData.heroImageMobile} aspect={9/16} onUploadSuccess={(url) => setStudioData({...studioData, heroImageMobile: url})} />
                        </div>
                      </div>

                      <div className={glassPanel}>
                        <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4">Studio Image Gallery</h3>
                        <DragDropImageUploader currentImage={''} multiple={true} onUploadSuccess={(urls) => {
                          const newUrls = Array.isArray(urls) ? urls : [urls];
                          setStudioData({...studioData, images: [...(studioData.images || []), ...newUrls]});
                        }} />
                        <div className="flex flex-wrap gap-4 mt-4">
                          {(studioData.images || []).map((img, idx) => (
                            <div key={idx} className="relative group w-32 h-32 rounded overflow-hidden">
                              <img src={img} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => {
                                const newArr = [...(studioData.images || [])];
                                newArr.splice(idx, 1);
                                setStudioData({...studioData, images: newArr});
                              }} className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={glassPanel}>
                        <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4">Studio Video Gallery (YouTube / Cloudinary URLs)</h3>
                        <button type="button" onClick={() => setStudioData({...studioData, videos: [...(studioData.videos || []), '']})} className="px-4 py-2 border border-white/20 text-xs rounded hover:bg-white/10 mb-4 inline-block">+ Add Video</button>
                        <div className="space-y-3">
                          {(studioData.videos || []).map((vid, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input type="text" placeholder="https://youtube.com/..." className={glassInput} value={vid} onChange={e => {
                                const newArr = [...(studioData.videos || [])];
                                newArr[idx] = e.target.value;
                                setStudioData({...studioData, videos: newArr});
                              }} />
                              <button type="button" onClick={() => {
                                const newArr = [...(studioData.videos || [])];
                                newArr.splice(idx, 1);
                                setStudioData({...studioData, videos: newArr});
                              }} className="px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors">×</button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <button type="submit" disabled={isGlobalSubmitting} className="px-8 py-3 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-widest hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          {isGlobalSubmitting ? 'Saving...' : 'Save Studio Settings'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* SERVICES TAB */}
                {activeTab === 'services' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-transparent p-6 rounded-2xl border border-blue-500/20">
                      <div>
                        <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">Service Catalog</h2>
                        <p className="text-xs text-blue-300/70 tracking-wide">Manage your main photography experiences and sub-services.</p>
                      </div>
                      <button onClick={() => setEditingService({ name: '', slug: '', tagline: '', description: '', imageUrl: '', heroImage: '', mobileHeroImage: '', portfolioImages: [], portfolioVideos: [], packages: [], subServices: [] })} className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        + New Service
                      </button>
                    </div>

                    {services.map(svc => (
                      <div key={svc._id} className={`${glassPanel} p-8 hover:border-white/20 transition-all duration-300`}>
                        <div className="flex justify-between items-start mb-4">
                           <div>
                             <h3 className="text-2xl text-white font-oswald tracking-[0.2em] uppercase">{svc.name}</h3>
                             <p className="text-gray-400 text-sm leading-relaxed mt-2 max-w-2xl">{svc.description}</p>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={() => setEditingService(svc)} className="px-4 py-2 rounded-full backdrop-blur-md bg-white/10 border border-white/30 text-white text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">Edit</button>
                             <button onClick={() => handleDeleteService(svc._id)} className="px-4 py-2 rounded-full backdrop-blur-md bg-red-500/80 border border-red-500 text-white text-xs uppercase tracking-widest hover:bg-red-500 transition-all">Delete</button>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                           {(svc.subServices || []).map((sub, i) => (
                             <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl backdrop-blur-sm flex items-center gap-3">
                               {sub.imageUrl && <div className="w-10 h-10 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${sub.imageUrl})` }}></div>}
                               <strong className="text-white block uppercase tracking-wider text-xs">{sub.name}</strong>
                             </div>
                           ))}
                           {(!svc.subServices || svc.subServices.length === 0) && (
                             <p className="text-xs text-gray-500 uppercase tracking-widest">No Sub-Experiences added yet.</p>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* EDIT SERVICE MODAL */}
                {editingService && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
                     <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${glassPanel} p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>
                       <div className="flex justify-between items-start mb-6">
                         <h2 className="text-xl font-oswald text-white uppercase tracking-[0.2em]">Edit Service: {editingService.name}</h2>
                         <button type="button" onClick={() => setEditingService(null)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                       </div>
                       <form onSubmit={(e) => handleSaveService(e, editingService)} className="space-y-8">
                         <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="block text-xs uppercase text-gray-400 mb-2">Service Category Name</label>
                               <input type="text" className={glassInput} value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})} />
                             </div>
                             <div>
                               <label className="block text-xs uppercase text-gray-400 mb-2">Slug</label>
                               <input type="text" className={glassInput} value={editingService.slug} onChange={e => setEditingService({...editingService, slug: e.target.value})} />
                             </div>
                             <div>
                               <label className="block text-xs uppercase text-gray-400 mb-2">Order</label>
                               <input type="number" className={glassInput} value={editingService.order || 0} onChange={e => setEditingService({...editingService, order: Number(e.target.value)})} />
                             </div>
                             <div>
                               <label className="block text-xs uppercase text-gray-400 mb-2">Tagline (for Portfolio Page)</label>
                               <input type="text" className={glassInput} placeholder="e.g. Capturing Moments That Last Forever" value={editingService.tagline || ''} onChange={e => setEditingService({...editingService, tagline: e.target.value})} />
                             </div>
                             <div className="col-span-2 flex gap-6">
                               <label className="flex items-center gap-2 text-xs uppercase text-gray-400 cursor-pointer">
                                 <input type="checkbox" className="w-4 h-4" checked={editingService.slotsActive !== false} onChange={e => setEditingService({...editingService, slotsActive: e.target.checked})} />
                                 Slots Active (Show in Booking)
                               </label>
                               <label className="flex items-center gap-2 text-xs uppercase text-gray-400 cursor-pointer">
                                 <input type="checkbox" className="w-4 h-4" checked={editingService.limitOnePerSession || false} onChange={e => setEditingService({...editingService, limitOnePerSession: e.target.checked})} />
                                 Limit to 1 per session (Exclusive)
                               </label>
                             </div>
                           </div>
                           <div>
                             <label className="block text-xs uppercase text-gray-400 mb-2">Category Description</label>
                             <textarea className={`${glassInput} h-24`} value={editingService.description} onChange={e => setEditingService({...editingService, description: e.target.value})}></textarea>
                           </div>
                           <div className="border-t border-white/5 pt-6 mt-6">
                            <div className="grid lg:grid-cols-3 gap-8">
                              <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Cover Thumbnail</label>
                                <DragDropImageUploader currentImage={editingService.imageUrl} onUploadSuccess={(url) => setEditingService({...editingService, imageUrl: url})} />
                              </div>
                              <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Hero Background</label>
                                <DragDropImageUploader currentImage={editingService.heroImage} aspect={16/9} onUploadSuccess={(url) => setEditingService({...editingService, heroImage: url})} />
                              </div>
                              <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Mobile Hero (Vertical)</label>
                                <DragDropImageUploader currentImage={editingService.mobileHeroImage} aspect={9/16} onUploadSuccess={(url) => setEditingService({...editingService, mobileHeroImage: url})} />
                              </div>
                            </div>
                           </div>
                           </div>

                           <div className="border-t border-white/5 pt-8 mt-8">
                            <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase mb-4">Main Service Portfolio Images</h3>
                            <label className="block text-xs uppercase text-gray-400 mb-2">Add Image</label>
                            <DragDropImageUploader currentImage={''} multiple={true} onUploadSuccess={(urls) => {
                              const newImgs = [...(editingService.portfolioImages || []), ...urls];
                              setEditingService({...editingService, portfolioImages: newImgs});
                              urls.forEach(url => {
                                axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery`, { url, category: editingService.name, type: 'image' }).catch(console.error);
                              });
                            }} />
                            <div className="mt-4 grid grid-cols-4 gap-2">
                              {(editingService.portfolioImages || []).map((img, idx) => (
                                <div 
                                  key={`${img}-${idx}`} 
                                  onClick={(e) => {
                                    if (selectedImageIndices.includes(idx)) {
                                      setSelectedImageIndices(selectedImageIndices.filter(i => i !== idx));
                                    } else {
                                      setSelectedImageIndices([...selectedImageIndices, idx].sort((a,b)=>a-b));
                                    }
                                  }}
                                  draggable 
                                  onDragStart={(e) => {
                                    let indicesToDrag = selectedImageIndices.includes(idx) ? selectedImageIndices : [idx];
                                    e.dataTransfer.setData('application/json', JSON.stringify(indicesToDrag));
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    try {
                                      const data = e.dataTransfer.getData('application/json');
                                      if (!data) return;
                                      const fromIndices = JSON.parse(data);
                                      if (!fromIndices || fromIndices.length === 0) return;
                                      
                                      const newImgs = [...editingService.portfolioImages];
                                      const itemsToMove = fromIndices.map(i => newImgs[i]);
                                      
                                      for (let i = fromIndices.length - 1; i >= 0; i--) {
                                        newImgs.splice(fromIndices[i], 1);
                                      }
                                      
                                      let adjustedToIdx = idx;
                                      let numRemovedBeforeTarget = fromIndices.filter(i => i < idx).length;
                                      adjustedToIdx -= numRemovedBeforeTarget;
                                      
                                      newImgs.splice(adjustedToIdx, 0, ...itemsToMove);
                                      
                                      setEditingService({...editingService, portfolioImages: newImgs});
                                      setSelectedImageIndices([]);
                                    } catch (err) {
                                      const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                                      if (!isNaN(fromIdx) && fromIdx !== idx) {
                                        const newImgs = [...editingService.portfolioImages];
                                        const [movedImg] = newImgs.splice(fromIdx, 1);
                                        newImgs.splice(idx, 0, movedImg);
                                        setEditingService({...editingService, portfolioImages: newImgs});
                                      }
                                    }
                                  }}
                                  className={`relative group cursor-move ${selectedImageIndices.includes(idx) ? 'ring-2 ring-blue-500 rounded' : ''}`}
                                >
                                  <img src={img} className="w-full h-32 object-contain bg-black/40 rounded border border-white/10 pointer-events-none" />
                                  <button type="button" onClick={async (e) => {
                                    e.stopPropagation();
                                    const newImgs = [...editingService.portfolioImages];
                                    const removedUrl = newImgs[idx];
                                    newImgs.splice(idx, 1);
                                    setEditingService({...editingService, portfolioImages: newImgs});
                                    try {
                                      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery`);
                                      const found = res.data.find(i => i.url === removedUrl);
                                      if (found) await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery/${found._id}`);
                                    } catch (err) { console.error(err); }
                                  }} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer">×</button>
                                </div>
                              ))}
                            </div>
                          </div>

                         <div className="border-t border-white/5 pt-8 mt-8">
                           <div className="flex justify-between items-center mb-6">
                             <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase">Sub-Experiences</h3>
                             <button type="button" onClick={() => {
                               const newSub = { name: '', slug: '', tagline: '', description: '', imageUrl: '', heroImage: '', mobileHeroImage: '', portfolioImages: [], portfolioVideos: [], packages: [], landingAbout: { title: '', description: '', imageUrl: '' }, features: [], faqs: [] };
                               setEditingSubService({ index: editingService.subServices?.length || 0, data: newSub });
                             }} className="text-xs uppercase bg-white/10 px-3 py-1 rounded hover:bg-white hover:text-black transition-colors">
                               + Add
                             </button>
                           </div>
                           <div className="grid md:grid-cols-2 gap-4">
                             {(editingService.subServices || []).map((sub, idx) => (
                               <div key={idx} className="bg-black/20 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                                 <div>
                                   <strong className="text-white block text-sm mb-1 uppercase tracking-wider">{sub.name || 'Untitled'}</strong>
                                   <span className="text-xs text-gray-500">{sub.packages?.length || 0} packages</span>
                                 </div>
                                 <div className="flex gap-2">
                                   <button type="button" onClick={() => setEditingSubService({ index: idx, data: {...sub} })} className="text-xs uppercase bg-white/5 px-3 py-1 rounded hover:bg-white/20 transition-colors">Edit</button>
                                   <button type="button" onClick={() => {
                                      const newSubs = [...(editingService.subServices || [])];
                                      newSubs.splice(idx, 1);
                                      setEditingService({...editingService, subServices: newSubs});
                                   }} className="text-xs uppercase bg-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-colors">Remove</button>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>

                         <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                           <button type="button" onClick={() => setEditingService(null)} className="px-6 py-3 rounded-xl bg-white/5 text-xs uppercase hover:bg-white/10 transition-colors">Cancel</button>
                           <button type="submit" disabled={isGlobalSubmitting} className="px-8 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save All Changes'}</button>
                         </div>
                       </form>
                     </motion.div>
                  </div>
                )}

                {/* EDIT SUBSERVICE MODAL (Nested) */}
                {editingSubService && (
                  <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 py-10">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${glassPanel} p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar border-blue-500/30`}>
                      <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-oswald text-white uppercase tracking-[0.2em]">Edit Sub-Experience</h2>
                        <button type="button" onClick={() => setEditingSubService(null)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                      </div>
                      <div className="space-y-6">
                        <div className="grid lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-1">
                            <div className="space-y-6">
                              <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Cover Thumbnail</label>
                                <DragDropImageUploader currentImage={editingSubService.data.imageUrl} onUploadSuccess={(url) => setEditingSubService({...editingSubService, data: {...editingSubService.data, imageUrl: url}})} />
                              </div>
                              <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Hero Background</label>
                                <DragDropImageUploader currentImage={editingSubService.data.heroImage} aspect={16/9} onUploadSuccess={(url) => setEditingSubService({...editingSubService, data: {...editingSubService.data, heroImage: url}})} />
                              </div>
                              <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Mobile Hero (Vertical)</label>
                                <DragDropImageUploader currentImage={editingSubService.data.mobileHeroImage} aspect={9/16} onUploadSuccess={(url) => setEditingSubService({...editingSubService, data: {...editingSubService.data, mobileHeroImage: url}})} />
                              </div>
                            </div>
                          </div>
                          <div className="lg:col-span-2 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Name</label>
                                <input type="text" className={glassInput} value={editingSubService.data.name} onChange={e => setEditingSubService({...editingSubService, data: {...editingSubService.data, name: e.target.value}})} />
                              </div>
                              <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Slug</label>
                                <input type="text" className={glassInput} value={editingSubService.data.slug} onChange={e => setEditingSubService({...editingSubService, data: {...editingSubService.data, slug: e.target.value}})} />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Tagline (for Portfolio Page)</label>
                              <input type="text" className={glassInput} placeholder="e.g. Capturing Moments That Last Forever" value={editingSubService.data.tagline || ''} onChange={e => setEditingSubService({...editingSubService, data: {...editingSubService.data, tagline: e.target.value}})} />
                            </div>
                            <div className="col-span-2">
                              <label className="flex items-center gap-2 text-xs uppercase text-gray-400 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4" checked={editingSubService.data.slotsActive !== false} onChange={e => setEditingSubService({...editingSubService, data: {...editingSubService.data, slotsActive: e.target.checked}})} />
                                Slots Active (Show in Booking)
                              </label>
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Description</label>
                              <textarea className={`${glassInput} h-24`} value={editingSubService.data.description} onChange={e => setEditingSubService({...editingSubService, data: {...editingSubService.data, description: e.target.value}})}></textarea>
                            </div>
                          </div>
                        </div>



                        <div className="border-t border-white/5 pt-6">
                          <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase mb-4">Portfolio Media</h3>
                          <div className="grid md:grid-cols-2 gap-8">
                            <div>
                              <label className="block text-xs uppercase text-gray-400 mb-2">Add Image</label>
                              <DragDropImageUploader currentImage={''} multiple={true} onUploadSuccess={(urls) => {
                                const newImgs = [...(editingSubService.data.portfolioImages || []), ...urls];
                                setEditingSubService({...editingSubService, data: {...editingSubService.data, portfolioImages: newImgs}});
                                // Auto-add to Cinematic Gallery
                                urls.forEach(url => {
                                  axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery`, { url, category: editingService.name, type: 'image' }).catch(console.error);
                                });
                              }} />
                              <div className="mt-4 grid grid-cols-4 gap-2">
                                {(editingSubService.data.portfolioImages || []).map((img, idx) => (
                                  <div 
                                    key={`${img}-${idx}`} 
                                    onClick={(e) => {
                                      if (selectedImageIndices.includes(idx)) {
                                        setSelectedImageIndices(selectedImageIndices.filter(i => i !== idx));
                                      } else {
                                        setSelectedImageIndices([...selectedImageIndices, idx].sort((a,b)=>a-b));
                                      }
                                    }}
                                    draggable 
                                    onDragStart={(e) => {
                                      let indicesToDrag = selectedImageIndices.includes(idx) ? selectedImageIndices : [idx];
                                      e.dataTransfer.setData('application/json', JSON.stringify(indicesToDrag));
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      try {
                                        const data = e.dataTransfer.getData('application/json');
                                        if (!data) return;
                                        const fromIndices = JSON.parse(data);
                                        if (!fromIndices || fromIndices.length === 0) return;
                                        
                                        const newImgs = [...editingSubService.data.portfolioImages];
                                        const itemsToMove = fromIndices.map(i => newImgs[i]);
                                        
                                        for (let i = fromIndices.length - 1; i >= 0; i--) {
                                          newImgs.splice(fromIndices[i], 1);
                                        }
                                        
                                        let adjustedToIdx = idx;
                                        let numRemovedBeforeTarget = fromIndices.filter(i => i < idx).length;
                                        adjustedToIdx -= numRemovedBeforeTarget;
                                        
                                        newImgs.splice(adjustedToIdx, 0, ...itemsToMove);
                                        
                                        setEditingSubService({...editingSubService, data: {...editingSubService.data, portfolioImages: newImgs}});
                                        setSelectedImageIndices([]);
                                      } catch (err) {
                                        const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                                        if (!isNaN(fromIdx) && fromIdx !== idx) {
                                          const newImgs = [...editingSubService.data.portfolioImages];
                                          const [movedImg] = newImgs.splice(fromIdx, 1);
                                          newImgs.splice(idx, 0, movedImg);
                                          setEditingSubService({...editingSubService, data: {...editingSubService.data, portfolioImages: newImgs}});
                                        }
                                      }
                                    }}
                                    className={`relative group cursor-move ${selectedImageIndices.includes(idx) ? 'ring-2 ring-blue-500 rounded' : ''}`}
                                  >
                                    <img src={img} className="w-full h-32 object-contain bg-black/40 rounded border border-white/10 pointer-events-none" />
                                    <button type="button" onClick={async (e) => {
                                      e.stopPropagation();
                                      const newImgs = [...editingSubService.data.portfolioImages];
                                      const removedUrl = newImgs[idx];
                                      newImgs.splice(idx, 1);
                                      setEditingSubService({...editingSubService, data: {...editingSubService.data, portfolioImages: newImgs}});
                                      try {
                                        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery`);
                                        const found = res.data.find(img => img.url === removedUrl);
                                        if (found) await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery/${found._id}`);
                                      } catch (err) { console.error(err); }
                                    }} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer">×</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs uppercase text-gray-400">YouTube Links</label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="form-checkbox text-blue-500 rounded bg-black border-white/20" checked={editingSubService.data.showVideoGallery !== false} onChange={e => setEditingSubService({...editingSubService, data: {...editingSubService.data, showVideoGallery: e.target.checked}})} />
                                  <span className="text-[11px] uppercase text-gray-400 tracking-widest">Show Gallery</span>
                                </label>
                                <button type="button" onClick={() => {
                                  const newVids = [...(editingSubService.data.portfolioVideos || []), ''];
                                  setEditingSubService({...editingSubService, data: {...editingSubService.data, portfolioVideos: newVids}});
                                }} className="text-[11px] uppercase text-blue-400">+ Add Link</button>
                              </div>
                              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                {(editingSubService.data.portfolioVideos || []).map((vid, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <input type="text" className={glassInput} placeholder="https://youtube.com/..." value={vid} onChange={e => {
                                      const newVids = [...editingSubService.data.portfolioVideos];
                                      newVids[idx] = e.target.value;
                                      setEditingSubService({...editingSubService, data: {...editingSubService.data, portfolioVideos: newVids}});
                                    }} />
                                    <button type="button" onClick={() => {
                                      const newVids = [...editingSubService.data.portfolioVideos];
                                      newVids.splice(idx, 1);
                                      setEditingSubService({...editingSubService, data: {...editingSubService.data, portfolioVideos: newVids}});
                                    }} className="bg-red-500/20 text-red-400 px-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors">×</button>
                                  </div>
                                ))}
                                {(!editingSubService.data.portfolioVideos || editingSubService.data.portfolioVideos.length === 0) && (
                                  <p className="text-xs text-gray-600">No videos added yet.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm text-gray-400 font-sans tracking-[0.2em] uppercase">Packages</h3>
                            <button type="button" onClick={() => {
                              const newPkgs = [...(editingSubService.data.packages || []), { name: '', price: '', features: [] }];
                              setEditingSubService({...editingSubService, data: {...editingSubService.data, packages: newPkgs}});
                            }} className="text-xs uppercase bg-white/10 px-3 py-1 rounded hover:bg-white hover:text-black transition-colors">
                              + Add Tier
                            </button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {(editingSubService.data.packages || []).map((pkg, idx) => (
                              <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 relative">
                                <button type="button" onClick={() => {
                                  const newPkgs = [...editingSubService.data.packages];
                                  newPkgs.splice(idx, 1);
                                  setEditingSubService({...editingSubService, data: {...editingSubService.data, packages: newPkgs}});
                                }} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs uppercase">Remove</button>
                                <div className="absolute top-2 right-16 flex gap-2">
                                  <button type="button" onClick={() => {
                                    if(idx > 0) {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      [newSlides[idx-1], newSlides[idx]] = [newSlides[idx], newSlides[idx-1]];
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }
                                  }} className="text-gray-400 hover:text-white text-xs">↑</button>
                                  <button type="button" onClick={() => {
                                    if(idx < editingLandingPage.heroSlides.length - 1) {
                                      const newSlides = [...editingLandingPage.heroSlides];
                                      [newSlides[idx+1], newSlides[idx]] = [newSlides[idx], newSlides[idx+1]];
                                      setEditingLandingPage({...editingLandingPage, heroSlides: newSlides});
                                    }
                                  }} className="text-gray-400 hover:text-white text-xs">↓</button>
                                </div>
  
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div>
                                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">Name</label>
                                    <input type="text" className={glassInput + ' py-2 text-xs'} value={pkg.name} onChange={e => {
                                      const newPkgs = [...editingSubService.data.packages];
                                      newPkgs[idx].name = e.target.value;
                                      setEditingSubService({...editingSubService, data: {...editingSubService.data, packages: newPkgs}});
                                    }} />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">Price</label>
                                    <input type="text" className={glassInput + ' py-2 text-xs'} value={pkg.price} onChange={e => {
                                      const newPkgs = [...editingSubService.data.packages];
                                      newPkgs[idx].price = e.target.value;
                                      setEditingSubService({...editingSubService, data: {...editingSubService.data, packages: newPkgs}});
                                    }} />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase">Features (one per line)</label>
                                  <textarea className={`${glassInput} h-16 text-xs`} value={(pkg.features || []).join('\n')} onChange={e => {
                                    const newPkgs = [...editingSubService.data.packages];
                                    newPkgs[idx].features = e.target.value.split('\n');
                                    setEditingSubService({...editingSubService, data: {...editingSubService.data, packages: newPkgs}});
                                  }}></textarea>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                          <button type="button" onClick={() => setEditingSubService(null)} className="px-6 py-3 rounded-xl bg-white/5 text-xs uppercase hover:bg-white/10 transition-colors">Discard</button>
                          <button type="button" onClick={() => {
                            const newSubs = [...(editingService.subServices || [])];
                            newSubs[editingSubService.index] = editingSubService.data;
                            setEditingService({...editingService, subServices: newSubs});
                            setEditingSubService(null);
                          }} className="px-6 py-3 rounded-xl bg-blue-500 text-white font-bold text-xs uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105 transition-all">Save Sub-Experience</button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* THEMES TAB */}
                {activeTab === 'themes' && (
                  <div className="space-y-8">
                    {!selectedThemeCategory ? (
                      <>
                        <div className="flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-transparent p-6 rounded-2xl border border-purple-500/20">
                          <div>
                            <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">Theme Catalog</h2>
                            <p className="text-xs text-purple-300/70 tracking-wide">Manage your category folders and their cover images.</p>
                          </div>
                          <button onClick={() => setEditingThemeCategory({ name: '', coverImage: '' })} className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                            + Add Category
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {themeCategories.map(cat => {
                            const count = themes.filter(t => t.category === cat.name).length;
                            return (
                              <div key={cat._id} className={`${glassPanel} overflow-hidden group relative h-[200px]`}>
                                <img src={cat.coverImage} alt={cat.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 cursor-pointer" onClick={() => setSelectedThemeCategory(cat.name)} />
                                <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none">
                                  <h3 className="text-xl text-white font-oswald uppercase tracking-widest">{cat.name}</h3>
                                  <span className="mt-1 text-[11px] text-purple-400 font-sans tracking-widest uppercase">{count} Themes</span>
                                </div>
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0">
                                  <button onClick={() => setEditingThemeCategory(cat)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 shadow-lg">✎</button>
                                  <button onClick={() => handleDeleteThemeCategory(cat._id)} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 shadow-lg">×</button>
                                </div>
                              </div>
                            );
                          })}
                          {themeCategories.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-500 uppercase tracking-widest">
                              No categories found. Click "+ Add Category" to create one!
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setSelectedThemeCategory(null)} className="font-sans text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                          ← Back to Categories
                        </button>
                        <div className="flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-transparent p-6 rounded-2xl border border-purple-500/20 mt-4">
                          <div>
                            <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">{selectedThemeCategory} Themes</h2>
                            <p className="text-xs text-purple-300/70 tracking-wide">Manage themes inside this folder.</p>
                          </div>
                          <button onClick={() => setEditingTheme({ name: '', category: selectedThemeCategory, age: '', costume: '', image: '' })} className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                            + New Theme
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {themes.filter(t => t.category === selectedThemeCategory).map(theme => (
                            <div key={theme._id} className={`${glassPanel} overflow-hidden group relative h-72 cursor-pointer`}>
                              <img src={theme.image} alt={theme.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700" />
                              <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent border-t border-white/5">
                                 <span className="text-[11px] text-purple-400 uppercase tracking-widest mb-1">{theme.category}</span>
                                 <h3 className="text-xl text-white font-oswald uppercase tracking-[0.2em] leading-tight">{theme.name}</h3>
                              </div>
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0">
                                <button onClick={() => setEditingTheme(theme)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 shadow-lg">✎</button>
                                <button onClick={() => handleDeleteTheme(theme._id)} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 shadow-lg">×</button>
                              </div>
                            </div>
                          ))}
                          {themes.filter(t => t.category === selectedThemeCategory).length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-500 uppercase tracking-widest">
                              No themes uploaded to {selectedThemeCategory} yet. Click "+ New Theme" to add one!
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* EDIT THEME CATEGORY MODAL */}
                {editingThemeCategory && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${glassPanel} p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>
                       <h2 className="text-xl font-oswald text-white mb-6 uppercase tracking-widest">{editingThemeCategory._id ? 'Edit Category' : 'Create Category'}</h2>
                       <form onSubmit={(e) => handleSaveThemeCategory(e, editingThemeCategory)} className="space-y-6">
                         
                         <div>
                           <label className="block text-xs uppercase text-gray-400 mb-2">Category Cover Image</label>
                           <DragDropImageUploader currentImage={editingThemeCategory.coverImage} onUploadSuccess={(url) => setEditingThemeCategory({...editingThemeCategory, coverImage: url})} />
                         </div>

                         <div>
                           <label className="block text-xs uppercase text-gray-400 mb-2">Category Name</label>
                           <input type="text" className={glassInput} value={editingThemeCategory.name} onChange={e => setEditingThemeCategory({...editingThemeCategory, name: e.target.value})} required placeholder="e.g. Maternity Stories" />
                         </div>
                         
                         <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                           <button type="button" onClick={() => setEditingThemeCategory(null)} className="px-6 py-3 rounded-xl bg-white/5 text-xs uppercase hover:bg-white/10 transition-colors">Cancel</button>
                           <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-purple-500 text-white font-bold text-xs uppercase hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save Category'}</button>
                         </div>
                       </form>
                     </motion.div>
                  </div>
                )}

                {/* EDIT THEME MODAL */}
                {editingTheme && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${glassPanel} p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>
                       <h2 className="text-xl font-oswald text-white mb-6 uppercase tracking-widest">{editingTheme._id ? 'Edit Theme' : 'Create Theme'}</h2>
                       <form onSubmit={(e) => handleSaveTheme(e, editingTheme)} className="space-y-6">
                         
                         <div>
                           <label className="block text-xs uppercase text-gray-400 mb-2">Theme Backdrop</label>
                           <DragDropImageUploader currentImage={editingTheme.image} onUploadSuccess={(url) => setEditingTheme({...editingTheme, image: url})} />
                         </div>

                         <div>
                           <label className="block text-xs uppercase text-gray-400 mb-2">Theme Name</label>
                           <input type="text" className={glassInput} value={editingTheme.name} onChange={e => setEditingTheme({...editingTheme, name: e.target.value})} required />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-xs uppercase text-gray-400 mb-2">Category</label>
                             <select className={glassInput} value={editingTheme.category} onChange={e => setEditingTheme({...editingTheme, category: e.target.value})}>
                                {themeCategories.map(cat => (
                                  <option key={cat._id} className="bg-black text-white" value={cat.name}>{cat.name}</option>
                                ))}
                             </select>
                           </div>
                           <div>
                             <label className="block text-xs uppercase text-gray-400 mb-2">Age Range</label>
                             <input type="text" className={glassInput} value={editingTheme.age} onChange={e => setEditingTheme({...editingTheme, age: e.target.value})} placeholder="e.g. 6-12 Months" required />
                           </div>
                         </div>
                         <div>
                           <label className="block text-xs uppercase text-gray-400 mb-2">Costume Included</label>
                           <input type="text" className={glassInput} value={editingTheme.costume} onChange={e => setEditingTheme({...editingTheme, costume: e.target.value})} placeholder="e.g. Floral Gown" required />
                         </div>
                         
                         <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                           <button type="button" onClick={() => setEditingTheme(null)} className="px-6 py-3 rounded-xl bg-white/5 text-xs uppercase hover:bg-white/10 transition-colors">Cancel</button>
                           <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-purple-500 text-white font-bold text-xs uppercase hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save Theme'}</button>
                         </div>
                       </form>
                     </motion.div>
                  </div>
                )}

                {/* GALLERY TAB */}
                {activeTab === 'gallery' && (
                  <div className="space-y-8">
                    <div className={`${glassPanel} p-8 border border-white/10`}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                        <div>
                          <h3 className="text-xl font-oswald text-white uppercase tracking-widest mb-2">Upload to Portfolio</h3>
                          <p className="text-xs text-gray-400 tracking-wide font-sans">Select a category before dropping an image.</p>
                        </div>
                        <div className="w-full md:w-64">
                          <label className="flex items-center justify-between text-[11px] uppercase text-gray-500 mb-1">
                            <span>Image Category</span>
                            <button onClick={handleAddGalleryCategory} className="text-blue-400 hover:text-white transition-colors">+ Add New</button>
                          </label>
                          <div className="flex items-center gap-2">
                            <select 
                              className={glassInput}
                              value={galleryCategory}
                              onChange={(e) => setGalleryCategory(e.target.value)}
                            >
                              {Array.from(new Set([
                                ...services.map(s => s.name),
                                ...services.flatMap(s => (s.subServices || []).map(sub => sub.name)),
                                ...galleryCategoriesData.map(c => c.name)
                              ])).map((catName, idx) => (
                                <option key={idx} className="bg-black text-white" value={catName}>{catName}</option>
                              ))}
                            </select>
                            {galleryCategoriesData.find(c => c.name === galleryCategory) && (
                              <button 
                                onClick={() => handleDeleteGalleryCategory(galleryCategoriesData.find(c => c.name === galleryCategory)._id)}
                                className="w-10 h-10 shrink-0 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center font-bold"
                                title="Delete this custom category"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-6 flex gap-2">
                        <button 
                          onClick={() => setGalleryMediaType('image')}
                          className={`px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold transition-all ${galleryMediaType === 'image' ? 'bg-white text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                        >
                          Images
                        </button>
                        <button 
                          onClick={() => setGalleryMediaType('video')}
                          className={`px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold transition-all ${galleryMediaType === 'video' ? 'bg-white text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                        >
                          YouTube Videos
                        </button>
                      </div>

                      {galleryMediaType === 'image' ? (
                        <DragDropImageUploader multiple={true} onUploadSuccess={handleUploadGalleryImage} />
                      ) : (
                        <form onSubmit={handleUploadGalleryVideo} className="flex gap-4">
                          <input 
                            type="url" 
                            required
                            placeholder="Paste YouTube Video URL here..." 
                            className={`${glassInput} flex-1`}
                            value={youtubeLink}
                            onChange={(e) => setYoutubeLink(e.target.value)}
                          />
                          <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                            Add Video
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {gallery
                        .filter(img => galleryMediaType === 'video' ? img.type === 'video' : img.type !== 'video')
                        .map(img => {
                        const getYouTubeId = (url) => {
                          if(!url) return null;
                          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                          const match = url.match(regExp);
                          return (match && match[2].length === 11) ? match[2] : null;
                        };
                        const ytId = img.type === 'video' ? getYouTubeId(img.url) : null;
                        
                        return (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={img._id} className="relative group aspect-square rounded-xl overflow-hidden shadow-xl border border-white/10">
                          {img.type === 'video' ? (
                            <div className="w-full h-full relative">
                              <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="Video Thumbnail" className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-40 transition-all duration-700" />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img src={img.url} alt="Gallery" className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-40 transition-all duration-700" />
                          )}
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] text-white uppercase tracking-widest border border-white/10">
                            {img.category}
                          </div>
                          <div className="absolute top-3 right-3 z-10">
                             <button onClick={() => handleToggleFeaturedGalleryImage(img)} title={img.isFeatured ? "Unfeature from homepage" : "Feature on homepage"} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm backdrop-blur-md transition-all ${img.isFeatured ? 'bg-yellow-500/90 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-black/60 text-gray-400 border border-white/10 hover:bg-white/20'}`}>
                               ★
                             </button>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button onClick={() => handleDeleteGalleryImage(img._id)} className="px-4 py-2 rounded-full bg-red-600/90 hover:bg-red-500 text-white uppercase tracking-widest text-[11px] font-bold backdrop-blur-md transition-colors">Delete</button>
                          </div>
                        </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* BOOKINGS TABS */}
                {activeTab === 'studio bookings' && !showSubscriptionsView && (
                  <div className="space-y-6">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gradient-to-r from-green-900/20 to-transparent p-6 rounded-2xl border border-green-500/20">
                      <div>
                        <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">Bookings Management</h2>
                        <p className="text-xs text-green-300/70 tracking-wide">Review and update client bookings.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 xl:gap-4 w-full xl:w-auto">
                        <input 
                          type="text" 
                          placeholder="Search name, phone, email..."
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none w-full sm:w-auto"
                          value={bookingSearchText}
                          onChange={(e) => setBookingSearchText(e.target.value)}
                        />
                        <select 
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
                          value={bookingStatusFilter}
                          onChange={(e) => setBookingStatusFilter(e.target.value)}
                        >
                          <option value="All Bookings">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Shoot Done">Shoot Done</option>
                          <option value="Editing In Process">Editing In Process</option>
                          <option value="Finished">Finished</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <input 
                          type="month" 
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-[10] w-full sm:w-auto"
                          value={bookingMonthFilter}
                          onChange={(e) => setBookingMonthFilter(e.target.value)}
                        />
                        <button 
                          onClick={() => setShowSubscriptionsView(true)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs uppercase font-bold tracking-widest rounded-lg transition-colors w-full sm:w-auto"
                        >
                          Subscriptions
                        </button>
                        <button 
                          onClick={() => setBookingStudio(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs uppercase font-bold tracking-widest rounded-lg transition-colors w-full sm:w-auto"
                        >
                          + Studio
                        </button>
                        <button 
                          onClick={() => setEditingBooking({})}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs uppercase font-bold tracking-widest rounded-lg transition-colors w-full sm:w-auto"
                        >
                          + Booking
                        </button>
                      </div>
                    </div>

                    {(() => {
                      // Whenever status updated to confirmed in leads or inquiries, display in studio bookings
                      const confirmedLeadBookings = leads
                        .filter(l => l.status && l.status.toLowerCase() === 'confirmed')
                        .filter(l => !bookings.some(b => (b.email && l.email && b.email.toLowerCase() === l.email.toLowerCase()) || (b.notes && b.notes.includes(l._id))))
                        .map(l => ({
                          _id: 'lead-' + l._id,
                          name: l.name,
                          email: l.email,
                          phone: l.phone,
                          package: 'Standard Package',
                          shootType: l.interestedIn || 'General Shoot',
                          date: l.eventDate ? new Date(l.eventDate).toISOString().split('T')[0] : (l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                          createdAt: l.createdAt,
                          slot: 'Morning',
                          status: 'Confirmed',
                          fromLead: true,
                          notes: `Confirmed Lead (${l.landingPageSource || 'Landing Page'})`
                        }));

                      const confirmedInquiryBookings = inquiries
                        .filter(i => i.status && ['confirmed', 'converted'].includes(i.status.toLowerCase()))
                        .filter(i => !bookings.some(b => (b.email && i.email && b.email.toLowerCase() === i.email.toLowerCase()) || (b.notes && b.notes.includes(i._id))))
                        .map(i => ({
                          _id: 'inquiry-' + i._id,
                          name: i.name,
                          email: i.email,
                          phone: i.phone,
                          package: 'Standard Package',
                          shootType: i.subject || 'General Shoot',
                          date: i.createdAt ? new Date(i.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                          createdAt: i.createdAt,
                          slot: 'Morning',
                          status: 'Confirmed',
                          fromInquiry: true,
                          notes: `Confirmed Inquiry (${i.subject})`
                        }));

                      const allStudioBookings = [...bookings, ...confirmedLeadBookings, ...confirmedInquiryBookings];

                      const filteredStudioBookings = allStudioBookings.filter(b => {
                        const matchesMonth = bookingMonthFilter ? (b.date && b.date.startsWith(bookingMonthFilter)) : true;
                        const matchesStatus = bookingStatusFilter === 'All Bookings' || (b.status && b.status.toLowerCase() === bookingStatusFilter.toLowerCase());
                        const matchesSearch = bookingSearchText.trim() === '' || 
                          [b.name, b.phone, b.email].some(val => val && String(val).toLowerCase().includes(bookingSearchText.toLowerCase()));
                        return matchesMonth && matchesStatus && matchesSearch;
                      });

                      if (filteredStudioBookings.length === 0) {
                        return <div className="text-center py-20 text-gray-500 uppercase tracking-widest">No bookings found for the selected filters.</div>;
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredStudioBookings.map(booking => (
                            <div key={booking._id} id={`booking-${booking._id}`} className={viewingDetailsBookingId === booking._id ? "" : `${glassPanel} p-6 flex flex-col relative transition-all duration-500 ${highlightedBookingId === booking._id ? 'border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02] bg-emerald-900/10' : ''}`}>
                              {viewingDetailsBookingId !== booking._id ? (
                                <div className="flex flex-col h-full">
                                  <div className="flex justify-between items-start mb-4 pr-2">
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                        {booking.bookingType === 'Studio' && (
                                          <span className="inline-block bg-blue-600/20 text-blue-400 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest border border-blue-500/20">Studio Booking</span>
                                        )}
                                        {booking.isSubscription && (
                                          <span className="inline-block bg-purple-600/20 text-purple-400 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest border border-purple-500/20">Subscription</span>
                                        )}
                                        {booking.fromLead && (
                                          <span className="inline-block bg-cyan-600/20 text-cyan-400 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest border border-cyan-500/20">Lead Converted</span>
                                        )}
                                        {booking.fromInquiry && (
                                          <span className="inline-block bg-amber-600/20 text-amber-400 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest border border-amber-500/20">Inquiry Converted</span>
                                        )}
                                      </div>
                                      <h3 className="text-xl text-white font-oswald uppercase tracking-widest">{booking.name}</h3>
                                      <p className="text-xs text-gray-400 font-sans">{booking.phone}</p>
                                      <p className="text-xs text-gray-400 font-sans">{booking.email}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider shrink-0 border ${getStatusBadgeClass(booking.status)}`}>
                                      {booking.status || 'Pending'}
                                    </span>
                                  </div>
                                  <div className="bg-black/30 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs mb-4 border border-white/5 flex-1">
                                    <div className="col-span-2"><span className="text-gray-500 uppercase text-[9px] block">Event / Shoot Name</span><span className="text-white font-bold tracking-wider">{(() => {
                                      if (booking.bookingType === 'Studio') return booking.studioName;
                                      const parentService = services.find(s => s.subServices && s.subServices.some(sub => sub.name === booking.shootType));
                                      return parentService ? `${parentService.name} - ${booking.shootType}` : booking.shootType;
                                    })()}</span></div>
                                    <div><span className="text-gray-500 uppercase text-[9px] block">Package</span><span className="text-white">{booking.package}</span></div>
                                    <div><span className="text-gray-500 uppercase text-[9px] block">Shoot Date</span><span className="text-emerald-400">{booking.date}</span></div>
                                    <div><span className="text-gray-500 uppercase text-[9px] block">Booking Date</span><span className="text-white">{new Date(booking.createdAt || booking.date).toLocaleDateString()}</span></div>
                                    <div><span className="text-gray-500 uppercase text-[9px] block">Slot</span><span className="text-emerald-400">{booking.slots && booking.slots.length > 0 ? booking.slots.join(', ') : booking.slot}</span></div>
                                    <div className="col-span-2 pt-2 flex justify-between">
                                      <div>
                                        <span className="text-gray-500 uppercase text-[9px] block">Pending Amount</span>
                                        <span className="text-amber-500 font-bold">₹{((booking.totalAmount || 0) - ((booking.payments && booking.payments.length > 0) ? booking.payments.reduce((sum, p) => sum + p.amount, 0) : (booking.advanceAmount || 0))).toLocaleString()}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-gray-500 uppercase text-[9px] block">Total Amount</span>
                                        <span className="text-white font-bold">₹{(booking.totalAmount || 0).toLocaleString()}</span>
                                      </div>
                                    </div>
                                    <div className="col-span-2 pt-1 border-t border-white/5 flex justify-between items-center">
                                      <span className="text-gray-500 uppercase text-[9px]">Status</span>
                                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                        (booking.status || '').toLowerCase() === 'confirmed' ? 'text-emerald-400' :
                                        (booking.status || '').toLowerCase() === 'shoot done' ? 'text-purple-400' :
                                        (booking.status || '').toLowerCase() === 'editing in process' ? 'text-cyan-400' :
                                        (booking.status || '').toLowerCase() === 'finished' ? 'text-teal-400' :
                                        (booking.status || '').toLowerCase() === 'contacted' ? 'text-blue-400' :
                                        (booking.status || '').toLowerCase() === 'cancelled' ? 'text-rose-400' :
                                        'text-amber-400'
                                      }`}>{booking.status || 'Pending'}</span>
                                    </div>
                                  </div>

                                  {booking.followUps && booking.followUps.filter(n => n.isPinned).length > 0 && (
                                    <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 flex flex-col gap-1 w-full mt-2">
                                      {booking.followUps.filter(n => n.isPinned).map(n => (
                                        <div key={n._id} className="flex gap-2 items-start leading-tight">
                                          <span className="shrink-0 mt-0.5">📌</span>
                                          <span>{n.note}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <button 
                                    onClick={() => setViewingDetailsBookingId(booking._id)}
                                    className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg text-xs uppercase tracking-widest transition-colors border border-emerald-500/20 font-bold mt-auto"
                                  >
                                    View Details
                                  </button>
                                </div>
                              ) : (
                              <div className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto flex justify-center items-start p-4 backdrop-blur-md">
                                <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative shadow-2xl mt-4 sm:mt-10 mb-10 animate-fade-in">
                                  <div className="sticky top-0 z-50 flex justify-end -mt-2 -mr-2 mb-2">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setViewingDetailsBookingId(null); }} className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-full shadow-lg border border-white/10">✕</button>
                                  </div>
                                  <div className="absolute top-4 right-16 flex gap-2 z-10">
                              <button 
                                onClick={() => { setActiveTab('business'); setHighlightedBookingId(booking._id); }}
                                className="text-[11px] text-emerald-400/70 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20 transition-colors"
                                title="View in Business Overview"
                              >
                                Overview 👁
                              </button>
                              <button 
                                onClick={() => setEditingBooking(booking)}
                                className="text-[11px] text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-1 bg-black/40 px-2 py-1 rounded transition-colors"
                              >
                                Edit ✏️
                              </button>
                            </div>
                            <div className="flex justify-between items-start mb-4 pr-16">
                              <div>
                                {booking.bookingType === 'Studio' && (
                                  <span className="inline-block bg-blue-600/20 text-blue-400 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest mb-1 border border-blue-500/20">Studio Booking</span>
                                )}
                                {booking.isSubscription && (
                                  <span className="inline-block bg-purple-600/20 text-purple-400 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest mb-1 border border-purple-500/20">Subscription</span>
                                )}
                                <h3 className="text-xl text-white font-oswald uppercase tracking-widest">{booking.name}</h3>
                                <p className="text-xs text-gray-400 font-sans">{booking.phone}</p>
                                <p className="text-xs text-gray-400 font-sans">{booking.email}</p>
                              </div>
                            </div>
                            
                            <div className="bg-black/30 rounded-lg p-3 space-y-2 mb-4 flex-1 border border-white/5">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="block text-[9px] text-gray-500 uppercase">Shoot</span>
                                  <span className="text-xs text-white">{(() => {
                                    if (booking.bookingType === 'Studio') return booking.studioName;
                                    const parentService = services.find(s => s.subServices && s.subServices.some(sub => sub.name === booking.shootType));
                                    return parentService ? `${parentService.name} - ${booking.shootType}` : booking.shootType;
                                  })()}</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-gray-500 uppercase">Package</span>
                                  <span className="text-xs text-white">{booking.package}</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-gray-500 uppercase">Date</span>
                                  <span className="text-xs text-emerald-400">{booking.date}</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-gray-500 uppercase">Slot</span>
                                  <span className="text-xs text-emerald-400">{booking.slots && booking.slots.length > 0 ? booking.slots.join(', ') : booking.slot}</span>
                                </div>
                                {booking.babyAge && (
                                  <div className="col-span-2">
                                    <span className="block text-[9px] text-gray-500 uppercase">Baby Age</span>
                                    <span className="text-xs text-white">{booking.babyAge}</span>
                                  </div>
                                )}
                              </div>
                              {booking.notes && <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-white/5 italic">"{booking.notes}"</p>}
                              
                              {booking.slotHistory && booking.slotHistory.length > 0 && (
                                <div className="mt-4 border-t border-white/5 pt-3">
                                  <span className="block text-xs uppercase text-white mb-2">Slot History</span>
                                  <div className="space-y-1">
                                    {booking.slotHistory.map((history, idx) => (
                                      <div key={idx} className="text-[11px] text-gray-400 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                        <div><span className="text-gray-500">{history.oldDate} ({history.oldSlot})</span> ➔ <span className="text-white">{history.newDate} ({history.newSlot})</span></div>
                                        <div className="text-[9px] text-gray-600 sm:ml-auto">{new Date(history.changedAt).toLocaleString()}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Add-ons */}
                            <div className="mb-4 bg-black/40 border border-white/5 rounded-xl p-4">
                              <h4 className="font-oswald text-base text-white uppercase tracking-widest mb-3">Add-ons</h4>
                              
                              {booking.addOns && booking.addOns.length > 0 && (
                                <div className="space-y-2 mb-4">
                                  {booking.addOns.map((addon, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-black/50 p-2 rounded text-xs text-gray-300">
                                      <span>{addon.name}</span>
                                      <div className="flex items-center gap-3">
                                        <span>₹{addon.price}</span>
                                        <button type="button" onClick={() => handleDeleteBookingAddOn(booking._id, addon._id)} className="text-red-500 hover:text-red-400">✕</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <form onSubmit={(e) => handleAddBookingAddOn(booking._id, e)} className="flex items-end gap-2">
                                <div className="flex-1">
                                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Add-on Name</label>
                                  <input type="text" name="addOnName" required className={`${glassInput} w-full py-1.5 px-2 text-xs`} />
                                </div>
                                <div className="w-24">
                                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Price</label>
                                  <input type="number" name="addOnPrice" required className={`${glassInput} w-full py-1.5 px-2 text-xs`} />
                                </div>
                                <button type="submit" className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors shrink-0">Add</button>
                              </form>
                            </div>

                            {/* Payment Tracking */}
                            <div className="mb-4 bg-black/40 border border-white/5 rounded-xl p-4">
                              <h4 className="font-oswald text-base text-white uppercase tracking-widest mb-3">Payment Tracking</h4>
                              
                              {booking.payments && booking.payments.length > 0 && (
                                <div className="mb-4">
                                  <h5 className="text-xs uppercase text-gray-400 mb-2">Installments</h5>
                                  <div className="space-y-2">
                                    {booking.payments.map((p, idx) => (
                                      <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-black/50 p-2 rounded text-xs text-gray-300">
                                        <span className="text-sm">{new Date(p.date).toLocaleDateString()} - {p.method} {p.method === 'UPI' && p.utrNumber ? `(UTR: ${p.utrNumber})` : ''}</span>
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm">₹{p.amount} (Rcvd by: {teamMembers.find(tm => tm._id === p.receivedBy)?.name || 'Unknown'})</span>
                                          <button type="button" onClick={() => handleDeleteInstallment(booking._id, p._id)} className="text-red-500 hover:text-red-400 text-sm" title="Delete Installment">✕</button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <form onSubmit={(e) => handleUpdatePayment(booking._id, e)} className="grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-4">
                                  <label className="block text-xs uppercase text-white mb-1">Total Amount</label>
                                  <input type="number" name="totalAmount" defaultValue={booking.totalAmount || 0} className={`${glassInput} w-full py-1.5 px-2 text-sm`} />
                                </div>
                                <div className="col-span-4">
                                  <label className="block text-xs uppercase text-white mb-1">Paid So Far</label>
                                  <input type="number" name="advanceAmount" value={(booking.payments && booking.payments.length > 0) ? booking.payments.reduce((sum, p) => sum + p.amount, 0) : (booking.advanceAmount || 0)} readOnly={(booking.payments && booking.payments.length > 0)} className={`${glassInput} w-full py-1.5 px-2 text-sm text-green-400 font-bold ${booking.payments && booking.payments.length > 0 ? 'cursor-not-allowed opacity-70' : ''}`} />
                                </div>
                                <div className="col-span-4">
                                  <label className="block text-xs uppercase text-white mb-1">Pending</label>
                                  <input type="number" name="pendingAmount" value={(booking.totalAmount || 0) - ((booking.payments && booking.payments.length > 0) ? booking.payments.reduce((sum, p) => sum + p.amount, 0) : (booking.advanceAmount || 0))} readOnly className={`${glassInput} w-full py-1.5 px-2 text-sm text-red-400 font-bold cursor-not-allowed opacity-70`} />
                                </div>
                                
                                <div className="col-span-12 border-t border-white/10 my-2 pt-4">
                                  <h5 className="text-xs uppercase text-gray-400 mb-3 font-bold">Add Installment</h5>
                                </div>
                                <div className="col-span-6">
                                  <label className="block text-xs uppercase text-white mb-1">Amount</label>
                                  <input type="number" name="newPaymentAmount" placeholder="Amount" className={`${glassInput} w-full py-2 px-2 text-sm`} />
                                </div>
                                <div className="col-span-6">
                                  <label className="block text-xs uppercase text-white mb-1">Method</label>
                                  <select name="newPaymentMethod" id="newPaymentMethod" className={`${glassInput} w-full py-2 px-2 text-sm`} onChange={(e) => {
                                    const utrContainer = e.target.closest('form').querySelector('.utr-container');
                                    if(e.target.value === 'UPI') utrContainer.classList.remove('hidden');
                                    else utrContainer.classList.add('hidden');
                                    
                                    const studioQrOption = e.target.closest('form').querySelector('.studio-qr-option');
                                    if(studioQrOption) {
                                      if(e.target.value === 'UPI') studioQrOption.classList.remove('hidden');
                                      else {
                                        studioQrOption.classList.add('hidden');
                                        const receivedBySelect = e.target.closest('form').querySelector('[name="newPaymentReceivedBy"]');
                                        if(receivedBySelect.value === 'Studio QR') receivedBySelect.value = '';
                                      }
                                    }
                                  }}>
                                    <option value="Cash" className="bg-[#111]">Cash</option>
                                    <option value="UPI" className="bg-[#111]">UPI</option>
                                  </select>
                                </div>
                                <div className="col-span-6 utr-container hidden">
                                  <label className="block text-xs uppercase text-white mb-1">UTR Number (Optional)</label>
                                  <input type="text" name="newPaymentUTR" placeholder="UTR Number (Optional)" className={`${glassInput} w-full py-2 px-2 text-sm`} />
                                </div>
                                <div className="col-span-6">
                                  <label className="block text-xs uppercase text-white mb-1">Received By</label>
                                  <select name="newPaymentReceivedBy" className={`${glassInput} w-full py-2 px-2 text-sm`}>
                                    <option value="" className="bg-[#111]">Select Member</option>
                                    <option value="Studio QR" className="bg-[#111] studio-qr-option hidden">Studio QR</option>
                                    {teamMembers.map(tm => (
                                      <option key={tm._id} value={tm._id} className="bg-[#111] text-white">{tm.name}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div className="col-span-12 mt-4">
                                  <button type="submit" disabled={isGlobalSubmitting} className="w-full py-3 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded text-xs uppercase tracking-widest transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Updating...' : 'Update Payment'}</button>
                                </div>
                              </form>
                            </div>

                            <div className="mb-4 grid grid-cols-2 gap-4">
                              <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                                <h4 className="text-[11px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Shoot Assignment</h4>
                                <select 
                                  value={(booking.assignedTeamMember?._id || booking.assignedTeamMember) || ''} 
                                  onChange={(e) => handleUpdateBookingDetails(booking._id, { assignedTeamMember: e.target.value })}
                                  className={`${glassInput} w-full py-1.5 px-2 text-xs`}
                                >
                                  <option value="" className="bg-[#111] text-white">-- Unassigned --</option>
                                  {teamMembers.map(tm => (
                                    <option key={tm._id} value={tm._id} className="bg-[#111] text-white">{tm.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                                <h4 className="text-[11px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Edit Assignment</h4>
                                <select 
                                  value={(booking.editAssignment?._id || booking.editAssignment) || ''} 
                                  onChange={(e) => handleUpdateBookingDetails(booking._id, { editAssignment: e.target.value })}
                                  className={`${glassInput} w-full py-1.5 px-2 text-xs`}
                                >
                                  <option value="" className="bg-[#111] text-white">-- Unassigned --</option>
                                  {teamMembers.map(tm => (
                                    <option key={tm._id} value={tm._id} className="bg-[#111] text-white">{tm.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="mb-4 bg-black/40 border border-white/5 rounded-xl p-4">
                              <h4 className="font-oswald text-base text-white uppercase tracking-widest mb-3">Notes</h4>
                              {booking.followUps && booking.followUps.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                  {booking.followUps.map((fu, idx) => (
                                    <div key={fu._id || idx} className="flex justify-between items-start bg-black/60 p-3 rounded border border-white/5">
                                      <div>
                                        <p className="text-sm text-white">{fu.note}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {new Date(fu.date).toLocaleString()}
                                          {fu.isPinned && <span className="text-amber-500 font-bold ml-2">📌 PINNED</span>}
                                        </p>
                                      </div>
                                      <div className="flex gap-3 items-center ml-3 shrink-0">
                                        <button onClick={async () => {
                                          try {
                                            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${booking._id}/followups/${fu._id}`, { note: fu.note, isPinned: !fu.isPinned });
                                            fetchData();
                                          } catch (error) {
                                            console.error(error);
                                            alert('Error updating note');
                                          }
                                        }} className={`${fu.isPinned ? 'text-amber-500' : 'text-gray-600 hover:text-white'} text-sm transition-colors`} title={fu.isPinned ? "Unpin note" : "Pin note"}>
                                          📌
                                        </button>
                                        <button onClick={async () => {
                                          if (!window.confirm('Delete this note forever?')) return;
                                          try {
                                            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${booking._id}/followups/${fu._id}`);
                                            fetchData();
                                          } catch (error) {
                                            console.error(error);
                                            alert('Error deleting follow-up note');
                                          }
                                        }} className="text-red-500 hover:text-red-400 text-sm">✕</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic mb-4">No notes yet.</p>
                              )}
                              <form onSubmit={async (e) => {
                                e.preventDefault();
                                const noteInput = e.target.note.value;
                                const isPinned = e.target.isPinned.checked;
                                if (!noteInput.trim()) return;
                                try {
                                  await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${booking._id}/followup`, { note: noteInput, isPinned });
                                  fetchData();
                                  e.target.reset();
                                } catch (error) {
                                  alert('Error adding note');
                                }
                              }} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  name="note"
                                  placeholder="Add a note..."
                                  className="flex-1 bg-black/60 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                                />
                                <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer hover:text-white transition-colors">
                                  <input type="checkbox" name="isPinned" className="accent-amber-500" />
                                  Pin
                                </label>
                                <button type="submit" className="px-5 py-2 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/20 rounded text-xs uppercase tracking-widest transition-colors font-bold">+ Add</button>
                              </form>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex gap-2 justify-between items-center">
                              <select 
                                className={`bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs uppercase font-bold tracking-widest outline-none [&>option]:bg-[#111] ${
                                  booking.status === 'Pending' ? 'text-yellow-500' :
                                  booking.status === 'Contacted' ? 'text-orange-400' :
                                  booking.status === 'Confirmed' ? 'text-green-500' :
                                  booking.status === 'Shoot Done' ? 'text-purple-400' :
                                  booking.status === 'Editing In Process' ? 'text-cyan-400' :
                                  (booking.status === 'Finished' || booking.status === 'Completed') ? 'text-blue-500' : 'text-red-500'
                                }`}
                                value={booking.status}
                                onChange={(e) => handleUpdateBookingStatus(booking._id, e.target.value)}
                              >
                                <option value="Pending" className="text-yellow-500 bg-[#111]">Pending</option>
                                <option value="Contacted" className="text-orange-400 bg-[#111]">Contacted</option>
                                <option value="Confirmed" className="text-green-500 bg-[#111]">Confirmed</option>
                                <option value="Shoot Done" className="text-purple-400 bg-[#111]">Shoot Done</option>
                                <option value="Editing In Process" className="text-cyan-400 bg-[#111]">Editing In Process</option>
                                <option value="Finished" className="text-blue-500 bg-[#111]">Finished</option>
                                <option value="Cancelled" className="text-red-500 bg-[#111]">Cancelled</option>
                              </select>
                              <button 
                                onClick={() => handleUpdateBookingDetails(booking._id, { status: booking.status })}
                                className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded text-[11px] uppercase tracking-widest transition-colors"
                              >
                                Save Details
                              </button>
                            </div>

                            {/* Booking Expenses Section */}
                            <div className="mt-4 pt-4 border-t border-white/5">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">Shoot Expenses</h4>
                                <span className="text-[10px] text-white/50 uppercase tracking-wider">
                                  Total: Rs. {expenses.filter(ex => ex.bookingId === booking._id).reduce((sum, ex) => sum + ex.amount, 0)}
                                </span>
                              </div>
                              
                              <div className="mb-3">
                                <button 
                                  onClick={() => setViewingExpensesBookingId(booking._id)}
                                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded border border-white/10 text-[10px] uppercase tracking-widest transition-colors"
                                >
                                  View Details ({expenses.filter(ex => ex.bookingId === booking._id).length})
                                </button>
                              </div>

                              <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                const amount = formData.get('amount');
                                const description = formData.get('description');
                                try {
                                  const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/business/expenses`, {
                                    date: new Date().toISOString().split('T')[0],
                                    amount: Number(amount),
                                    type: 'Shoot',
                                    description,
                                    bookingId: booking._id
                                  });
                                  setExpenses([res.data, ...expenses]);
                                  e.target.reset();
                                } catch (err) {
                                  console.error(err);
                                  alert('Failed to add expense');
                                }
                              }} className="flex gap-2">
                                <input required type="text" name="description" placeholder="Expense detail..." className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none flex-1" />
                                <input required type="number" name="amount" placeholder="Rs. 0" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-20" />
                                <button type="submit" disabled={isGlobalSubmitting} className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap disabled:opacity-50">+ Add</button>
                              </form>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5">
                              <button 
                                onClick={() => handleDeleteBooking(booking._id)}
                                className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs uppercase tracking-widest transition-colors"
                              >
                                Delete Booking
                              </button>
                            </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  </div>
                )}

                {/* CALENDAR TAB */}
                {activeTab === 'calendar' && (
                  <CalendarView allBookings={bookings} setActiveTab={setActiveTab} setHighlightedBookingId={setHighlightedBookingId} settings={settings} />
                )}

                {/* SLOTS TAB */}
                {activeTab === 'slots' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gradient-to-r from-red-900/20 to-transparent p-6 rounded-2xl border border-red-500/20">
                      <div>
                        <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">Slot Management</h2>
                        <p className="text-xs text-red-300/70 tracking-wide">Block out dates or specific slots to prevent client bookings.</p>
                      </div>
                    </div>

                    <div className={`${glassPanel} p-8 flex flex-col md:flex-row gap-8 items-start`}>
                      <div className="w-full md:w-1/3 border-r border-white/5 pr-8 space-y-8">
                        <div>
                          <label className="block text-[11px] uppercase text-gray-500 mb-2">Select Date</label>
                          <input 
                            type="date" 
                            className="w-full bg-black/40 border border-white/10 py-4 px-4 font-sans text-white focus:outline-none focus:border-white transition-colors rounded-xl [&::-webkit-calendar-picker-indicator]:invert"
                            value={slotDate}
                            onChange={(e) => setSlotDate(e.target.value)}
                          />
                        </div>

                        <div className="pt-8 border-t border-white/5">
                          <label className="block text-[11px] uppercase text-gray-500 mb-4">Global Weekly Schedule</label>
                          <p className="text-xs text-gray-400 font-sans mb-4">Select days that the studio is ALWAYS closed.</p>
                          <div className="space-y-2">
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, idx) => {
                              const isBlocked = (settings.blockedWeekdays || []).includes(idx);
                              return (
                                <label key={idx} onClick={() => handleToggleBlockedWeekday(idx)} className="flex items-center gap-3 cursor-pointer group">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isBlocked ? 'bg-red-500 border-red-500' : 'border-white/20 group-hover:border-white/50 bg-black/40'}`}>
                                    {isBlocked && <span className="text-white text-xs">✓</span>}
                                  </div>
                                  <span className={`text-sm font-oswald tracking-widest uppercase transition-colors ${isBlocked ? 'text-red-400' : 'text-gray-300'}`}>{dayName}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-2/3">
                        <h3 className="text-sm font-oswald text-white uppercase tracking-widest mb-6">Slot Availability for {slotDate}</h3>
                        
                        {isLoadingSlots ? (
                           <div className="text-xs text-gray-500 tracking-widest uppercase">Loading slots...</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="mb-6 bg-black/40 p-4 rounded-xl border border-white/5">
                              <div className="mb-4 pb-4 border-b border-white/5">
                                <label className="block text-sm uppercase text-white font-oswald tracking-widest mb-1">Global Slots Per Session</label>
                                <p className="text-[11px] text-gray-500 font-sans">Set maximum bookings for Morning/Afternoon/Evening globally for each weekday</p>
                              </div>
                              <div className="space-y-3">
                                {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day, dayIndex) => {
                                  const currentCapacity = settings.weekdayCapacities ? (settings.weekdayCapacities[dayIndex] ?? 3) : 3;
                                  return (
                                    <div key={dayIndex} className="flex justify-between items-center bg-black/20 p-2 px-4 rounded border border-white/5">
                                      <span className="text-xs uppercase font-oswald text-gray-300 tracking-widest">{day}</span>
                                          <div className="flex gap-2">
                                        {[1, 2, 3].map(num => {
                                          const isSelected = currentCapacity === num;
                                          return (
                                            <button 
                                              key={num}
                                              onClick={() => {
                                                const newCapacities = { ...(settings.weekdayCapacities || { '0':3,'1':3,'2':3,'3':3,'4':3,'5':3,'6':3 }), [dayIndex]: num };
                                                setSettings({ ...settings, weekdayCapacities: newCapacities });
                                              }}
                                              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-oswald transition-colors border ${isSelected ? 'bg-white text-black border-white' : 'bg-black text-gray-400 border-white/10 hover:border-white/50'}`}
                                            >
                                              {num}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-6 flex justify-end">
                                <button 
                                  onClick={async () => {
                                    try {
                                      const newCapacities = settings.weekdayCapacities || { '0':3,'1':3,'2':3,'3':3,'4':3,'5':3,'6':3 };
                                      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/blocked-weekdays`, { weekdayCapacities: newCapacities });
                                      alert("Global Slots saved successfully! Payload sent: " + JSON.stringify(newCapacities));
                                      if (slotDate) {
                                        fetchSlotsForAdmin(slotDate);
                                      }
                                    } catch(e) {
                                      alert("Error saving slots. Please check your connection. Error: " + e.message);
                                      console.error(e);
                                    }
                                  }}
                                  className="px-6 py-2 bg-white text-black font-oswald uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors"
                                >
                                  Save Global Slots
                                </button>
                              </div>
                            </div>
                            
                            {(settings.blockedWeekdays || []).includes(new Date(slotDate).getUTCDay()) ? (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-12 text-center">
                                <h3 className="text-2xl font-oswald text-red-500 uppercase tracking-widest mb-2">Studio Holiday</h3>
                                <p className="text-sm font-sans text-red-400/80">The studio is closed on {['Sundays','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays'][new Date(slotDate).getUTCDay()]}. All sessions are blocked.</p>
                              </div>
                            ) : (
                              <>
                                {slotData.map((slot, idx) => (
                                  <div key={idx} className="mb-6 bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                                    <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                      <h4 className="text-lg font-oswald uppercase tracking-widest text-white">{slot.slot}</h4>
                                      <span className="text-xs text-gray-400 font-sans tracking-widest uppercase">{slot.maxCapacity} Total Slots</span>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                      {Array.from({ length: slot.maxCapacity }).map((_, i) => {
                                        let slotStatus = 'Available';
                                        let bookingDetail = null;
                                        
                                        if (i < slot.currentBookings) {
                                          slotStatus = 'Booked';
                                          bookingDetail = slot.bookingDetails?.[i];
                                        } else if (i >= slot.maxCapacity - (slot.blockedCount || 0)) {
                                          slotStatus = 'Blocked';
                                        }

                                        return (
                                          <div key={i} className="p-4 flex justify-between items-center">
                                            <div>
                                              <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-500 font-oswald tracking-widest">SLOT {i + 1}</span>
                                                <span className={`text-[11px] px-2 py-0.5 rounded font-bold tracking-widest uppercase ${slotStatus === 'Available' ? 'bg-green-500/20 text-green-400' : slotStatus === 'Booked' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                                                  {slotStatus}
                                                </span>
                                              </div>
                                              {bookingDetail && (
                                                <p className="text-xs text-white mt-1 font-sans">{bookingDetail.name} <span className="text-gray-500">({bookingDetail.shootType})</span></p>
                                              )}
                                            </div>
                                            <div>
                                              {slotStatus === 'Available' && (
                                                <button 
                                                  onClick={() => handleBlockSlot(slot.slot, 'block_single')}
                                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors rounded text-[11px] uppercase tracking-widest font-bold"
                                                >
                                                  Block
                                                </button>
                                              )}
                                              {slotStatus === 'Blocked' && (
                                                <button 
                                                  onClick={() => handleBlockSlot(slot.slot, 'open_single')}
                                                  className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white transition-colors rounded text-[11px] uppercase tracking-widest font-bold"
                                                >
                                                  Unblock
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {slot.maxCapacity === 0 && (
                                        <div className="p-6 text-center text-xs text-red-500 uppercase tracking-widest font-bold bg-red-500/5">
                                          Entire Session Blocked
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBSCRIPTIONS VIEW */}
                {activeTab === 'studio bookings' && showSubscriptionsView && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-transparent p-6 rounded-2xl border border-purple-500/20">
                      <div>
                        <div className="flex items-center gap-4 mb-1">
                          <button 
                            onClick={() => setShowSubscriptionsView(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            ← Back
                          </button>
                          <h2 className="text-lg font-oswald text-white uppercase tracking-widest">Subscriptions</h2>
                        </div>
                        <p className="text-xs text-purple-300/70 tracking-wide">Manage recurring client bookings.</p>
                      </div>
                      <button 
                        onClick={() => setIsSubscriptionModalOpen(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs uppercase font-bold tracking-widest rounded-lg transition-colors"
                      >
                        + New Subscription
                      </button>
                    </div>

                    {subscriptions.length === 0 ? (
                      <div className="text-center py-20 text-gray-500 uppercase tracking-widest">No subscriptions found.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subscriptions.map(sub => (
                          <div key={sub._id} className={`${glassPanel} p-6 flex flex-col relative`}>
                            <div className="absolute top-4 right-4 flex gap-2">
                              <button 
                                onClick={() => handleEditSubscription(sub)}
                                className="text-[11px] text-blue-400 hover:text-blue-300 uppercase tracking-widest bg-blue-900/40 px-2 py-1 rounded"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteSubscription(sub._id)}
                                className="text-[11px] text-red-400 hover:text-red-300 uppercase tracking-widest bg-red-900/40 px-2 py-1 rounded"
                              >
                                Delete
                              </button>
                            </div>
                            <h3 className="text-xl text-white font-oswald uppercase tracking-widest mb-1">{sub.name}</h3>
                            <p className="text-xs text-gray-400 font-mono mb-1">{sub.phone}</p>
                            <p className="text-[11px] text-gray-500 mb-4">{sub.email}</p>
                            
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-xs font-bold text-white uppercase tracking-widest bg-white/10 px-2 py-1 rounded">
                                {sub.duration} Months
                              </span>
                              <select 
                                className="bg-black/60 border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none uppercase tracking-widest"
                                value={sub.status || 'Pending'}
                                onChange={(e) => handleUpdateSubscriptionStatus(sub._id, e.target.value)}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Finished">Finished</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>

                            {/* Linked Bookings summary */}
                            <div className="mt-2 pt-4 border-t border-white/10">
                              <h4 className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Included Sessions:</h4>
                              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                {sub.bookings && sub.bookings.map((b, i) => {
                                  const isFinished = b.status === 'Finished';
                                  return (
                                    <div key={i} className={`flex justify-between items-center text-[11px] p-2 rounded ${isFinished ? 'bg-green-900/20 opacity-70' : 'bg-black/40'}`}>
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => handleToggleSessionStatus(b._id, b.status)}
                                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isFinished ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-gray-300'}`}
                                        >
                                          {isFinished && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </button>
                                        <span className={isFinished ? 'text-gray-500 line-through' : 'text-gray-300'}>{new Date(b.date).toLocaleDateString()} • {b.slot}</span>
                                      </div>
                                      <span className={`${isFinished ? 'text-gray-500 line-through' : 'text-purple-300'} truncate max-w-[100px] ml-2 text-right`} title={b.shootType}>{b.shootType}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* INQUIRIES TAB */}
                {activeTab === 'inquiries' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-orange-900/20 to-transparent p-6 rounded-2xl border border-orange-500/20">
                      <div>
                        <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">Contact Inquiries</h2>
                        <p className="text-xs text-orange-300/70 tracking-wide">Manage leads and messages from the contact page.</p>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <input 
                          type="text" 
                          placeholder="Search Name, Email, Phone..." 
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-white w-full md:w-64"
                          value={inquirySearch}
                          onChange={e => setInquirySearch(e.target.value)}
                        />
                        <select 
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none w-full md:w-auto uppercase tracking-widest"
                          value={inquiryFilter}
                          onChange={e => setInquiryFilter(e.target.value)}
                        >
                          <option value="All">All Statuses</option>
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Pending">Pending</option>
                          <option value="Negotiation">Negotiation</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Junk Lead">Junk Lead</option>
                        </select>
                      </div>
                    </div>

                    {/* STATS ROW */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Total Inquiries</p>
                        <p className="text-2xl font-bold font-oswald text-white">{inquiries.length}</p>
                      </div>
                      <div className="bg-black/40 border border-yellow-500/20 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Pending</p>
                        <p className="text-2xl font-bold font-oswald text-yellow-500">{inquiries.filter(i => (i.status || '').toLowerCase() === 'pending').length}</p>
                      </div>
                      <div className="bg-black/40 border border-blue-500/20 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Contacted</p>
                        <p className="text-2xl font-bold font-oswald text-blue-500">{inquiries.filter(i => (i.status || '').toLowerCase() === 'contacted').length}</p>
                      </div>
                      <div className="bg-black/40 border border-orange-500/20 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Negotiation</p>
                        <p className="text-2xl font-bold font-oswald text-orange-500">{inquiries.filter(i => (i.status || '').toLowerCase() === 'negotiation').length}</p>
                      </div>
                      <div className="bg-black/40 border border-green-500/20 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Confirmed</p>
                        <p className="text-2xl font-bold font-oswald text-green-500">{inquiries.filter(i => ['confirmed', 'converted'].includes((i.status || '').toLowerCase())).length}</p>
                      </div>
                      <div className="bg-black/40 border border-red-500/20 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Cancelled / Lost</p>
                        <p className="text-2xl font-bold font-oswald text-red-500">{inquiries.filter(i => ['cancelled', 'lost'].includes((i.status || '').toLowerCase())).length}</p>
                      </div>
                    </div>

                    {filteredInquiries.length === 0 ? (
                      <div className="flex items-center justify-center h-64">
                        <div className={`${glassPanel} p-10 text-center w-full`}>
                          <p className="text-gray-500 text-sm tracking-[0.3em] uppercase">No inquiries found.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {/* Header Row */}
                        <div className="hidden md:flex items-center px-6 py-3 border-b border-white/5 text-[11px] text-gray-500 uppercase tracking-widest font-bold">
                          <div className="w-24">Lead ID</div>
                          <div className="flex-1">Client Info</div>
                          <div className="flex-[1.5]">Subject</div>
                          <div className="flex-[2]">Message Snippet</div>
                          <div className="w-32">Status</div>
                          <div className="w-16 text-right">Action</div>
                        </div>

                        {/* Data Rows */}
                        {filteredInquiries.map(inq => (
                          <div id={`row-${inq._id}`} key={inq._id} className={`${glassPanel} p-4 md:px-6 flex flex-col md:flex-row md:items-center gap-4 transition-all duration-1000 ${highlightedItemId === inq._id ? '!bg-emerald-900/40 !border-emerald-500 !shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'hover:bg-white/5'}`}>
                            {/* Lead ID */}
                            <div className="w-24 text-xs font-sans text-gray-500 tracking-widest hidden md:block">
                              #{inq._id.substring(inq._id.length - 6).toUpperCase()}
                            </div>

                            {/* Client Info */}
                            <div className="flex-1">
                              <h3 className="text-sm text-white font-oswald uppercase tracking-widest truncate">{inq.name}</h3>
                              <p className="text-[11px] text-gray-400 font-sans tracking-wider truncate">{inq.email}</p>
                              <p className="text-[11px] text-gray-400 font-sans tracking-wider">{inq.phone}</p>
                              {inq.createdAt && <p className="text-[10px] text-gray-600 font-sans tracking-wider mt-0.5">Submitted: {new Date(inq.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                            </div>

                            {/* Subject */}
                            <div className="flex-[1.5]">
                              <p className="text-xs text-white font-bold tracking-wider truncate">{inq.subject}</p>
                            </div>

                            {/* Message */}
                            <div className="flex-[2] text-xs text-gray-400 italic line-clamp-2 pr-4">
                              {inq.message}
                            </div>

                            {/* Status */}
                            <div className="w-36 flex flex-col gap-2">
                              <select 
                                className={`border rounded-lg px-2 py-2 text-[11px] outline-none tracking-widest uppercase cursor-pointer transition-colors font-bold ${
                                  (inq.status || '').toLowerCase() === 'new' ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' :
                                  (inq.status || '').toLowerCase() === 'contacted' ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' :
                                  (inq.status || '').toLowerCase() === 'pending' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' :
                                  (inq.status || '').toLowerCase() === 'negotiation' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' :
                                  ['confirmed','converted'].includes((inq.status || '').toLowerCase()) ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
                                  ['cancelled','lost'].includes((inq.status || '').toLowerCase()) ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' :
                                  (inq.status || '').toLowerCase() === 'junk lead' ? 'bg-gray-500/10 border-gray-500/40 text-gray-400' :
                                  'bg-black/40 border-white/10 text-white'
                                }`}
                                value={inq.status}
                                onChange={(e) => handleUpdateInquiryStatus(inq._id, e.target.value)}
                              >
                                <option value="New" className="bg-[#111] text-white">New</option>
                                <option value="Contacted" className="bg-[#111] text-white">Contacted</option>
                                <option value="Pending" className="bg-[#111] text-white">Pending</option>
                                <option value="Negotiation" className="bg-[#111] text-white">Negotiation</option>
                                <option value="Confirmed" className="bg-[#111] text-white">Confirmed</option>
                                <option value="Cancelled" className="bg-[#111] text-white">Cancelled</option>
                                <option value="Junk Lead" className="bg-[#111] text-white">Junk Lead</option>
                              </select>
                              <button onClick={() => setFollowUpModal({ type: 'inquiry', id: inq._id })} className="text-[9px] text-green-400 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center border border-green-500/30 rounded py-1 bg-green-500/10 hover:bg-green-500/30">
                                📋 Notes ({inq.followUps?.length || 0})
                              </button>
                            </div>

                            {/* Action */}
                            <div className="w-16 flex justify-end">
                              <button 
                                onClick={() => handleDeleteInquiry(inq._id)}
                                className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                title="Delete Inquiry"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CUSTOMERS TAB */}
                
                {/* LEADS TAB */}
                {activeTab === 'leads' && (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-black/40 p-6 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md gap-4">
                      <h2 className="text-xl font-oswald text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase tracking-widest">Landing Page Leads</h2>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
                        <input 
                          type="text" 
                          placeholder="Search Name, Email, Phone..."
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none w-full md:w-64"
                          value={leadSearch}
                          onChange={(e) => setLeadSearch(e.target.value)}
                        />
                        <select 
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none w-full md:w-auto uppercase tracking-widest"
                          value={leadFilter}
                          onChange={e => setLeadFilter(e.target.value)}
                        >
                          <option value="All">All Statuses</option>
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="pending">Pending</option>
                          <option value="negotiation">Negotiation</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="junk lead">Junk Lead</option>
                        </select>
                      </div>
                    </div>

                    {/* STATS ROW */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Total Leads</p>
                        <p className="text-2xl font-bold font-oswald text-white">{leads.length}</p>
                      </div>
                      <div className="bg-black/40 border border-emerald-500/20 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">New</p>
                        <p className="text-2xl font-bold font-oswald text-emerald-500">{leads.filter(l => (l.status || '').toLowerCase() === 'new').length}</p>
                      </div>
                      <div className="bg-black/40 border border-blue-500/20 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Contacted</p>
                        <p className="text-2xl font-bold font-oswald text-blue-500">{leads.filter(l => (l.status || '').toLowerCase() === 'contacted').length}</p>
                      </div>
                      <div className="bg-black/40 border border-yellow-500/20 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Pending</p>
                        <p className="text-2xl font-bold font-oswald text-yellow-500">{leads.filter(l => (l.status || '').toLowerCase() === 'pending').length}</p>
                      </div>
                      <div className="bg-black/40 border border-orange-500/20 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Negotiation</p>
                        <p className="text-2xl font-bold font-oswald text-orange-500">{leads.filter(l => (l.status || '').toLowerCase() === 'negotiation').length}</p>
                      </div>
                      <div className="bg-black/40 border border-purple-500/20 p-4 rounded-xl">
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Confirmed</p>
                        <p className="text-2xl font-bold font-oswald text-purple-500">{leads.filter(l => (l.status || '').toLowerCase() === 'confirmed').length}</p>
                      </div>
                    </div>
                    {leads.filter(l => {
                      const matchesSearch = leadSearch.trim() === '' || [l.name, l.email, l.phone].some(val => val && String(val).toLowerCase().includes(leadSearch.toLowerCase()));
                      const matchesStatus = leadFilter === 'All' || l.status === leadFilter;
                      return matchesSearch && matchesStatus;
                    }).length === 0 ? (
                      <div className="flex items-center justify-center h-48">
                        <p className="text-gray-500 text-sm tracking-[0.3em] uppercase">No leads found.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {/* Header Row */}
                        <div className="hidden md:flex items-center px-6 py-3 border-b border-white/5 text-[11px] text-gray-500 uppercase tracking-widest font-bold">
                          <div className="w-24">Lead ID</div>
                          <div className="flex-1">Client Info</div>
                          <div className="flex-[1.5]">Source</div>
                          <div className="flex-[1.5]">Event Date</div>
                          <div className="w-36">Status</div>
                          <div className="w-16 text-right">Action</div>
                        </div>
                        {leads.filter(l => {
                          const matchesSearch = leadSearch.trim() === '' || [l.name, l.email, l.phone].some(val => val && String(val).toLowerCase().includes(leadSearch.toLowerCase()));
                          const matchesStatus = leadFilter === 'All' || l.status === leadFilter;
                          return matchesSearch && matchesStatus;
                        }).map((lead) => (
                          <div id={`row-${lead._id}`} key={lead._id} className={`${glassPanel} p-4 md:px-6 flex flex-col md:flex-row md:items-center gap-4 transition-all duration-1000 ${highlightedItemId === lead._id ? '!bg-emerald-900/40 !border-emerald-500 !shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'hover:bg-white/5'}`}>
                            {/* Lead ID */}
                            <div className="w-24 text-xs font-sans text-gray-500 tracking-widest hidden md:block">
                              #{lead._id.substring(lead._id.length - 6).toUpperCase()}
                            </div>
                            {/* Client Info */}
                            <div className="flex-1">
                              <h3 className="text-sm text-white font-oswald uppercase tracking-widest truncate">{lead.name}</h3>
                              <p className="text-[11px] text-gray-400 font-sans tracking-wider truncate">{lead.email}</p>
                              <p className="text-[11px] text-gray-400 font-sans tracking-wider">{lead.phone}</p>
                              {lead.createdAt && <p className="text-[10px] text-gray-600 font-sans tracking-wider mt-0.5">Submitted: {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                            </div>
                            {/* Source */}
                            <div className="flex-[1.5]">
                              {lead.landingPageSource && <span className="bg-white/10 px-3 py-1 rounded-full text-xs text-white/70">{lead.landingPageSource}</span>}
                            </div>
                            {/* Event Date */}
                            <div className="flex-[1.5]">
                              {lead.eventDate && <p className="text-xs text-emerald-400">{new Date(lead.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                            </div>
                            {/* Status */}
                            <div className="w-36 flex flex-col gap-2">
                              <select 
                                className={`border rounded-lg px-2 py-2 text-[11px] outline-none tracking-widest uppercase cursor-pointer transition-colors font-bold ${
                                  (lead.status || '').toLowerCase() === 'new' ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' :
                                  (lead.status || '').toLowerCase() === 'contacted' ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' :
                                  (lead.status || '').toLowerCase() === 'pending' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' :
                                  (lead.status || '').toLowerCase() === 'negotiation' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' :
                                  (lead.status || '').toLowerCase() === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
                                  (lead.status || '').toLowerCase() === 'cancelled' ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' :
                                  (lead.status || '').toLowerCase() === 'junk lead' ? 'bg-gray-500/10 border-gray-500/40 text-gray-400' :
                                  'bg-black/40 border-white/10 text-white'
                                }`}
                                value={lead.status || 'new'}
                                onChange={async (e) => {
                                  try {
                                    await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads/${lead._id}`, { status: e.target.value });
                                    fetchData();
                                  } catch(err) { console.error(err); }
                                }}
                              >
                                <option className="bg-[#111] text-white" value="new">New</option>
                                <option className="bg-[#111] text-white" value="contacted">Contacted</option>
                                <option className="bg-[#111] text-white" value="pending">Pending</option>
                                <option className="bg-[#111] text-white" value="negotiation">Negotiation</option>
                                <option className="bg-[#111] text-white" value="confirmed">Confirmed</option>
                                <option className="bg-[#111] text-white" value="cancelled">Cancelled</option>
                                <option className="bg-[#111] text-white" value="junk lead">Junk Lead</option>
                              </select>
                              <button onClick={() => setFollowUpModal({ type: 'lead', id: lead._id })} className="text-[9px] text-green-400 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center border border-green-500/30 rounded py-1 bg-green-500/10 hover:bg-green-500/30">
                                📝 Notes ({lead.followUps?.length || 0})
                              </button>
                            </div>
                            {/* Action */}
                            <div className="w-16 flex justify-end">
                              <button 
                                onClick={async () => {
                                  if(window.confirm('Are you sure you want to delete this lead?')) {
                                    try {
                                      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads/${lead._id}`);
                                      fetchData();
                                    } catch(err) { console.error(err); }
                                  }
                                }}
                                className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                title="Delete Lead"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* FOLLOW UPS TAB */}
                {activeTab === 'follow ups' && (
                  <FollowUpsCalendar 
                    leads={leads} 
                    inquiries={inquiries} 
                    setActiveTab={setActiveTab} 
                    setLeadSearch={setLeadSearch}
                    setLeadFilter={setLeadFilter}
                    setInquirySearch={setInquirySearch}
                    setInquiryFilter={setInquiryFilter}
                    setHighlightedItemId={setHighlightedItemId}
                  />
                )}

                {activeTab === 'customers' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-900/20 to-transparent p-6 rounded-2xl border border-teal-500/20">
                      <div>
                        <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">Customer Database</h2>
                        <p className="text-xs text-teal-300/70 tracking-wide">Aggregated view of all clients from bookings and inquiries.</p>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <input 
                          type="text" 
                          placeholder="Search Customers..." 
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-white w-full md:w-64"
                          value={customersSearch}
                          onChange={e => setCustomersSearch(e.target.value)}
                        />
                        <button 
                          onClick={exportCustomersCSV}
                          className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] whitespace-nowrap"
                        >
                          Export CSV
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const customerMap = {};
                      
                      // Process Bookings
                      bookings.forEach(b => {
                        const key = b.phone || b.name;
                        if (!customerMap[key]) customerMap[key] = { name: b.name, phone: b.phone, email: 'N/A', bookings: [], inquiries: [] };
                        customerMap[key].bookings.push(b);
                      });

                      // Process Inquiries
                      inquiries.forEach(inq => {
                        const key = inq.phone || inq.name;
                        if (!customerMap[key]) customerMap[key] = { name: inq.name, phone: inq.phone, email: inq.email || 'N/A', bookings: [], inquiries: [] };
                        customerMap[key].inquiries.push(inq);
                        if (customerMap[key].email === 'N/A' && inq.email) customerMap[key].email = inq.email;
                      });

                      let customersList = Object.values(customerMap);
                      if (customersSearch) {
                        const s = customersSearch.toLowerCase();
                        customersList = customersList.filter(c => 
                          (c.name && c.name.toLowerCase().includes(s)) ||
                          (c.phone && c.phone.toLowerCase().includes(s)) ||
                          (c.email && c.email.toLowerCase().includes(s))
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {customersList.length === 0 ? (
                            <div className="col-span-full text-center py-20 text-gray-500 uppercase tracking-widest">No customers found.</div>
                          ) : (
                            customersList.map((c, i) => (
                              <div key={i} className={`${glassPanel} p-6`}>
                                <div className="mb-4 pb-4 border-b border-white/5">
                                  <h3 className="text-xl text-white font-oswald uppercase tracking-widest">{c.name}</h3>
                                  <p className="text-xs text-gray-400 font-sans mt-1">📞 {c.phone || 'No phone'}</p>
                                  <p className="text-xs text-gray-400 font-sans mt-1">✉️ {c.email}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <p className="text-[9px] uppercase text-gray-500 mb-1">Bookings</p>
                                    <p className="text-lg font-bold font-oswald text-white">{c.bookings.length}</p>
                                  </div>
                                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <p className="text-[9px] uppercase text-gray-500 mb-1">Inquiries</p>
                                    <p className="text-lg font-bold font-oswald text-white">{c.inquiries.length}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* FOLLOW-UP MODAL */}
            {followUpModal && (
              <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${glassPanel} p-8 w-full max-w-lg`}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-oswald text-white uppercase tracking-widest">Follow-Up Notes</h2>
                    <button onClick={() => setFollowUpModal(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto custom-scrollbar mb-6 space-y-3">
                    {(() => {
                      const item = followUpModal.type === 'booking' 
                        ? bookings.find(b => b._id === followUpModal.id)
                        : (followUpModal.type === 'lead' 
                           ? leads.find(l => l._id === followUpModal.id) 
                           : inquiries.find(i => i._id === followUpModal.id));
                      
                      const notes = item?.followUps || [];
                      
                      if (notes.length === 0) return <p className="text-xs text-gray-500 italic">No notes yet.</p>;
                      
                      return notes.map((n, idx) => (
                        <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5 relative group">
                          {editingNoteId === n._id ? (
                            <div className="flex flex-col gap-2">
                              <textarea 
                                className="w-full bg-black/40 border border-white/20 rounded p-2 text-xs text-white outline-none focus:border-green-500"
                                value={editingNoteText}
                                onChange={e => setEditingNoteText(e.target.value)}
                              ></textarea>
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingNoteId(null)} className="px-2 py-1 bg-white/10 text-white text-[11px] rounded hover:bg-white/20">Cancel</button>
                                <button onClick={() => {
                                  handleUpdateFollowUp(n._id, editingNoteText);
                                  setEditingNoteId(null);
                                }} className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/50 text-[11px] rounded hover:bg-green-500 hover:text-white">Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => {
                                  setEditingNoteId(n._id);
                                  setEditingNoteText(n.note);
                                }} className="text-gray-400 hover:text-white text-[11px] uppercase tracking-widest">Edit</button>
                                <button onClick={() => handleDeleteFollowUp(n._id)} className="text-red-400 hover:text-red-500 text-[11px] uppercase tracking-widest">Delete</button>
                              </div>
                              <p className="text-[9px] text-green-400 mb-1">{new Date(n.date).toLocaleString()}</p>
                              <p className="text-xs text-gray-300 pr-16">{n.note}</p>
                            </>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  <form onSubmit={handleAddFollowUp}>
                    <div className="flex gap-4 mb-4 flex-col sm:flex-row">
                      <div className="flex-1">
                        <textarea 
                          className={`${glassInput} h-24 w-full text-xs`} 
                          placeholder="Type a new follow-up note..." 
                          value={followUpNote} 
                          onChange={e => setFollowUpNote(e.target.value)}
                        ></textarea>
                      </div>
                      <div className="w-full sm:w-1/3">
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Schedule Date (Optional)</label>
                        <input 
                          type="date"
                          className={`${glassInput} w-full text-xs py-2 px-3`}
                          value={followUpDate}
                          onChange={e => setFollowUpDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setFollowUpModal(null)} className="px-4 py-2 rounded-lg bg-white/5 text-xs uppercase hover:bg-white/10 transition-colors">Close</button>
                      <button type="submit" disabled={isGlobalSubmitting} className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Adding...' : 'Add Note'}</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
            </>
          )}
          {activeTab === 'testimonials' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-amber-900/20 to-transparent p-6 rounded-2xl border border-amber-500/20">
                <div>
                  <h2 className="text-lg font-oswald text-white uppercase tracking-widest mb-1">Testimonials Manager</h2>
                  <p className="text-xs text-amber-300/70 tracking-wide">Manage client reviews shown on the Home Page.</p>
                </div>
                <button 
                  onClick={() => setEditingTestimonial({ authorName: '', reviewText: '', rating: 5, googleReviewUrl: '', isActive: true })} 
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] whitespace-nowrap"
                >
                  + Add Testimonial
                </button>
              </div>

              {editingTestimonial && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${glassPanel} p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border-amber-500/30`}>
                    <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                      <h3 className="text-xl font-oswald text-white uppercase tracking-[0.2em]">{editingTestimonial._id ? 'Edit Testimonial' : 'Add New Testimonial'}</h3>
                      <button onClick={() => setEditingTestimonial(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                  
                    <form onSubmit={(e) => handleSaveTestimonial(e, editingTestimonial)} className="space-y-6">
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Client Name(s)</label>
                        <input 
                          type="text" 
                          className={glassInput} 
                          placeholder="e.g. Arjun & Niharika"
                          required 
                          value={editingTestimonial.authorName || ''} 
                          onChange={e => setEditingTestimonial({...editingTestimonial, authorName: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Review Text</label>
                        <textarea 
                          className={`${glassInput} min-h-[120px]`} 
                          placeholder="Enter client quote..."
                          required 
                          value={editingTestimonial.reviewText || ''} 
                          onChange={e => setEditingTestimonial({...editingTestimonial, reviewText: e.target.value})}
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Google Review URL (Optional)</label>
                        <input 
                          type="url" 
                          className={glassInput} 
                          placeholder="e.g. https://g.co/kgs/..."
                          value={editingTestimonial.googleReviewUrl || ''} 
                          onChange={e => setEditingTestimonial({...editingTestimonial, googleReviewUrl: e.target.value})} 
                        />
                        <p className="text-[11px] text-gray-600 uppercase tracking-widest mt-1">Paste the specific Google Review link to show a verified review link badge.</p>
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Rating (1 to 5 Stars)</label>
                        <select 
                          className={`${glassInput} appearance-none`}
                          value={editingTestimonial.rating || 5} 
                          onChange={e => setEditingTestimonial({...editingTestimonial, rating: parseInt(e.target.value)})}
                        >
                          <option value="5" className="bg-black">5 Stars</option>
                          <option value="4" className="bg-black">4 Stars</option>
                          <option value="3" className="bg-black">3 Stars</option>
                          <option value="2" className="bg-black">2 Stars</option>
                          <option value="1" className="bg-black">1 Star</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="isActive" checked={editingTestimonial.isActive !== false} onChange={e => setEditingTestimonial({...editingTestimonial, isActive: e.target.checked})} />
                        <label htmlFor="isActive" className="text-xs uppercase text-gray-400 tracking-widest cursor-pointer">Visible on Home Page</label>
                      </div>
                      <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                        <button type="button" onClick={() => setEditingTestimonial(null)} className="px-6 py-3 rounded-xl bg-white/5 text-xs uppercase hover:bg-white/10 transition-colors">Cancel</button>
                        <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 rounded-xl bg-amber-500 text-white font-bold text-xs uppercase hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isGlobalSubmitting ? 'Saving...' : 'Save Testimonial'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map(t => (
                  <div key={t._id} className={`${glassPanel} p-8 flex flex-col justify-between ${!t.isActive ? 'opacity-50' : ''}`}>
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-amber-500/60 text-5xl font-serif leading-none">"</div>
                        <div className="flex gap-2">
                           <button onClick={() => setEditingTestimonial(t)} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-amber-500 hover:scale-110 shadow-lg transition-all">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                           </button>
                           <button onClick={() => handleDeleteTestimonial(t._id)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:scale-110 shadow-lg transition-all">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                           </button>
                        </div>
                      </div>
                      
                      {t.googleReviewUrl && (
                        <a href={t.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-amber-500/30 text-amber-400 text-[11px] uppercase tracking-widest hover:bg-amber-500/10 transition-colors mb-6">
                          <span>G</span> GOOGLE REVIEW &#8599;
                        </a>
                      )}

                      <div className="text-amber-400 text-sm mb-4">{'★'.repeat(t.rating || 5)}</div>
                      <p className="text-sm text-gray-300 font-sans italic mb-8 leading-relaxed">"{t.reviewText}"</p>
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-white/10 pt-6">
                      <h4 className="text-amber-400 text-sm font-sans uppercase tracking-widest">{t.authorName}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEAM MEMBERS TAB */}
          {activeTab === 'team' && (
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-oswald text-white uppercase tracking-widest">Manage Team</h2>
                <button onClick={() => setEditingTeamMember({ name: '', title: '', subtitle: '', imageUrl: '', order: 0 })} className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">
                  + Add Member
                </button>
              </div>

              {editingTeamMember && (
                <div className="bg-[#111] border border-white/10 p-8 mb-10">
                  <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <h3 className="text-lg font-oswald text-white uppercase tracking-widest">{editingTeamMember._id ? 'Edit Team Member' : 'New Team Member'}</h3>
                    <button onClick={() => setEditingTeamMember(null)} className="text-white hover:text-red-500 text-xl leading-none">&times;</button>
                  </div>
                  
                  <form onSubmit={(e) => handleSaveTeamMember(e, editingTeamMember)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Name</label>
                        <input 
                          type="text" 
                          required 
                          className="w-full bg-black border border-white/10 p-4 text-white outline-none focus:border-white/50 transition-colors" 
                          value={editingTeamMember.name || ''} 
                          onChange={e => setEditingTeamMember({...editingTeamMember, name: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Title (e.g. Lead Artist)</label>
                        <input 
                          type="text" 
                          className="w-full bg-black border border-white/10 p-4 text-white outline-none focus:border-white/50 transition-colors" 
                          value={editingTeamMember.title || ''} 
                          onChange={e => setEditingTeamMember({...editingTeamMember, title: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Subtitle (e.g. Specialist)</label>
                        <input 
                          type="text" 
                          className="w-full bg-black border border-white/10 p-4 text-white outline-none focus:border-white/50 transition-colors" 
                          value={editingTeamMember.subtitle || ''} 
                          onChange={e => setEditingTeamMember({...editingTeamMember, subtitle: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Display Order</label>
                        <input 
                          type="number" 
                          className="w-full bg-black border border-white/10 p-4 text-white outline-none focus:border-white/50 transition-colors" 
                          value={editingTeamMember.order || 0} 
                          onChange={e => setEditingTeamMember({...editingTeamMember, order: Number(e.target.value)})} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Email (For Assignment Notifications)</label>
                        <input 
                          type="email" 
                          className="w-full bg-black border border-white/10 p-4 text-white outline-none focus:border-white/50 transition-colors" 
                          value={editingTeamMember.email || ''} 
                          onChange={e => setEditingTeamMember({...editingTeamMember, email: e.target.value})} 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Profile Image</label>
                      <DragDropImageUploader 
                        currentImage={editingTeamMember.imageUrl} 
                        onUploadSuccess={(url) => setEditingTeamMember({...editingTeamMember, imageUrl: url})} 
                      />
                    </div>
                    
                    
                    <div className="pt-4 border-t border-white/10 mt-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 accent-emerald-500" 
                          checked={editingTeamMember.hasAccess || false} 
                          onChange={e => setEditingTeamMember({...editingTeamMember, hasAccess: e.target.checked})} 
                        />
                        <span className="text-xs uppercase text-emerald-400 tracking-widest font-bold">Grant Dashboard Access</span>
                      </label>
                      
                      {editingTeamMember.hasAccess && (
                        <div className="bg-emerald-900/10 p-6 rounded border border-emerald-500/20 space-y-6 mt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="block text-xs uppercase text-emerald-500/70 mb-2 tracking-widest">Login Password</label>
                              <input 
                                type="password" 
                                className="w-full bg-black border border-emerald-500/30 p-4 text-white outline-none focus:border-emerald-500 transition-colors" 
                                value={editingTeamMember.password || ''} 
                                onChange={e => setEditingTeamMember({...editingTeamMember, password: e.target.value})} 
                                placeholder="Leave blank to keep existing"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs uppercase text-emerald-500/70 mb-3 tracking-widest">Select Permissions</label>
                            <div className="flex flex-col gap-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/60 p-6 rounded border border-white/5">
                                {['dashboard', 'leads', 'inquiries', 'follow ups', 'studio bookings', 'calendar', 'slots', 'customers', 'testimonials', 'team', 'cms', 'hero', 'landing pages', 'studio', 'services', 'themes', 'gallery', 'developer options', 'add partner'].map(perm => (
                                  <label key={perm} className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                      type="checkbox" 
                                      className="accent-emerald-500"
                                      checked={(editingTeamMember.permissions || []).includes(perm)}
                                      onChange={(e) => {
                                        const perms = new Set(editingTeamMember.permissions || []);
                                        if (e.target.checked) perms.add(perm);
                                        else perms.delete(perm);
                                        setEditingTeamMember({...editingTeamMember, permissions: Array.from(perms)});
                                      }}
                                    />
                                    <span className="text-xs text-white uppercase">{perm}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded">
                                <label className="block text-[10px] uppercase text-purple-400 mb-3 tracking-widest font-bold">Business Module</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {['business', 'overview', 'studio shoots', 'props rentals', 'events'].map(perm => (
                                    <label key={perm} className="flex items-center gap-2 cursor-pointer group">
                                      <input 
                                        type="checkbox" 
                                        className="accent-purple-500"
                                        checked={(editingTeamMember.permissions || []).includes(perm)}
                                        onChange={(e) => {
                                          const perms = new Set(editingTeamMember.permissions || []);
                                          if (e.target.checked) perms.add(perm);
                                          else perms.delete(perm);
                                          setEditingTeamMember({...editingTeamMember, permissions: Array.from(perms)});
                                        }}
                                      />
                                      <span className="text-xs text-white uppercase">{perm}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-4 pt-4 border-t border-white/10 mt-6">
                      <button type="submit" disabled={isGlobalSubmitting} className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isGlobalSubmitting ? 'Saving...' : 'Save Team Member'}
                      </button>
                      <button type="button" onClick={() => setEditingTeamMember(null)} className="px-8 py-3 border border-white/20 text-white uppercase tracking-widest text-xs hover:bg-white/5">CANCEL</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {teamMembers.sort((a,b) => a.order - b.order).map(member => (
                  <div key={member._id} className="bg-[#111] border border-white/10 p-4 group">
                    <div className="aspect-[3/4] relative overflow-hidden mb-4 bg-black">
                      {member.imageUrl && (
                        <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover filter grayscale group-hover:scale-105 transition-transform duration-[2s]" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button onClick={() => setEditingTeamMember(member)} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onClick={() => handleDeleteTeamMember(member._id)} className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </div>
                    <h4 className="text-white font-oswald uppercase tracking-widest text-lg mb-1">{member.name}</h4>
                    <p className="text-xs font-sans tracking-[0.3em] text-emerald-400 uppercase">{member.title}</p>
                    <p className="text-[11px] text-gray-400 mt-2 font-light leading-relaxed">{member.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {/* PERMISSIONS TAB */}
          {activeTab === 'permissions' && (
            <div className="p-10 max-w-5xl">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-oswald text-white uppercase tracking-widest">Admin Permissions</h2>
                <div className="flex justify-end gap-4">
                  <button onClick={() => setEditingPartner({name: '', sharePercentage: 0})} className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">
                    + Add Partner
                  </button>
                  <button onClick={() => setEditingAdminUser({ email: '', password: '', permissions: [] })} className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">
                    + Add Admin User
                  </button>
                </div>
              </div>

              {editingAdminUser && (
                <div className="bg-[#111] border border-white/10 p-8 mb-10">
                  <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <h3 className="text-lg font-oswald text-white uppercase tracking-widest">{editingAdminUser._id ? 'Edit Admin User' : 'New Admin User'}</h3>
                    <button onClick={() => setEditingAdminUser(null)} className="text-white hover:text-red-500 text-xl leading-none">&times;</button>
                  </div>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
                      const headers = { Authorization: `Bearer ${token}` };
                      if (editingAdminUser._id) {
                        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin-users/${editingAdminUser._id}`, editingAdminUser, { headers });
                      } else {
                        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin-users`, editingAdminUser, { headers });
                      }
                      alert('Admin user saved successfully!');
                      setEditingAdminUser(null);
                      fetchAdminUsers();
                    } catch (err) {
                      console.error(err);
                      alert(err.response?.data?.message || 'Failed to save admin user');
                    }
                  }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Admin Email</label>
                        <input 
                          type="email" 
                          required
                          className="w-full bg-black border border-white/10 p-4 text-white outline-none focus:border-white/50 transition-colors" 
                          value={editingAdminUser.email || ''} 
                          onChange={e => setEditingAdminUser({...editingAdminUser, email: e.target.value})} 
                          placeholder="admin@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Password</label>
                        <input 
                          type="password" 
                          required={!editingAdminUser._id}
                          className="w-full bg-black border border-white/10 p-4 text-white outline-none focus:border-white/50 transition-colors" 
                          value={editingAdminUser.password || ''} 
                          onChange={e => setEditingAdminUser({...editingAdminUser, password: e.target.value})} 
                          placeholder={editingAdminUser._id ? "Leave blank to keep existing" : "Required"}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-4 tracking-widest">Assign Permissions</label>
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded">
                          {['dashboard', 'leads', 'inquiries', 'follow ups', 'studio bookings', 'calendar', 'slots', 'customers', 'testimonials', 'team', 'cms', 'hero', 'landing pages', 'studio', 'services', 'themes', 'gallery', 'client gallery', 'permissions', 'developer options', 'add partner']
                            .filter(perm => isSuperAdmin || userPermissions.includes(perm))
                            .map(perm => (
                            <label key={perm} className={`flex items-center gap-3 ${storedUser.email === editingAdminUser.email ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                              <input 
                                type="checkbox" 
                                disabled={storedUser.email === editingAdminUser.email}
                                className="w-4 h-4 accent-white disabled:opacity-50"
                                checked={(editingAdminUser.permissions || []).includes(perm)}
                                onChange={(e) => {
                                  const perms = new Set(editingAdminUser.permissions || []);
                                  if (e.target.checked) perms.add(perm);
                                  else perms.delete(perm);
                                  setEditingAdminUser({...editingAdminUser, permissions: Array.from(perms)});
                                }}
                              />
                              <span className="text-xs text-white uppercase tracking-widest">{perm}</span>
                            </label>
                          ))}
                        </div>
                        <div className="p-6 bg-purple-500/5 border border-purple-500/30 rounded">
                          <label className="block text-[10px] uppercase text-purple-400 mb-4 tracking-widest font-bold">Business Module</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['business', 'overview', 'studio shoots', 'props rentals', 'events']
                              .filter(perm => isSuperAdmin || userPermissions.includes(perm))
                              .map(perm => (
                              <label key={perm} className={`flex items-center gap-3 ${storedUser.email === editingAdminUser.email ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                <input 
                                  type="checkbox" 
                                  disabled={storedUser.email === editingAdminUser.email}
                                  className="w-4 h-4 accent-purple-500 disabled:opacity-50"
                                  checked={(editingAdminUser.permissions || []).includes(perm)}
                                  onChange={(e) => {
                                    const perms = new Set(editingAdminUser.permissions || []);
                                    if (e.target.checked) perms.add(perm);
                                    else perms.delete(perm);
                                    setEditingAdminUser({...editingAdminUser, permissions: Array.from(perms)});
                                  }}
                                />
                                <span className="text-xs text-white uppercase tracking-widest">{perm}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 pt-4 border-t border-white/10 mt-6">
                      <button type="submit" className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-gray-200">
                        Save Admin User
                      </button>
                      <button type="button" onClick={() => setEditingAdminUser(null)} className="px-8 py-3 border border-white/20 text-white uppercase tracking-widest text-xs hover:bg-white/5">CANCEL</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-[#111] border border-white/10 overflow-hidden">
                <table className="w-full text-left font-sans text-sm">
                  <thead className="bg-white/5 text-xs uppercase font-oswald tracking-[0.1em] text-gray-400">
                    <tr>
                      <th className="px-6 py-4">Admin Email</th>
                      <th className="px-6 py-4">Permissions</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adminUsers.map(user => (
                      <tr key={user._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white font-bold">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {user.isSuperAdmin ? (
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] uppercase tracking-widest rounded">Super Admin</span>
                            ) : (
                              user.permissions?.length > 0 ? user.permissions.map(p => (
                                <span key={p} className="px-2 py-1 bg-white/10 text-gray-300 border border-white/10 text-[9px] uppercase tracking-widest rounded">{p}</span>
                              )) : <span className="text-gray-500 italic text-xs">No permissions</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            {!user.isSuperAdmin && (
                              <>
                                <button onClick={() => setEditingAdminUser(user)} className="text-gray-400 hover:text-white uppercase text-xs tracking-widest transition-colors">Edit</button>
                                <button 
                                  onClick={async () => {
                                    if(window.confirm('Are you sure you want to delete this admin user?')) {
                                      try {
                                        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin-users/${user._id}`, {
                                          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}` }
                                        });
                                        fetchAdminUsers();
                                      } catch(err) {
                                        alert(err.response?.data?.message || 'Failed to delete user');
                                      }
                                    }
                                  }} 
                                  className="text-red-500 hover:text-red-400 uppercase text-xs tracking-widest transition-colors"
                                >Delete</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {adminUsers.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500 italic">No admin users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DEVELOPER OPTIONS TAB */}
          {activeTab === 'developer options' && (
            <div className="p-10 max-w-4xl">
              <h2 className="text-2xl font-oswald text-white uppercase tracking-widest mb-10 border-b border-white/10 pb-4">
                Developer Options
              </h2>
              
              <div className={`${glassPanel} p-8 mb-8`}>
                  <h3 className="text-xl font-oswald text-white uppercase tracking-widest mb-2">
                    Portfolio Mode Settings
                  </h3>
                  <p className="text-sm font-sans text-gray-400 tracking-wider leading-relaxed mb-6">
                    Add website domains (e.g., your portfolio, linkedin.com) that will trigger read-only mode for visitors. When active, forms and booking submissions will be disabled, and a disclaimer will be shown.
                  </p>
                  <div>
                    <label className="block text-xs uppercase text-gray-500 mb-2">Allowed Referrers (comma separated)</label>
                    <textarea 
                      className={`${glassInput} mb-6`} 
                      rows="2" 
                      placeholder="e.g. saiprasanth.com, linkedin.com" 
                      value={settings.portfolioReferrers ? settings.portfolioReferrers.join(', ') : ''} 
                      onChange={e => setSettings({...settings, portfolioReferrers: e.target.value.split(',').map(r => r.trim()).filter(r => r)})}
                    />

                    <label className="block text-[10px] uppercase text-gray-500 mb-3 tracking-widest">Displays</label>
                    <div className="space-y-4 mb-6">
                      {(settings.displays || []).map((disp, idx) => (
                        <div key={idx} className="flex gap-4 items-center">
                          <input 
                            type="text" 
                            className="w-full bg-[#111] border border-white/10 rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
                            placeholder="Website Link"
                            value={disp.websiteLink}
                            onChange={e => {
                              const newDisplays = [...(settings.displays || [])];
                              newDisplays[idx].websiteLink = e.target.value;
                              setSettings({...settings, displays: newDisplays});
                            }}
                          />
                          <input 
                            type="text" 
                            className="w-full bg-[#111] border border-white/10 rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
                            placeholder="Description"
                            value={disp.description}
                            onChange={e => {
                              const newDisplays = [...(settings.displays || [])];
                              newDisplays[idx].description = e.target.value;
                              setSettings({...settings, displays: newDisplays});
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const newDisplays = (settings.displays || []).filter((_, i) => i !== idx);
                              setSettings({...settings, displays: newDisplays});
                            }}
                            className="text-red-500 hover:text-red-400 p-2 text-lg"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mb-8">
                      <button 
                        type="button"
                        onClick={() => {
                          const newDisplays = [...(settings.displays || []), { websiteLink: '', description: '' }];
                          setSettings({...settings, displays: newDisplays});
                        }}
                        className="px-6 py-3 border border-white/10 bg-[#111] text-white text-xs uppercase tracking-widest hover:bg-white/5 rounded"
                      >
                        + Add Display
                      </button>
                    </div>

                    <button 
                      type="button" 
                      onClick={async () => {
                        try {
                          await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/contact`, {
                            contactEmail: settings.contactEmail,
                            whatsappNumber: settings.whatsappNumber,
                            teamEmails: settings.teamEmails,
                            portfolioReferrers: settings.portfolioReferrers,
                            footerStudioAddress: settings.footerStudioAddress,
                            footerSocials: settings.footerSocials,
                            displays: settings.displays
                          });
                          alert('Portfolio Settings saved!');
                        } catch(err) {
                          alert('Failed to save settings');
                        }
                      }}
                      className="px-6 py-3 rounded bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Save Referrers
                    </button>
                  </div>
                </div>

                <div className={`${glassPanel} p-8 mb-8`}>
                <h3 className="text-xl font-oswald text-white uppercase tracking-widest mb-2 flex items-center gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Maintenance Mode
                </h3>
                <p className="text-sm font-sans text-gray-400 tracking-wider leading-relaxed mb-8">
                  When enabled, all public pages will be intercepted by a Maintenance screen. Only the `/admin` portal will remain accessible. Use this when performing critical updates.
                </p>

                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.maintenanceMode || false}
                        onChange={async (e) => {
                          const newStatus = e.target.checked;
                          try {
                            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/maintenance`, { 
                              maintenanceMode: newStatus,
                              maintenanceEndTime: settings.maintenanceEndTime
                            });
                            setSettings({ ...settings, maintenanceMode: newStatus });
                          } catch (error) {
                            console.error(error);
                            alert('Failed to update maintenance mode');
                          }
                        }}
                      />
                      <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                    <span className={`text-sm font-bold uppercase tracking-widest ${settings.maintenanceMode ? 'text-red-500' : 'text-gray-500'}`}>
                      {settings.maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  {settings.maintenanceMode && (
                    <div className="bg-black/30 p-6 rounded-xl border border-white/5">
                      <label className="block text-xs uppercase text-gray-400 tracking-widest mb-3">Expected End Time (Optional)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="datetime-local" 
                          className="bg-black/50 border border-white/10 rounded px-4 py-2 text-white text-sm outline-none focus:border-white/30 [&::-webkit-calendar-picker-indicator]:invert"
                          value={settings.maintenanceEndTime ? new Date(new Date(settings.maintenanceEndTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''}
                          onChange={async (e) => {
                            const dateVal = e.target.value ? new Date(e.target.value).toISOString() : null;
                            try {
                              await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/maintenance`, { 
                                maintenanceMode: true,
                                maintenanceEndTime: dateVal
                              });
                              setSettings({ ...settings, maintenanceEndTime: dateVal });
                            } catch (error) {
                              console.error(error);
                              alert('Failed to save end time');
                            }
                          }}
                        />
                        <button 
                          onClick={async () => {
                            try {
                              await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/maintenance`, { 
                                maintenanceMode: true,
                                maintenanceEndTime: null
                              });
                              setSettings({ ...settings, maintenanceEndTime: null });
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                          className="text-xs text-red-400 uppercase tracking-widest hover:text-red-300"
                        >
                          Clear
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-2 italic">If set, a countdown timer will appear on the maintenance screen.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`${glassPanel} p-8 flex flex-col items-start`}>
                  <h3 className="text-lg font-oswald text-white uppercase tracking-widest mb-2">Admin Bypass</h3>
                  <p className="text-xs text-gray-400 mb-6 font-sans">
                    Enable bypass to view the public website while Maintenance Mode is active.
                  </p>
                  <button 
                    onClick={() => {
                      localStorage.setItem('adminBypass', 'true');
                      window.open('/', '_blank');
                    }}
                    className="px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-200 transition-colors"
                  >
                    Preview Website
                  </button>
                </div>

                <div className={`${glassPanel} p-8 flex flex-col items-start`}>
                  <h3 className="text-lg font-oswald text-white uppercase tracking-widest mb-2">System Cache</h3>
                  <p className="text-xs text-gray-400 mb-6 font-sans">
                    Clear local browser cache, saved preferences, and admin bypass flags.
                  </p>
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      alert('System cache cleared successfully. You may need to log in again if auth relies on it.');
                      window.location.reload();
                    }}
                    className="px-6 py-3 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold uppercase tracking-widest rounded transition-colors"
                  >
                    Clear Cache
                  </button>
                </div>
                <div className={`${glassPanel} p-8 flex flex-col items-start col-span-1 md:col-span-2 mt-4`}>
                  <h3 className="text-lg font-oswald text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                    ✉️ Email Delivery Tester
                  </h3>
                  <p className="text-xs text-gray-400 mb-6 font-sans">
                    Send a test email to verify that your Nodemailer setup (EMAIL_USER and EMAIL_PASS) is working correctly.
                  </p>
                  
                  <div className="flex flex-col md:flex-row w-full gap-4 items-center">
                    <input 
                      type="email" 
                      placeholder="Enter email address..." 
                      className="w-full md:flex-1 bg-black/40 border border-white/20 rounded px-4 py-2 text-white text-sm outline-none focus:border-white/50"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                    />
                    <button 
                      onClick={async () => {
                        if (!testEmailAddress) {
                          setTestEmailStatus('Please enter an email address.');
                          return;
                        }
                        setTestEmailStatus('Sending test email...');
                        try {
                          const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/test-email`, { email: testEmailAddress });
                          if (res.data.success) {
                            setTestEmailStatus('✅ Success! The test email was delivered.');
                          } else {
                            setTestEmailStatus(`❌ Failed: ${res.data.error}`);
                          }
                        } catch (err) {
                          setTestEmailStatus(`❌ Error: ${err.response?.data?.error || err.message}`);
                        }
                      }}
                      className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors"
                    >
                      Send Test Email
                    </button>
                  </div>
                  {testEmailStatus && (
                    <p className={`mt-4 text-xs font-sans tracking-wider ${testEmailStatus.includes('✅') ? 'text-green-400' : testEmailStatus.includes('❌') ? 'text-red-400' : 'text-gray-400'}`}>
                      {testEmailStatus}
                    </p>
                  )}
                </div>

              </div>
            </div>
          )}

          {(activeTab === 'business' || activeTab === 'events' || activeTab === 'props rentals') && (
            <BusinessView
              hideTabsAndOverview={activeTab === 'events' || activeTab === 'props rentals'}
              defaultViewMode={activeTab === 'events' ? 'events' : (activeTab === 'props rentals' ? 'props' : (highlightedBookingId ? 'studio_shoots' : 'overview'))} 
              bookings={bookings} 
              expenses={expenses} 
              partners={partners} 
              teamMembers={teamMembers}
              highlightedBookingId={highlightedBookingId}
              userPermissions={userPermissions}
              isSuperAdmin={isSuperAdmin}
              onAddPartner={() => setEditingPartner({name: '', sharePercentage: 0})}
              onAddExpense={(data) => setEditingExpense(data || {date: new Date().toISOString().split('T')[0], items: [{description: '', amount: 0}], type: 'Studio'})}
              onEditPartner={setEditingPartner}
              onEditExpense={setEditingExpense}
              onDeletePartner={handleDeletePartner}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          <AnimatePresence>
            {editingBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                <div className="sticky top-0 z-50 flex justify-between items-center mb-8 border-b border-white/10 pb-4 bg-[#111] -mt-8 pt-8">
                  <h3 className="text-xl font-oswald text-white uppercase tracking-widest">{editingBooking._id ? 'Edit Booking' : 'Create New Booking'}</h3>
                  <button onClick={() => setEditingBooking(null)} className="text-white hover:text-red-500 text-2xl bg-black/50 w-8 h-8 flex items-center justify-center rounded-full transition-colors">&times;</button>
                </div>
                
                <form onSubmit={handleSaveBookingDetails} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] uppercase text-gray-500 mb-2">Client Name</label>
                      <input type="text" className={glassInput} required value={editingBooking.name || ''} onChange={e => setEditingBooking({...editingBooking, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase text-gray-500 mb-2">Phone</label>
                      <input type="tel" className={glassInput} required value={editingBooking.phone || ''} onChange={e => setEditingBooking({...editingBooking, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase text-gray-500 mb-2">Email</label>
                      <input type="email" className={glassInput} required value={editingBooking.email || ''} onChange={e => setEditingBooking({...editingBooking, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase text-gray-500 mb-2">Baby Age (if applicable)</label>
                      <input type="text" className={glassInput} value={editingBooking.babyAge || ''} onChange={e => setEditingBooking({...editingBooking, babyAge: e.target.value})} />
                    </div>
                    {(() => {
                      // Gather sub-services from services
                      const availableSubServices = [];
                      (services || []).forEach(svc => {
                        if (svc.subServices && svc.subServices.length > 0) {
                          svc.subServices.forEach(sub => {
                            availableSubServices.push({
                              name: sub.name,
                              serviceName: svc.name,
                              packages: (sub.packages && sub.packages.length > 0) ? sub.packages.map(p => typeof p === 'string' ? p : p.name) : ['Silver Package', 'Gold Package', 'Platinum Package']
                            });
                          });
                        } else if (svc.packages && svc.packages.length > 0) {
                          availableSubServices.push({
                            name: svc.name,
                            serviceName: svc.name,
                            packages: svc.packages.map(p => typeof p === 'string' ? p : p.name)
                          });
                        }
                      });

                      // Only use real sub-services from DB (no fallback packagesData)

                      const selectedSub = availableSubServices.find(s => s.name === editingBooking.shootType);
                      const currentPackages = selectedSub?.packages?.length > 0 
                        ? selectedSub.packages 
                        : ['Silver Package', 'Gold Package', 'Platinum Package'];

                      return (
                        <>
                          <div>
                            <label className="block text-[11px] uppercase text-gray-500 mb-2">Shoot Type</label>
                            <select 
                              className={`${glassInput} [&>option]:bg-[#111] [&>option]:text-white`}
                              required 
                              value={editingBooking.shootType || ''} 
                              onChange={e => {
                                const selectedShoot = e.target.value;
                                setEditingBooking(prev => ({
                                  ...prev, 
                                  shootType: selectedShoot, 
                                  package: '' 
                                }));
                              }}
                            >
                              <option value="" disabled className="bg-[#111] text-gray-400">Select Shoot Type</option>
                              {availableSubServices.map((sub, idx) => (
                                <option key={idx} value={sub.name} className="bg-[#111] text-white">
                                  {sub.serviceName && sub.serviceName !== sub.name ? `${sub.name} (${sub.serviceName})` : sub.name}
                                </option>
                              ))}
                              {editingBooking.shootType && editingBooking.shootType !== 'Custom' && !availableSubServices.some(s => s.name === editingBooking.shootType) && (
                                <option value={editingBooking.shootType} className="bg-[#111] text-white">{editingBooking.shootType}</option>
                              )}
                              <option value="Custom" className="bg-[#111] text-white">Custom</option>
                            </select>
                            {editingBooking.shootType === 'Custom' && (
                              <input 
                                type="text"
                                placeholder="Enter custom shoot type"
                                className={`${glassInput} mt-2 w-full`}
                                required
                                value={editingBooking.customShootTypeValue || ''}
                                onChange={e => setEditingBooking(prev => ({...prev, customShootTypeValue: e.target.value}))}
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] uppercase text-gray-500 mb-2">Package</label>
                            <select 
                              className={`${glassInput} [&>option]:bg-[#111] [&>option]:text-white ${!editingBooking.shootType ? 'opacity-50 cursor-not-allowed' : ''}`}
                              required 
                              disabled={!editingBooking.shootType}
                              value={editingBooking.package || ''} 
                              onChange={e => setEditingBooking(prev => ({ ...prev, package: e.target.value }))}
                            >
                              <option value="" disabled className="bg-[#111] text-gray-400">
                                {editingBooking.shootType ? "Select Package" : "Select Shoot Type First"}
                              </option>
                              {currentPackages.map((pkgName, idx) => (
                                <option key={idx} value={pkgName} className="bg-[#111] text-white">{pkgName}</option>
                              ))}
                              {editingBooking.package && editingBooking.package !== 'Custom' && !currentPackages.includes(editingBooking.package) && (
                                <option value={editingBooking.package} className="bg-[#111] text-white">{editingBooking.package}</option>
                              )}
                              <option value="Custom" className="bg-[#111] text-white">Custom</option>
                            </select>
                            {editingBooking.package === 'Custom' && (
                              <input 
                                type="text"
                                placeholder="Enter custom package"
                                className={`${glassInput} mt-2 w-full`}
                                required
                                value={editingBooking.customPackageValue || ''}
                                onChange={e => setEditingBooking(prev => ({...prev, customPackageValue: e.target.value}))}
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] uppercase text-gray-500 mb-2">Shoot Date</label>
                            <input 
                              type="date" 
                              className={`${glassInput} [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-[10]`} 
                              required 
                              value={editingBooking.date || ''} 
                              onChange={e => setEditingBooking({...editingBooking, date: e.target.value})} 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] uppercase text-gray-500 mb-2">Booking Date</label>
                            <input 
                              type="date" 
                              className={`${glassInput} [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-[10]`} 
                              value={editingBooking.createdAt ? new Date(editingBooking.createdAt).toISOString().split('T')[0] : ''} 
                              onChange={e => setEditingBooking({...editingBooking, createdAt: e.target.value})} 
                            />
                          </div>
                        </>
                      );
                    })()}
                    <div>
                      <label className="block text-[11px] uppercase text-gray-500 mb-2">Time Slot</label>
                      <select className={`${glassInput} [&>option]:bg-[#111] [&>option]:text-white`} required value={editingBooking.slot || ''} onChange={e => setEditingBooking({...editingBooking, slot: e.target.value})}>
                        <option value="" disabled className="bg-[#111] text-gray-400">Select Slot</option>
                        <option value="Morning" className="bg-[#111] text-white">Morning</option>
                        <option value="Afternoon" className="bg-[#111] text-white">Afternoon</option>
                        <option value="Evening" className="bg-[#111] text-white">Evening</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] uppercase text-gray-500 mb-2">Status</label>
                      <select className={`${glassInput} [&>option]:bg-[#111] [&>option]:text-white`} required value={editingBooking.status || 'Pending'} onChange={e => setEditingBooking({...editingBooking, status: e.target.value})}>
                        <option value="Pending" className="bg-[#111] text-yellow-500">Pending</option>
                        <option value="Contacted" className="bg-[#111] text-orange-400">Contacted</option>
                        <option value="Confirmed" className="bg-[#111] text-green-500">Confirmed</option>
                        <option value="Shoot Done" className="bg-[#111] text-purple-400">Shoot Done</option>
                        <option value="Editing In Process" className="bg-[#111] text-cyan-400">Editing In Process</option>
                        <option value="Finished" className="bg-[#111] text-blue-500">Finished</option>
                        <option value="Cancelled" className="bg-[#111] text-red-500">Cancelled</option>
                      </select>
                    </div>

                    {['Confirmed', 'Finished', 'Shoot Done', 'Editing In Process'].includes(editingBooking.status) && editingBooking.bookingType !== 'Studio' && (
                      <div className="md:col-span-2 bg-black/40 border border-white/5 rounded-xl p-4 mt-2">
                        <label className="block text-[11px] uppercase text-gray-500 mb-4">Progress Tracking</label>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${editingBooking.shootCompleted ? 'bg-purple-500 border-purple-500' : 'border-white/20 bg-black/40'}`}>
                              {editingBooking.shootCompleted && <span className="text-white text-[11px]">✓</span>}
                            </div>
                            <span className="text-xs uppercase tracking-widest text-gray-400">Shoot Completed</span>
                            <input type="checkbox" className="hidden" checked={editingBooking.shootCompleted || false} onChange={e => setEditingBooking({...editingBooking, shootCompleted: e.target.checked})} />
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${editingBooking.photosDelivered ? 'bg-pink-500 border-pink-500' : 'border-white/20 bg-black/40'}`}>
                              {editingBooking.photosDelivered && <span className="text-white text-[11px]">✓</span>}
                            </div>
                            <span className="text-xs uppercase tracking-widest text-gray-400">Photos Delivered</span>
                            <input type="checkbox" className="hidden" checked={editingBooking.photosDelivered || false} onChange={e => setEditingBooking({...editingBooking, photosDelivered: e.target.checked})} />
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${editingBooking.videosDelivered ? 'bg-teal-500 border-teal-500' : 'border-white/20 bg-black/40'}`}>
                              {editingBooking.videosDelivered && <span className="text-white text-[11px]">✓</span>}
                            </div>
                            <span className="text-xs uppercase tracking-widest text-gray-400">Videos Delivered</span>
                            <input type="checkbox" className="hidden" checked={editingBooking.videosDelivered || false} onChange={e => setEditingBooking({...editingBooking, videosDelivered: e.target.checked})} />
                          </label>
                        </div>
                      </div>
                    )}
                    {editingBooking.slotHistory && editingBooking.slotHistory.length > 0 && (
                      <div className="md:col-span-2 bg-black/40 border border-white/5 rounded-xl p-4 mt-2">
                        <label className="block text-[11px] uppercase text-gray-500 mb-4">Slot Change History</label>
                        <div className="space-y-2">
                          {editingBooking.slotHistory.map((history, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row md:justify-between md:items-center text-xs text-gray-400 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                              <div>
                                <span className="text-gray-500 mr-2">{history.oldDate} ({history.oldSlot})</span>
                                ➔
                                <span className="text-green-400 ml-2">{history.newDate} ({history.newSlot})</span>
                              </div>
                              <div className="text-[11px] text-gray-600 mt-1 md:mt-0">
                                {new Date(history.changedAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] uppercase text-gray-500 mb-2">Additional Notes</label>
                      <textarea className={`${glassInput} h-24`} value={editingBooking.notes || ''} onChange={e => setEditingBooking({...editingBooking, notes: e.target.value})}></textarea>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-4 pt-6 border-t border-white/10 mt-6">
                    <button type="button" onClick={() => setEditingBooking(null)} className="px-6 py-3 bg-black border border-white/20 text-white hover:bg-white/10 rounded-lg text-xs uppercase tracking-widest font-bold transition-colors">Cancel</button>
                    <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Saving...' : 'Save Booking'}</button>
                  </div>
                </form>
              </motion.div>
            </div>
            )}
          </AnimatePresence>

          {/* --- Studio Booking Modal --- */}
          <AnimatePresence>
            {bookingStudio && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-[#111] border border-blue-500/30 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                  <h3 className="text-xl font-oswald text-white uppercase tracking-widest mb-6">Book Studio</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if(studioBookingData.slots.length === 0) {
                      alert("Please select at least one slot.");
                      return;
                    }
                    try {
                      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/studio`, studioBookingData);
                      alert('Studio booked successfully!');
                      setBookingStudio(false);
                      setStudioBookingData({ name: '', email: '', phone: '', studioName: '', date: '', slots: [] });
                      fetchData();
                    } catch (error) {
                      alert(error.response?.data?.error || 'Failed to book studio');
                    }
                  }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Client Name</label>
                      <input type="text" required className={glassInput} value={studioBookingData.name} onChange={e => setStudioBookingData({...studioBookingData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Studio Name</label>
                      <input type="text" required className={glassInput} value={studioBookingData.studioName} onChange={e => setStudioBookingData({...studioBookingData, studioName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Phone</label>
                      <input type="text" required className={glassInput} value={studioBookingData.phone} onChange={e => setStudioBookingData({...studioBookingData, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Email (Optional)</label>
                      <input type="email" className={glassInput} value={studioBookingData.email} onChange={e => setStudioBookingData({...studioBookingData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Date</label>
                      <input type="date" required className={glassInput} value={studioBookingData.date} onChange={e => setStudioBookingData({...studioBookingData, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Slots (Multiple)</label>
                      <div className="flex flex-col gap-2 mt-2">
                        {['Morning', 'Afternoon', 'Evening'].map(s => {
                          const slotInfo = studioAvailableSlots.find(info => info.slot === s);
                          const isDisabled = slotInfo && slotInfo.status === 'Fully Booked';
                          return (
                          <label key={s} className={`flex items-center gap-3 text-white text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input 
                              type="checkbox"
                              disabled={isDisabled}
                              className="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 disabled:opacity-50"
                              checked={studioBookingData.slots.includes(s) && !isDisabled}
                              onChange={(e) => {
                                if(e.target.checked) {
                                  setStudioBookingData({...studioBookingData, slots: [...studioBookingData.slots, s]});
                                } else {
                                  setStudioBookingData({...studioBookingData, slots: studioBookingData.slots.filter(slot => slot !== s)});
                                }
                              }}
                            />
                            {s} {isDisabled && <span className="text-[11px] text-red-400 uppercase tracking-widest">(Fully Booked)</span>}
                          </label>
                        )})}
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                      <button type="button" onClick={() => setBookingStudio(false)} className="px-6 py-2 border border-white/20 text-white text-xs uppercase tracking-widest rounded hover:bg-white/10 transition-colors">Cancel</button>
                      <button type="submit" disabled={isGlobalSubmitting} className="px-6 py-2 bg-blue-600 text-white text-xs uppercase font-bold tracking-widest rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isGlobalSubmitting ? 'Booking...' : 'Book Studio'}</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {isSubscriptionModalOpen && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl my-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-oswald text-white tracking-widest uppercase">Create Subscription</h3>
                    <button onClick={() => setIsSubscriptionModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
                  </div>
                  
                  <form onSubmit={handleSubscriptionSubmit} className="space-y-8">
                    {/* Client Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Client Name</label>
                        <input type="text" required className={glassInput} value={subscriptionData.name} onChange={e => setSubscriptionData({...subscriptionData, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Email</label>
                        <input type="email" required className={glassInput} value={subscriptionData.email} onChange={e => setSubscriptionData({...subscriptionData, email: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-2">Phone</label>
                        <input type="text" required className={glassInput} value={subscriptionData.phone} onChange={e => setSubscriptionData({...subscriptionData, phone: e.target.value})} />
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <div className="flex items-center gap-4 mb-6">
                        <label className="text-sm font-oswald text-white tracking-widest uppercase whitespace-nowrap">Subscription Duration:</label>
                        <select 
                          className={`${glassInput} w-32`}
                          value={subscriptionData.duration}
                          onChange={handleSubscriptionDurationChange}
                        >
                          {[...Array(12)].map((_, i) => (
                            <option key={i+1} value={i+1} className="bg-[#111] text-white">{i+1} Month{i > 0 && 's'}</option>
                          ))}
                        </select>
                      </div>

                      {/* Monthly Slots Config */}
                      <div className="space-y-4">
                        {subscriptionData.months.map((month, index) => (
                          <div key={index} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Month {index + 1}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                              <div>
                                <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1">Date</label>
                                <input 
                                  type="date" 
                                  required 
                                  className={`${glassInput} [&::-webkit-calendar-picker-indicator]:invert`} 
                                  value={month.date} 
                                  onChange={e => {
                                    const newMonths = [...subscriptionData.months];
                                    newMonths[index].date = e.target.value;
                                    setSubscriptionData({...subscriptionData, months: newMonths});
                                  }} 
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1">Slot</label>
                                <select 
                                  required
                                  className={glassInput}
                                  value={month.slot}
                                  onChange={e => {
                                    const newMonths = [...subscriptionData.months];
                                    newMonths[index].slot = e.target.value;
                                    setSubscriptionData({...subscriptionData, months: newMonths});
                                  }}
                                >
                                  <option value="Morning" className="bg-[#111]">Morning</option>
                                  <option value="Afternoon" className="bg-[#111]">Afternoon</option>
                                  <option value="Evening" className="bg-[#111]">Evening</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1">Service</label>
                                <select 
                                  required
                                  className={glassInput}
                                  value={month.mainService}
                                  onChange={e => {
                                    const newMonths = [...subscriptionData.months];
                                    newMonths[index].mainService = e.target.value;
                                    newMonths[index].shootType = ''; // Reset sub service
                                    newMonths[index].package = ''; // Reset package
                                    setSubscriptionData({...subscriptionData, months: newMonths});
                                  }}
                                >
                                  <option value="" className="bg-[#111]">Select Service</option>
                                  {services.map(s => (
                                    <option key={s._id} value={s._id} className="bg-[#111] text-white">{s.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1">Sub Service</label>
                                <select 
                                  required
                                  className={glassInput}
                                  value={month.shootType}
                                  disabled={!month.mainService}
                                  onChange={e => {
                                    const newMonths = [...subscriptionData.months];
                                    newMonths[index].shootType = e.target.value;
                                    newMonths[index].package = ''; // Reset package
                                    setSubscriptionData({...subscriptionData, months: newMonths});
                                  }}
                                >
                                  <option value="" className="bg-[#111]">Select Sub Service</option>
                                  {services.find(s => s._id === month.mainService)?.subServices?.map((sub, idx) => (
                                    <option key={idx} value={sub.name} className="bg-[#111] text-white">{sub.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1">Package</label>
                                <select 
                                  required
                                  className={glassInput}
                                  value={month.package}
                                  disabled={!month.shootType}
                                  onChange={e => {
                                    const newMonths = [...subscriptionData.months];
                                    newMonths[index].package = e.target.value;
                                    setSubscriptionData({...subscriptionData, months: newMonths});
                                  }}
                                >
                                  <option value="" className="bg-[#111]">Select Package</option>
                                  {services.find(s => s._id === month.mainService)?.subServices?.find(sub => sub.name === month.shootType)?.packages?.map((pkg, idx) => (
                                    <option key={idx} value={pkg.name} className="bg-[#111] text-white">{pkg.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                      <button type="button" onClick={() => { setIsSubscriptionModalOpen(false); setEditingSubscriptionId(null); }} className="px-6 py-2 border border-white/20 text-white text-xs uppercase tracking-widest rounded hover:bg-white/10 transition-colors">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-purple-600 text-white text-xs uppercase font-bold tracking-widest rounded hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]">{editingSubscriptionId ? 'Save Changes' : 'Create Bookings'}</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
            
            {editingPartner && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-md bg-[#111] border border-white/10 p-6 shadow-2xl rounded-xl"
                >
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                    <h3 className="text-xl font-light uppercase tracking-widest text-white">
                      {editingPartner._id ? 'Edit Partner' : 'Add Partner'}
                    </h3>
                    <button onClick={() => setEditingPartner(null)} className="text-white/50 hover:text-white transition-colors">
                      ✕
                    </button>
                  </div>
                  <form onSubmit={editingPartner._id ? handleUpdatePartner : handleAddPartner} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Partner Name</label>
                      <input type="text" name="name" defaultValue={editingPartner.name} required className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Share Percentage (%)</label>
                      <input type="number" step="0.01" name="sharePercentage" defaultValue={editingPartner.sharePercentage} required className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white" />
                    </div>
                    <div className="pt-4 flex justify-end gap-4">
                      <button type="button" onClick={() => setEditingPartner(null)} className="px-4 py-2 text-white/50 hover:text-white uppercase tracking-widest text-xs">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 uppercase tracking-widest text-xs font-bold rounded transition-colors">Save Partner</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
            
            {editingExpense && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-md bg-[#111] border border-white/10 p-6 shadow-2xl rounded-xl"
                >
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                    <h3 className="text-xl font-light uppercase tracking-widest text-white">
                      {editingExpense._id ? 'Edit Expense' : 'Add Expense'}
                    </h3>
                    <button onClick={() => setEditingExpense(null)} className="text-white/50 hover:text-white transition-colors">
                      ✕
                    </button>
                  </div>
                  <form onSubmit={editingExpense._id ? handleUpdateExpense : handleAddExpense} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Date</label>
                      <input type="date" value={editingExpense.date} onChange={e => setEditingExpense({...editingExpense, date: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Type</label>
                      <select value={editingExpense.type} onChange={e => setEditingExpense({...editingExpense, type: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm" disabled>
                        <option value={editingExpense.type}>{editingExpense.type}</option>
                      </select>
                    </div>

                    {!editingExpense._id ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs uppercase tracking-widest text-white/50">Expenses</label>
                          <button type="button" onClick={() => {
                            setEditingExpense({...editingExpense, items: [...(editingExpense.items || []), { description: '', amount: 0 }]})
                          }} className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded">+ Add Row</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                          {(editingExpense.items || [{ description: '', amount: 0 }]).map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input type="text" placeholder="Expense Name" value={item.description} onChange={e => {
                                const newItems = [...editingExpense.items];
                                newItems[idx].description = e.target.value;
                                setEditingExpense({...editingExpense, items: newItems});
                              }} required className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-xs" />
                              <input type="number" placeholder="Price (₹)" value={item.amount} onChange={e => {
                                const newItems = [...editingExpense.items];
                                newItems[idx].amount = Number(e.target.value);
                                setEditingExpense({...editingExpense, items: newItems});
                              }} required className="w-24 bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-xs" />
                              {(editingExpense.items?.length > 1) && (
                                <button type="button" onClick={() => {
                                  const newItems = editingExpense.items.filter((_, i) => i !== idx);
                                  setEditingExpense({...editingExpense, items: newItems});
                                }} className="text-red-500 hover:text-red-400">✕</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Expense Name</label>
                          <input type="text" name="description" defaultValue={editingExpense.description} required className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Price (₹)</label>
                          <input type="number" name="amount" defaultValue={editingExpense.amount} required className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                      </>
                    )}

                    <div className="pt-4 flex justify-end gap-4">
                      <button type="button" onClick={() => setEditingExpense(null)} className="px-4 py-2 text-white/50 hover:text-white uppercase tracking-widest text-xs">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 uppercase tracking-widest text-xs font-bold rounded transition-colors">Save Expense</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {/* EXPENSES DETAILS MODAL */}
            {viewingExpensesBookingId && (
              <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${glassPanel} p-8 w-full max-w-lg`}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-oswald text-white uppercase tracking-widest">Expense Details</h2>
                    <button onClick={() => setViewingExpensesBookingId(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto custom-scrollbar mb-6 space-y-3">
                    {(() => {
                      const bookingExpenses = expenses.filter(ex => ex.bookingId === viewingExpensesBookingId);
                      if (bookingExpenses.length === 0) return <p className="text-xs text-gray-500 italic uppercase">No expenses recorded yet.</p>;
                      
                      return bookingExpenses.map((ex, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/5 rounded px-3 py-2 group">
                          <div className="flex flex-col">
                            <span className="text-[11px] text-white uppercase">{ex.description}</span>
                            <span className="text-[9px] text-gray-500">{new Date(ex.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[11px] text-red-400 font-bold uppercase tracking-widest">Rs. {ex.amount}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              <button onClick={() => setEditingExpense(ex)} className="text-[10px] px-2 py-1 bg-amber-500/20 text-amber-500 hover:bg-amber-500/40 rounded uppercase tracking-widest transition-colors">Edit</button>
                              <button onClick={() => handleDeleteExpense(ex._id)} className="text-[10px] px-2 py-1 bg-red-500/20 text-red-500 hover:bg-red-500/40 rounded uppercase tracking-widest transition-colors">Delete</button>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </motion.div>
              </div>
            )}

          {/* ─── CLIENT GALLERY TAB ─── */}
          {activeTab === 'client gallery' && (
            <motion.div key="client-gallery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="p-6 md:p-10 max-w-5xl">
              <h2 className="text-2xl font-oswald text-white uppercase tracking-widest mb-2 border-b border-white/10 pb-4">
                Client Image Galleries
              </h2>
              <p className="text-xs text-gray-500 tracking-wider mb-8">
                Share a Google Drive folder link and assign it to a client email. Clients visit <span className="text-white/70">/my-gallery</span> and enter their email to browse and select images. You receive the selections as a CSV.
              </p>

              {/* CREATE GALLERY FORM */}
              <div className={`${glassPanel} p-6 mb-8`}>
                <h3 className="text-sm font-oswald text-white uppercase tracking-widest mb-6">Add New Client Gallery</h3>
                <form onSubmit={handleCreateGallery} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-2 tracking-widest">Client Name</label>
                    <input className={glassInput} placeholder="e.g. Ravi &amp; Priya" value={newGalleryForm.clientName} onChange={e => setNewGalleryForm({...newGalleryForm, clientName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-2 tracking-widest">Client Email *</label>
                    <input className={glassInput} type="email" placeholder="client@example.com" value={newGalleryForm.clientEmail} onChange={e => setNewGalleryForm({...newGalleryForm, clientEmail: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-2 tracking-widest">Event Name *</label>
                    <input className={glassInput} placeholder="e.g. Wedding Reception" value={newGalleryForm.eventName} onChange={e => setNewGalleryForm({...newGalleryForm, eventName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-2 tracking-widest">Google Drive Folder Link *</label>
                    <input className={glassInput} placeholder="https://drive.google.com/drive/folders/..." value={newGalleryForm.folderLink} onChange={e => setNewGalleryForm({...newGalleryForm, folderLink: e.target.value})} required />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-2">
                    {galleryCreateError && <p className="text-red-400 text-xs tracking-wider">{galleryCreateError}</p>}
                    {galleryCreateSuccess && <p className="text-emerald-400 text-xs tracking-wider">{galleryCreateSuccess}</p>}
                    <button type="submit" disabled={isCreatingGallery} className="px-6 py-3 bg-white text-black text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 w-fit">
                      {isCreatingGallery ? 'Creating...' : '+ Create Gallery'}
                    </button>
                  </div>
                </form>
              </div>

              {/* GALLERIES LIST */}
              <div className={`${glassPanel} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-oswald text-white uppercase tracking-widest">All Client Galleries</h3>
                  <div className="flex gap-2">
                    <button onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-gallery/download-all-selections`, '_blank')} className="text-[10px] uppercase bg-white text-black hover:bg-gray-200 font-bold tracking-widest px-4 py-2 rounded-lg transition-all">Download All Selections (ZIP)</button>
                    <button onClick={fetchClientGalleries} className="text-[10px] uppercase text-gray-400 hover:text-white tracking-widest border border-white/10 px-3 py-2 rounded-lg transition-all">Refresh</button>
                  </div>
                </div>
                {isLoadingClientGalleries ? (
                  <p className="text-gray-500 text-xs tracking-wider py-6">Loading galleries...</p>
                ) : clientGalleries.length === 0 ? (
                  <p className="text-gray-500 text-xs tracking-wider py-6">No galleries created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(
                      clientGalleries.reduce((acc, gallery) => {
                        const email = gallery.clientEmail;
                        if (!acc[email]) acc[email] = { clientName: gallery.clientName, galleries: [] };
                        acc[email].galleries.push(gallery);
                        return acc;
                      }, {})
                    ).map(([email, data]) => {
                      const hasSubmitted = data.galleries.some(g => g.status === 'Submitted');
                      const allImages = data.galleries.flatMap(g => g.images.map(img => ({ ...img, eventName: g.eventName, galleryId: g._id })));
                      const selectedImages = allImages.filter(i => i.isSelected);
                      
                      return (
                        <div key={email} className="border border-white/10 rounded-xl overflow-hidden">
                          {/* Email Group Header */}
                          <div 
                            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-white/5 hover:bg-white/[0.08] transition-all cursor-pointer"
                            onClick={() => setExpandedEmail(expandedEmail === email ? null : email)}
                          >
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-white uppercase tracking-wider">{data.clientName || '—'}</span>
                              <span className="text-[10px] text-gray-500 mt-0.5">{email}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-[9px] text-gray-400">{data.galleries.length} Events</span>
                              <span className="text-[9px] text-gray-400">
                                {allImages.length} images {selectedImages.length > 0 && `(${selectedImages.length} selected)`}
                              </span>
                              
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  const link = `${window.location.origin}/my-gallery?email=${encodeURIComponent(email)}`;
                                  navigator.clipboard.writeText(link);
                                  alert(`Client link copied to clipboard!\n\n${link}`);
                                }}
                                className="text-[10px] px-3 py-1 bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-lg uppercase tracking-widest transition-all"
                                title="Copy direct shareable link for this client"
                              >
                                📋 Copy Link
                              </button>
                              
                              {hasSubmitted && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-gallery/download-email/${encodeURIComponent(email)}`, '_blank');
                                  }}
                                  className="text-[10px] px-4 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/30 rounded-lg uppercase tracking-widest transition-all font-bold"
                                >
                                  Download ZIP
                                </button>
                              )}
                              
                              <span className="text-gray-500 text-xs">{expandedEmail === email ? '▲' : '▼'}</span>
                            </div>
                          </div>
                          
                          {/* Individual Galleries in this Email Group */}
                          <div className="p-4 space-y-3">
                            {data.galleries.map(gallery => (
                              <div key={gallery._id} className="border border-white/10 rounded-xl overflow-hidden">
                                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-white/5 hover:bg-white/[0.08] transition-all cursor-pointer" onClick={() => setExpandedEmail(expandedEmail === gallery._id ? null : gallery._id)}>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">{gallery.clientName || '—'} — {gallery.eventName}</span>
                                    <span className="text-[10px] text-gray-500 mt-0.5">{gallery.clientEmail}</span>
                                  </div>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`text-[9px] px-2 py-1 rounded-full uppercase tracking-widest font-bold border ${gallery.status === 'Submitted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                                      {gallery.status}
                                    </span>
                                    <span className="text-[9px] text-gray-400">
                                      {gallery.images.length} images {gallery.images.filter(i => i.isSelected).length > 0 && `(${gallery.images.filter(i => i.isSelected).length} selected)`}
                                    </span>
                                    <button
                                      onClick={e => { e.stopPropagation(); handleSyncGallery(gallery._id); }}
                                      disabled={syncingGalleryId === gallery._id}
                                      className="text-[10px] px-3 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg uppercase tracking-widest transition-all disabled:opacity-50"
                                      title="Re-read photos from Google Drive folder"
                                    >
                                      {syncingGalleryId === gallery._id ? 'Syncing...' : '↻ Sync Drive'}
                                    </button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        const link = `${window.location.origin}/my-gallery?email=${encodeURIComponent(gallery.clientEmail)}&galleryId=${gallery._id}`;
                                        navigator.clipboard.writeText(link);
                                        alert(`Client link copied to clipboard!\n\n${link}`);
                                      }}
                                      className="text-[10px] px-3 py-1 bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-lg uppercase tracking-widest transition-all"
                                      title="Copy direct shareable link for this client"
                                    >
                                      📋 Copy Link
                                    </button>
                                    
                                    {gallery.status === 'Submitted' && (
                                      <button
                                        onClick={e => {
                                          e.stopPropagation();
                                          window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-gallery/${gallery._id}/download-selections`, '_blank');
                                        }}
                                        className="text-[10px] px-3 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/30 rounded-lg uppercase tracking-widest transition-all"
                                      >
                                        Download ZIP
                                      </button>
                                    )}

                                    {gallery.status === 'Submitted' && (
                                      <button
                                        onClick={e => { e.stopPropagation(); handleExportGalleryCSV(gallery._id, gallery.clientName, gallery.eventName); }}
                                        className="text-[10px] px-3 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/30 rounded-lg uppercase tracking-widest transition-all"
                                      >
                                        Export CSV
                                      </button>
                                    )}
                                    {gallery.status === 'Submitted' && (
                                      <button
                                        onClick={e => {
                                          e.stopPropagation();
                                          if(window.confirm('Unlock this gallery to allow the client to edit their selection?')) {
                                            handleUnlockGallery(gallery._id);
                                          }
                                        }}
                                        className="text-[10px] px-3 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg uppercase tracking-widest transition-all"
                                      >
                                        Unlock for Edit
                                      </button>
                                    )}
                                    <button
                                      onClick={e => { e.stopPropagation(); handleDeleteGallery(gallery._id); }}
                                      className="text-[10px] px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/30 border border-red-500/20 rounded-lg uppercase tracking-widest transition-all"
                                    >
                                      Delete
                                    </button>
                                    <span className="text-gray-500 text-xs">{expandedEmail === gallery._id ? '▲' : '▼'}</span>
                                  </div>
                                </div>
                                {expandedEmail === gallery._id && (
                                  <div className="px-5 py-4 bg-black/20 border-t border-white/5">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                      <p className="text-[10px] uppercase text-gray-500 tracking-widest">
                                        Drive Folder: <a href={gallery.folderLink} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline normal-case">{gallery.folderLink.length > 55 ? gallery.folderLink.substring(0, 55) + '...' : gallery.folderLink}</a>
                                      </p>
                                      <span className="text-[10px] text-gray-400 tracking-wider">
                                        {gallery.images.filter(i => i.isSelected).length} of {gallery.images.length} selected by client
                                      </span>
                                    </div>
                                    {gallery.images.length === 0 ? (
                                      <p className="text-gray-600 text-xs">No images found.</p>
                                    ) : (
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                                        {gallery.images.map((img, idx) => (
                                          <div key={idx} className={`relative rounded-lg overflow-hidden border p-1 transition-all ${img.isSelected ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-white/5 border-white/5'}`}>
                                            <div className="aspect-square rounded overflow-hidden mb-1 bg-black/40">
                                              <img
                                                src={`https://drive.google.com/thumbnail?id=${img.driveId}&sz=w200`}
                                                alt={img.name}
                                                className="w-full h-full object-cover"
                                                onError={e => {
                                                  const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-gallery/image/${img.driveId}`;
                                                  if (e.target.src !== proxyUrl) {
                                                    e.target.src = proxyUrl;
                                                  } else {
                                                    e.target.style.display = 'none';
                                                  }
                                                }}
                                              />
                                            </div>
                                            <p className={`text-[9px] truncate font-mono ${img.isSelected ? 'text-emerald-300 font-bold' : 'text-gray-400'}`}>
                                              {img.isSelected ? '✓ ' : ''}{img.name}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {gallery.submittedAt && (
                                      <p className="text-[10px] text-gray-500 mt-3">Submitted: {new Date(gallery.submittedAt).toLocaleString()}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-2">How it works for clients</p>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Share the link <span className="text-white/70">yourdomain.com/my-gallery</span> with your client</li>
                  <li>Client enters their email address to access their assigned galleries</li>
                  <li>Client views all images, clicks to select, then submits</li>
                  <li>Gallery status changes to "Submitted" — click <strong className="text-white">Export CSV</strong> above to download their choices</li>
                </ol>
                <p className="text-[10px] text-yellow-400/70 mt-3 tracking-wider">⚠️ Make sure you have shared the Google Drive folder with your Service Account email as a Viewer.</p>
              </div>
            </motion.div>
          )}

          </AnimatePresence>

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
