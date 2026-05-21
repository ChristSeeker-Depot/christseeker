import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, BookOpenCheck, ChevronDown, ChevronUp, Trash2, Loader2, PlusCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { callAI, parseAIJson } from '../lib/ai';
import { useAuth } from '../contexts/AuthContext';

interface SermonNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  metadata: { speaker?: string; passages?: string; application?: string } | null;
}

export default function SermonNotesPage() {
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [speaker, setSpeaker] = useState('');
  const [passages, setPassages] = useState('');
  const [mainNotes, setMainNotes] = useState('');
  const [application, setApplication] = useState('');

  // Co-Pilot state
  const [copilotSuggestions, setCopilotSuggestions] = useState<string[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  const fetchNotes = async () => {
    if (!user) return;
    const { data } = await supabase.from('journal_entries').select('*').eq('user_id', user.id).eq('entry_type', 'sermon_note').order('created_at', { ascending: false });
    if (data) setNotes(data as SermonNote[]);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [user]);

  // AI Co-Pilot Debounce Logic
  useEffect(() => {
    if (!mainNotes || mainNotes.length < 30) {
      setCopilotSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCopilotLoading(true);
      try {
        const raw = await callAI({
          message: `Analyze this sermon note snippet and provide 2 relevant scripture references or short theological themes. Note snippet: "${mainNotes}". Return exactly as a valid JSON array of strings (e.g., ["John 3:16 - God's love", "Theme: Redemption"]). Do not include markdown formatting outside the array.`,
          denomination: profile?.denomination || 'Non-Denominational',
          mode: 'sermon_copilot',
        });
        const parsed = parseAIJson<string[]>(raw);
        if (Array.isArray(parsed)) setCopilotSuggestions(parsed);
      } catch (err) {
        console.error('Co-pilot error:', err);
      } finally {
        setCopilotLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [mainNotes, profile]);

  const handleSave = async () => {
    if (!mainNotes.trim() || !user) return;
    setSaving(true);
    const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    await supabase.from('journal_entries').insert({
      user_id: user.id,
      title: `${dateStr}${speaker ? ` — ${speaker}` : ''}`,
      content: mainNotes,
      entry_type: 'sermon_note',
      metadata: { speaker, passages, application },
    });
    setSpeaker(''); setPassages(''); setMainNotes(''); setApplication('');
    setCopilotSuggestions([]);
    setShowForm(false);
    fetchNotes();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('journal_entries').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all";
  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
          <h1 className="text-2xl font-bold">Sermon Notes</h1>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(s => !s)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: 'var(--accent)' }}>
          <PlusCircle className="w-4 h-4" /> New Note
        </motion.button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-panel p-6 rounded-3xl mb-6 overflow-hidden">
            <h2 className="font-bold mb-4 flex items-center gap-2"><BookOpenCheck className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Today's Sermon</h2>
            <div className="space-y-4 relative">
              <div><label className="text-xs font-semibold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text-muted)' }}>Speaker</label><input value={speaker} onChange={e => setSpeaker(e.target.value)} placeholder="e.g. Pastor David" className={inputClass} style={inputStyle} /></div>
              <div><label className="text-xs font-semibold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text-muted)' }}>Key Passages</label><input value={passages} onChange={e => setPassages(e.target.value)} placeholder="e.g. John 15:1-8, Romans 8:28" className={inputClass} style={inputStyle} /></div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                  Main Notes
                  {copilotLoading && <Loader2 className="w-3 h-3 animate-spin opacity-50" />}
                </label>
                <div className="relative">
                  <textarea value={mainNotes} onChange={e => setMainNotes(e.target.value)} placeholder="Key message today..." rows={5} className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 transition-all" style={inputStyle} />
                  
                  {/* AI Co-Pilot Suggestion Box */}
                  <AnimatePresence>
                    {copilotSuggestions.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute -bottom-2 translate-y-full left-0 right-0 z-10 glass-panel p-3 rounded-xl border border-[var(--accent)]/30 shadow-xl" style={{ background: 'var(--bg-primary)' }}>
                        <div className="flex items-center gap-1.5 mb-2 text-[var(--accent)]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">AI Co-Pilot Suggestions</span>
                        </div>
                        <ul className="space-y-1.5">
                          {copilotSuggestions.map((sug, idx) => (
                            <li key={idx} className="text-xs opacity-80 flex items-start gap-2 leading-tight">
                              <span className="text-[var(--accent)] mt-0.5">•</span> {sug}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className={copilotSuggestions.length > 0 ? "pt-16 transition-all" : "transition-all"}><label className="text-xs font-semibold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text-muted)' }}>How will I apply this week?</label><textarea value={application} onChange={e => setApplication(e.target.value)} placeholder="One practical step..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 transition-all" style={inputStyle} /></div>
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} disabled={!mainNotes.trim() || saving} className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'var(--accent)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? 'Saving...' : 'Save Notes'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin opacity-40" /></div>
        : notes.length === 0 && !showForm ? (
          <div className="text-center py-20 opacity-40"><BookOpenCheck className="w-10 h-10 mx-auto mb-3" /><p>No sermon notes yet.<br />Tap "New Note" before Sunday's service.</p></div>
        ) : (
          <div className="space-y-3">
            {notes.map((note, i) => (
              <motion.div key={note.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel rounded-2xl overflow-hidden">
                <button onClick={() => setExpanded(expanded === note.id ? null : note.id)} className="w-full p-4 text-left flex justify-between items-center">
                  <div><p className="font-semibold text-sm">{note.title}</p>{note.metadata?.speaker && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{note.metadata.speaker}</p>}</div>
                  {expanded === note.id ? <ChevronUp className="w-4 h-4 opacity-40" /> : <ChevronDown className="w-4 h-4 opacity-40" />}
                </button>
                <AnimatePresence>
                  {expanded === note.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {note.metadata?.passages && <div><p className="font-semibold text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>Passages</p><p>{note.metadata.passages}</p></div>}
                        <div><p className="font-semibold text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>Notes</p><p className="whitespace-pre-wrap">{note.content}</p></div>
                        {note.metadata?.application && <div><p className="font-semibold text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>Application</p><p>{note.metadata.application}</p></div>}
                        <button onClick={() => handleDelete(note.id)} className="flex items-center gap-1.5 text-red-400 text-xs mt-2 opacity-60 hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}
