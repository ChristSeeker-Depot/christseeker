import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BREATH_SCRIPTURE = "Be still, and know that I am God. — Psalm 46:10";

const phases = [
  { label: 'Breathe In', duration: 4, scale: 1.3 },
  { label: 'Hold', duration: 4, scale: 1.3 },
  { label: 'Breathe Out', duration: 6, scale: 1 },
];

export default function BreathPrayerPage() {
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(phases[0].duration);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSession = () => {
    setActive(true);
    setPhaseIndex(0);
    setCountdown(phases[0].duration);
  };

  const stopSession = () => {
    setActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setPhaseIndex(0);
    setCountdown(phases[0].duration);
  };

  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setPhaseIndex(pi => {
            const next = (pi + 1) % phases.length;
            setCountdown(phases[next].duration);
            return next;
          });
          return phases[(phaseIndex + 1) % phases.length].duration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active, phaseIndex]);

  const currentPhase = phases[phaseIndex];

  return (
    <div className="max-w-lg mx-auto p-6 min-h-screen flex flex-col" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-4 mb-10 animate-fade-in">
        <Link to="/">
          <motion.div whileTap={{ scale: 0.90 }} className="p-2 opacity-70 hover:opacity-100 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </motion.div>
        </Link>
        <h1 className="text-2xl font-bold">Breath Prayer</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-10">
        <p className="text-center font-serif italic text-lg opacity-70 px-6">{BREATH_SCRIPTURE}</p>

        {/* Breathing circle */}
        <div className="relative flex items-center justify-center w-56 h-56">
          {/* Outer glow ring */}
          <motion.div
            animate={active ? { scale: currentPhase.scale, opacity: 0.2 } : { scale: 1, opacity: 0.1 }}
            transition={{ duration: currentPhase.duration, ease: 'easeInOut' }}
            className="absolute w-56 h-56 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
          {/* Inner circle */}
          <motion.div
            animate={active ? { scale: currentPhase.scale === 1.3 ? 1.15 : 0.9 } : { scale: 1 }}
            transition={{ duration: currentPhase.duration, ease: 'easeInOut' }}
            className="w-40 h-40 rounded-full flex flex-col items-center justify-center z-10"
            style={{ background: 'var(--accent)', opacity: 0.85 }}
          >
            {active ? (
              <>
                <span className="text-white font-semibold text-base">{currentPhase.label}</span>
                <span className="text-white text-3xl font-bold mt-1">{countdown}</span>
              </>
            ) : (
              <span className="text-white font-semibold text-sm text-center px-3">Tap to begin</span>
            )}
          </motion.div>
        </div>

        <AnimatePresence>
          {!active ? (
            <motion.button
              key="start"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={startSession}
              className="px-8 py-3 rounded-xl font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              Begin Session
            </motion.button>
          ) : (
            <motion.button
              key="stop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopSession}
              className="px-8 py-3 rounded-xl font-medium opacity-60 hover:opacity-100 transition-opacity"
              style={{ border: '1px solid var(--bg-card-border)' }}
            >
              End Session
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex gap-6 text-xs opacity-40">
          {phases.map((p, i) => (
            <div key={p.label} className={`text-center ${active && i === phaseIndex ? 'opacity-100 font-bold' : ''}`}>
              <p>{p.label}</p>
              <p>{p.duration}s</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
