import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle2, ChevronRight, Loader2, Save } from 'lucide-react';
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
    id: 'lust',
    title: 'Lust & Purity',
    description: 'Breaking the cycle of visual and mental impurity.',
    declaration: 'I am a new creation. My body is a temple of the Holy Spirit. I will not be mastered by my desires.',
    passages: [
      { ref: '1 Corinthians 6:18-20', text: 'Flee from sexual immorality. All other sins a person commits are outside the body, but whoever sins sexually, sins against their own body. Do you not know that your bodies are temples of the Holy Spirit, who is in you, whom you have received from God? You are not your own; you were bought at a price. Therefore honor God with your bodies.' },
      { ref: 'Psalm 119:9', text: 'How can a young person stay on the path of purity? By living according to your word.' }
    ],
    prayer: 'Lord Jesus, I confess my struggle with lust and impurity. I am tired of being ruled by my desires and the images of this world. I renounce the lies that say I cannot change. Wash my mind with Your Word. Create in me a pure heart, O God. Give me the strength to flee temptation the moment it arises. I present my body to You today as a living sacrifice. Let my eyes be fixed on You alone. In Your holy name, Amen.',
  },
  {
    id: 'anxiety',
    title: 'Anxiety & Fear',
    description: 'Overcoming the weight of constant worry and panic.',
    declaration: 'God has not given me a spirit of fear, but of power, love, and a sound mind. I cast my cares on Him.',
    passages: [
      { ref: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.' },
      { ref: '2 Timothy 1:7', text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.' }
    ],
    prayer: 'Father, my mind is racing and my heart is heavy with fear. I bring all my 'what-ifs' and worst-case scenarios to the foot of the cross right now. I renounce the spirit of fear and anxiety over my life. I declare that You are in control of my future. Fill me with Your perfect peace that makes no sense to the world. Guard my mind today. I choose to trust You. In Jesus\' name, Amen.',
  },
  {
    id: 'pride',
    title: 'Pride & Control',
    description: 'Surrendering the need to be right, seen, and in charge.',
    declaration: 'I choose to humble myself under the mighty hand of God. I exist for His glory, not my own.',
    passages: [
      { ref: 'James 4:6', text: 'But he gives us more grace. That is why Scripture says: "God opposes the proud but shows favor to the humble."' },
      { ref: 'Philippians 2:3-4', text: 'Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves, not looking to your own interests but each of you to the interests of the others.' }
    ],
    prayer: 'Lord, forgive me for making myself the center of my universe. Forgive my need to control, my need to be right, and my desire for the applause of people. I renounce pride in all its forms. Break my stubborn will. Teach me the beauty of humility. Help me to serve others quietly today, without seeking recognition. I lay my crown at Your feet. You alone are King. In Jesus\' name, Amen.',
  },
  {
    id: 'anger',
    title: 'Anger & Bitterness',
    description: 'Releasing unforgiveness and a hot temper.',
    declaration: 'I forgive as I have been forgiven. I surrender my right to revenge to the Lord.',
    passages: [
      { ref: 'Ephesians 4:31-32', text: 'Get rid of all bitterness, rage and anger, brawling and slander, along with every form of malice. Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.' },
      { ref: 'James 1:19-20', text: 'My dear brothers and sisters, take note of this: Everyone should be quick to listen, slow to speak and slow to become angry, because human anger does not produce the righteousness that God desires.' }
    ],
    prayer: 'Father God, I confess the anger and bitterness that has taken root in my heart. I release those who have hurt me [name them specifically if needed]. I choose to forgive them right now, just as You have completely forgiven me. Drain the poison of resentment from my soul. Replace my quick temper with Your patience and gentleness. Let Your grace overflow in me so I can respond with love instead of rage. In Jesus\' name, Amen.',
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
      <div className="glass-panel p-6 rounded-3xl" style={{ borderLeft: '4px solid #e53e3e' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-2 text-red-500">The Declaration</h3>
        <p className="text-xl font-bold leading-snug">"{data.declaration}"</p>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--accent)' }}>
          <Shield className="w-4 h-4" /> The Sword of the Spirit
        </h3>
        {data.passages.map((p, i) => (
          <div key={i}>
            <p className="font-bold text-sm mb-1">{p.ref}</p>
            <p className="text-sm opacity-80 leading-relaxed italic border-l-2 pl-3 py-1" style={{ borderColor: 'var(--bg-card-border)' }}>
              "{p.text}"
            </p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 rounded-3xl">
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          Prayer of Breaking
        </h3>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.prayer}</p>
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
