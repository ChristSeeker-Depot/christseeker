import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const DENOMINATIONS = [
  'Anglican',
  'Catholic',
  'Baptist',
  'Reformed',
  'Pentecostal',
  'Orthodox',
  'Non-Denominational'
];

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // If already onboarded, redirect to dashboard
  if (profile) {
    return <Navigate to="/" />;
  }

  const handleComplete = async () => {
    if (!selected || !user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{ id: user.id, denomination: selected }]);
        
      if (error) throw error;
      
      await refreshProfile();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3 animate-slide-in-bottom">Choose Your Tradition</h1>
          <p className="opacity-70 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            To help us provide tailored guidance and prayers, please select your denomination.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {DENOMINATIONS.map((den, index) => (
            <motion.button
              key={den}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(den)}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 glass-panel
                ${selected === den 
                  ? 'border-[#2D3436] bg-[var(--color-soft-blue)]' 
                  : 'border-transparent hover:border-[#E3EBF3]'}
              `}
            >
              <span className="font-medium">{den}</span>
            </motion.button>
          ))}
        </div>

        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleComplete}
            disabled={!selected || loading}
            className="px-8 py-3 rounded-xl bg-[#2D3436] text-white font-medium hover:bg-[#1a1f20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue'}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
