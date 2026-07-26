import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAI } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const STEPS = [
  {
    id: 'gratitude',
    emoji: '🌟',
    title: 'Gratitude',
    subtitle: "Where did you see God's hand today?",
    placeholder: 'A moment of beauty, an answered prayer, unexpected grace, a kind word...',
  },
  {
    id: 'surrender',
    emoji: '🕊️',
    title: 'Surrender',
    subtitle: 'What burden are you laying down tonight?',
    placeholder: "A worry, a mistake, a relationship, tomorrow's fears...",
  },
];

export default function EveningExamenPage() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [gratitude, setGratitude] = useState('');
  const [surrender, setSurrender] = useState('');
  const [blessing, setBlessing] = useState('');
  const [loadingBlessing, setLoadingBlessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleNext = async () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      setStep(2);
      setLoadingBlessing(true);
      try {
        const reply = await callAI({
          message: `A Christian is ending their day in prayer. Today they are grateful for: "${gratitude}". They are surrendering to God tonight: "${surrender}". Please offer them one short, comforting Scripture passage (preferably from Psalms or the Gospels) and a 1-2 sentence gentle blessing for their sleep. Speak warmly and directly to them. Keep it under 80 words.`,
          denomination: profile?.denomination ?? 'Non-Denominational',
          mode: 'devotional',
        });
        setBlessing(reply);
      } catch {
        setBlessing('"He grants sleep to those he loves." - Psalm 127:2\n\nRest now, dear one. Tomorrow\'s grace is already prepared. You are held.');
      } finally {
        setLoadingBlessing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user || saved) return;
    setSaving(true);
    const content = `**🌟 Gratitude**\n${gratitude}\n\n**🕊️ Surrender**\n${surrender}\n\n**📖 Evening Blessing**\n${blessing}`;
    await supabase.from('journal_entries').insert({
      user_id: user.id,
      title: `Evening Examen - ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      content,
      entry_type: 'examen',
    });
    setSaved(true);
    setSaving(false);
  };

  const canContinue = step === 0 ? gratitude.trim().length > 0 : surrender.trim().length > 0;

  return (
    <div
      className="max-w-xl mx-auto p-6 min-h-screen flex flex-col"
      style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <Link to="/">
          <motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100">
            <ArrowLeft className="w-5 h-5" />
          </motion.div>
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Evening Examen</p>
          <div className="flex gap-2 justify-center">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-[var(--accent)]' : 'w-4 bg-[var(--bg-card)]'}`}
              />
            ))}
          </div>
        </div>
        <div className="w-10" />
      </header>

      {/* Step Content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step < 2 ? (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-10">
                <p className="text-6xl mb-5">{STEPS[step].emoji}</p>
                <h1 className="text-3xl font-bold mb-2">{STEPS[step].title}</h1>
                <p className="opacity-60 text-sm">{STEPS[step].subtitle}</p>
              </div>
              <textarea
                value={step === 0 ? gratitude : surrender}
                onChange={e => step === 0 ? setGratitude(e.target.value) : setSurrender(e.target.value)}
                placeholder={STEPS[step].placeholder}
                rows={8}
                autoFocus
                className="w-full px-5 py-4 rounded-3xl text-sm resize-none focus:outline-none focus:ring-2 custom-scrollbar flex-1"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--bg-card-border)',
                  color: 'var(--text-primary)',
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="blessing"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-10">
                <p className="text-6xl mb-5">📖</p>
                <h1 className="text-3xl font-bold mb-2">Evening Blessing</h1>
                <p className="opacity-60 text-sm">Rest in His Word</p>
              </div>

              <div
                className="glass-panel p-8 rounded-3xl flex-1 flex flex-col justify-center min-h-[180px]"
              >
                {loadingBlessing ? (
                  <div className="flex flex-col items-center gap-4 opacity-50 py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm">Preparing your blessing...</p>
                  </div>
                ) : (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-base leading-relaxed whitespace-pre-wrap font-serif italic opacity-90 text-center"
                  >
                    {blessing}
                  </motion.p>
                )}
              </div>

              {!loadingBlessing && blessing && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="mt-5 w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                  style={{ background: saved ? '#38a169' : 'var(--accent)' }}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saved ? 'Saved to Journal ✓' : 'Save to Journal & Rest Well'}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Continue Button */}
      {step < 2 && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleNext}
          disabled={!canContinue}
          className="mt-6 w-full py-4 rounded-2xl text-white font-bold disabled:opacity-40 transition-opacity"
          style={{ background: 'var(--accent)' }}
        >
          {step === 1 ? 'Receive Your Blessing ->' : 'Continue ->'}
        </motion.button>
      )}
    </div>
  );
}
