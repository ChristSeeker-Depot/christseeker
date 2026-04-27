import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Cross, Mail, RefreshCw, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import type { FormEvent } from 'react';

export default function AuthPage() {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (user) return <Navigate to="/" />;

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Show the "check your email" screen
        setAwaitingVerification(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } }
  };

  const particles = Array.from({ length: 8 });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#F8F9FA] to-[#E3EBF3]">

      {/* Floating background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white opacity-40 blur-xl"
            initial={{ x: Math.random() * 1200, y: Math.random() * 800, scale: Math.random() * 0.5 + 0.5 }}
            animate={{ y: [null, Math.random() * -100 - 50], x: [null, Math.random() * 100 - 50] }}
            transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
            style={{ width: Math.random() * 100 + 50, height: Math.random() * 100 + 50 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel p-8 rounded-3xl w-full max-w-md relative z-10 shadow-2xl border border-white/60"
      >
        <AnimatePresence mode="wait">

          {/* ── Email Verification Waiting Screen ── */}
          {awaitingVerification ? (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-full bg-[#E3EBF3] flex items-center justify-center mb-6"
              >
                <Mail className="w-9 h-9 text-[#2D3436]" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
              <p className="text-sm opacity-70 mb-1">We've sent a verification link to:</p>
              <p className="font-semibold mb-6 text-sm break-all">{email}</p>

              <div className="bg-[#E3EBF3]/40 border border-[#E3EBF3] rounded-2xl p-4 text-sm opacity-80 mb-8 text-left space-y-1">
                <p>1. Open your email inbox.</p>
                <p>2. Click the link in the email from Supabase.</p>
                <p>3. You'll be brought straight into ChristSeeker.</p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleResend}
                disabled={resendLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D3436] text-white font-medium text-sm hover:bg-[#1a1f20] transition-colors disabled:opacity-60 shadow-md"
              >
                <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                {resendLoading ? 'Resending...' : 'Resend Verification Email'}
              </motion.button>

              {resendSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-green-600 text-sm mt-4"
                >
                  <CheckCircle2 className="w-4 h-4" /> Email resent successfully!
                </motion.div>
              )}
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

              <button
                onClick={() => { setAwaitingVerification(false); setIsLogin(true); }}
                className="mt-6 text-xs opacity-50 hover:opacity-100 transition-opacity"
              >
                Back to Login
              </button>
            </motion.div>

          ) : (
            /* ── Auth Form ── */
            <motion.div key="form" variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col">

              <motion.div variants={itemVariants} className="flex justify-center mb-6">
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}>
                  <Cross className="w-12 h-12 text-[#2D3436]" />
                </motion.div>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-3xl font-bold text-center mb-1">ChristSeeker</motion.h1>
              <motion.p variants={itemVariants} className="text-center text-sm mb-8 opacity-60">
                {isLogin ? 'Welcome back. Enter and be still.' : 'Begin your journey of faith.'}
              </motion.p>

              <form onSubmit={handleAuth} className="space-y-4">
                {error && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Email */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#2D3436] transition-all"
                    placeholder="your@email.com"
                  />
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#2D3436] transition-all"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                {/* Confirm Password — sign up only */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-medium mb-1">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/50 border transition-all focus:outline-none focus:ring-2 focus:ring-[#2D3436] ${confirmPassword && confirmPassword !== password ? 'border-red-300' : 'border-white/60'}`}
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowConfirm(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity">
                          {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        {confirmPassword && confirmPassword === password && (
                          <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                        )}
                      </div>
                      {confirmPassword && confirmPassword !== password && (
                        <p className="text-red-500 text-xs mt-1 pl-1">Passwords do not match.</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div variants={itemVariants} className="pt-1">
                  <motion.button
                    whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
                    type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#2D3436] text-white font-medium hover:bg-[#1a1f20] transition-colors disabled:opacity-70 shadow-lg"
                  >
                    {loading ? 'Processing...' : (isLogin ? 'Enter' : 'Create Account')}
                  </motion.button>
                </motion.div>
              </form>

              <motion.div variants={itemVariants} className="mt-6 text-center">
                <button
                  onClick={() => { setIsLogin(l => !l); setError(null); setConfirmPassword(''); }}
                  className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                >
                  {isLogin ? "Don't have an account? — Sign Up" : 'Already have an account? — Login'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
