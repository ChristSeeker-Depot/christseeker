import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, ChevronRight, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Stronghold = {
  id: string;
  title: string;
  description: string;
  declaration: string;
  passages: { ref: string; text: string }[];
  prayer: string;
};

const STRONGHOLDS: Stronghold[] = [
  {
    id: 'purity',
    title: 'Cultivating Purity',
    description: 'Protecting your mind and heart for a deeper walk with God.',
    declaration: 'I am a new creation. My body is a temple of the Holy Spirit. I am empowered to choose what is good, pure, and true.',
    passages: [
      { ref: '1 Corinthians 6:18-20', text: 'Flee from sexual immorality... Do you not know that your bodies are temples of the Holy Spirit, who is in you... You were bought at a price.' },
      { ref: 'Psalm 119:9', text: 'How can a young person stay on the path of purity? By living according to your word.' }
    ],
    prayer: 'Lord Jesus, I want my heart and mind to be a place where You feel at home. I renounce the lies that say I am stuck in old patterns. Wash my thoughts with Your Word. Give me the strength to turn my eyes toward You whenever I feel tempted. I choose Your path of life today. Amen.',
  },
  {
    id: 'peace',
    title: 'Finding Perfect Peace',
    description: 'Quietening the noise of worry and resting in His care.',
    declaration: 'God has not given me a spirit of fear, but of power, love, and a sound mind. I cast every care on Him today.',
    passages: [
      { ref: 'Philippians 4:6-7', text: 'Do not be anxious about anything... And the peace of God, which transcends all understanding, will guard your hearts.' },
      { ref: '2 Timothy 1:7', text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.' }
    ],
    prayer: 'Father, I bring my racing thoughts to You. I renounce the weight of worry and I accept Your peace right now. You are in control of my future, and You are bigger than any problem I face. I choose to trust in Your goodness today. Amen.',
  },
  {
    id: 'humility',
    title: 'Walking in Humility',
    description: 'Surrendering the heavy burden of control and self-importance.',
    declaration: 'I choose to humble myself under the mighty hand of God. My life exists to reflect His light, not my own.',
    passages: [
      { ref: 'James 4:6', text: 'God opposes the proud but shows favor to the humble.' },
      { ref: 'Philippians 2:3-4', text: 'In humility value others above yourselves... not looking to your own interests but each of you to the interests of the others.' }
    ],
    prayer: 'Lord, I lay down my need to be right and my need to be in charge. It is a heavy weight I was never meant to carry. Teach me the freedom of serving others without needing recognition. I find my worth in being Your child, not in my own achievements. Amen.',
  },
  {
    id: 'forgiveness',
    title: 'Choosing Forgiveness',
    description: 'Releasing the pain of the past to step into a lighter future.',
    declaration: 'I forgive as I have been forgiven. I release every debt and every grudge into the hands of the Lord.',
    passages: [
      { ref: 'Ephesians 4:31-32', text: 'Get rid of all bitterness, rage and anger... Be kind and compassionate to one another, forgiving each other.' },
      { ref: 'James 1:19-20', text: 'Everyone should be quick to listen, slow to speak and slow to become angry.' }
    ],
    prayer: 'Father, I release the people who have hurt me. I choose to forgive them right now, just as You have completely forgiven me. Drain the poison of resentment from my heart and fill me with Your compassion. I choose to walk in love today. Amen.',
  },
];

export default function StrongholdBusterPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'built-in' | 'custom'>('built-in');
  const [selectedStronghold, setSelectedStronghold] = useState<Stronghold | null>(null);
  
  // Custom AI State
  const [customTopic, setCustomTopic] = useState('');
  const [customData, setCustomData] = useState<Stronghold | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerateCustom = async () => {
    if (!customTopic.trim()) return;
    setLoading(true);
    setError(null);
    setCustomData(null);
    setSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: `Create a "Stronghold Buster" guide for a Christian struggling to break free from: "${customTopic}". 
Format your response exactly as follows using markdown:

**🔥 Declaration**
[A powerful, one-sentence biblical declaration of freedom using "I am" or "I will"]

**📖 The Sword of the Spirit**
[Passage 1 Reference]: [Passage 1 Text]
[Passage 2 Reference]: [Passage 2 Text]

**🙏 Prayer of Breaking**
[A passionate, first-person prayer of repentance, renunciation of the enemy's lies, and surrender to Jesus]`,
          history: [],
          denomination: profile?.denomination ?? 'Non-Denominational',
          mode: 'devotional',
        },
      });
      
      if (error || data?.error) throw new Error(data?.error || 'Could not generate stronghold guide.');
      
      // Parse the markdown returned by Gemini into the Stronghold object shape
      const responseText = data.reply as string;
      
      const declarationMatch = responseText.match(/\*\*🔥 Declaration\*\*\n([\s\S]*?)\n\n\*\*📖/);
      const prayerMatch = responseText.match(/\*\*🙏 Prayer of Breaking\*\*\n([\s\S]*)$/);
      const passagesBlock = responseText.match(/\*\*📖 The Sword of the Spirit\*\*\n([\s\S]*?)\n\n\*\*🙏/);
      
      let passages: {ref: string, text: string}[] = [];
      if (passagesBlock && passagesBlock[1]) {
        const lines = passagesBlock[1].trim().split('\n');
        for (const line of lines) {
          const parts = line.split(': ');
          if (parts.length >= 2) {
            passages.push({ ref: parts[0].trim(), text: parts.slice(1).join(': ').trim() });
          } else {
             passages.push({ ref: 'Scripture', text: line.trim() });
          }
        }
      }

      setCustomData({
        id: 'custom',
        title: `Breaking ${customTopic}`,
        description: 'Your personalized freedom guide.',
        declaration: declarationMatch ? declarationMatch[1].trim() : 'I am free in Christ Jesus.',
        passages: passages.length > 0 ? passages : [{ref: '2 Corinthians 10:4', text: 'The weapons we fight with are not the weapons of the world. On the contrary, they have divine power to demolish strongholds.'}],
        prayer: prayerMatch ? prayerMatch[1].trim() : 'Lord, set me free. Amen.',
      });
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToJournal = async (stronghold: Stronghold) => {
    if (!user) return;
    setSaving(true);
    const content = `**Declaration:**\n${stronghold.declaration}\n\n**Key Scriptures:**\n${stronghold.passages.map(p => `*${p.ref}* - ${p.text}`).join('\n\n')}\n\n**Prayer:**\n${stronghold.prayer}`;
    
    await supabase.from('journal_entries').insert({
      user_id: user.id,
      title: `Stronghold Buster: ${stronghold.title}`,
      content: content,
      entry_type: 'general',
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const StrongholdView = ({ data }: { data: Stronghold }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border-l-4 border-red-500/50">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 opacity-50">Step 1: Confront the Lie</h3>
        <p className="text-lg opacity-80 italic">"{data.description}"</p>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-4 border-l-4 border-indigo-500/50">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 opacity-50 flex items-center gap-2">
          Step 2: The Sword of Truth
        </h3>
        {data.passages.map((p, i) => (
          <div key={i} className="mb-4 last:mb-0">
            <p className="font-bold text-sm mb-1 text-indigo-400">{p.ref}</p>
            <p className="text-base opacity-90 leading-relaxed font-serif">
              "{p.text}"
            </p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 rounded-3xl border-l-4 border-emerald-500/50 bg-emerald-500/5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 opacity-50">Step 3: Declaration of Victory</h3>
        <p className="text-xl font-bold leading-tight text-emerald-400">"{data.declaration}"</p>
      </div>

      <div className="glass-panel p-6 rounded-3xl border-l-4 border-[var(--accent)]/50">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 opacity-50">
          Step 4: Prayer of Breaking
        </h3>
        <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-80">{data.prayer}</p>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => handleSaveToJournal(data)}
        disabled={saving || saved}
        className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md"
        style={{ background: saved ? '#38a169' : 'var(--bg-card)', color: saved ? '#fff' : 'var(--text-primary)', border: '1px solid var(--bg-card-border)' }}
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saved ? 'Saved to Journal ✓' : 'Save to Journal'}
      </motion.button>
    </motion.div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {selectedStronghold || customData ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setSelectedStronghold(null); setCustomData(null); }} className="p-2 opacity-70 hover:opacity-100">
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          ) : (
            <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
          )}
          <div>
             <h1 className="text-2xl font-bold">Stronghold Buster</h1>
             {selectedStronghold || customData ? (
                <p className="text-xs opacity-60">Breaking {selectedStronghold?.title || customTopic}</p>
             ) : (
                <p className="text-xs opacity-60">The weapons we fight with are not of this world.</p>
             )}
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {selectedStronghold ? (
          <StrongholdView key="view" data={selectedStronghold} />
        ) : customData ? (
          <StrongholdView key="custom-view" data={customData} />
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            
            <div className="flex bg-[var(--bg-card)] rounded-xl p-1 mb-6 border border-[var(--bg-card-border)]">
              <button onClick={() => setActiveTab('built-in')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'built-in' ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--accent)]' : 'opacity-60'}`}>Common Battles</button>
              <button onClick={() => setActiveTab('custom')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'custom' ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--accent)]' : 'opacity-60'}`}>Specific Struggle</button>
            </div>

            {activeTab === 'built-in' ? (
              <div className="space-y-3">
                {STRONGHOLDS.map((s, i) => (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStronghold(s)}
                    className="w-full text-left glass-panel p-5 rounded-2xl flex items-center justify-between group"
                  >
                    <div>
                      <h2 className="font-bold text-lg">{s.title}</h2>
                      <p className="text-sm opacity-60 mt-0.5">{s.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:text-[var(--accent)] transition-all group-hover:translate-x-1" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-3xl">
                <p className="text-sm opacity-80 mb-4">Are you battling a specific addiction, fear, or negative thought pattern not listed? Type it below, and Jesus AI will generate a personalized biblical battle plan.</p>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Phone addiction, fear of failure, jealousy..."
                  className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 mb-4 transition-all"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
                />
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleGenerateCustom}
                  disabled={!customTopic.trim() || loading}
                  className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                  style={{ background: 'var(--accent)' }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                  {loading ? 'Forging your weapons...' : 'Create Battle Plan'}
                </motion.button>
              </div>
            )}
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
