import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DayReading { day: number; title: string; passages: string[]; reflection: string; }
interface Plan { id: string; title: string; description: string; duration_days: number; plan_data: DayReading[]; }
interface UserPlan { id: string; plan_id: string; start_date: string; completed_days: number[]; plan: Plan; }

// Built-in plans — these are seeded to the DB on first visit
const BUILT_IN_PLANS: Omit<Plan, 'id'>[] = [
  {
    title: '7 Days in John',
    description: 'A week journeying through the heart of John\'s Gospel.',
    duration_days: 7,
    plan_data: [
      { day: 1, title: 'The Word Became Flesh', passages: ['John 1:1-18'], reflection: 'Meditate on the mystery of the Incarnation — God stepping into creation.' },
      { day: 2, title: 'The First Disciples', passages: ['John 1:35-51'], reflection: 'Jesus calls ordinary people. How is He calling you today?' },
      { day: 3, title: 'Water into Wine', passages: ['John 2:1-11'], reflection: 'Jesus turns ordinary into extraordinary. What areas of your life need His touch?' },
      { day: 4, title: 'Born Again', passages: ['John 3:1-21'], reflection: '"For God so loved the world…" — sit with this truth for five minutes.' },
      { day: 5, title: 'Living Water', passages: ['John 4:1-30'], reflection: 'Jesus meets us in our thirst. What are you thirsting for today?' },
      { day: 6, title: 'I Am the Bread of Life', passages: ['John 6:25-59'], reflection: 'Jesus is the true source of nourishment. How does He satisfy you?' },
      { day: 7, title: 'The Good Shepherd', passages: ['John 10:1-18'], reflection: 'You are known by name. Rest in the security of His care.' },
    ],
  },
  {
    title: 'Peace in Anxiety — 5 Days',
    description: 'Biblical anchors for anxious hearts.',
    duration_days: 5,
    plan_data: [
      { day: 1, title: 'Cast Your Cares', passages: ['1 Peter 5:6-7', 'Psalm 55:22'], reflection: 'God invites you to physically hand over your worries. Write them down, then give them.' },
      { day: 2, title: 'Do Not Fear', passages: ['Isaiah 41:10', 'Psalm 23'], reflection: '"I am with you." Repeat this truth slowly until it settles in your chest.' },
      { day: 3, title: 'The Peace That Passes', passages: ['Philippians 4:4-9'], reflection: 'What are you thankful for right now? Start there.' },
      { day: 4, title: 'Overwhelmed', passages: ['Psalm 61:1-4', 'Matthew 11:28-30'], reflection: 'Jesus calls the weary. You don\'t have to have it together to come to Him.' },
      { day: 5, title: 'Sufficient Grace', passages: ['2 Corinthians 12:7-10', 'Romans 8:28'], reflection: 'Weakness is not failure. In it, His strength is perfected.' },
    ],
  },
];

