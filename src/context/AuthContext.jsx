import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('korus_auth_token'));
  const [loading, setLoading] = useState(true);

  // Verify stored token on initial application load
  const verifyAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('korus_auth_token');

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.getMe();
      if (data.success && data.user) {
        setUser(data.user);
        setToken(storedToken);
      } else {
        // Token invalid, clear storage
        localStorage.removeItem('korus_auth_token');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.warn('[AuthContext] Token verification failed:', error.message);
      // Clear invalid/expired token
      localStorage.removeItem('korus_auth_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Login handler
  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    if (data.success && data.token && data.user) {
      localStorage.setItem('korus_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Login failed');
  };

  // Register handler
  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    if (data.success && data.token && data.user) {
      localStorage.setItem('korus_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Registration failed');
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('korus_auth_token');
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    refreshUser: verifyAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
