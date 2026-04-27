import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function JournalPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (data) setEntries(data as JournalEntry[]);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setSaving(true);
    try {
      await supabase.from('journal_entries').insert([{
        user_id: user.id,
        title: title.trim(),
        content: content.trim()
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
    if (!window.confirm("Delete this prayer entry?")) return;
    await supabase.from('journal_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between mb-10 animate-fade-in">
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

      {/* Entries List */}
      <div className="space-y-3">
        {entries.length === 0 && !isWriting && (
          <div className="text-center py-20 opacity-50">
            <p>Your journal is empty.</p>
            <p className="text-sm mt-1">Begin with a prayer.</p>
          </div>
        )}
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
              className="w-full text-left px-5 py-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{entry.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(entry.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.90 }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                  className="p-1 text-red-400 opacity-50 hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
                {expanded === entry.id ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>{entry.content}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
