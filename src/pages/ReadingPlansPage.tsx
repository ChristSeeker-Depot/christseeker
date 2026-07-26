import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Loader2, ChevronRight, Trash2 } from 'lucide-react';
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
    title: '30 Days with Jesus',
    description: 'A month-long deep dive into the life, ministry, and miracles of Christ.',
    duration_days: 30,
    plan_data: [
      { day: 1, title: 'The Birth of Jesus', passages: ['Luke 2:1-20'], reflection: 'Humility starts in a manger. Praise God for His approachable glory.' },
      { day: 2, title: 'The Baptism', passages: ['Matthew 3'], reflection: 'The Father\'s approval comes before Jesus\' ministry even begins. You too are loved.' },
      { day: 3, title: 'Temptation in the Wilderness', passages: ['Matthew 4:1-11'], reflection: 'Jesus fought the enemy with the Word. What Scripture are you using today?' },
      { day: 4, title: 'The Sermon on the Mount (Part 1)', passages: ['Matthew 5'], reflection: 'The Kingdom is for the poor in spirit. Acknowledge your need for Him.' },
      { day: 5, title: 'The Sermon on the Mount (Part 2)', passages: ['Matthew 6'], reflection: 'Seek first the Kingdom. What worries are distracting you today?' },
      { day: 6, title: 'The Sermon on the Mount (Part 3)', passages: ['Matthew 7'], reflection: 'Build your house on the Rock. What is your foundation today?' },
      { day: 7, title: 'Healing the Leper', passages: ['Mark 1:40-45'], reflection: 'Jesus touches the "untouchable." Who are you avoiding that He wants to love?' },
      { day: 8, title: 'Faith of the Centurion', passages: ['Matthew 8:5-13'], reflection: 'Authority is recognized by faith. Trust His word even from a distance.' },
      { day: 9, title: 'Calming the Storm', passages: ['Mark 4:35-41'], reflection: '"Peace, be still." The wind and waves obey Him; so can your heart.' },
      { day: 10, title: 'Jairus\' Daughter', passages: ['Mark 5:21-43'], reflection: '"Do not be afraid, only believe." He is the Lord over life and death.' },
      { day: 11, title: 'Feeding the 5,000', passages: ['John 6:1-15'], reflection: 'He takes our "not enough" and makes it more than enough.' },
      { day: 12, title: 'Walking on Water', passages: ['Matthew 14:22-33'], reflection: 'Keep your eyes on Jesus, not the waves. What is your "storm" today?' },
      { day: 13, title: 'The Transfiguration', passages: ['Matthew 17:1-13'], reflection: 'A glimpse of His true glory. Listen to Him.' },
      { day: 14, title: 'The Good Samaritan', passages: ['Luke 10:25-37'], reflection: 'Who is your neighbour? Love is shown in action, not just words.' },
      { day: 15, title: 'Mary and Martha', passages: ['Luke 10:38-42'], reflection: 'Choose the "one thing" that is necessary: sitting at His feet.' },
      { day: 16, title: 'The Prodigal Son', passages: ['Luke 15:11-32'], reflection: 'The Father is running toward you. No matter where you\'ve been, come home.' },
      { day: 17, title: 'Lazarus Raised', passages: ['John 11:1-44'], reflection: '"I am the resurrection and the life." He can bring life to dead places.' },
      { day: 18, title: 'The Triumphal Entry', passages: ['Matthew 21:1-11'], reflection: 'Hosanna! Is He the King of your daily decisions?' },
      { day: 19, title: 'Cleansing the Temple', passages: ['Mark 11:15-19'], reflection: 'Your heart is His temple. Is there anything He needs to clear out today?' },
      { day: 20, title: 'The Last Supper', passages: ['Luke 22:7-23'], reflection: '"Do this in remembrance of me." Reflect on the body broken for you.' },
      { day: 21, title: 'Gethsemane', passages: ['Matthew 26:36-46'], reflection: '"Not my will, but Yours be done." What are you struggling to surrender?' },
      { day: 22, title: 'The Betrayal & Arrest', passages: ['John 18:1-14'], reflection: 'Jesus goes willingly. He was bound so you could be free.' },
      { day: 23, title: 'Peter\'s Denial', passages: ['Luke 22:54-62'], reflection: 'Failure is not final. He knew Peter would fail, and He still loved him.' },
      { day: 24, title: 'The Trial', passages: ['John 18:28-40'], reflection: 'The King of Truth stands before the world. Do you recognize His voice?' },
      { day: 25, title: 'The Crucifixion', passages: ['Luke 23:26-49'], reflection: 'It is finished. Sit in silence at the foot of the cross.' },
      { day: 26, title: 'The Burial', passages: ['John 19:38-42'], reflection: 'The silence of the tomb. Trust Him even in the waiting.' },
      { day: 27, title: 'The Resurrection', passages: ['Matthew 28:1-10'], reflection: 'He is risen! Death is defeated. Live in the power of the empty tomb today.' },
      { day: 28, title: 'The Road to Emmaus', passages: ['Luke 24:13-35'], reflection: 'Does your heart burn within you when He speaks? Invite Him to stay.' },
      { day: 29, title: 'The Great Commission', passages: ['Matthew 28:16-20'], reflection: 'Go and make disciples. You are not alone; He is with you always.' },
      { day: 30, title: 'The Ascension', passages: ['Acts 1:1-11'], reflection: 'He is seated at the right hand of the Father, interceding for you.' },
    ],
  },
  {
    title: 'Women of Faith',
    description: '10 days exploring the courage, devotion, and impact of women in the Bible.',
    duration_days: 10,
    plan_data: [
      { day: 1, title: 'Sarah: Trusting the Impossible', passages: ['Genesis 21:1-7'], reflection: 'God is faithful to His promises, even when we laugh in doubt.' },
      { day: 2, title: 'Rahab: A New Legacy', passages: ['Joshua 2'], reflection: 'Your past does not define your future in God\'s Kingdom.' },
      { day: 3, title: 'Deborah: Leading with Courage', passages: ['Judges 4'], reflection: 'God calls leaders from unexpected places. Will you say yes?' },
      { day: 4, title: 'Ruth: Loyal Love', passages: ['Ruth 1'], reflection: 'Faithfulness often looks like staying when it\'s easier to leave.' },
      { day: 5, title: 'Hannah: Persistent Prayer', passages: ['1 Samuel 1'], reflection: 'Pour out your soul to the Lord. He hears the silent cries of the heart.' },
      { day: 6, title: 'Esther: For Such a Time as This', passages: ['Esther 4'], reflection: 'You are where you are for a divine purpose. Be bold.' },
      { day: 7, title: 'Mary of Nazareth: Total Surrender', passages: ['Luke 1:26-38'], reflection: '"Let it be to me according to your word." This is the ultimate prayer.' },
      { day: 8, title: 'The Woman at the Well: Fully Known', passages: ['John 4:1-42'], reflection: 'He knows your secrets and still offers you living water.' },
      { day: 9, title: 'Mary Magdalene: First Witness', passages: ['John 20:1-18'], reflection: 'The one who was forgiven much, loved much. He calls your name too.' },
      { day: 10, title: 'Lydia: The Open Heart', passages: ['Acts 16:11-15'], reflection: 'Hospitality is a spiritual gift. How can you open your heart and home today?' },
    ],
  },
  {
    title: 'Kingdom Leadership',
    description: '7 days of wisdom for those called to lead and serve others.',
    duration_days: 7,
    plan_data: [
      { day: 1, title: 'The Servant Leader', passages: ['Mark 10:35-45'], reflection: 'Greatness in the Kingdom is measured by service, not status.' },
      { day: 2, title: 'Nehemiah: The Builder', passages: ['Nehemiah 2'], reflection: 'Leadership starts with a burden and a prayer. What has God put on your heart?' },
      { day: 3, title: 'Joshua: Be Strong & Courageous', passages: ['Joshua 1'], reflection: 'The key to courage is the constant presence of God and His Word.' },
      { day: 4, title: 'David: A Heart for God', passages: ['1 Samuel 16:1-13'], reflection: 'Man looks at the outward appearance, but God looks at the heart.' },
      { day: 5, title: 'Solomon: Seeking Wisdom', passages: ['1 Kings 3'], reflection: 'Above all else, ask God for a discerning heart to lead His people.' },
      { day: 6, title: 'Paul: Passing the Torch', passages: ['2 Timothy 2'], reflection: 'Leadership is about reproduction. Who are you investing in today?' },
      { day: 7, title: 'The Chief Shepherd', passages: ['1 Peter 5:1-4'], reflection: 'Lead with a willing heart, not for personal gain. Your reward is eternal.' },
    ],
  },
  {
    title: 'Strength in the Storm',
    description: '5 days of biblical comfort for those walking through grief or hardship.',
    duration_days: 5,
    plan_data: [
      { day: 1, title: 'He is Close', passages: ['Psalm 34:18'], reflection: 'The Lord is near to the brokenhearted. You don\'t have to reach far.' },
      { day: 2, title: 'The Valley', passages: ['Psalm 23:4'], reflection: 'He does not remove the valley, but He walks *through* it with you.' },
      { day: 3, title: 'God of All Comfort', passages: ['2 Corinthians 1:3-4'], reflection: 'He comforts us so we can comfort others. Your pain has a future purpose.' },
      { day: 4, title: 'Man of Sorrows', passages: ['Isaiah 53:3-5'], reflection: 'Jesus is acquainted with grief. He truly understands your pain.' },
      { day: 5, title: 'No More Tears', passages: ['Revelation 21:1-4'], reflection: 'This is not the end. One day, He will wipe every tear away.' },
    ],
  },
  {
    title: 'Proverbs: Wisdom for Living',
    description: '10 days in the book of Proverbs exploring practical wisdom.',
    duration_days: 10,
    plan_data: [
      { day: 1, title: 'The Fear of the Lord', passages: ['Proverbs 1:1-7'], reflection: 'Wisdom begins with awe. Acknowledge God\'s authority over your life.' },
      { day: 2, title: 'Trust vs. Understanding', passages: ['Proverbs 3:5-6'], reflection: 'Stop trying to figure it all out. Trust the One who already has.' },
      { day: 3, title: 'Guard Your Heart', passages: ['Proverbs 4:20-27'], reflection: 'Everything you do flows from your heart. What are you letting in?' },
      { day: 4, title: 'The Power of Words', passages: ['Proverbs 18:21'], reflection: 'Death and life are in the tongue. Use your words to build up today.' },
      { day: 5, title: 'Friendship', passages: ['Proverbs 17:17'], reflection: 'A friend loves at all times. Who can you show brotherly love to today?' },
      { day: 6, title: 'Hard Work vs. Sloth', passages: ['Proverbs 6:6-11'], reflection: 'Excellence in small things is worship. Do your work for the Lord.' },
      { day: 7, title: 'Integrity', passages: ['Proverbs 11:1-3'], reflection: 'Honest scales are the Lord\'s delight. Choose the right path, even when no one is looking.' },
      { day: 8, title: 'Humility', passages: ['Proverbs 16:18-19'], reflection: 'Pride goes before a fall. Ask God for a humble spirit today.' },
      { day: 9, title: 'Generosity', passages: ['Proverbs 11:24-25'], reflection: 'The generous soul will be made rich. Give freely and trust God to provide.' },
      { day: 10, title: 'Planning & Sovereignty', passages: ['Proverbs 16:9'], reflection: 'You can plan your course, but the Lord determines your steps. Rest in that.' },
    ],
  },
  {
    title: 'Peace in Anxiety',
    description: 'Biblical anchors for anxious hearts.',
    duration_days: 5,
    plan_data: [
      { day: 1, title: 'Cast Your Cares', passages: ['1 Peter 5:6-7'], reflection: 'God invites you to physically hand over your worries. Write them down, then give them.' },
      { day: 2, title: 'Do Not Fear', passages: ['Isaiah 41:10'], reflection: '"I am with you." Repeat this truth slowly until it settles in your chest.' },
      { day: 3, title: 'The Peace That Passes', passages: ['Philippians 4:6-7'], reflection: 'What are you thankful for right now? Start there.' },
      { day: 4, title: 'Overwhelmed', passages: ['Matthew 11:28-30'], reflection: 'Jesus calls the weary. You don\'t have to have it together to come to Him.' },
      { day: 5, title: 'Sufficient Grace', passages: ['2 Corinthians 12:9'], reflection: 'Weakness is not failure. In it, His strength is perfected.' },
    ],
  },
  {
    title: 'Armour of God',
    description: 'A week suiting up for spiritual battle with Ephesians 6.',
    duration_days: 7,
    plan_data: [
      { day: 1, title: 'The Full Armour', passages: ['Ephesians 6:10-13'], reflection: 'We do not fight flesh and blood. What unseen battle are you in today?' },
      { day: 2, title: 'Belt of Truth', passages: ['Ephesians 6:14'], reflection: 'Where is the enemy lying to you? Speak the opposite truth aloud.' },
      { day: 3, title: 'Breastplate of Righteousness', passages: ['Ephesians 6:14'], reflection: 'Your righteousness is not earned — it is received. Rest in that today.' },
      { day: 4, title: 'Gospel of Peace', passages: ['Ephesians 6:15'], reflection: 'Peace is not the absence of trouble but the presence of God. Where do you need it?' },
      { day: 5, title: 'Shield of Faith', passages: ['Ephesians 6:16'], reflection: 'Every fiery dart loses its power when it hits faith. What do you believe today?' },
      { day: 6, title: 'Helmet of Salvation', passages: ['Ephesians 6:17'], reflection: 'Guard your mind. What thoughts need to be taken captive today? (2 Cor 10:5)' },
      { day: 7, title: 'Sword of the Spirit', passages: ['Ephesians 6:17-18'], reflection: 'The Word is your only offensive weapon. Memorise one verse today and pray it.' },
    ],
  },
  {
    title: 'Fruit of the Spirit',
    description: 'Exploring each fruit and asking God to cultivate it in you.',
    duration_days: 9,
    plan_data: [
      { day: 1, title: 'The Vine & the Branch', passages: ['John 15:1-8'], reflection: 'Fruit doesn\'t strive — it grows by abiding. How connected are you to the Vine today?' },
      { day: 2, title: 'Love', passages: ['1 Corinthians 13:4-8'], reflection: 'Where is love most costly for you right now? Ask God to fill that specific gap.' },
      { day: 3, title: 'Joy', passages: ['Nehemiah 8:10'], reflection: 'Joy is not happiness — it is a settled confidence in God\'s goodness. Can you find it today?' },
      { day: 4, title: 'Peace', passages: ['Isaiah 26:3'], reflection: '"Perfect peace" comes from a mind stayed on God. Spend 5 minutes in stillness.' },
      { day: 5, title: 'Patience', passages: ['Romans 5:3-5'], reflection: 'What is God using to grow patience in your life right now? Thank Him for it.' },
      { day: 6, title: 'Kindness & Goodness', passages: ['Titus 3:4-5'], reflection: 'Who needs a practical act of kindness from you today? Do it before tonight.' },
      { day: 7, title: 'Faithfulness', passages: ['Lamentations 3:22-23'], reflection: 'His mercies are new every morning. How has God been faithful to you this week?' },
      { day: 8, title: 'Gentleness', passages: ['Matthew 5:5'], reflection: 'Gentleness is power under control. Where do you need to respond gently today?' },
      { day: 9, title: 'Self-Control', passages: ['2 Peter 1:5-8'], reflection: 'Where is the Spirit calling you to say no so you can say a greater yes?' },
    ],
  },
  {
    title: 'The Lord\'s Prayer',
    description: 'A slow, deep walk through every line Jesus taught us to pray.',
    duration_days: 7,
    plan_data: [
      { day: 1, title: 'Our Father in Heaven', passages: ['Matthew 6:9'], reflection: 'You are invited to call God Father. Sit with that intimacy for a moment.' },
      { day: 2, title: 'Hallowed Be Your Name', passages: ['Exodus 3:13-15'], reflection: 'To hallow is to treat as holy. How would your day look if you treated God as holy in every moment?' },
      { day: 3, title: 'Your Kingdom Come', passages: ['Luke 17:20-21'], reflection: 'Where do you want to see God\'s kingdom break in today — in your home, your workplace, your city?' },
      { day: 4, title: 'Give Us Today Our Daily Bread', passages: ['Exodus 16:4'], reflection: 'God provides daily, not in advance. What do you need to trust Him for today specifically?' },
      { day: 5, title: 'Forgive Us Our Debts', passages: ['Colossians 3:13'], reflection: 'Receiving forgiveness and giving it are linked. Is there someone you need to forgive today?' },
      { day: 6, title: 'Lead Us Not Into Temptation', passages: ['1 Corinthians 10:13'], reflection: 'Where are you most vulnerable right now? Ask God to provide the way of escape.' },
      { day: 7, title: 'For Yours is the Kingdom', passages: ['1 Chronicles 29:11-12'], reflection: 'The prayer ends with praise, not a request. End today in pure worship — no asking.' },
    ],
  },
];

