import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Sun, Moon, Scroll, Type, User } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserProfile } from '../contexts/AuthContext';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } })
};

export default function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [nameSaved, setNameSaved] = useState(false);

  const handleSaveName = async () => {
    await updateProfile({ display_name: displayName });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleThemeChange = (theme: UserProfile['theme']) => updateProfile({ theme });
  const handleFontChange = (font_size: UserProfile['font_size']) => updateProfile({ font_size });

  const handleEraseAllData = async () => {
    if (!user) return;
    if (!window.confirm("Are you absolutely sure? This permanently deletes all your data and cannot be undone.")) return;
    setLoading(true);
    try {
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
      await supabase.from('journal_entries').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      await signOut();
      navigate('/auth');
    } catch (err) {
      console.error(err);
      alert("Failed to erase data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const themes: { value: UserProfile['theme']; label: string; icon: React.ReactNode; bg: string }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-5 h-5" />, bg: 'bg-[#F8F9FA] border-gray-200' },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" />, bg: 'bg-[#111418] border-gray-700' },
    { value: 'parchment', label: 'Parchment', icon: <Scroll className="w-5 h-5" />, bg: 'bg-[#F5EFDC] border-[#c9a96e]' },
  ];

  const fontSizes: { value: UserProfile['font_size']; label: string }[] = [
    { value: 'sm', label: 'Small' },
    { value: 'base', label: 'Medium' },
    { value: 'lg', label: 'Large' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-4 mb-10 animate-fade-in">
        <Link to="/">
          <motion.div whileTap={{ scale: 0.90 }} className="p-2 opacity-70 hover:opacity-100 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </motion.div>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <div className="space-y-5">

        {/* Profile Card */}
        <motion.div
          className="glass-panel p-6 rounded-3xl"
          variants={cardVariants} custom={0} initial="hidden" animate="visible"
        >
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 opacity-60" />
            <h3 className="font-bold">Profile</h3>
          </div>
          <div className="space-y-2 text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            <p><strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {user?.email}</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Tradition:</strong> {profile?.denomination}</p>
            {profile?.church_name && <p><strong style={{ color: 'var(--text-primary)' }}>Church:</strong> {profile.church_name}</p>}
            <p><strong style={{ color: 'var(--text-primary)' }}>Daily Streak:</strong> 🔥 {profile?.streak ?? 0} days</p>
          </div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Display Name</label>
          <div className="flex gap-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Brother Elijah"
              className="flex-1 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveName}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ background: 'var(--accent)' }}
            >
              {nameSaved ? '✓ Saved' : 'Save'}
            </motion.button>
          </div>
        </motion.div>

        {/* Appearance Card */}
        <motion.div
          className="glass-panel p-6 rounded-3xl"
          variants={cardVariants} custom={1} initial="hidden" animate="visible"
        >
          <div className="flex items-center gap-2 mb-5">
            <Type className="w-5 h-5 opacity-60" />
            <h3 className="font-bold">Appearance</h3>
          </div>

          <p className="text-sm mb-3 font-medium">Theme</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {themes.map(t => (
              <motion.button
                key={t.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleThemeChange(t.value)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 text-sm font-medium transition-all ${t.bg} ${profile?.theme === t.value ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20' : 'border-transparent'}`}
              >
                {t.icon}
                {t.label}
              </motion.button>
            ))}
          </div>

          <p className="text-sm mb-3 font-medium">Font Size</p>
          <div className="flex gap-3">
            {fontSizes.map(f => (
              <motion.button
                key={f.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFontChange(f.value)}
                className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${profile?.font_size === f.value ? 'border-[var(--accent)]' : 'border-transparent'}`}
                style={{ background: 'var(--bg-card)' }}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Account Card */}
        <motion.div
          className="glass-panel p-6 rounded-3xl"
          variants={cardVariants} custom={2} initial="hidden" animate="visible"
        >
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold">Account</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={signOut}
              className="flex-1 py-3 rounded-xl border font-medium text-sm transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--bg-card-border)', color: 'var(--text-primary)' }}
            >
              Sign Out
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleEraseAllData}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Erase All Data'}
            </motion.button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
