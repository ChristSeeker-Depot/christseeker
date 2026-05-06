import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Save, Loader2, Brain, Radio, UserCheck } from 'lucide-react';
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

type Mode = 'idle' | 'subtitles' | 'notetaker' | 'summary' | 'joining';

export default function SermonLivePage() {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<Mode>('idle');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalLines, setFinalLines] = useState<string[]>([]);
  const [fullTranscript, setFullTranscript] = useState('');
  const [diarizedTranscript, setDiarizedTranscript] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [summarising, setSummarising] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [supported, setSupported] = useState(true);
  const [diarizeEnabled, setDiarizeEnabled] = useState(false);
  const [autoNotes, setAutoNotes] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [isDiarizing, setIsDiarizing] = useState(false);
  const [isBroadcast, setIsBroadcast] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const deepgramSocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcriptRef = useRef('');
  const previousTranscriptRef = useRef('');
  const autoNotesRef = useRef(false);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const isListeningRef = useRef(false);
  const lastDiarizedLengthRef = useRef(0);
  const diarizingRef = useRef(false);
  const usingDeepgramRef = useRef(false);
  const DEEPGRAM_KEY = import.meta.env.VITE_DEEPGRAM_KEY as string;

  // App preferences from Settings
  const largeSubs = localStorage.getItem('cs_large_subs') === 'true';
  const confirmDisconnect = localStorage.getItem('cs_confirm_disconnect') === 'true';

  // Sync with DB if Host
  useEffect(() => {
    if (mode === 'subtitles' && isBroadcast && (profile?.role === 'leader' || profile?.role === 'admin') && sessionId && fullTranscript) {
      const timer = setTimeout(async () => {
        await supabase.from('live_sessions').update({ 
          transcript: fullTranscript,
          diarized_transcript: diarizeEnabled ? diarizedTranscript.join('\n') : null
        }).eq('id', sessionId);
      }, 5000); // 5-second throttle to avoid hitting DB too hard
      return () => clearTimeout(timer);
    }
  }, [fullTranscript, diarizedTranscript, mode, profile, sessionId, isBroadcast, diarizeEnabled]);

  // Subscribe to DB if Guest
  useEffect(() => {
    if (mode === 'joining' && profile?.church_id) {
      const fetchActiveSession = async () => {
        const { data } = await supabase
          .from('live_sessions')
          .select('id, transcript, diarized_transcript')
          .eq('church_id', profile.church_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setSessionId(data.id);
          setFullTranscript(data.transcript);
          if (data.diarized_transcript) {
            setDiarizedTranscript(data.diarized_transcript.split('\n').filter((l: string) => l.trim()));
            setDiarizeEnabled(true);
          }
          setIsBroadcast(true);
          setMode('subtitles');
          
          const channel = supabase.channel(`session-${data.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_sessions', filter: `id=eq.${data.id}` }, 
              payload => {
                const newTranscript = payload.new.transcript;
                const newDiarized = payload.new.diarized_transcript;
                
                if (newDiarized) {
                   setDiarizedTranscript(newDiarized.split('\n').filter((l: string) => l.trim()));
                   setDiarizeEnabled(true);
                }
                setFullTranscript(newTranscript);
              }
            )
            .subscribe();
          
          return () => { supabase.removeChannel(channel); };
        } else {
           alert("No active sermon found for your church. Ask your leader to start the session!");
           setMode('idle');
        }
      };
      fetchActiveSession();
    }
  }, [mode, profile]);

  // Diarization Logic (AI Speaker Recognition) — only fires when Deepgram is NOT active
  useEffect(() => {
    if (diarizeEnabled && !usingDeepgramRef.current && fullTranscript.length > lastDiarizedLengthRef.current + 20 && !diarizingRef.current) {
      const handleDiarize = async () => {
        diarizingRef.current = true;
        setIsDiarizing(true);
        try {
          const { data, error } = await supabase.functions.invoke('chat', {
            body: {
              message: fullTranscript,
              mode: 'diarize',
              denomination: profile?.denomination || 'Non-Denominational'
            }
          });
          if (!error && data?.reply) {
            const lines = data.reply.split('\n').filter((l: string) => l.trim());
            setDiarizedTranscript(lines);
            lastDiarizedLengthRef.current = fullTranscript.length;
            
            // Sync diarized version to DB so guests see it
            if (sessionId && profile?.role === 'leader') {
               await supabase.from('live_sessions').update({ diarized_transcript: data.reply }).eq('id', sessionId);
            }
          }
        } catch (e) { console.error(e); }
        finally { 
          diarizingRef.current = false;
          setIsDiarizing(false);
        }
      };
      handleDiarize();
    }
  }, [fullTranscript, diarizeEnabled, profile, sessionId]);

  const initRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
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
      
      // ALWAYS split by sentence for the 'raw' view to prevent bunching
      const rawLines = fullSessionText.split(/[.!?]+\s+/).filter(Boolean);
      setFinalLines(rawLines.map(l => l.trim()));

      transcriptRef.current = fullSessionText;
      setFullTranscript(fullSessionText);
      setInterimText(interim);
      
      if (subtitleRef.current) {
        subtitleRef.current.scrollTop = subtitleRef.current.scrollHeight;
      }
    };

    recognition.onerror = (event: any) => { 
      console.error('Speech recognition error:', event.error);
      if (['not-allowed', 'service-not-allowed', 'network'].includes(event.error)) {
        setIsListening(false); 
        isListeningRef.current = false;
        alert('Microphone access failed. Please ensure you are using Google Chrome, Safari, or Microsoft Edge.');
      }
    };

    recognition.onend = () => { 
      if (isListeningRef.current) {
        previousTranscriptRef.current = transcriptRef.current;
        // Small delay before restarting helps clear browser audio buffers 
        // and prevents the "weird noise" (beeping) from rapid restarts.
        setTimeout(() => {
          if (isListeningRef.current) {
            try {
              recognitionRef.current = initRecognition();
              recognitionRef.current?.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 400);
      }
    };

    return recognition;
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    return () => { 
      isListeningRef.current = false;
      recognitionRef.current?.abort(); 
    };
  }, []);

  const getSpeakerColor = (line: string) => {
    const cleanLine = line.replace(/\*\*/g, '').trim().toLowerCase();
    
    // Look for speaker patterns anywhere in the start of the line
    const isSpeaker1 = cleanLine.includes('speaker 0') || cleanLine.includes('leader') || cleanLine.startsWith('0:');
    const isSpeaker2 = cleanLine.includes('speaker 1') || cleanLine.startsWith('1:');
    const isSpeaker3 = cleanLine.includes('speaker 2') || cleanLine.startsWith('2:');
    const isSpeaker4 = cleanLine.includes('speaker 3') || cleanLine.startsWith('3:');
    const isSpeaker5 = cleanLine.includes('speaker 4') || cleanLine.startsWith('4:');

    if (isSpeaker1) return 'text-emerald-400 mt-12';
    if (isSpeaker2) return 'text-rose-400 mt-12';
    if (isSpeaker3) return 'text-amber-400 mt-12';
    if (isSpeaker4) return 'text-sky-400 mt-12';
    if (isSpeaker5) return 'text-fuchsia-400 mt-12';
    
    // If it has a generic label like [Speaker X]
    const genericMatch = cleanLine.match(/speaker\s+(\d+)/i);
    if (genericMatch) {
      const colors = ['text-emerald-400', 'text-rose-400', 'text-amber-400', 'text-sky-400', 'text-fuchsia-400', 'text-lime-400', 'text-indigo-400'];
      return colors[parseInt(genericMatch[1]) % colors.length] + ' mt-12';
    }

    return 'text-white opacity-90';
  };

  const startDeepgram = async (existingStream?: MediaStream) => {
    try {
      const stream = existingStream || await navigator.mediaDevices.getUserMedia({ audio: true });
      // Safari/Chrome Mime-Type Detection
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const encoding = mimeType.includes('webm') ? 'opus' : 'aac';
      
      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&diarize=true&smart_format=true&filler_words=true&punctuate=true&encoding=${encoding}`,
        ['token', DEEPGRAM_KEY]
      );
      
      socket.onopen = () => {
        console.log('Deepgram Connection SECURED');
        usingDeepgramRef.current = true;
        setInterimText('Deepgram Live Active...');
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        
        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && socket.readyState === 1) {
            socket.send(event.data);
          }
        });
        mediaRecorder.start(250);
        mediaRecorderRef.current = mediaRecorder;
        setIsDiarizing(true);
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives[0]?.transcript;
        const words = received.channel?.alternatives[0]?.words;

        if (transcript && received.is_final) {
          if (words && words.length > 0) {
            let currentLine = '';
            let currentSpeaker = words[0].speaker;
            const newLines: string[] = [];

            words.forEach((w: any) => {
              if (w.speaker !== currentSpeaker) {
                newLines.push(`[Speaker ${currentSpeaker}]: ${currentLine.trim()}`);
                currentLine = w.word + ' ';
                currentSpeaker = w.speaker;
              } else {
                currentLine += w.word + ' ';
              }
            });
            newLines.push(`[Speaker ${currentSpeaker}]: ${currentLine.trim()}`);
            setDiarizedTranscript(prev => [...prev, ...newLines]);
          }
          
          setFullTranscript(prev => (prev + ' ' + transcript).trim());
          if (subtitleRef.current) {
            subtitleRef.current.scrollTop = subtitleRef.current.scrollHeight;
          }
        } else if (transcript) {
          setInterimText(transcript);
        }
      };

      socket.onclose = () => {
        console.log('Deepgram closed');
        usingDeepgramRef.current = false;
        setIsDiarizing(false);
      };

      socket.onerror = (err) => {
        console.error('Deepgram Error:', err);
        usingDeepgramRef.current = false;
        // Fallback to Web Speech if Deepgram fails
        const recognition = initRecognition();
        recognitionRef.current = recognition;
        recognition?.start();
      };
      
      deepgramSocketRef.current = socket;
    } catch (err) {
      console.error('Mic Access Failed:', err);
      alert('Microphone access failed. Please click the microphone icon in your address bar to allow access.');
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const startListening = async (selectedMode: 'subtitles' | 'notetaker', broadcast = false) => {
    autoNotesRef.current = selectedMode === 'subtitles' ? autoNotes : false;
    setFinalLines([]);
    setInterimText('Preparing microphone...');
    transcriptRef.current = '';
    previousTranscriptRef.current = '';
    setFullTranscript('');
    setDiarizedTranscript([]);
    lastDiarizedLengthRef.current = 0;
    setSummary('');
    setIsBroadcast(broadcast);

    try {
      // Request mic FIRST — only create DB session after permission is granted
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Now safe to create the live session in the DB
      if (selectedMode === 'subtitles' && broadcast && (profile?.role === 'leader' || profile?.role === 'admin') && profile?.church_id) {
        const { data } = await supabase.from('live_sessions').insert({
          church_id: profile.church_id,
          leader_id: user?.id,
          title: `${profile.church_name || 'Church'} Sermon - ${new Date().toLocaleDateString()}`,
          is_active: true,
          transcript: ''
        }).select().single();
        if (data) setSessionId(data.id);
      }

      setMode(selectedMode);
      setIsListening(true);
      isListeningRef.current = true;
      setInterimText('Listening...');

      if (diarizeEnabled) {
        startDeepgram(stream);
      } else {
        const recognition = initRecognition();
        recognitionRef.current = recognition;
        try {
          recognition?.start();
        } catch (e) {
          console.error('WebSpeech start failed:', e);
        }
      }
    } catch (err) {
      console.error('Initial Mic Request Failed:', err);
      alert('Microphone access denied. Please click the microphone icon in your browser address bar to enable.');
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const stopListening = async () => {
    // Confirm before disconnect preference
    if (confirmDisconnect && isBroadcast && isListening) {
      const ok = window.confirm('Are you sure you want to end the broadcast? Your congregation will lose the live feed.');
      if (!ok) return;
    }
    isListeningRef.current = false;
    setIsListening(false);
    setIsDiarizing(false);
    setInterimText('');
    
    if (sessionId && profile?.role === 'leader') {
       await supabase.from('live_sessions').update({ 
         is_active: false,
         transcript: fullTranscript,
         diarized_transcript: diarizeEnabled ? diarizedTranscript.join('\n') : null
       }).eq('id', sessionId);
    }

    try {
      recognitionRef.current?.stop();
    } catch (e) {
      recognitionRef.current?.abort();
    }

    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop(); } catch(e){}
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (deepgramSocketRef.current) {
      try { deepgramSocketRef.current.close(); } catch(e){}
    }

    if ((mode === 'notetaker' || autoNotesRef.current) && fullTranscript.trim()) {
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

          {/* AI Settings Section */}
          <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-3">
             <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 ml-1">AI Enhancements</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <div>
                      <p className="text-xs font-bold">Identify Speakers</p>
                      <p className="text-[10px] opacity-40">Labels Speaker 1, 2, 3, etc.</p>
                    </div>
                  </div>
                  <div onClick={() => setDiarizeEnabled(d => !d)}
                    className={`w-9 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer ${diarizeEnabled ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${diarizeEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </div>
                </label>

                <label className="flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                  <div className="flex items-center gap-3">
                    <Brain className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <div>
                      <p className="text-xs font-bold">Auto-Notes</p>
                      <p className="text-[10px] opacity-40">AI summarises when finished</p>
                    </div>
                  </div>
                  <div onClick={() => setAutoNotes(n => !n)}
                    className={`w-9 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer ${autoNotes ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoNotes ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
             </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => startListening('subtitles', false)}
            className="flex items-center gap-6 p-8 rounded-[2.5rem] text-left transition-all hover:shadow-2xl group border border-white/5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform bg-blue-500/10">
              <Radio className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Live Subtitles</h3>
              <p className="text-sm opacity-60">Visual transcript for hard-of-hearing</p>
            </div>
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => startListening('notetaker')}
            className="flex items-center gap-6 p-8 rounded-[2.5rem] text-left transition-all hover:shadow-2xl group border border-white/5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform bg-purple-500/10">
              <Mic className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">AI Note Taker</h3>
              <p className="text-sm opacity-60">Record and summarise the sermon</p>
            </div>
          </motion.button>

          {(profile?.role === 'leader' || profile?.role === 'admin') && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => startListening('subtitles', true)}
              className="flex items-center gap-6 p-8 rounded-[2.5rem] text-left transition-all hover:shadow-2xl group border-2"
              style={{ background: 'rgba(235, 68, 90, 0.05)', borderColor: 'rgba(235, 68, 90, 0.2)' }}>
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform bg-red-500/10">
                <Mic className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ color: '#eb445a' }}>Start Broadcast</h3>
                <p className="text-sm opacity-60">Stream subtitles to your congregation</p>
              </div>
            </motion.button>
          )}

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-xs opacity-40 mb-3 uppercase tracking-widest font-bold">Joining a session?</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMode('joining')}
              className="px-8 py-3 rounded-2xl font-bold text-sm border border-white/10 hover:bg-white/5 transition-colors">
              Find Active Sermon
            </motion.button>
          </div>

          {/* GDPR Notice */}
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] opacity-40 leading-relaxed text-center">
              By starting a session, you agree to our <Link to="/privacy" className="underline hover:text-[var(--accent)]">Data Handling Policy</Link>. 
              Audio is processed in real-time by Deepgram and transcripts are securely stored in Supabase.
            </p>
          </div>
        </motion.div>
      )}

      {/* Joining screen */}
      {mode === 'joining' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
           <div className="w-20 h-20 rounded-full border-4 border-t-transparent border-[var(--accent)] animate-spin" />
           <div>
              <h2 className="text-xl font-bold mb-2">Joining {profile?.church_name}...</h2>
              <p className="text-sm opacity-60">Connecting to live subtitle stream.</p>
           </div>
           <button onClick={() => setMode('idle')} className="mt-4 text-xs opacity-50 hover:opacity-100">Cancel</button>
        </div>
      )}

      {/* Subtitles view */}
      {mode === 'subtitles' && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black text-white p-6 pb-24 md:p-12">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className={`w-4 h-4 rounded-full animate-pulse shadow-lg ${isBroadcast ? 'bg-red-500 shadow-red-500/50' : 'bg-blue-500 shadow-blue-500/50'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] opacity-50 font-bold tracking-widest uppercase">
                  {isBroadcast ? `Live from ${profile?.church_name || 'Church'}` : 'Private Mode'}
                </span>
                <span className="text-sm md:text-base font-bold tracking-widest uppercase opacity-70">
                  {isBroadcast 
                    ? (profile?.role === 'leader' || profile?.role === 'admin' ? 'Broadcasting Transcript' : 'Tuned Into Sermon')
                    : 'Personal Transcription'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
               {diarizeEnabled && (
                <span className="text-[10px] font-bold flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  <UserCheck className={`w-3 h-3 ${isDiarizing ? 'animate-pulse' : ''}`} /> 
                  {isDiarizing ? 'True Voice ID Active' : 'AI Identification'}
                </span>
              )}
            </div>
          </div>
          
          <div ref={subtitleRef} className="flex-1 overflow-y-auto px-6 py-12 space-y-8 custom-scrollbar">
            {diarizeEnabled && diarizedTranscript.length > 0 ? (
              diarizedTranscript.map((line, i) => (
                <p key={i} className={`font-extrabold leading-tight ${getSpeakerColor(line)} ${largeSubs ? 'text-4xl md:text-6xl' : 'text-3xl md:text-5xl'}`}>
                  {line}
                </p>
              ))
            ) : (
              <>
                {finalLines.map((line, i) => (
                  <p key={i} className={`font-extrabold leading-tight text-white ${largeSubs ? 'text-5xl md:text-7xl' : 'text-4xl md:text-6xl'}`}>{line}</p>
                ))}
                {interimText && <p className={`font-extrabold leading-tight text-yellow-400 ${largeSubs ? 'text-5xl md:text-7xl' : 'text-4xl md:text-6xl'}`}>{interimText}</p>}
                {finalLines.length === 0 && !interimText && <p className="opacity-30 text-3xl font-bold">Waiting for audio...</p>}
              </>
            )}
          </div>
          
          <div className="absolute bottom-8 left-0 right-0 flex justify-center px-6 gap-4">
            {profile?.role === 'leader' || !isBroadcast ? (
              <motion.button whileTap={{ scale: 0.95 }} onClick={stopListening}
                className="flex items-center gap-3 px-10 py-5 rounded-full font-bold text-white shadow-2xl bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-colors text-lg">
                <MicOff className="w-6 h-6 text-red-500" /> End Broadcast
              </motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMode('idle')}
                className="flex items-center gap-3 px-10 py-5 rounded-full font-bold text-white shadow-2xl bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-colors text-lg">
                Disconnect
              </motion.button>
            )}
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
