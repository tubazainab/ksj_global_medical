'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login state on load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('ksj-token');
      const authType = localStorage.getItem('ksj-auth-type'); // 'user' or 'employee'

      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await fetch(`${API_URL}/users/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          const data = await res.json();
          if (data.success) {
            if (authType === 'employee') {
              // Fetch Employee specific details
              const empRes = await fetch(`${API_URL}/employees/dashboard`, {
                headers: { 'Authorization': `Bearer ${storedToken}` }
              });
              const empData = await empRes.json();
              if (empData.success) {
                setEmployee({ ...data.data, dashboardMetrics: empData.data });
              } else {
                setEmployee(data.data);
              }
            } else {
              setUser(data.data);
            }
          } else {
            // Invalid/expired token
            logout();
          }
        } catch (err) {
          console.error('Auth check error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Customer Login
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('ksj-token', data.token);
        localStorage.setItem('ksj-auth-type', 'user');
        setToken(data.token);
        setUser(data.user);
        setEmployee(null);
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Server is unreachable. Make sure the backend is active.' };
    }
  };

  // Register Customer
  const register = async (name, email, phone, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server is unreachable.' };
    }
  };

  // Verify OTP
  const verifyOtp = async (email, otpCode) => {
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('ksj-token', data.token);
        localStorage.setItem('ksj-auth-type', 'user');
        setToken(data.token);
        setUser(data.user);
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Server is unreachable.' };
    }
  };

  // Employee Login
  const loginEmployee = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('ksj-token', data.token);
        localStorage.setItem('ksj-auth-type', 'employee');
        setToken(data.token);
        setEmployee(data.employee);
        setUser(null);
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Server is unreachable.' };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('ksj-token');
    localStorage.removeItem('ksj-auth-type');
    setToken(null);
    setUser(null);
    setEmployee(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  // Refresh user profile details
  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      employee,
      token,
      loading,
      login,
      register,
      verifyOtp,
      loginEmployee,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
