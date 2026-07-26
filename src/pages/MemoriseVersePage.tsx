import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Trash2, RefreshCw, Check, Eye, Loader2, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MemoryVerse {
  id: string;
  reference: string;
  text: string;
  mastery: number; // 0-5
  next_review_at: string | null;
  created_at: string;
}

// Leitner SRS intervals in days: level 1→1d, 2→3d, 3→7d, 4→21d, 5→60d
const SRS_INTERVALS = [1, 3, 7, 21, 60];

function getNextReviewDate(mastery: number): string {
  const days = SRS_INTERVALS[Math.min(mastery, SRS_INTERVALS.length - 1)] ?? 60;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function isDueToday(next_review_at: string | null): boolean {
  if (!next_review_at) return true; // never reviewed = always due
  return new Date(next_review_at) <= new Date();
}

// Given text and mastery level 0-5, blank out an increasing proportion of words
function blankedText(text: string, mastery: number): { word: string; blanked: boolean }[] {
  const words = text.split(' ');
  const blankFraction = mastery === 0 ? 0 : Math.min(0.2 + (mastery - 1) * 0.15, 0.8);
  const interval = blankFraction > 0 ? Math.max(1, Math.round(1 / blankFraction)) : Infinity;
  return words.map((word, i) => ({
    word,
    blanked: mastery > 0 && (i + 1) % interval === 0,
  }));
}

export default function MemoriseVersePage() {
  const { user } = useAuth();
  const [verses, setVerses] = useState<MemoryVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRef, setNewRef] = useState('');
  const [newText, setNewText] = useState('');
  const [saving, setSaving] = useState(false);

  // Practice mode state
  const [practising, setPractising] = useState<MemoryVerse | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [showFull, setShowFull] = useState(false);

  const fetchVerses = useCallback(async () => {
    const { data } = await supabase
      .from('memory_verses')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (data) setVerses(data as MemoryVerse[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (user) fetchVerses();
  }, [user, fetchVerses]);

  const handleAdd = async () => {
    if (!newRef.trim() || !newText.trim() || !user) return;
    setSaving(true);
    const { data } = await supabase.from('memory_verses').insert({
      user_id: user.id,
      reference: newRef.trim(),
      text: newText.trim(),
      mastery: 0,
      next_review_at: null, // immediately due
    }).select().single();
    if (data) setVerses(prev => [data as MemoryVerse, ...prev]);
    setShowAdd(false);
    setNewRef('');
    setNewText('');
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this verse from memory practice?')) return;
    await supabase.from('memory_verses').delete().eq('id', id);
    setVerses(prev => prev.filter(v => v.id !== id));
  };

  const handlePractise = (verse: MemoryVerse) => {
    setPractising(verse);
    setRevealed(new Set());
    setShowFull(false);
  };

  const handleMastered = async () => {
    if (!practising) return;
    const newMastery = Math.min(practising.mastery + 1, 5);
    const next = getNextReviewDate(newMastery);
    await supabase.from('memory_verses').update({ mastery: newMastery, next_review_at: next }).eq('id', practising.id);
    setVerses(prev => prev.map(v => v.id === practising.id ? { ...v, mastery: newMastery, next_review_at: next } : v));
    setPractising(null);
  };

  const handleResetMastery = async (verse: MemoryVerse) => {
    await supabase.from('memory_verses').update({ mastery: 0, next_review_at: null }).eq('id', verse.id);
    setVerses(prev => prev.map(v => v.id === verse.id ? { ...v, mastery: 0, next_review_at: null } : v));
  };

  const masteryLabel = (m: number) => ['Not started', 'Level 1 — Few Blanks', 'Level 2 — Some Blanks', 'Level 3 — Many Blanks', 'Level 4 — Heavy Blanks', '⭐ Memorised!'][m];
  const masteryColor = (m: number) => ['opacity-40', 'text-orange-400', 'text-yellow-400', 'text-blue-400', 'text-indigo-400', 'text-emerald-400'][m];

  const dueVerses = verses.filter(v => isDueToday(v.next_review_at));
  const upcomingVerses = verses.filter(v => !isDueToday(v.next_review_at));

  const formatReviewDate = (iso: string | null) => {
    if (!iso) return 'Due now';
    const d = new Date(iso);
    return `Review: ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  };

  const VerseCard = ({ verse }: { verse: MemoryVerse }) => {
    const due = isDueToday(verse.next_review_at);
    return (
      <motion.div
        className={`glass-panel p-5 rounded-2xl flex items-center gap-4 ${due ? 'ring-1 ring-amber-400/40' : ''}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-bold text-sm">{verse.reference}</p>
            {due && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400">Due</span>}
            <span className={`text-[10px] font-bold ${masteryColor(verse.mastery)}`}>{masteryLabel(verse.mastery)}</span>
          </div>
          <p className="text-xs opacity-60 line-clamp-2 font-serif italic">"{verse.text}"</p>
          <div className="flex gap-1 mt-3">
            {[1, 2, 3, 4, 5].map(lvl => (
              <div key={lvl} className={`h-1 flex-1 rounded-full transition-all ${verse.mastery >= lvl ? 'bg-[var(--accent)]' : 'bg-[var(--bg-card)]'}`} />
            ))}
          </div>
          {verse.next_review_at && !isDueToday(verse.next_review_at) && (
            <p className="text-[10px] opacity-40 mt-1.5">{formatReviewDate(verse.next_review_at)}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handlePractise(verse)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white ${due ? 'ring-1 ring-amber-400/40' : ''}`}
            style={{ background: 'var(--accent)' }}>
            <BookOpen className="w-3.5 h-3.5" /> Practise
          </motion.button>
          <div className="flex gap-1">
            {verse.mastery > 0 && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleResetMastery(verse)}
                className="p-1.5 opacity-40 hover:opacity-80 transition-opacity" title="Reset progress">
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(verse.id)}
              className="p-1.5 text-red-400 opacity-40 hover:opacity-100 transition-opacity">
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
          <div>
            <h1 className="text-2xl font-bold">Memorise Verses</h1>
            <p className="text-xs opacity-50">Hide His Word in your heart</p>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'var(--accent)' }}>
          <Plus className="w-4 h-4" /> Add Verse
        </motion.button>
      </header>

      {/* Practise Modal */}
      <AnimatePresence>
        {practising && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
              className="w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Practising</p>
                  <h2 className="text-2xl font-bold">{practising.reference}</h2>
                  <p className={`text-xs font-semibold mt-1 ${masteryColor(practising.mastery)}`}>{masteryLabel(practising.mastery)}</p>
                </div>
                <button onClick={() => setPractising(null)} className="p-2 opacity-50 hover:opacity-100 rounded-full hover:bg-white/10">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 rounded-3xl mb-6 leading-loose text-lg font-serif" style={{ background: 'var(--bg-card)' }}>
                {showFull ? (
                  <p className="italic">"{practising.text}"</p>
                ) : (
                  <p className="italic">
                    {blankedText(practising.text, practising.mastery).map((item, i) => (
                      <span key={i}>
                        {item.blanked ? (
                          <motion.span
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRevealed(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; })}
                            className={`inline-block mx-0.5 px-1 rounded cursor-pointer transition-all select-none ${revealed.has(i) ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--bg-primary)] text-transparent'}`}
                            style={!revealed.has(i) ? { textShadow: 'none', letterSpacing: '0.1em' } : {}}
                          >
                            {item.word}
                          </motion.span>
                        ) : <span>{item.word}</span>}
                        {i < blankedText(practising.text, practising.mastery).length - 1 ? ' ' : ''}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              <p className="text-xs text-center opacity-40 mb-6">
                {practising.mastery > 0
                  ? 'Tap blanked words to reveal them. Ready when you can say it without peeking.'
                  : 'Read through the full verse first, then press "Got it!" to start blanking words.'}
              </p>

              <div className="flex flex-col gap-3">
                {!showFull && practising.mastery > 0 && (
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowFull(true)}
                    className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                    <Eye className="w-4 h-4" /> Reveal Full Verse
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleMastered}
                  className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                  style={{ background: 'var(--accent)' }}>
                  <Check className="w-5 h-5" />
                  {practising.mastery < 5 ? 'Got it! Increase Difficulty' : 'Practised! ⭐'}
                </motion.button>
              </div>

              {/* SRS next review info */}
              {practising.mastery < 5 && (
                <p className="text-[10px] text-center opacity-30 mt-4">
                  Next review after "Got it!": {SRS_INTERVALS[Math.min(practising.mastery, SRS_INTERVALS.length - 1)]} day(s) from now
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Verse Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}>
              <h2 className="text-xl font-bold mb-5">Add a Verse</h2>
              <div className="space-y-4">
                <input value={newRef} onChange={e => setNewRef(e.target.value)} placeholder="Reference (e.g. Philippians 4:13)"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }} />
                <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Paste the full verse text here..." rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none custom-scrollbar"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }} />
                <div className="flex gap-3">
                  <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border font-medium opacity-60 hover:opacity-100 text-sm" style={{ borderColor: 'var(--bg-card-border)' }}>Cancel</button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleAdd} disabled={saving || !newRef.trim() || !newText.trim()}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'var(--accent)' }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin opacity-40" /></div>
      ) : verses.length === 0 ? (
        <div className="text-center py-20 opacity-40">
          <BookOpen className="w-14 h-14 mx-auto mb-4" />
          <p className="font-semibold">No verses yet.</p>
          <p className="text-sm mt-1">Add a verse you want to hide in your heart.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Due Today */}
          {dueVerses.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2 text-amber-400">
                <Bell className="w-3.5 h-3.5" /> Due for Review ({dueVerses.length})
              </p>
              <div className="space-y-3">
                {dueVerses.map((verse, i) => (
                  <motion.div key={verse.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <VerseCard verse={verse} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingVerses.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <BookOpen className="w-3.5 h-3.5" /> Upcoming Reviews
              </p>
              <div className="space-y-3">
                {upcomingVerses.map((verse, i) => (
                  <motion.div key={verse.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <VerseCard verse={verse} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
