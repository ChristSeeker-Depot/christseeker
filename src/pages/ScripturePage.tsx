import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VerseResult {
  reference: string;
  text: string;
  translation_name: string;
}

export default function ScripturePage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<VerseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const encoded = encodeURIComponent(query.trim());
      const res = await fetch(`https://bible-api.com/${encoded}`);
      if (!res.ok) throw new Error('Passage not found. Try a reference like "John 3:16" or "Romans 8:28".');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult({ reference: data.reference, text: data.text, translation_name: data.translation_name });
    } catch (err: any) {
      setError(err.message || 'Could not fetch passage.');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = ['John 3:16', 'Romans 8:28', 'Psalm 23', 'Philippians 4:6-7', 'Isaiah 40:31'];

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-4 mb-10 animate-fade-in">
        <Link to="/">
          <motion.div whileTap={{ scale: 0.90 }} className="p-2 opacity-70 hover:opacity-100 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </motion.div>
        </Link>
        <h1 className="text-2xl font-bold">Scripture Search</h1>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='e.g. John 3:16 or Romans 8'
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl font-medium text-white flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            <Search className="w-4 h-4" />
          </motion.button>
        </form>

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2 mb-8">
          {suggestions.map(s => (
            <motion.button
              key={s}
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuery(s)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
            >
              {s}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16 opacity-50">
              Seeking the Word...
            </motion.div>
          )}

          {error && (
            <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl text-red-500 text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
              {error}
            </motion.div>
          )}

          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-8 rounded-3xl"
            >
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                {result.reference} · {result.translation_name}
              </p>
              <p className="text-lg font-serif italic leading-relaxed whitespace-pre-wrap">{result.text.trim()}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
