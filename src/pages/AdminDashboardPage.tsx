import { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, BarChart, Heart, Users, Activity, ShieldAlert, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrayers: 0,
    urgentPrayers: 0,
    activeFasts: 0,
    totalInteractions: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const [{ count: totalPrayers }, { count: urgentPrayers }, { count: activeFasts }, { count: totalInteractions }] = await Promise.all([
        supabase.from('prayer_requests').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('prayer_requests').select('*', { count: 'exact', head: true }).eq('is_urgent', true),
        supabase.from('fasting_logs').select('*', { count: 'exact', head: true }).is('end_time', null),
        supabase.from('prayer_interactions').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
      ]);

      setStats({
        totalPrayers: totalPrayers || 0,
        urgentPrayers: urgentPrayers || 0,
        activeFasts: activeFasts || 0,
        totalInteractions: totalInteractions || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'leader') {
      fetchStats();
    }
  }, [profile?.role, fetchStats]);

  if (!profile || (profile.role !== 'admin' && profile.role !== 'leader')) {
    return <Navigate to="/" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-3 mb-8">
        <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart className="w-6 h-6 text-[var(--accent)]" /> Pastoral Analytics</h1>
          <p className="text-xs opacity-60 mt-1">Anonymized congregation health (Last 7 Days)</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin opacity-40" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Prayer Requests</p>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Heart className="w-5 h-5" />
                </div>
              </div>
              <h2 className="text-4xl font-bold">{stats.totalPrayers}</h2>
              <p className="text-xs opacity-50 mt-2">Shared by the community this week</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-3xl border-2 border-red-500/20">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-red-500">Urgent Needs</p>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-red-500">{stats.urgentPrayers}</h2>
              <p className="text-xs opacity-50 mt-2">Currently flagged as emergencies</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Active Fasts</p>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <h2 className="text-4xl font-bold">{stats.activeFasts}</h2>
              <p className="text-xs opacity-50 mt-2">Congregants currently fasting</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Prayer Interactions</p>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <h2 className="text-4xl font-bold">{stats.totalInteractions}</h2>
              <p className="text-xs opacity-50 mt-2">"Praying" button clicks this week</p>
            </motion.div>
          </div>

          <div className="glass-panel p-8 rounded-3xl opacity-60 text-center text-sm">
            <p className="italic">"Be sure you know the condition of your flocks, give careful attention to your herds."</p>
            <p className="font-bold mt-2">— Proverbs 27:23</p>
          </div>
        </div>
      )}
    </div>
  );
}
