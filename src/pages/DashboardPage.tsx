import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, Music, LogOut, Settings, X, RefreshCw, BookMarked, Search, Wind, Heart, BookOpenCheck, Mic, Sparkles, ListChecks, Shield, Plus, Download, Clock, Users, Archive, CheckSquare, BarChart, BookHeart, Moon, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { callAI, parseAIJson } from '../lib/ai';
import { getDailyIndex, PRAYER_GUIDES } from '../data/spiritualData';
import TextToSpeech from '../components/TextToSpeech';
import html2canvas from 'html2canvas';
import { useRef } from 'react';

const ToolCard = ({ to, icon: Icon, title, desc, delay = 0, span = '' }: { to: string; icon: any; title: string; desc: string; delay?: number; span?: string }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={span}>
    <Link to={to} className="block h-full">
      <motion.div whileTap={{ scale: 0.96 }} className="glass-panel p-5 rounded-3xl h-full border-2 border-transparent hover:border-[var(--accent)]/20 transition-all group cursor-pointer">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
          <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      </motion.div>
    </Link>
  </motion.div>
);

export default function DashboardPage() {
  const { profile, signOut } = useAuth();
  const [prayerIndex, setPrayerIndex] = useState(0);
  const [modalContent, setModalContent] = useState<'verse' | 'song' | null>(null);

  const [verse, setVerse] = useState<{ text: string, reference: string, reflection: string } | null>(null);
  const [song, setSong] = useState<{ title: string, artist: string, theme: string, lyrics: string } | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const verseRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [habits, setHabits] = useState({ read: false, pray: false, silence: false });
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);

  // Prayer Deck
  const [prayerDeck, setPrayerDeck] = useState<{ id: string; content: string; display_name: string | null; is_urgent?: boolean; is_anonymous?: boolean }[]>([]);
  const [prayerDeckPrayed, setPrayerDeckPrayed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDeck = async () => {
      const { data } = await supabase
        .from('prayer_requests')
        .select('id, content, display_name, is_urgent, is_answered, is_anonymous')
        .eq('is_answered', false)
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setPrayerDeck(data as any[]);
    };
    fetchDeck();
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`habits_${today}`);
    if (saved) setHabits(JSON.parse(saved));
    // Check streak milestone
    const lastMilestone = localStorage.getItem('cs_last_milestone');
    const currentStreak = profile?.streak ?? 0;
    const milestones = [7, 30, 100];
    for (const m of milestones) {
      if (currentStreak >= m && lastMilestone !== String(m)) {
        setStreakMilestone(m);
        localStorage.setItem('cs_last_milestone', String(m));
        break;
      }
    }
  }, [profile]);

  const toggleHabit = (key: keyof typeof habits) => {
    const newHabits = { ...habits, [key]: !habits[key] };
    setHabits(newHabits);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`habits_${today}`, JSON.stringify(newHabits));
  };

  const handleExport = async () => {
    if (!verseRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(verseRef.current, { 
        backgroundColor: document.body.style.backgroundColor || '#ffffff', 
        scale: 2 
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ChristSeeker-Verse.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const denomGuides = profile?.denomination && PRAYER_GUIDES[profile.denomination]
      ? PRAYER_GUIDES[profile.denomination]
      : PRAYER_GUIDES['Non-Denominational'];
    setPrayerIndex(getDailyIndex(denomGuides.length));
  }, [profile]);

  const displayName = profile?.display_name ?? null;
  const streak = profile?.streak ?? 0;
  
  const fetchDailyContent = async (seed: string, forceRefresh = false) => {
    setLoadingDaily(true);
    const translation = profile?.bible_translation || 'NIV';
    const cacheKey = `daily_content_${seed}_${translation}`;
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setVerse(parsed.verse);
          setSong(parsed.song);
          setLoadingDaily(false);
          return;
        } catch (e) {}
      }
    }

    try {
      const raw = await callAI({
        message: `Generate daily spiritual content. Pick a completely random Bible verse (from anywhere in the entire Bible) and a completely random Christian worship song (from any era). Provide the verse text in the ${translation} translation. Return ONLY a valid JSON object with this exact structure (no markdown): { "verse": { "text": "", "reference": "", "reflection": "" }, "song": { "title": "", "artist": "", "theme": "", "lyrics": "" } }`,
        denomination: profile?.denomination || 'Non-Denominational',
        mode: 'devotional',
      });
      const parsed = parseAIJson<{ verse: typeof verse; song: typeof song }>(raw);
      setVerse(parsed.verse);
      setSong(parsed.song);
      localStorage.setItem(cacheKey, JSON.stringify(parsed));
    } catch (err) {
      console.error("Failed to fetch daily content", err);
      // Fallback
      if (!verse) {
        setVerse({ text: "Be still, and know that I am God.", reference: "Psalm 46:10", reflection: "God invites us to surrender." });
        setSong({ title: "10,000 Reasons", artist: "Matt Redman", theme: "Adoration", lyrics: "The sun comes up..." });
      }
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    if (profile === undefined) return;
    const today = new Date().toISOString().split('T')[0];
    fetchDailyContent(today);
  }, [profile]);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingChurch, setLoadingChurch] = useState(true);
  const [showAddModal, setShowAddModal] = useState<'announcement' | 'event' | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [savingChurch, setSavingChurch] = useState(false);

  const fetchChurchData = async () => {
    if (!profile?.church_id) {
      setLoadingChurch(false);
      return;
    }
    const [annRes, eveRes] = await Promise.all([
      supabase.from('announcements').select('*').eq('church_id', profile.church_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('events').select('*').eq('church_id', profile.church_id).order('event_date', { ascending: true }).limit(3)
    ]);
    if (annRes.data) setAnnouncements(annRes.data);
    if (eveRes.data) setEvents(eveRes.data);
    setLoadingChurch(false);
  };

  useEffect(() => {
    fetchChurchData();
  }, [profile?.church_id]);

  const handleSaveChurch = async () => {
    if (!profile?.church_id) return;
    setSavingChurch(true);
    try {
      if (showAddModal === 'announcement') {
        await supabase.from('announcements').insert({
          church_id: profile.church_id,
          title: newTitle,
          content: newContent
        });
      } else {
        await supabase.from('events').insert({
          church_id: profile.church_id,
          title: newTitle,
          description: newContent,
          event_date: new Date(newDate).toISOString(),
          location: newLocation
        });
      }
      await fetchChurchData();
      setShowAddModal(null);
      setNewTitle('');
      setNewContent('');
      setNewDate('');
      setNewLocation('');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingChurch(false);
    }
  };

  const denomGuides = profile?.denomination && PRAYER_GUIDES[profile.denomination]
    ? PRAYER_GUIDES[profile.denomination]
    : PRAYER_GUIDES['Non-Denominational'];
  const prayerGuide = denomGuides[prayerIndex];

  const handleRegenerate = () => {
    const today = new Date().toISOString().split('T')[0];
    fetchDailyContent(today + Math.random().toString(), true);
  };

  const canManage = profile?.role === 'leader' || profile?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen relative" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      {/* Streak Milestone Celebration */}
      <AnimatePresence>
        {streakMilestone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setStreakMilestone(null)}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-[2.5rem] p-10 text-center shadow-2xl"
              style={{ background: 'var(--bg-primary)', border: '2px solid var(--accent)' }}>
              <div className="text-6xl mb-4">🔥</div>
              <h2 className="text-3xl font-bold mb-2">{streakMilestone} Day Streak!</h2>
              <p className="opacity-60 mb-2 text-sm">
                {streakMilestone === 7 ? '"His mercies are new every morning." — Lamentations 3:23' :
                 streakMilestone === 30 ? '"Blessed is the one who perseveres..." — James 1:12' :
                 '"Well done, good and faithful servant." — Matthew 25:21'}
              </p>
              <p className="font-semibold text-[var(--accent)] mb-8">Keep seeking His face. 🙏</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStreakMilestone(null)}
                className="w-full py-3 rounded-2xl text-white font-bold"
                style={{ background: 'var(--accent)' }}>Continue</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals - Moved to top for z-index priority */}
      <AnimatePresence>
        {(modalContent || showAddModal) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => { setModalContent(null); setShowAddModal(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative max-h-[85vh] flex flex-col"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}>
              <button onClick={() => { setModalContent(null); setShowAddModal(null); }} className="absolute top-6 right-6 p-2 opacity-50 hover:opacity-100 rounded-full transition-all hover:bg-white/10">
                <X className="w-6 h-6" />
              </button>
              
              <div className="overflow-y-auto custom-scrollbar pr-2 mt-2 flex-1">
                {showAddModal ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold">Add {showAddModal === 'announcement' ? 'Announcement' : 'Event'}</h3>
                      <p className="text-xs opacity-50 mt-1">This will be visible to your entire congregation.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1 mb-1 block">Title</label>
                        <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Sunday Service Update" 
                          className="w-full px-5 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--bg-card-border)] focus:border-[var(--accent)] transition-colors focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1 mb-1 block">Content / Description</label>
                        <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Share the details..." rows={4}
                          className="w-full px-5 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--bg-card-border)] focus:border-[var(--accent)] transition-colors focus:outline-none resize-none" />
                      </div>
                      {showAddModal === 'event' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1 mb-1 block">Date & Time</label>
                            <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} 
                              className="w-full px-5 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--bg-card-border)] focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1 mb-1 block">Location</label>
                            <input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Main Hall" 
                              className="w-full px-5 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--bg-card-border)] focus:outline-none" />
                          </div>
                        </div>
                      )}
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSaveChurch} disabled={savingChurch || !newTitle} 
                        className="w-full py-4 rounded-2xl bg-[var(--accent)] text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-[var(--accent)]/20 mt-4 disabled:opacity-50">
                        {savingChurch ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        Save {showAddModal}
                      </motion.button>
                    </div>
                  </div>
                ) : modalContent === 'verse' && verse && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}>Deeper Reflection</h3>
                    <div ref={verseRef} className="p-6 -mx-6 sm:mx-0 sm:rounded-[2rem]" style={{ background: 'var(--bg-primary)' }}>
                      <h2 className="text-3xl font-serif italic mb-3">"{verse.text}"</h2>
                      <p className="font-bold text-lg mb-6">— {verse.reference}</p>
                      <div className="p-6 rounded-[2rem]" style={{ background: 'var(--bg-card)' }}>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{verse.reflection}</p>
                      </div>
                    </div>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      <TextToSpeech text={`Verse of the day. ${verse.reference}. ${verse.text}. Reflection: ${verse.reflection}`} />
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold disabled:opacity-50" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                        {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Share
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleRegenerate} disabled={loadingDaily} className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold disabled:opacity-50" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                        <RefreshCw className={`w-4 h-4 ${loadingDaily ? 'animate-spin' : ''}`} /> Generate New
                      </motion.button>
                    </div>
                  </div>
                )}
                {modalContent === 'song' && song && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}>Worship Details</h3>
                    <h2 className="text-2xl font-bold mb-1">{song.title}</h2>
                    <p className="font-medium text-lg mb-6" style={{ color: 'var(--text-muted)' }}>By {song.artist}</p>
                    
                    <div className="w-full rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: '16/9', background: '#000' }}>
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(song.title + ' ' + song.artist + ' worship')}`} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen 
                      />
                    </div>

                    <div className="p-6 rounded-[2rem] mb-6" style={{ background: 'var(--bg-card)' }}>
                      <p className="text-xs font-bold uppercase mb-3 opacity-40">Theme: {song.theme}</p>
                      <p className="text-sm italic leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>{song.lyrics}</p>
                    </div>
                    <div className="flex justify-center">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleRegenerate} disabled={loadingDaily} className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold disabled:opacity-50" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                        <RefreshCw className={`w-4 h-4 ${loadingDaily ? 'animate-spin' : ''}`} /> Generate New
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">ChristSeeker</h1>
          {displayName && <p className="text-sm opacity-60 mt-0.5">Peace to you, {displayName}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold glass-panel">🔥 {streak}</div>
          {canManage && <Link to="/admin"><motion.div whileTap={{ scale: 0.90 }} className="p-2 opacity-70 hover:opacity-100 transition-opacity text-[var(--accent)]"><BarChart className="w-5 h-5" /></motion.div></Link>}
          <Link to="/support"><motion.div whileTap={{ scale: 0.90 }} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-colors"><Heart className="w-5 h-5 fill-current" /></motion.div></Link>
          <Link to="/settings"><motion.div whileTap={{ scale: 0.90 }} className="p-2 opacity-70 hover:opacity-100 transition-opacity"><Settings className="w-5 h-5" /></motion.div></Link>
          <motion.button whileTap={{ scale: 0.90 }} onClick={signOut} className="p-2 opacity-70 hover:opacity-100 transition-opacity"><LogOut className="w-5 h-5" /></motion.button>
        </div>
      </header>

      <div className="space-y-5">
        {/* Verse of the Day */}
        <motion.div className={`glass-panel p-8 rounded-3xl text-center border-2 border-transparent transition-all ${!loadingDaily && verse ? 'cursor-pointer hover:border-[var(--accent)]/20' : ''}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          whileTap={!loadingDaily && verse ? { scale: 0.98 } : {}} onClick={() => !loadingDaily && verse && setModalContent('verse')}>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Verse of the Day</p>
          {loadingDaily || !verse ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
              <p className="text-sm opacity-60">Curating today's verse...</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-serif italic mb-4">"{verse.text}"</h2>
              <p className="font-medium">— {verse.reference}</p>
              <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>Tap to reflect & read more</p>
            </>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Speak to a Peer */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileTap={{ scale: 0.98 }}>
            <Link to="/chat" className="block h-full">
              <div className="glass-panel p-6 rounded-3xl h-full border-2 border-transparent hover:border-[var(--accent)]/20 transition-all group">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: 'var(--accent)' }}>
                  <MessageCircle className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Speak to a Peer</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Seek guidance, share your burdens, or discuss theology.</p>
              </div>
            </Link>
          </motion.div>

          {/* Prayer Guide */}
          <motion.div className="glass-panel p-6 rounded-3xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
              <BookOpen className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-xl font-bold mb-1">Prayer Guide</h3>
            <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>{profile?.denomination}</p>
            <p className="font-medium mb-2">{prayerGuide?.title}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{prayerGuide?.text}</p>
          </motion.div>

          {/* Today's Worship + Daily Disciplines — equal-height 2-col grid */}
          <div className="grid grid-cols-2 gap-5 items-stretch">
            {/* Today's Worship */}
            <motion.div className={`glass-panel p-6 rounded-3xl border-2 border-transparent transition-all h-full flex flex-col justify-between ${!loadingDaily && song ? 'cursor-pointer hover:border-[var(--accent)]/20' : ''}`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              whileTap={!loadingDaily && song ? { scale: 0.98 } : {}} onClick={() => !loadingDaily && song && setModalContent('song')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                  {loadingDaily ? <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} /> : <Music className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Today's Worship</p>
                  {loadingDaily || !song ? (
                     <p className="text-sm opacity-60 mt-1">Discovering a new song...</p>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold">{song.title}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{song.artist}</p>
                    </>
                  )}
                </div>
              </div>
              {!loadingDaily && song && <p className="text-xs mt-auto pt-4" style={{ color: 'var(--text-muted)' }}>Tap for lyrics & video</p>}
            </motion.div>

            {/* Daily Disciplines */}
            <motion.div className="glass-panel p-6 rounded-3xl h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Daily Disciplines</h3>
              <div className="space-y-3">
                {[
                  { key: 'read', label: 'Read the Word' },
                  { key: 'pray', label: 'Spent Time in Prayer' },
                  { key: 'silence', label: 'Silence & Solitude' }
                ].map(habit => (
                  <div key={habit.key} onClick={() => toggleHabit(habit.key as keyof typeof habits)} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${habits[habit.key as keyof typeof habits] ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]' : 'bg-[var(--bg-card)] border-[var(--bg-card-border)] opacity-70 hover:opacity-100'}`}>
                    <CheckSquare className={`w-5 h-5 ${habits[habit.key as keyof typeof habits] ? 'fill-current' : 'opacity-40'}`} />
                    <span className={`text-sm font-bold ${habits[habit.key as keyof typeof habits] ? '' : 'text-[var(--text-primary)]'}`}>{habit.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div className="grid grid-cols-2 gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ToolCard to="/journal" icon={BookMarked} title="Prayer Journal" desc="Write your prayers" delay={0.31} />
            <ToolCard to="/scripture" icon={Search} title="Scripture" desc="Look up any passage" delay={0.32} />
            <ToolCard to="/breath" icon={Wind} title="Breath Prayer" desc="A moment of stillness" delay={0.33} />
            <ToolCard to="/devotional" icon={Sparkles} title="Devotional" desc="AI-personalised today" delay={0.34} />
            <ToolCard to="/stronghold" icon={Shield} title="Stronghold Buster" desc="Overcome struggles" delay={0.35} />
            <ToolCard to="/fasting" icon={Clock} title="Fasting Tracker" desc="Log your spiritual fasts" delay={0.36} />
            <ToolCard to="/memorise" icon={BookHeart} title="Memorise" desc="Hide His Word in your heart" delay={0.37} />
            <ToolCard to="/evening-examen" icon={Moon} title="Evening Examen" desc="End your day with God" delay={0.38} />
            <ToolCard to="/creeds" icon={Landmark} title="Historic Creeds" desc="The faith once delivered" delay={0.39} />
          </motion.div>

          {/* Prayer Deck */}
          {prayerDeck.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Heart className="w-3.5 h-3.5" /> Prayer Deck
                </p>
                <p className="text-[10px] opacity-40">Swipe to intercede</p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {prayerDeck.map(req => (
                  <motion.div
                    key={req.id}
                    whileTap={{ scale: 0.97 }}
                    className="shrink-0 w-56 glass-panel p-4 rounded-2xl flex flex-col justify-between gap-3 border-2 transition-all"
                    style={{ borderColor: req.is_urgent ? 'rgba(239,68,68,0.4)' : 'transparent' }}
                  >
                    <div>
                      <p className="text-[10px] font-bold opacity-50 mb-1">{req.is_anonymous ? 'Anonymous' : (req.display_name ?? 'Community')}</p>
                      <p className="text-xs leading-relaxed line-clamp-4">{req.content}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (prayerDeckPrayed.has(req.id)) return;
                        setPrayerDeckPrayed(prev => new Set([...prev, req.id]));
                        supabase.from('prayer_interactions').insert({ request_id: req.id, user_id: undefined });
                      }}
                      className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                        prayerDeckPrayed.has(req.id)
                          ? 'bg-red-500/10 text-red-400'
                          : 'text-white'
                      }`}
                      style={!prayerDeckPrayed.has(req.id) ? { background: 'var(--accent)' } : {}}
                    >
                      <Heart className={`w-3.5 h-3.5 ${prayerDeckPrayed.has(req.id) ? 'fill-current' : ''}`} />
                      {prayerDeckPrayed.has(req.id) ? 'Prayed ✓' : 'Pray for this'}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Church Life */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          {/* Announcements */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Church Announcements</h3>
              {canManage && (
                <motion.button whileHover={{ scale: 1.1, color: 'var(--accent)' }} whileTap={{ scale: 0.9 }} 
                  onClick={() => setShowAddModal('announcement')} className="text-[10px] font-bold text-[var(--accent)] hover:underline">+ New</motion.button>
              )}
            </div>
            <div className="space-y-3">
              {loadingChurch ? (
                <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin opacity-20" /></div>
              ) : announcements.length > 0 ? announcements.map(ann => (
                <div key={ann.id} className="glass-panel p-4 rounded-2xl border-l-2 border-[var(--accent)]">
                  <p className="font-bold text-sm mb-1">{ann.title}</p>
                  <p className="text-xs opacity-70 line-clamp-2">{ann.content}</p>
                </div>
              )) : (
                <div className="glass-panel p-8 rounded-2xl text-center opacity-40 italic text-sm">No announcements yet.</div>
              )}
            </div>
          </motion.div>

          {/* Events */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Upcoming Events</h3>
              {canManage && (
                <motion.button whileHover={{ scale: 1.1, color: 'var(--accent)' }} whileTap={{ scale: 0.9 }} 
                  onClick={() => setShowAddModal('event')} className="text-[10px] font-bold text-[var(--accent)] hover:underline">+ New</motion.button>
              )}
            </div>
            <div className="space-y-3">
              {loadingChurch ? (
                <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin opacity-20" /></div>
              ) : events.length > 0 ? events.map(eve => (
                <div key={eve.id} className="glass-panel p-4 rounded-2xl flex gap-4 items-center">
                  <div className="bg-[var(--accent)]/10 text-[var(--accent)] p-2 rounded-xl text-center min-w-[50px]">
                    <p className="text-[10px] font-bold uppercase">{new Date(eve.event_date).toLocaleString('default', { month: 'short' })}</p>
                    <p className="text-lg font-bold">{new Date(eve.event_date).getDate()}</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{eve.title}</p>
                    <p className="text-[10px] opacity-60 flex items-center gap-1">📍 {eve.location || 'Church'}</p>
                  </div>
                </div>
              )) : (
                <div className="glass-panel p-8 rounded-2xl text-center opacity-40 italic text-sm">No upcoming events.</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Community & Church tools */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Community & Church</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ToolCard to="/prayer-wall" icon={Heart} title="Prayer Wall" desc="Pray for others" delay={0.5} />
            <ToolCard to="/plans" icon={ListChecks} title="Reading Plans" desc="Structured Bible study" delay={0.52} />
            <ToolCard to="/sermon-notes" icon={BookOpenCheck} title="Sermon Notes" desc="Structured note-taking" delay={0.54} />
            <ToolCard to="/sermon-live" icon={Mic} title="Live Tools" desc="Subtitles & AI notes" delay={0.56} />
            <ToolCard to="/groups" icon={Users} title="Small Groups" desc="Join a local group" delay={0.58} />
            <ToolCard to="/archives" icon={Archive} title="Sermon Archive" desc="Past messages" delay={0.60} />
          </div>
        </div>

        {/* Footer with Privacy Link */}
        <footer className="mt-12 pb-8 text-center border-t border-white/5 pt-8">
          <Link to="/privacy" className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 hover:opacity-100 hover:text-[var(--accent)] transition-all">
            Privacy & Data Handling Policy
          </Link>
          <p className="text-[9px] opacity-20 mt-2 italic">Your data is stored securely in accordance with GDPR standards.</p>
        </footer>
      </div>
    </div>
  );
}
