import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  denomination: string;
  church_name: string | null;
  display_name: string | null;
  theme: 'light' | 'dark' | 'parchment';
  font_size: 'sm' | 'base' | 'lg';
  streak: number;
  last_visit_date: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  updateProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        // Update streak logic: if last_visit_date is not today, increment streak
        const today = new Date().toISOString().split('T')[0];
        const profile = data as UserProfile;

        if (profile && profile.last_visit_date !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          // Streak continues if last visit was yesterday, else resets to 1
          const newStreak = profile.last_visit_date === yesterdayStr
            ? (profile.streak || 0) + 1
            : 1;

          const { data: updated } = await supabase
            .from('profiles')
            .update({ streak: newStreak, last_visit_date: today })
            .eq('id', userId)
            .select()
            .single();

          setProfile(updated as UserProfile);
        } else {
          setProfile(profile);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  /**
   * Updates a subset of the user's profile both remotely and in local state.
   * Avoids redundant re-fetches by patching the local state directly.
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    await supabase.from('profiles').update(updates).eq('id', user.id);
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