export default function ReadingPlansPage() {
  const { user, profile } = useAuth();
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
    // Fetch existing plans
    const { data: existingPlans } = await supabase.from('reading_plans').select('*');
    const existingTitles = new Set(existingPlans?.map(p => p.title) || []);
    
    // Find plans that aren't in the DB yet
    const missingPlans = BUILT_IN_PLANS.filter(p => !existingTitles.has(p.title));
    
    if (missingPlans.length > 0) {
      await supabase.from('reading_plans').insert(missingPlans);
      // Re-fetch everything to include the new ones
      const { data: allPlans } = await supabase.from('reading_plans').select('*');
      setPlans(allPlans as Plan[]);
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

  const unenroll = async (upId: string) => {
    if (!window.confirm('Remove this plan? Your progress will be lost.')) return;
    await supabase.from('user_plans').delete().eq('id', upId);
    setUserPlans(prev => prev.filter(u => u.id !== upId));
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
      const { data, error } = await supabase.functions.invoke('get-passage', {
        body: {
          passage: day.passages[0],
          translation: profile?.bible_translation || 'NIV'
        }
      });
      if (!error && data?.text) setVerseData(data.text);
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
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{Math.round(progress)}%</span>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => unenroll(up.id)} className="p-1.5 text-red-400 opacity-40 hover:opacity-100 transition-opacity" title="Remove plan"><Trash2 className="w-4 h-4" /></motion.button>
                    </div>
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
