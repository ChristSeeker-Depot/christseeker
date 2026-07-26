import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { callAI } from '../lib/ai';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Pencil, Sparkles, Loader2, Check, X, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_answered: boolean;
  answered_at: string | null;
}

export default function JournalPage() {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'all' | 'answered'>('all');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // AI reflection state
  const [reflectingId, setReflectingId] = useState<string | null>(null);
  const [reflections, setReflections] = useState<Record<string, string>>({});

  // Answer state
  const [answeringId, setAnsweringId] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (data) setEntries(data as JournalEntry[]);
  }, [user?.id]);

  useEffect(() => {
    if (user) fetchEntries();
  }, [user, fetchEntries]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setSaving(true);
    try {
      await supabase.from('journal_entries').insert([{
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        is_answered: false,
      }]);
      setTitle('');
      setContent('');
      setIsWriting(false);
      await fetchEntries();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this prayer entry?')) return;
    await supabase.from('journal_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleMarkAnswered = async (entry: JournalEntry) => {
    if (answeringId) return;
    setAnsweringId(entry.id);
    const now = new Date().toISOString();
    await supabase.from('journal_entries').update({
      is_answered: !entry.is_answered,
      answered_at: entry.is_answered ? null : now,
    }).eq('id', entry.id);
    setEntries(prev => prev.map(e =>
      e.id === entry.id ? { ...e, is_answered: !entry.is_answered, answered_at: entry.is_answered ? null : now } : e
    ));
    setAnsweringId(null);
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setExpanded(entry.id);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editContent.trim()) return;
    setSavingEdit(true);
    try {
      await supabase.from('journal_entries').update({
        title: editTitle.trim(),
        content: editContent.trim(),
      }).eq('id', editingId);
      setEntries(prev => prev.map(e => e.id === editingId
        ? { ...e, title: editTitle.trim(), content: editContent.trim() }
        : e
      ));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReflect = async (entry: JournalEntry) => {
    if (reflections[entry.id] || reflectingId === entry.id) return;
    setReflectingId(entry.id);
    setExpanded(entry.id);
    try {
      const reply = await callAI({
        message: `A Christian has written this prayer in their journal:\n\nTitle: "${entry.title}"\n\n"${entry.content}"\n\nPlease offer a brief, warm, biblically-grounded reflection of 2-3 sentences, including one relevant scripture reference. Speak as a caring spiritual friend, not an AI.`,
        denomination: profile?.denomination ?? 'Non-Denominational',
        mode: 'devotional',
      });
      setReflections(prev => ({ ...prev, [entry.id]: reply }));
    } catch (err) {
      console.error(err);
      setReflections(prev => ({ ...prev, [entry.id]: 'Could not load a reflection at this time. Please try again.' }));
    } finally {
      setReflectingId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const answeredEntries = entries.filter(e => e.is_answered).sort((a, b) =>
    new Date(a.answered_at ?? a.created_at).getTime() - new Date(b.answered_at ?? b.created_at).getTime()
  );
  const displayedEntries = view === 'answered' ? answeredEntries : entries;

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between mb-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link to="/">
            <motion.div whileTap={{ scale: 0.90 }} className="p-2 opacity-70 hover:opacity-100 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
          </Link>
          <h1 className="text-2xl font-bold">Prayer Journal</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.90 }}
          onClick={() => setIsWriting(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          <Plus className="w-4 h-4" /> New Entry
        </motion.button>
      </header>

      {/* View Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
        {(['all', 'answered'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${view === tab ? 'text-white' : 'opacity-50'}`}
            style={view === tab ? { background: 'var(--accent)' } : {}}
          >
            {tab === 'all' ? <><Clock className="w-3 h-3" /> All Prayers</> : <><CheckCircle2 className="w-3 h-3" /> Answered ✨ ({answeredEntries.length})</>}
          </button>
        ))}
      </div>

      {/* New Entry Form */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel p-6 rounded-3xl mb-6"
          >
            <h3 className="font-bold mb-4">New Prayer</h3>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title (e.g. 'For strength today')"
              className="w-full px-4 py-2 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your prayer here..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-sm mb-4 resize-none focus:outline-none focus:ring-2 custom-scrollbar"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsWriting(false)} className="px-4 py-2 text-sm opacity-60 hover:opacity-100">Cancel</button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {saving ? 'Saving...' : 'Save Prayer'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answered Prayer Timeline */}
      {view === 'answered' && (
        <div className="mb-6">
          {answeredEntries.length === 0 ? (
            <div className="text-center py-16 opacity-40">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">No answered prayers marked yet.</p>
              <p className="text-sm mt-1">When God answers a prayer, tap ✨ to mark it and build your testimony timeline.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[var(--accent)]/20" />
              <div className="space-y-4 pl-12">
                {answeredEntries.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-12 top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{ background: 'var(--bg-primary)', borderColor: 'var(--accent)' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    </div>
                    <div className="glass-panel p-4 rounded-2xl">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm">{entry.title}</p>
                          <p className="text-[10px] opacity-50 mt-0.5">
                            Prayed: {formatDate(entry.created_at)} → Answered: {formatDate(entry.answered_at ?? entry.created_at)}
                          </p>
                        </div>
                        <span className="text-lg">✨</span>
                      </div>
                      <p className="text-xs leading-relaxed mt-2 opacity-70 line-clamp-3">{entry.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entries List */}
      {view === 'all' && (
        <div className="space-y-3">
          {displayedEntries.length === 0 && !isWriting && (
            <div className="text-center py-20 opacity-50">
              <p>Your journal is empty.</p>
              <p className="text-sm mt-1">Begin with a prayer.</p>
            </div>
          )}
          {displayedEntries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-panel rounded-2xl overflow-hidden transition-all ${entry.is_answered ? 'ring-1 ring-yellow-400/30' : ''}`}
            >
              <button
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                className="w-full text-left px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{entry.title}</p>
                    {entry.is_answered && <span className="text-sm">✨</span>}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(entry.created_at)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {/* Mark Answered */}
                  <motion.button
                    whileTap={{ scale: 0.90 }}
                    onClick={(e) => { e.stopPropagation(); handleMarkAnswered(entry); }}
                    className={`p-1.5 transition-opacity ${entry.is_answered ? 'text-yellow-400' : 'opacity-40 hover:opacity-100'}`}
                    title={entry.is_answered ? 'Unmark as answered' : 'Mark as answered ✨'}
                  >
                    {answeringId === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.90 }}
                    onClick={(e) => { e.stopPropagation(); handleReflect(entry); }}
                    className="p-1.5 text-[var(--accent)] opacity-50 hover:opacity-100 transition-opacity"
                    title="AI Reflection"
                  >
                    {reflectingId === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.90 }}
                    onClick={(e) => { e.stopPropagation(); startEdit(entry); }}
                    className="p-1.5 opacity-50 hover:opacity-100 transition-opacity"
                    title="Edit Entry"
                  >
                    <Pencil className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.90 }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                    className="p-1.5 text-red-400 opacity-50 hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                  {expanded === entry.id ? <ChevronUp className="w-4 h-4 opacity-50 ml-1" /> : <ChevronDown className="w-4 h-4 opacity-50 ml-1" />}
                </div>
              </button>
              <AnimatePresence>
                {expanded === entry.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5"
                  >
                    {editingId === entry.id ? (
                      <div className="space-y-3">
                        <input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
                        />
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          rows={5}
                          className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none custom-scrollbar"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
                        />
                        <div className="flex gap-2 justify-end">
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditingId(null)}
                            className="p-2 rounded-xl opacity-60 hover:opacity-100">
                            <X className="w-4 h-4" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveEdit} disabled={savingEdit}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                            style={{ background: 'var(--accent)' }}>
                            {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>{entry.content}</p>
                        {reflections[entry.id] && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 rounded-2xl border-l-4 border-[var(--accent)]/50"
                            style={{ background: 'var(--bg-card)' }}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                              <Sparkles className="w-3 h-3" /> AI Reflection
                            </p>
                            <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-muted)' }}>{reflections[entry.id]}</p>
                          </motion.div>
                        )}
                      </>
                    )}
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
