import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Save, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function DevotionalPage() {
  const { user, profile } = useAuth();
  const [topic, setTopic] = useState('');
  const [devotional, setDevotional] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prompts = [
    'Feeling anxious about the future',
    'Struggling with forgiveness',
    'Gratitude for today',
    'Seeking God in doubt',
    'Finding peace in suffering',
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setDevotional('');
    setSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: `Create a personal devotional for someone who is experiencing: "${topic}". 
Format your response exactly as follows using markdown:
**📖 Scripture**
[A single, relevant Bible verse with reference]

**🙏 Reflection**
[2–3 warm, pastoral paragraphs connecting the verse to their experience]

**✉️ A Prayer for Today**
[A short, first-person prayer they can pray right now]`,
          history: [],
          denomination: profile?.denomination ?? 'Non-Denominational',
          mode: 'devotional',
        },
      });
      if (error || data?.error) throw new Error(data?.error || 'Could not generate devotional.');
      setDevotional(data.reply);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !devotional) return;
    setSaving(true);
    await supabase.from('journal_entries').insert({
      user_id: user.id,
      title: `Devotional: ${topic}`,
      content: devotional,
      entry_type: 'general',
    });
    setSaved(true);
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-3 mb-8">
        <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
        <h1 className="text-2xl font-bold">Daily Devotional</h1>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass-panel p-6 rounded-3xl mb-5">
          <label className="block font-semibold mb-1">How are you feeling today?</label>
          <p className="text-sm mb-4 opacity-60">Tell us what's on your heart — or choose a prompt below.</p>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Anxious about my new job, struggling to forgive someone..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 mb-4 transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
          />
          <div className="flex flex-wrap gap-2 mb-4">
            {prompts.map(p => (
              <motion.button key={p} whileTap={{ scale: 0.95 }}
                onClick={() => setTopic(p)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{ background: topic === p ? 'var(--accent)' : 'var(--bg-card)', color: topic === p ? '#fff' : 'var(--text-primary)', border: '1px solid var(--bg-card-border)' }}>
                {p}
              </motion.button>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleGenerate}
            disabled={!topic.trim() || loading}
            className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Preparing your devotional…' : 'Generate Devotional'}
          </motion.button>
        </div>

        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center mb-4">{error}</motion.p>}

        <AnimatePresence>
          {devotional && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-panel p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <h2 className="font-bold">Your Devotional</h2>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap opacity-90 mb-6">{devotional}</div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleSave}
                disabled={saving || saved}
                className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                style={{ background: saved ? '#38a169' : 'var(--bg-card)', color: saved ? '#fff' : 'var(--text-primary)', border: '1px solid var(--bg-card-border)' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved to Journal ✓' : saving ? 'Saving…' : 'Save to Journal'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
