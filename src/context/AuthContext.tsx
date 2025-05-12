import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAdminUser, getAdminUserById, createAdminUser, type AdminUser } from '../lib/db';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  signup: (username: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const userId = localStorage.getItem('adminUserId');
      if (userId) {
        try {
          const userData = await getAdminUserById(userId);
          if (userData && userData.isActive) {
            setUser(userData);
          } else {
            localStorage.removeItem('adminUserId');
          }
        } catch (err) {
          console.error('Error fetching user:', err);
          localStorage.removeItem('adminUserId');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await loginAdminUser(identifier, password);
      if (userData) {
        setUser(userData);
        localStorage.setItem('adminUserId', userData.id!);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Create the admin user
      await createAdminUser({
        username,
        email,
        password
      });
      // Don't auto-login after signup - require explicit login
      setLoading(false);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('UNIQUE constraint failed')) {
          setError('Username or email already exists');
        } else {
          setError('An error occurred during signup');
        }
      } else {
        setError('An error occurred during signup');
      }
      console.error('Signup error:', err);
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('adminUserId');
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    signup
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 