export default function ReadingPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [activeDay, setActiveDay] = useState<DayReading | null>(null);
  const [activePlan, setActivePlan] = useState<UserPlan | null>(null);
  const [verseData, setVerseData] = useState<string | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, [user]);

  const loadAll = async () => {
    if (!user) return;
    // Fetch or seed plans
    const { data: existingPlans } = await supabase.from('reading_plans').select('*');
    if (!existingPlans || existingPlans.length === 0) {
      const { data: seeded } = await supabase.from('reading_plans').insert(BUILT_IN_PLANS).select('*');
      setPlans((seeded as Plan[]) ?? []);
    } else {
      setPlans(existingPlans as Plan[]);
    }
    // Fetch user's enrolled plans
    const { data: uPlans } = await supabase.from('user_plans').select('*, plan:reading_plans(*)').eq('user_id', user.id);
    if (uPlans) setUserPlans(uPlans as unknown as UserPlan[]);
    setLoading(false);
  };

  const enroll = async (planId: string) => {
    if (!user) return;
    await supabase.from('user_plans').insert({ user_id: user.id, plan_id: planId, start_date: new Date().toISOString().split('T')[0], completed_days: [] });
    loadAll();
  };

  const markComplete = async (up: UserPlan, day: number) => {
    const updated = [...new Set([...up.completed_days, day])];
    await supabase.from('user_plans').update({ completed_days: updated }).eq('id', up.id);
    setUserPlans(prev => prev.map(u => u.id === up.id ? { ...u, completed_days: updated } : u));
    setActiveDay(null); setActivePlan(null);
  };

  const openDay = async (up: UserPlan, day: DayReading) => {
    setActivePlan(up); setActiveDay(day); setVerseData(null);
    setLoadingVerse(true);
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(day.passages[0])}`);
      const d = await res.json();
      if (d.text) setVerseData(d.text.trim());
    } catch { /* silent */ } finally { setLoadingVerse(false); }
  };

  const todayDay = (up: UserPlan) => {
    const start = new Date(up.start_date);
    const diff = Math.floor((Date.now() - start.getTime()) / 86400000);
    return Math.min(diff + 1, up.plan.duration_days);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin opacity-40" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-3 mb-8">
        <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
        <h1 className="text-2xl font-bold">Reading Plans</h1>
      </header>

      {/* Active plans */}
      {userPlans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Your Plans</h2>
          <div className="space-y-4">
            {userPlans.map(up => {
              const today = todayDay(up);
              const progress = (up.completed_days.length / up.plan.duration_days) * 100;
              return (
                <motion.div key={up.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-3">
                    <div><p className="font-bold">{up.plan.title}</p><p className="text-xs opacity-50 mt-0.5">Day {today} of {up.plan.duration_days}</p></div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full mb-4" style={{ background: 'var(--bg-card)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
                  </div>
                  <div className="space-y-2">
                    {up.plan.plan_data.map(day => {
                      const done = up.completed_days.includes(day.day);
                      const isToday = day.day === today;
                      return (
                        <motion.button key={day.day} whileTap={{ scale: 0.97 }}
                          onClick={() => !done ? openDay(up, day) : undefined}
                          disabled={done}
                          className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${isToday && !done ? 'font-semibold' : ''} ${done ? 'opacity-40' : 'hover:bg-[var(--bg-card)]'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${done ? 'bg-green-500 text-white' : isToday ? 'text-white' : ''}`} style={!done && isToday ? { background: 'var(--accent)' } : !done ? { background: 'var(--bg-card)' } : {}}>
                              {done ? <CheckCircle2 className="w-4 h-4" /> : day.day}
                            </div>
                            <span className="text-sm">{day.title}</span>
                          </div>
                          {!done && isToday && <ChevronRight className="w-4 h-4 opacity-40" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available plans */}
      <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Available Plans</h2>
      <div className="space-y-4">
        {plans.filter(p => !userPlans.find(u => u.plan_id === p.id)).map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-panel p-5 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1">
                <p className="font-bold">{plan.title}</p>
                <p className="text-sm opacity-60 mb-3">{plan.description}</p>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => enroll(plan.id)}
                  className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: 'var(--accent)' }}>
                  Start Plan
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
        {plans.filter(p => !userPlans.find(u => u.plan_id === p.id)).length === 0 && (
          <p className="text-center opacity-40 text-sm py-8">You're enrolled in all available plans!</p>
        )}
      </div>

      {/* Day modal */}
      <AnimatePresence>
        {activeDay && activePlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => { setActiveDay(null); setActivePlan(null); }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Day {activeDay.day}</p>
              <h2 className="text-xl font-bold mb-4">{activeDay.title}</h2>
              <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--bg-card)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{activeDay.passages.join(', ')}</p>
                {loadingVerse ? <Loader2 className="w-5 h-5 animate-spin opacity-40 my-2" /> : verseData ? <p className="text-base font-serif italic leading-relaxed">{verseData}</p> : <p className="opacity-40 text-sm">Could not load passage.</p>}
              </div>
              <p className="text-sm leading-relaxed opacity-80 mb-6">{activeDay.reflection}</p>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => markComplete(activePlan, activeDay.day)}
                  className="flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                  style={{ background: 'var(--accent)' }}>
                  <CheckCircle2 className="w-4 h-4" /> Mark as Complete
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setActiveDay(null); setActivePlan(null); }}
                  className="px-4 py-3 rounded-xl font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
