import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Church, ChevronRight, PenLine } from 'lucide-react';

const DENOMINATIONS = [
  'Anglican',
  'Catholic',
  'Baptist',
  'Reformed',
  'Pentecostal',
  'Orthodox',
  'Non-Denominational',
];

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');
  const [customDenomination, setCustomDenomination] = useState('');
  const [churchName, setChurchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (profile) return <Navigate to="/" />;

  const isOther = selected === 'Other';
  const finalDenomination = isOther ? customDenomination.trim() : selected;
  const canContinue = finalDenomination.length > 0 && (!isOther || customDenomination.trim().length > 0);

  const handleComplete = async () => {
    if (!canContinue || !user) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          denomination: finalDenomination,
          church_name: churchName.trim() || null,
        }]);
      if (error) throw error;
      await refreshProfile();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const allOptions = [...DENOMINATIONS, 'Other'];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F8F9FA] to-[#E3EBF3]"
      style={{ color: 'var(--text-primary)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
            className="w-16 h-16 rounded-full bg-[#2D3436] flex items-center justify-center mx-auto mb-5 shadow-xl"
          >
            <Church className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Your Faith, Your Home</h1>
          <p className="opacity-60 text-sm max-w-sm mx-auto">
            Help us personalise your experience by telling us a little about your tradition and your church community.
          </p>
        </div>

        {/* Step 1 — Denomination */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-3xl mb-5 shadow-sm"
        >
          <h2 className="font-bold mb-1">Your Tradition</h2>
          <p className="text-sm opacity-60 mb-5">Select the denomination that best reflects your faith community.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allOptions.map((den, i) => (
              <motion.button
                key={den}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelected(den); if (den !== 'Other') setCustomDenomination(''); }}
                className={`p-3 rounded-2xl border-2 text-sm font-medium transition-all duration-200 text-left flex items-center gap-2
                  ${selected === den
                    ? 'border-[#2D3436] bg-[#2D3436] text-white shadow-md'
                    : 'border-transparent bg-white/40 hover:bg-white/70 hover:border-[#E3EBF3]'
                  }
                  ${den === 'Other' ? 'italic' : ''}
                `}
              >
                {den === 'Other' ? <PenLine className="w-4 h-4 shrink-0" /> : null}
                {den}
              </motion.button>
            ))}
          </div>

          {/* Custom denomination input */}
          <AnimatePresence>
            {isOther && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <label className="block text-sm font-medium mb-1">Enter your denomination</label>
                <input
                  value={customDenomination}
                  onChange={e => setCustomDenomination(e.target.value)}
                  placeholder="e.g. Quaker, Mennonite, Assemblies of God..."
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#2D3436] transition-all text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Step 2 — Church Name (optional) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel p-6 rounded-3xl mb-6 shadow-sm"
        >
          <h2 className="font-bold mb-1">Your Church <span className="font-normal opacity-50 text-sm">(optional)</span></h2>
          <p className="text-sm opacity-60 mb-4">
            Let us know where you worship. This is just for personalisation and is never shared.
          </p>
          <input
            value={churchName}
            onChange={e => setChurchName(e.target.value)}
            placeholder="e.g. St. Peter's Church, Birmingham"
            className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#2D3436] transition-all text-sm"
          />
        </motion.div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: canContinue ? 1.02 : 1 }}
            onClick={handleComplete}
            disabled={!canContinue || loading}
            className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-[#2D3436] text-white font-semibold text-base hover:bg-[#1a1f20] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
          >
            {loading ? 'Saving your profile...' : 'Enter ChristSeeker'}
            {!loading && <ChevronRight className="w-5 h-5" />}
          </motion.button>
        </motion.div>

        <p className="text-center text-xs opacity-40 mt-4">
          You can change these settings at any time from your profile.
        </p>
      </motion.div>
    </div>
  );
}
