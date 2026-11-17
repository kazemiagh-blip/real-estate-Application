import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { PropertyFilters, User } from '../types';

interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'agent';
  agencyTitle?: string;
  reraId?: string;
  specialty?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<User>;
  toggleFavorite: (propertyId: string) => Promise<boolean>;
  saveSearch: (name: string, filters: PropertyFilters) => Promise<void>;
  deleteSavedSearch: (searchId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: User | null }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    return data.user;
  };

  const register = async (input: RegisterInput) => {
    const data = await apiFetch<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const updateProfile = async (patch: Partial<User>) => {
    const data = await apiFetch<{ user: User }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setUser(data.user);
    return data.user;
  };

  const toggleFavorite = async (propertyId: string) => {
    const data = await apiFetch<{ favorites: string[]; user: User }>(
      '/api/favorites/toggle',
      {
        method: 'POST',
        body: JSON.stringify({ propertyId }),
      }
    );
    setUser(data.user);
    return data.favorites.includes(propertyId);
  };

  const saveSearch = async (name: string, filters: PropertyFilters) => {
    const data = await apiFetch<{ user: User }>('/api/saved-searches', {
      method: 'POST',
      body: JSON.stringify({ name, filters }),
    });
    setUser(data.user);
  };

  const deleteSavedSearch = async (searchId: string) => {
    const data = await apiFetch<{ user: User }>(
      `/api/saved-searches/${searchId}`,
      { method: 'DELETE' }
    );
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        toggleFavorite,
        saveSearch,
        deleteSavedSearch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
