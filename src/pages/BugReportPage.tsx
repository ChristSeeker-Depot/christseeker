import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bug, Send, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ['UI / Visual', 'Login & Account', 'Live Subtitles', 'AI Chat', 'Sermon Notes', 'Prayer Wall', 'Scripture Search', 'Settings', 'Other'];
const SEVERITIES = [
  { label: 'Low — Minor inconvenience', value: 'low' },
  { label: 'Medium — Feature not working', value: 'medium' },
  { label: 'High — Blocks core usage', value: 'high' },
];

export default function BugReportPage() {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 3 && description.trim().length > 10 && category;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Store in Supabase
      const { error: dbError } = await supabase.from('bug_reports').insert({
        user_id: user?.id ?? null,
        user_email: user?.email ?? 'anonymous',
        title: title.trim(),
        category,
        severity,
        description: description.trim(),
        steps: steps.trim() || null,
        denomination: profile?.denomination ?? null,
      });

      if (dbError) throw dbError;

      // 2. Send email via Edge Function
      await supabase.functions.invoke('send-bug-report', {
        body: {
          title: title.trim(),
          category,
          severity,
          description: description.trim(),
          steps: steps.trim() || 'Not provided',
          userEmail: user?.email ?? 'anonymous',
          denomination: profile?.denomination ?? 'N/A',
        },
      });

      setSubmitted(true);
    } catch (err: any) {
      setError('Failed to submit report. Please try again or email 19e.nixon@gmail.com directly.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-6 text-center" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Report Received</h1>
          <p className="opacity-60 text-sm leading-relaxed max-w-xs">
            Thank you for helping improve ChristSeeker. Your report has been sent and we'll look into it as soon as possible.
          </p>
          <Link to="/settings">
            <motion.button whileTap={{ scale: 0.96 }} className="mt-8 px-8 py-3 rounded-2xl font-bold text-white" style={{ background: 'var(--accent)' }}>
              Back to Settings
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-3 mb-8">
        <Link to="/settings"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report a Bug</h1>
          <p className="text-xs opacity-40 mt-0.5">Help us make ChristSeeker better</p>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* Intro */}
        <div className="glass-panel p-5 rounded-2xl flex gap-4 items-start" style={{ background: 'var(--bg-card)' }}>
          <Bug className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm opacity-70 leading-relaxed">
            Found something broken? Tell us what happened and we'll get it fixed. Reports go directly to the developer — thank you for helping the global church!
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block">Bug Title <span className="text-red-400">*</span></label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Live Subtitles don't start on Safari"
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block">Category <span className="text-red-400">*</span></label>
          <div className="relative">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none appearance-none pr-10"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none" />
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block">Severity</label>
          <div className="grid grid-cols-1 gap-2">
            {SEVERITIES.map(s => (
              <button
                key={s.value}
                onClick={() => setSeverity(s.value)}
                className={`p-3 rounded-xl text-left text-sm font-medium transition-all border ${severity === s.value ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-transparent'}`}
                style={severity !== s.value ? { background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block">What happened? <span className="text-red-400">*</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the bug clearly. What did you expect to happen vs what actually happened?"
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Steps */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block">Steps to reproduce <span className="opacity-60 normal-case font-normal">(optional)</span></label>
          <textarea
            value={steps}
            onChange={e => setSteps(e.target.value)}
            placeholder="1. Go to Live Subtitles&#10;2. Tap 'Start Broadcast'&#10;3. See error..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
          />
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">
            {error}
          </motion.p>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: canSubmit ? 1.01 : 1 }}
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="w-full py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-3 disabled:opacity-40 mt-4"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {loading ? 'Sending Report...' : 'Submit Bug Report'}
        </motion.button>

        <p className="text-[10px] opacity-30 text-center">
          Reports are sent to the developer and stored securely. Your email is included to allow follow-up.
        </p>

      </motion.div>
    </div>
  );
}
