import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Save, Loader2, Brain, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Extend window type for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Mode = 'idle' | 'subtitles' | 'notetaker' | 'summary';

export default function SermonLivePage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('idle');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalLines, setFinalLines] = useState<string[]>([]);
  const [fullTranscript, setFullTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [summarising, setSummarising] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          setFinalLines(prev => [...prev, text]);
          transcriptRef.current += ' ' + text;
          setFullTranscript(transcriptRef.current.trim());
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
      // Auto-scroll subtitles
      if (subtitleRef.current) subtitleRef.current.scrollTop = subtitleRef.current.scrollHeight;
    };
    recognition.onerror = () => { setIsListening(false); };
    recognition.onend = () => { if (isListening) recognition.start(); };
    recognitionRef.current = recognition;
    return () => { recognition.abort(); };
  }, []);

  const startListening = (selectedMode: 'subtitles' | 'notetaker') => {
    setMode(selectedMode);
    setFinalLines([]);
    setInterimText('');
    transcriptRef.current = '';
    setFullTranscript('');
    setSummary('');
    setIsListening(true);
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.abort();
    setInterimText('');
    if (mode === 'notetaker' && fullTranscript) {
      handleSummarise();
    }
  };

  const handleSummarise = useCallback(async () => {
    if (!fullTranscript.trim()) return;
    setSummarising(true);
    setMode('summary');
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: `Analyse this sermon transcript and respond with a structured summary in markdown format. Include:\n1. **3-sentence summary**\n2. **Bible verses referenced**\n3. **3–5 key points**\n4. **One practical application**\n\nTranscript:\n\n${fullTranscript}`,
          history: [],
          denomination: 'Non-Denominational',
          mode: 'devotional',
        },
      });
      if (!error && data?.reply) setSummary(data.reply);
    } catch { /* silent */ } finally {
      setSummarising(false);
    }
  }, [fullTranscript]);

  const saveToJournal = async () => {
    if (!user || !summary) return;
    setSaving(true);
    await supabase.from('journal_entries').insert({
      user_id: user.id,
      title: `Sermon Notes — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      content: summary,
      entry_type: 'sermon_note',
      metadata: { source: 'ai_notetaker' },
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
    setSaving(false);
  };

  if (!supported) {
    return (
      <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
        <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 mb-6 w-fit"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
        <div className="text-center py-20 opacity-60">
          <MicOff className="w-12 h-12 mx-auto mb-4" />
          <p className="font-bold text-lg mb-2">Speech recognition not supported</p>
          <p className="text-sm">Please use Google Chrome or Microsoft Edge to access this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-3 mb-8">
        <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
        <h1 className="text-2xl font-bold">
          {mode === 'subtitles' ? 'Live Subtitles' : mode === 'notetaker' || mode === 'summary' ? 'AI Note Taker' : 'Sermon Tools'}
        </h1>
      </header>

      {/* Mode selector */}
      {mode === 'idle' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-5">
          <div className="text-center mb-2">
            <p className="opacity-60 text-sm">Select a tool to use during your service</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => startListening('subtitles')}
            className="glass-panel p-8 rounded-3xl text-left border-2 border-transparent hover:border-[var(--accent)]/30 transition-all group">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: 'var(--accent)' }}>
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Live Subtitles</h2>
            <p className="text-sm opacity-60">Real-time, large-text captions of the sermon. Ideal for deaf or hard-of-hearing churchgoers. Keep your screen on and follow along.</p>
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => startListening('notetaker')}
            className="glass-panel p-8 rounded-3xl text-left border-2 border-transparent hover:border-[var(--accent)]/30 transition-all group">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
              <Brain className="w-7 h-7" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2">AI Note Taker</h2>
            <p className="text-sm opacity-60">Place your phone down, let it listen. When you stop, Gemini AI will generate a structured summary of the sermon with key points and application.</p>
          </motion.button>
        </motion.div>
      )}

      {/* Subtitles view */}
      {mode === 'subtitles' && (
        <div className="flex-1 flex flex-col">
          <div ref={subtitleRef} className="flex-1 overflow-y-auto glass-panel rounded-3xl p-6 mb-6 space-y-3" style={{ minHeight: '300px', maxHeight: '55vh' }}>
            {finalLines.map((line, i) => (
              <p key={i} className="text-2xl md:text-3xl font-bold leading-tight">{line}</p>
            ))}
            {interimText && <p className="text-2xl md:text-3xl font-bold leading-tight opacity-40">{interimText}</p>}
            {finalLines.length === 0 && !interimText && <p className="opacity-30 text-lg">Listening… speak near the device.</p>}
          </div>
          <div className="flex justify-center">
            <motion.button whileTap={{ scale: 0.95 }} onClick={stopListening}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white shadow-xl"
              style={{ background: '#e53e3e' }}>
              <MicOff className="w-5 h-5" /> Stop Listening
            </motion.button>
          </div>
        </div>
      )}

      {/* Note Taker — listening */}
      {mode === 'notetaker' && isListening && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            className="w-28 h-28 rounded-full flex items-center justify-center shadow-xl" style={{ background: 'var(--accent)' }}>
            <Mic className="w-12 h-12 text-white" />
          </motion.div>
          <div>
            <p className="text-xl font-bold mb-1">Recording…</p>
            <p className="text-sm opacity-60">{fullTranscript.split(' ').filter(Boolean).length} words captured</p>
          </div>
          <p className="text-xs opacity-40 max-w-xs">Place your device facing the speaker. When the service ends, tap Stop.</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={stopListening}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white shadow-xl mt-4"
            style={{ background: '#e53e3e' }}>
            <MicOff className="w-5 h-5" /> Stop & Summarise
          </motion.button>
        </div>
      )}

      {/* Summary view */}
      {mode === 'summary' && (
        <div className="flex-1 flex flex-col">
          {summarising ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent)' }} />
              <p className="opacity-60">Gemini is analysing the sermon…</p>
            </div>
          ) : (
            <>
              <div className="glass-panel p-6 rounded-3xl mb-5 overflow-y-auto flex-1" style={{ maxHeight: '55vh' }}>
                <h2 className="font-bold mb-4 flex items-center gap-2"><Brain className="w-5 h-5" style={{ color: 'var(--accent)' }} /> AI Sermon Summary</h2>
                <div className="text-sm leading-relaxed whitespace-pre-wrap opacity-80">{summary}</div>
              </div>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={saveToJournal} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savedMsg ? 'Saved!' : saving ? 'Saving…' : 'Save to Journal'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setMode('idle')}
                  className="px-5 py-3 rounded-xl font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                  Done
                </motion.button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
