import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Save, Loader2, Brain, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
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
  /** When true, subtitle mode also generates AI notes on stop */
  const [autoNotes, setAutoNotes] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const previousTranscriptRef = useRef('');
  const autoNotesRef = useRef(false);
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
      let currentSessionFinal = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          currentSessionFinal += result[0].transcript.trim() + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      
      const fullSessionText = (previousTranscriptRef.current + ' ' + currentSessionFinal).trim();
      const lines = fullSessionText.match(/[^.!?]+[.!?]+/g) || [fullSessionText];
      
      setFinalLines(lines.slice(-3).map(l => l.trim()).filter(Boolean));
      transcriptRef.current = fullSessionText;
      setFullTranscript(fullSessionText);
      setInterimText(interim);
      
      // Auto-scroll subtitles
      if (subtitleRef.current) subtitleRef.current.scrollTop = subtitleRef.current.scrollHeight;
    };
    recognition.onerror = () => { setIsListening(false); };
    recognition.onend = () => { 
      if (isListening) {
        previousTranscriptRef.current = transcriptRef.current;
        recognition.start(); 
      }
    };
    recognitionRef.current = recognition;
    return () => { recognition.abort(); };
  }, []);

  const startListening = (selectedMode: 'subtitles' | 'notetaker') => {
    autoNotesRef.current = selectedMode === 'subtitles' ? autoNotes : false;
    setMode(selectedMode);
    setFinalLines([]);
    setInterimText('');
    transcriptRef.current = '';
    previousTranscriptRef.current = '';
    setFullTranscript('');
    setSummary('');
    setIsListening(true);
    try {
      recognitionRef.current?.start();
    } catch (e) {
      // Ignore if already started
    }
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.abort();
    setInterimText('');
    // Trigger summary for Note Taker mode OR subtitle mode with autoNotes enabled
    if ((mode === 'notetaker' || autoNotesRef.current) && transcriptRef.current.trim()) {
      handleSummarise();
    } else {
      setMode('idle');
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

          {/* Subtitle card with Auto-Notes toggle */}
          <div className="glass-panel p-8 rounded-3xl border-2 border-transparent hover:border-[var(--accent)]/30 transition-all">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">Live Subtitles</h2>
                <p className="text-sm opacity-60 mb-5">Real-time, large-text captions. Ideal for deaf or hard-of-hearing churchgoers.</p>
                {/* Auto-notes toggle */}
                <label className="flex items-center justify-between gap-3 p-3 rounded-xl mb-4 cursor-pointer" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1.5"><Brain className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Auto-generate notes</p>
                    <p className="text-xs opacity-50 mt-0.5">AI summarises the sermon when you stop</p>
                  </div>
                  <div onClick={() => setAutoNotes(n => !n)}
                    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 cursor-pointer ${autoNotes ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoNotes ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => startListening('subtitles')}
                  className="w-full py-3 rounded-xl text-white font-medium text-sm" style={{ background: 'var(--accent)' }}>
                  Start Subtitles{autoNotes ? ' + Notes' : ''}
                </motion.button>
              </div>
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={() => startListening('notetaker')}
            className="glass-panel p-8 rounded-3xl text-left border-2 border-transparent hover:border-[var(--accent)]/30 transition-all group">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
              <Brain className="w-7 h-7" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2">AI Note Taker</h2>
            <p className="text-sm opacity-60">Place your phone down, let it listen. When you stop, Gemini AI will generate a structured summary with key points and application.</p>
          </motion.button>
        </motion.div>
      )}

      {/* Subtitles view */}
      {mode === 'subtitles' && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black text-white p-6 pb-24 md:p-12">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
              <span className="text-sm md:text-base font-bold tracking-widest uppercase opacity-70">Live Transcript</span>
            </div>
            {autoNotes && (
              <span className="text-sm font-bold flex items-center gap-2 text-gray-400">
                <Brain className="w-4 h-4" /> Notes Active
              </span>
            )}
          </div>
          <div ref={subtitleRef} className="flex-1 overflow-y-auto space-y-8 scroll-smooth pb-10">
            {finalLines.map((line, i) => (
              <p key={i} className="text-4xl md:text-6xl font-extrabold leading-tight text-white">{line}</p>
            ))}
            {interimText && <p className="text-4xl md:text-6xl font-extrabold leading-tight text-yellow-400">{interimText}</p>}
            {finalLines.length === 0 && !interimText && <p className="opacity-30 text-3xl font-bold">Listening... speak into the microphone.</p>}
          </div>
          <div className="absolute bottom-8 left-0 right-0 flex justify-center px-6">
            <motion.button whileTap={{ scale: 0.95 }} onClick={stopListening}
              className="flex items-center gap-3 px-10 py-5 rounded-full font-bold text-white shadow-2xl bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-colors text-lg">
              <MicOff className="w-6 h-6 text-red-500" /> {autoNotes ? 'Stop & Generate Notes' : 'Stop Listening'}
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
