import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Plus, Loader2, Square, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function FastingTrackerPage() {
  const { user } = useAuth();
  const [fasts, setFasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeFast, setActiveFast] = useState<any>(null);
  const [now, setNow] = useState(Date.now());

  const [title, setTitle] = useState('');
  const [fastType, setFastType] = useState('Water');
  const [notes, setNotes] = useState('');

  // Tick every minute so the live timer updates
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchFasts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('fasting_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setFasts(data);
      const active = data.find((f: any) => !f.end_date);
      setActiveFast(active || null);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchFasts();
  }, [fetchFasts]);

  const handleStartFast = async () => {
    if (!user || !title) return;
    const { data } = await supabase.from('fasting_logs').insert({
      user_id: user.id,
      title,
      fast_type: fastType,
      notes,
      start_date: new Date().toISOString()
    }).select().single();
    
    if (data) {
      setFasts([data, ...fasts]);
      setActiveFast(data);
      setShowModal(false);
      setTitle('');
      setNotes('');
    }
  };

  const handleEndFast = async () => {
    if (!activeFast) return;
    const { data } = await supabase.from('fasting_logs').update({
      end_date: new Date().toISOString()
    }).eq('id', activeFast.id).select().single();

    if (data) {
      setFasts(prev => prev.map(f => f.id === data.id ? data : f));
      setActiveFast(null);
    }
  };

  const calculateDuration = (start: string, end?: string) => {
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : now;
    const totalMins = Math.floor((e - s) / 60000);
    const diffHours = Math.floor(totalMins / 60);
    const diffMins = totalMins % 60;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h ${diffMins}m`;
    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    return `${diffMins}m`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
          <h1 className="text-2xl font-bold">Fasting Tracker</h1>
        </div>
        {!activeFast && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-md" style={{ background: 'var(--accent)' }}>
            <Plus className="w-4 h-4" /> Start Fast
          </motion.button>
        )}
      </header>

      {activeFast && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl" style={{ background: 'var(--accent)' }}>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Active Fast</p>
            <h2 className="text-3xl font-bold mb-1">{activeFast.title}</h2>
            <p className="opacity-90 mb-6">{activeFast.fast_type} Fast</p>
            
            <div className="bg-black/20 px-6 py-3 rounded-2xl mb-8">
              <p className="text-xs opacity-70 uppercase tracking-widest mb-1">Duration</p>
              <p className="text-2xl font-bold">{calculateDuration(activeFast.start_date)}</p>
            </div>

            <motion.button whileTap={{ scale: 0.95 }} onClick={handleEndFast} className="flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[var(--accent)] font-bold shadow-lg">
              <Square className="w-5 h-5" /> End Fast Now
            </motion.button>
          </div>
        </motion.div>
      )}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 opacity-50 flex items-center gap-2"><History className="w-4 h-4" /> Past Fasts</h3>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin opacity-40" /></div>
        ) : fasts.filter(f => f.end_date).length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center opacity-40 italic">No completed fasts yet.</div>
        ) : (
          <div className="space-y-4">
            {fasts.filter(f => f.end_date).map(fast => (
              <div key={fast.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold">{fast.title}</h4>
                  <p className="text-xs opacity-60 mt-0.5">{fast.fast_type} • {new Date(fast.start_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--accent)]">{calculateDuration(fast.start_date, fast.end_date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.35)' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md rounded-3xl p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}>
              <h2 className="font-bold text-xl mb-4">Begin a Fast</h2>
              <div className="space-y-4">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Intention (e.g. Guidance for career)" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--bg-card-border)] focus:outline-none" />
                <select value={fastType} onChange={e => setFastType(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--bg-card-border)] focus:outline-none">
                  <option>Water Fast</option>
                  <option>Daniel Fast</option>
                  <option>Social Media Fast</option>
                  <option>Other</option>
                </select>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes or prayer points..." rows={3} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--bg-card-border)] focus:outline-none resize-none" />
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-[var(--bg-card-border)] font-medium opacity-70">Cancel</button>
                  <button onClick={handleStartFast} disabled={!title} className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-50" style={{ background: 'var(--accent)' }}>Start Fast</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
