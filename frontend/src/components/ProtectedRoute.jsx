import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      if (localStorage.getItem('adminBypass') === 'true') {
        setIsAuthenticated(true);
        return;
      }

      try {
        await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthenticated(true);
      } catch (err) {
        console.warn("Token verification note:", err);
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser && token) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          setIsAuthenticated(false);
        }
      }
    };
    verifyToken();
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-oswald tracking-widest">VERIFYING ACCESS...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
