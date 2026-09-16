import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserProfile, Match } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  activeTab: 'discover' | 'explore' | 'likes' | 'chat' | 'profile' | 'admin';
  setActiveTab: (tab: 'discover' | 'explore' | 'likes' | 'chat' | 'profile' | 'admin') => void;
  activeChatMatch: Match | null;
  setActiveChatMatch: (match: Match | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  demoLogin: (role?: 'user' | 'admin') => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  setProfile: (profile: UserProfile | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'discover' | 'explore' | 'likes' | 'chat' | 'profile' | 'admin'>('discover');
  const [activeChatMatch, setActiveChatMatch] = useState<Match | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.getCurrentUser();
        setUser(data.user);
        setProfile(data.profile);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        api.logout();
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password });
      setUser(data.user);
      setProfile(data.profile);
      setActiveTab('discover');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const data = await api.register(payload);
      setUser(data.user);
      setProfile(data.profile);
      setActiveTab('discover');
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: 'user' | 'admin' = 'user') => {
    setIsLoading(true);
    try {
      const data = await api.demoLogin(role);
      setUser(data.user);
      setProfile(data.profile);
      setActiveTab(role === 'admin' ? 'admin' : 'discover');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setProfile(null);
    setActiveChatMatch(null);
    setActiveTab('discover');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = await api.updateProfile(updates);
    setProfile(updated);
    return updated;
  };

  const refreshUser = async () => {
    if (!api.getToken()) return;
    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      setProfile(data.profile);
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        activeTab,
        setActiveTab,
        activeChatMatch,
        setActiveChatMatch,
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
        setProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
