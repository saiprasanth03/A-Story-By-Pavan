import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { siteConfig } from '../config/site.config';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'forgot', 'otp', 'reset'
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const token = localStorage.getItem('adminToken');
    if (token) {
      window.location.href = '/admin';
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, 
        { email, password }
      );
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', JSON.stringify(res.data.user));
      localStorage.removeItem('adminBypass');
      window.location.href = '/admin';
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || 'Login failed. Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`, { email }, { timeout: 5000 });
      setMessage(res.data.message);
      setMode('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Error requesting OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/reset-password`, { email, otp, newPassword }, { timeout: 5000 });
      setMessage(res.data.message);
      setMode('login');
      setPassword('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-[#0f0f12]">
      <div className="w-full max-w-md bg-white border border-black/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-mirage text-[#0f0f12] uppercase tracking-widest mb-2 font-bold">{siteConfig.brand.shortName}</h1>
          <p className="text-neutral-500 font-sans text-xs uppercase tracking-widest font-semibold">Admin Portal Access</p>
        </div>

        {error && <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs text-center rounded-xl font-medium">{error}</div>}
        {message && <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center rounded-xl font-medium">{message}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] text-neutral-600 uppercase tracking-widest mb-1 font-bold">Email</label>
              <input type="email" required className="w-full bg-neutral-50 border border-black/20 text-[#0f0f12] px-4 py-3 rounded-xl outline-none focus:border-black focus:bg-white transition-colors" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-600 uppercase tracking-widest mb-1 font-bold">Password</label>
              <input type="password" required className="w-full bg-neutral-50 border border-black/20 text-[#0f0f12] px-4 py-3 rounded-xl outline-none focus:border-black focus:bg-white transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-3.5 mt-2 bg-black text-white font-sans font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors rounded-xl disabled:opacity-50 shadow-md text-xs"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center pt-4">
              <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} className="text-xs text-neutral-500 hover:text-black font-semibold transition-colors">Forgot Password?</button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-[10px] text-neutral-600 uppercase tracking-widest mb-1 font-bold">Email</label>
              <input type="email" required className="w-full bg-neutral-50 border border-black/20 text-[#0f0f12] px-4 py-3 rounded-xl outline-none focus:border-black focus:bg-white transition-colors" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 bg-black text-white font-sans font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors rounded-xl disabled:opacity-50 shadow-md text-xs">
              {isSubmitting ? 'Sending...' : 'Send OTP'}
            </button>
            <div className="text-center pt-4">
              <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-xs text-neutral-500 hover:text-black font-semibold transition-colors">Back to Login</button>
            </div>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-[10px] text-neutral-600 uppercase tracking-widest mb-1 font-bold">Email</label>
              <input type="email" required readOnly className="w-full bg-neutral-100 border border-black/10 text-neutral-500 px-4 py-3 rounded-xl outline-none cursor-not-allowed" value={email} />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-600 uppercase tracking-widest mb-1 font-bold">OTP</label>
              <input type="text" required className="w-full bg-neutral-50 border border-black/20 text-[#0f0f12] px-4 py-3 rounded-xl outline-none focus:border-black focus:bg-white transition-colors tracking-widest text-center font-bold" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-600 uppercase tracking-widest mb-1 font-bold">New Password</label>
              <input type="password" required className="w-full bg-neutral-50 border border-black/20 text-[#0f0f12] px-4 py-3 rounded-xl outline-none focus:border-black focus:bg-white transition-colors" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 bg-black text-white font-sans font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors rounded-xl disabled:opacity-50 shadow-md text-xs">
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
            <div className="text-center pt-4">
              <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-xs text-neutral-500 hover:text-black font-semibold transition-colors">Back to Login</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
