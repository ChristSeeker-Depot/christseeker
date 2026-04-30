import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, PlusCircle, Loader2, Send, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PrayerRequest {
  id: string;
  content: string;
  is_anonymous: boolean;
  prayed_count: number;
  created_at: string;
  display_name: string | null;
  user_id: string;
}

interface PrayerInteraction {
  request_id: string;
}

export default function PrayerWallPage() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [interactions, setInteractions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setRequests(data as PrayerRequest[]);
    setLoading(false);
  }, []);

  const fetchInteractions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('prayer_interactions')
      .select('request_id')
      .eq('user_id', user.id);
    if (data) setInteractions(new Set(data.map((d: PrayerInteraction) => d.request_id)));
  }, [user]);

  useEffect(() => {
    fetchRequests();
    fetchInteractions();

    // Real-time subscription
    const channel = supabase
      .channel('prayer_wall')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRequests, fetchInteractions]);

  const handlePray = async (requestId: string) => {
    if (!user) return;
    const alreadyPrayed = interactions.has(requestId);
    if (alreadyPrayed) return;

    // Optimistic update
    setInteractions(prev => new Set([...prev, requestId]));
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, prayed_count: r.prayed_count + 1 } : r));

    await supabase.from('prayer_interactions').insert({ request_id: requestId, user_id: user.id });
    await supabase.rpc('increment_prayed_count', { request_id: requestId });
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('prayer_requests').insert({
      content: content.trim(),
      is_anonymous: isAnonymous,
      display_name: isAnonymous ? null : (profile?.display_name ?? null),
      user_id: user.id,
    });
    if (!error) {
      setContent('');
      setShowForm(false);
      fetchRequests();
    }
    setSubmitting(false);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
          <h1 className="text-2xl font-bold">Prayer Wall</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-md"
          style={{ background: 'var(--accent)' }}
        >
          <PlusCircle className="w-4 h-4" /> Add Request
        </motion.button>
      </header>

      {/* Submit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Share a Prayer Request</h2>
                <button onClick={() => setShowForm(false)} className="p-1 opacity-50 hover:opacity-100"><X className="w-5 h-5" /></button>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What would you like the community to pray for?"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 mb-4 transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
              />
              <label className="flex items-center gap-3 mb-5 cursor-pointer select-none">
                <div
                  onClick={() => setIsAnonymous(a => !a)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${isAnonymous ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 opacity-60" /> Post anonymously</span>
              </label>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Sharing...' : 'Share with Community'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin opacity-40" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 opacity-40">
          <Heart className="w-10 h-10 mx-auto mb-3" />
          <p>No prayer requests yet.<br />Be the first to share.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-5 rounded-2xl"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {req.is_anonymous ? 'Anonymous' : (req.display_name ?? 'A Brother/Sister')}
                    </span>
                    <span className="text-xs opacity-30">·</span>
                    <span className="text-xs opacity-40">{timeAgo(req.created_at)}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{req.content}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handlePray(req.id)}
                  disabled={interactions.has(req.id)}
                  className={`flex flex-col items-center gap-0.5 shrink-0 transition-all ${interactions.has(req.id) ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${interactions.has(req.id) ? 'fill-red-400 text-red-400' : ''}`}
                  />
                  <span className="text-xs font-semibold">{req.prayed_count}</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
