import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, Music, LogOut, Settings, X, RefreshCw, BookMarked, Search, Wind, Heart, BookOpenCheck, Mic, Sparkles, ListChecks, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDailyIndex, VERSES, PRAYER_GUIDES, SONGS } from '../data/spiritualData';

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
  const [verseIndex, setVerseIndex] = useState(0);
  const [songIndex, setSongIndex] = useState(0);
  const [prayerIndex, setPrayerIndex] = useState(0);
  const [modalContent, setModalContent] = useState<'verse' | 'song' | null>(null);

  useEffect(() => {
    setVerseIndex(getDailyIndex(VERSES.length));
    setSongIndex(getDailyIndex(SONGS.length));
    const denomGuides = profile?.denomination && PRAYER_GUIDES[profile.denomination]
      ? PRAYER_GUIDES[profile.denomination]
      : PRAYER_GUIDES['Non-Denominational'];
    setPrayerIndex(getDailyIndex(denomGuides.length));
  }, [profile]);

  const verse = VERSES[verseIndex];
  const song = SONGS[songIndex];
  const denomGuides = profile?.denomination && PRAYER_GUIDES[profile.denomination]
    ? PRAYER_GUIDES[profile.denomination]
    : PRAYER_GUIDES['Non-Denominational'];
  const prayerGuide = denomGuides[prayerIndex];

  const displayName = profile?.display_name ?? null;
  const streak = profile?.streak ?? 0;

  const handleNextVerse = () => setVerseIndex(prev => (prev + 1) % VERSES.length);
  const handleNextSong = () => setSongIndex(prev => (prev + 1) % SONGS.length);

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen relative" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">ChristSeeker</h1>
          {displayName && <p className="text-sm opacity-60 mt-0.5">Peace to you, {displayName}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold glass-panel">🔥 {streak}</div>
          <Link to="/settings"><motion.div whileTap={{ scale: 0.90 }} className="p-2 opacity-70 hover:opacity-100 transition-opacity"><Settings className="w-5 h-5" /></motion.div></Link>
          <motion.button whileTap={{ scale: 0.90 }} onClick={signOut} className="p-2 opacity-70 hover:opacity-100 transition-opacity"><LogOut className="w-5 h-5" /></motion.button>
        </div>
      </header>

      <div className="space-y-5">
        {/* Verse of the Day */}
        <motion.div className="glass-panel p-8 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-[var(--accent)]/20 transition-all"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          whileTap={{ scale: 0.98 }} onClick={() => setModalContent('verse')}>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Verse of the Day</p>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-4">"{verse.text}"</h2>
          <p className="font-medium">— {verse.reference}</p>
          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>Tap to reflect & read more</p>
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

          {/* Today's Worship */}
          <motion.div className="glass-panel p-6 rounded-3xl cursor-pointer border-2 border-transparent hover:border-[var(--accent)]/20 transition-all"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            whileTap={{ scale: 0.98 }} onClick={() => setModalContent('song')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                  <Music className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Today's Worship</p>
                  <h3 className="text-lg font-bold">{song.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{song.artist}</p>
                </div>
              </div>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>Tap for lyrics</p>
            </div>
          </motion.div>

          {/* Tools Grid */}
          <motion.div className="grid grid-cols-2 gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ToolCard to="/journal" icon={BookMarked} title="Prayer Journal" desc="Write your prayers" delay={0.31} />
            <ToolCard to="/scripture" icon={Search} title="Scripture" desc="Look up any passage" delay={0.32} />
            <ToolCard to="/breath" icon={Wind} title="Breath Prayer" desc="A moment of stillness" delay={0.33} />
            <ToolCard to="/devotional" icon={Sparkles} title="Devotional" desc="AI-personalised today" delay={0.34} />
            <ToolCard to="/stronghold" icon={Shield} title="Stronghold Buster" desc="Overcome struggles" delay={0.35} span="col-span-2" />
          </motion.div>
        </div>

        {/* Second row — community & church tools */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Community & Church</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ToolCard to="/prayer-wall" icon={Heart} title="Prayer Wall" desc="Pray for others" delay={0.4} />
            <ToolCard to="/plans" icon={ListChecks} title="Reading Plans" desc="Structured Bible study" delay={0.42} />
            <ToolCard to="/sermon-notes" icon={BookOpenCheck} title="Sermon Notes" desc="Structured note-taking" delay={0.44} />
            <ToolCard to="/sermon-live" icon={Mic} title="Live Tools" desc="Subtitles & AI notes" delay={0.46} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalContent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setModalContent(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}>
              <button onClick={() => setModalContent(null)} className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100 rounded-full" style={{ background: 'var(--bg-card)' }}>
                <X className="w-5 h-5" />
              </button>
              <div className="overflow-y-auto custom-scrollbar pr-2 mt-4 flex-1">
                {modalContent === 'verse' && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}>Deeper Reflection</h3>
                    <h2 className="text-2xl font-serif italic mb-2">"{verse.text}"</h2>
                    <p className="font-bold mb-6">— {verse.reference}</p>
                    <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)' }}>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{verse.reflection}</p>
                    </div>
                    <div className="mt-8 flex justify-center">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleNextVerse} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                        <RefreshCw className="w-4 h-4" /> Load Alternate Verse
                      </motion.button>
                    </div>
                  </div>
                )}
                {modalContent === 'song' && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}>Worship Details</h3>
                    <h2 className="text-xl font-bold mb-1">{song.title}</h2>
                    <p className="font-medium mb-6" style={{ color: 'var(--text-muted)' }}>By {song.artist}</p>
                    <div className="p-5 rounded-2xl mb-6" style={{ background: 'var(--bg-card)' }}>
                      <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Theme: {song.theme}</p>
                      <p className="text-sm italic leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>{song.lyrics}</p>
                    </div>
                    <div className="flex justify-center">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleNextSong} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                        <RefreshCw className="w-4 h-4" /> Next Song
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
