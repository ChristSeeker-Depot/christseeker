import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, BookOpen, GraduationCap, Map, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface VerseResult {
  reference: string;
  text: string;
  translation_name: string;
}

export default function ScripturePage() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<VerseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scholar Mode
  const [scholarMode, setScholarMode] = useState(false);
  const [analyzingWord, setAnalyzingWord] = useState<string | null>(null);
  const [wordData, setWordData] = useState<any | null>(null);

  // Maps
  const [extractingMap, setExtractingMap] = useState(false);
  const [mapLocation, setMapLocation] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setMapLocation(null);

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

  const handleWordClick = async (word: string) => {
    if (!scholarMode || !result) return;
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (!cleanWord) return;

    setAnalyzingWord(cleanWord);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: `Analyze the word "${cleanWord}" in the context of ${result.reference}. Return valid JSON: {"original_word": "Greek/Hebrew word", "transliteration": "...", "strongs": "Strong's number", "definition": "Brief meaning", "commentary": "1-2 sentences of early church father context."}`,
          history: [],
          denomination: profile?.denomination || 'Non-Denominational',
          mode: 'scholar_lookup',
        },
      });

      if (!error && data?.reply) {
        let jsonStr = data.reply;
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/```$/, '').trim();
        }
        setWordData(JSON.parse(jsonStr));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingWord(null);
    }
  };

  const handleExtractLocations = async () => {
    if (!result) return;
    setExtractingMap(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: `Identify the primary historical city or region mentioned in this passage: "${result.text}". Return ONLY the name of the place (e.g., "Jerusalem", "Sea of Galilee"). If none, return "NONE".`,
          history: [],
          mode: 'extract_locations',
        },
      });

      if (!error && data?.reply && data.reply !== 'NONE') {
        setMapLocation(data.reply.trim());
      } else {
        alert("No historical locations found in this passage.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExtractingMap(false);
    }
  };

  const renderText = (text: string) => {
    if (!scholarMode) return <p className="text-lg font-serif italic leading-relaxed whitespace-pre-wrap">{text}</p>;
    
    return (
      <p className="text-lg font-serif italic leading-relaxed whitespace-pre-wrap">
        {text.split(' ').map((word, i) => (
          <span 
            key={i} 
            onClick={() => handleWordClick(word)}
            className="cursor-pointer hover:bg-[var(--accent)] hover:text-white rounded px-0.5 transition-colors"
          >
            {word}{' '}
          </span>
        ))}
      </p>
    );
  };

  const suggestions = ['John 3:16', 'Romans 8:28', 'Psalm 23', 'Philippians 4:6-7', 'Isaiah 40:31'];

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen relative" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      {/* Scholar Modal */}
      <AnimatePresence>
        {wordData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setWordData(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl p-6 shadow-2xl relative" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}>
              <button onClick={() => setWordData(null)} className="absolute top-4 right-4 p-1 opacity-50 hover:opacity-100"><X className="w-5 h-5" /></button>
              <div className="mb-4 pb-4 border-b border-white/10">
                <h3 className="text-2xl font-bold font-serif">{wordData.original_word}</h3>
                <p className="text-sm opacity-60 italic">{wordData.transliteration} • Strong's {wordData.strongs}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Definition</p>
                  <p className="text-sm font-medium">{wordData.definition}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Historical Context</p>
                  <p className="text-sm italic">{wordData.commentary}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center gap-4 mb-10 animate-fade-in">
        <Link to="/"><motion.div whileTap={{ scale: 0.90 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
        <h1 className="text-2xl font-bold">Scripture Search</h1>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder='e.g. John 3:16 or Romans 8' className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }} />
          </div>
          <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={loading} className="px-5 py-3 rounded-xl font-medium text-white flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--accent)' }}>
            <Search className="w-4 h-4" />
          </motion.button>
        </form>

        <div className="flex flex-wrap gap-2 mb-8">
          {suggestions.map(s => (
            <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => { setQuery(s); setTimeout(() => handleSearch(), 0); }} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}>
              {s}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {loading && <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16 opacity-50">Seeking the Word...</motion.div>}
          {error && <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl text-red-500 text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>{error}</motion.div>}

          {result && !loading && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <button 
                  onClick={() => setScholarMode(!scholarMode)} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${scholarMode ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-transparent border-[var(--bg-card-border)] opacity-60 hover:opacity-100'}`}
                >
                  <GraduationCap className="w-4 h-4" /> {scholarMode ? 'Scholar Mode ON' : 'Scholar Mode'}
                </button>
                <button 
                  onClick={handleExtractLocations} 
                  disabled={extractingMap}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-transparent border-[var(--bg-card-border)] opacity-60 hover:opacity-100 disabled:opacity-30"
                >
                  {extractingMap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />} Historical Map
                </button>
              </div>

              {scholarMode && <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-2 animate-pulse">Tap any word to translate</p>}
              
              <div className="glass-panel p-8 rounded-3xl relative">
                {analyzingWord && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl backdrop-blur-sm bg-black/20">
                    <div className="bg-[var(--bg-card)] px-6 py-3 rounded-full flex items-center gap-3 shadow-xl">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                      <span className="text-sm font-bold">Analyzing "{analyzingWord}"...</span>
                    </div>
                  </div>
                )}
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                  {result.reference} · {result.translation_name}
                </p>
                {renderText(result.text.trim())}
              </div>

              {mapLocation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel p-2 rounded-3xl overflow-hidden mt-4">
                  <div className="flex items-center justify-between p-4 pb-2">
                    <p className="text-sm font-bold flex items-center gap-2"><Map className="w-4 h-4 text-[var(--accent)]" /> {mapLocation}</p>
                    <button onClick={() => setMapLocation(null)} className="opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="w-full h-64 rounded-2xl overflow-hidden">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" style={{ border: 0 }} 
                      src={`https://www.google.com/maps?q=${encodeURIComponent(mapLocation + ' ancient historical site')}&output=embed`} 
                      allowFullScreen 
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
