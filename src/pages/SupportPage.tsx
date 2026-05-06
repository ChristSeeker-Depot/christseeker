import { motion } from 'framer-motion';
import { Heart, Server, Zap, ArrowLeft, Globe, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-3 mb-8">
        <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
        <h1 className="text-2xl font-bold tracking-tight">Support the Mission</h1>
      </header>

      <div className="space-y-8">
        <section className="text-center py-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6"
          >
            <Heart className="w-10 h-10 text-red-500 animate-pulse" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-3">Keep the Light On</h2>
          <p className="opacity-70 text-sm leading-relaxed max-w-md mx-auto">
            ChristSeeker serves churches around the world. Your support helps us cover the high costs of professional AI and secure global hosting.
          </p>
        </section>

        <div className="grid gap-4">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 flex gap-5 items-start" style={{ background: 'var(--bg-card)' }}>
            <div className="p-3 rounded-2xl bg-blue-500/10"><Zap className="w-6 h-6 text-blue-500" /></div>
            <div>
              <h3 className="font-bold mb-1">AI Transcription & Analysis</h3>
              <p className="text-xs opacity-50 leading-relaxed">
                We use elite Deepgram Nova-2 and Google Gemini models. These provide the speed and accuracy required for live worship, but carry significant per-minute costs.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5 flex gap-5 items-start" style={{ background: 'var(--bg-card)' }}>
            <div className="p-3 rounded-2xl bg-emerald-500/10"><Server className="w-6 h-6 text-emerald-500" /></div>
            <div>
              <h3 className="font-bold mb-1">Global Infrastructure</h3>
              <p className="text-xs opacity-50 leading-relaxed">
                Your spiritual data is protected by high-grade encrypted servers. We maintain redundant global hosting to ensure 100% uptime for Sunday services.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5 flex gap-5 items-start" style={{ background: 'var(--bg-card)' }}>
            <div className="p-3 rounded-2xl bg-purple-500/10"><Globe className="w-6 h-6 text-purple-500" /></div>
            <div>
              <h3 className="font-bold mb-1">Future Innovation</h3>
              <p className="text-xs opacity-50 leading-relaxed">
                We are constantly building new tools for the global church—from multi-language translations to automated liturgy generation.
              </p>
            </div>
          </div>
        </div>

        <section className="pt-8 text-center space-y-6">
          <p className="text-sm font-medium opacity-80 italic">"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." — 2 Corinthians 9:7</p>
          
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <motion.a 
              href="https://buy.stripe.com/14A6oHfGwgJV5Up4U4gQE00" 
              target="_blank"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-4 rounded-2xl bg-[var(--accent)] text-white font-bold shadow-xl flex items-center justify-center gap-3"
            >
              <HeartHandshake className="w-5 h-5" />
              Make a Maintenance Donation
            </motion.a>
            <p className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Secure via Stripe</p>
          </div>
        </section>

        <footer className="pt-12 pb-12 text-center">
          <div className="flex justify-center gap-2 mb-4 opacity-30">
             <Globe className="w-4 h-4" />
             <p className="text-[10px] font-bold uppercase tracking-widest">Global Ministry Support</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
