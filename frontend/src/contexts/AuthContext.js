// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiService from '../services/api'; // We'll update this service

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('bookwormToken'));
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // To track initial user fetch

  // Function to fetch user data if token exists
  const fetchCurrentUser = useCallback(async (currentToken) => {
      if (currentToken) {
          try {
              // apiService will need updating to handle auth header
              const response = await apiService.getCurrentUser(currentToken);
              setCurrentUser(response.data);
          } catch (error) {
              console.error("Failed to fetch current user:", error);
              // Token might be invalid/expired, clear it
              setToken(null);
              setCurrentUser(null);
              localStorage.removeItem('bookwormToken');
          }
      }
      setLoading(false); // Finished initial loading attempt
  }, []); // No dependencies needed if apiService is stable

  // Effect to load user data on initial load or when token changes
  useEffect(() => {
      setLoading(true);
      const currentToken = localStorage.getItem('bookwormToken');
      setToken(currentToken); // Ensure state matches localStorage
      fetchCurrentUser(currentToken);
  }, [fetchCurrentUser]); // Rerun if fetchCurrentUser changes (it shouldn't)


  const login = async (email, password) => {
    try {
      const response = await apiService.loginUser(email, password);
      const { access_token, refresh_token } = response.data;
      setToken(access_token);
      localStorage.setItem('bookwormToken', access_token);
      localStorage.setItem('bookwormRefreshToken', refresh_token);
      await fetchCurrentUser(access_token);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('bookwormToken');
    // Optionally redirect to home page or clear other state
    // No need to call apiService.logout unless you have a backend logout endpoint
  };

  const refreshToken = async () => {
    try {
      const currentRefreshToken = localStorage.getItem('bookwormRefreshToken');
      if (!currentRefreshToken) return false;
      
      const response = await apiService.refreshToken(currentRefreshToken);
      const { access_token } = response.data;
      setToken(access_token);
      localStorage.setItem('bookwormToken', access_token);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      return false;
    }
  };

  const checkTokenExpiration = useCallback(() => {
    const token = localStorage.getItem('bookwormToken');
    if (!token) return;
    
    // Decode token to check expiration (without verification)
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Check if token will expire in the next 5 minutes
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      if (timeUntilExpiration < 300000 && timeUntilExpiration > 0) {
        // Token expires in less than 5 minutes, refresh it
        refreshToken();
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
    }
  }, []);

  // Set up interval to check token
  useEffect(() => {
    const interval = setInterval(checkTokenExpiration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkTokenExpiration]);

  const value = {
    token,
    currentUser,
    loading, // Provide loading state for initial user check
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
