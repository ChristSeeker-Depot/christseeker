import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus, X, LogIn, LogOut, Loader2, Lock, Globe, BookOpen, Sparkles, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { callAI } from '../lib/ai';

interface SmallGroup {
  id: string;
  name: string;
  description: string | null;
  topic: string | null;
  is_private: boolean;
  church_id: string | null;
  leader_id: string;
  member_count: number;
  created_at: string;
}

interface GroupMembership {
  group_id: string;
}

export default function SmallGroupsPage() {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<SmallGroup[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  // Discussion Guide Generator state
  const [guideGroupId, setGuideGroupId] = useState<string | null>(null);
  const [guideInput, setGuideInput] = useState('');
  const [guideResult, setGuideResult] = useState('');
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [guideCopied, setGuideCopied] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTopic, setNewTopic] = useState('Bible Study');
  const [newPrivate, setNewPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const TOPICS = ['Bible Study', 'Prayer', 'Worship', 'Men\'s Group', 'Women\'s Group', 'Youth', 'Marriage', 'Recovery', 'Evangelism', 'Other'];

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [groupRes, memberRes] = await Promise.all([
      supabase.from('small_groups').select('*').order('created_at', { ascending: false }),
      supabase.from('small_group_members').select('group_id').eq('user_id', user.id),
    ]);
    if (groupRes.data) setGroups(groupRes.data as SmallGroup[]);
    if (memberRes.data) setMyGroupIds(new Set(memberRes.data.map((m: GroupMembership) => m.group_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleJoin = async (group: SmallGroup) => {
    if (!user) return;
    setJoiningId(group.id);
    await supabase.from('small_group_members').insert({ group_id: group.id, user_id: user.id, display_name: profile?.display_name ?? 'Member' });
    await supabase.from('small_groups').update({ member_count: group.member_count + 1 }).eq('id', group.id);
    setMyGroupIds(prev => new Set([...prev, group.id]));
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, member_count: g.member_count + 1 } : g));
    setJoiningId(null);
  };

  const handleLeave = async (group: SmallGroup) => {
    if (!user || !window.confirm(`Leave "${group.name}"?`)) return;
    setLeavingId(group.id);
    await supabase.from('small_group_members').delete().eq('group_id', group.id).eq('user_id', user.id);
    const newCount = Math.max(0, group.member_count - 1);
    await supabase.from('small_groups').update({ member_count: newCount }).eq('id', group.id);
    setMyGroupIds(prev => { const s = new Set(prev); s.delete(group.id); return s; });
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, member_count: newCount } : g));
    setLeavingId(null);
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from('small_groups').insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      topic: newTopic,
      is_private: newPrivate,
      church_id: profile?.church_id ?? null,
      leader_id: user.id,
      member_count: 1,
    }).select().single();

    if (!error && data) {
      await supabase.from('small_group_members').insert({ group_id: data.id, user_id: user.id, display_name: profile?.display_name ?? 'Leader' });
      setGroups(prev => [data as SmallGroup, ...prev]);
      setMyGroupIds(prev => new Set([...prev, data.id]));
      setShowCreate(false);
      setNewName(''); setNewDesc(''); setNewTopic('Bible Study'); setNewPrivate(false);
    }
    setCreating(false);
  };

  const handleGenerateGuide = async () => {
    if (!guideInput.trim() || generatingGuide) return;
    setGeneratingGuide(true);
    setGuideResult('');
    try {
      const reply = await callAI({
        message: `You are a small group leader assistant. Generate a discussion guide for a small group based on the following sermon/passage: "${guideInput}". 

Provide:
1. A one-sentence theme summary
2. Five open-ended discussion questions (numbered)
3. One group prayer point

Format clearly and keep it practical for a 60-minute small group discussion.`,
        denomination: profile?.denomination ?? 'Non-Denominational',
        mode: 'devotional',
      });
      setGuideResult(reply);
    } catch {
      setGuideResult('Could not generate a guide right now. Please try again.');
    } finally {
      setGeneratingGuide(false);
    }
  };

  const handleCopyGuide = () => {
    navigator.clipboard.writeText(guideResult);
    setGuideCopied(true);
    setTimeout(() => setGuideCopied(false), 2000);
  };

  const myGroups = groups.filter(g => myGroupIds.has(g.id));
  const otherGroups = groups.filter(g => !myGroupIds.has(g.id));

  const topicColor: Record<string, string> = {
    'Bible Study': 'bg-blue-500/10 text-blue-400',
    'Prayer': 'bg-purple-500/10 text-purple-400',
    'Worship': 'bg-pink-500/10 text-pink-400',
    "Men's Group": 'bg-indigo-500/10 text-indigo-400',
    "Women's Group": 'bg-rose-500/10 text-rose-400',
    'Youth': 'bg-orange-500/10 text-orange-400',
    'Marriage': 'bg-red-500/10 text-red-400',
    'Recovery': 'bg-teal-500/10 text-teal-400',
    'Evangelism': 'bg-green-500/10 text-green-400',
    'Other': 'bg-gray-500/10 text-gray-400',
  };

  const GroupCard = ({ group }: { group: SmallGroup }) => {
    const isMember = myGroupIds.has(group.id);
    const isJoining = joiningId === group.id;
    const isLeaving = leavingId === group.id;
    const isLeader = group.leader_id === user?.id;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-5 rounded-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
            <Users className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-sm">{group.name}</h3>
              {group.is_private && <Lock className="w-3 h-3 opacity-40" />}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${topicColor[group.topic ?? 'Other'] ?? topicColor['Other']}`}>
                {group.topic ?? 'Other'}
              </span>
              {isMember && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">Joined</span>}
              {isLeader && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">Leader</span>}
            </div>
            {group.description && <p className="text-xs opacity-60 mb-2 line-clamp-2">{group.description}</p>}
            <p className="text-[10px] opacity-40 font-medium">{group.member_count} member{group.member_count !== 1 ? 's' : ''}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => isMember ? handleLeave(group) : handleJoin(group)}
            disabled={isJoining || isLeaving}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${isMember ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'text-white'}`}
            style={!isMember ? { background: 'var(--accent)' } : {}}
          >
            {isJoining || isLeaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
             isMember ? <><LogOut className="w-3.5 h-3.5" /> Leave</> : <><LogIn className="w-3.5 h-3.5" /> Join</>}
          </motion.button>
        </div>

        {/* Leader-only: Study Guide Generator */}
        {isLeader && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setGuideGroupId(group.id); setGuideInput(''); setGuideResult(''); }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all opacity-70 hover:opacity-100"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Generate Study Guide
          </motion.button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
          <div>
            <h1 className="text-2xl font-bold">Small Groups</h1>
            <p className="text-xs opacity-50">Study, pray, and grow together</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'var(--accent)' }}
        >
          <Plus className="w-4 h-4" /> Create
        </motion.button>
      </header>

      {/* Discussion Guide Modal */}
      <AnimatePresence>
        {guideGroupId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => { setGuideGroupId(null); setGuideResult(''); }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}>
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-xl font-bold">Study Guide Generator</h2>
                  <p className="text-xs opacity-50">Paste a sermon title, theme, or scripture passage</p>
                </div>
                <button onClick={() => { setGuideGroupId(null); setGuideResult(''); }} className="p-1 opacity-50 hover:opacity-100"><X className="w-5 h-5" /></button>
              </div>
              {!guideResult ? (
                <>
                  <textarea
                    value={guideInput}
                    onChange={e => setGuideInput(e.target.value)}
                    placeholder="e.g. 'The Prodigal Son — Luke 15:11-32' or 'Forgiveness and Reconciliation'"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none mb-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
                  />
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleGenerateGuide}
                    disabled={!guideInput.trim() || generatingGuide}
                    className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}>
                    {generatingGuide ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Guide…</> : <><Sparkles className="w-5 h-5" /> Generate Guide</>}
                  </motion.button>
                </>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl p-4 mb-4 text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                    {guideResult}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setGuideResult(''); setGuideInput(''); }}
                      className="flex-1 py-3 rounded-xl border font-medium text-sm opacity-60 hover:opacity-100"
                      style={{ borderColor: 'var(--bg-card-border)' }}>← Regenerate</button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={handleCopyGuide}
                      className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                      style={{ background: guideCopied ? '#38a169' : 'var(--accent)' }}>
                      {guideCopied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Guide</>}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold">Create a Group</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 opacity-50 hover:opacity-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1 mb-1 block">Group Name</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Tuesday Morning Prayer"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1 mb-1 block">Description (optional)</label>
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What does your group focus on?" rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1 mb-1 block">Topic</label>
                  <select value={newTopic} onChange={e => setNewTopic(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none appearance-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}>
                    {TOPICS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none px-1">
                  <div onClick={() => setNewPrivate(p => !p)} className={`w-11 h-6 rounded-full relative transition-colors ${newPrivate ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${newPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-sm flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 opacity-60" /> Private group (invite only)</span>
                </label>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleCreate} disabled={creating || !newName.trim()}
                  className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  style={{ background: 'var(--accent)' }}>
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {creating ? 'Creating...' : 'Create Group'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin opacity-40" /></div>
      ) : (
        <div className="space-y-8">
          {/* My Groups */}
          {myGroups.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <BookOpen className="w-3.5 h-3.5" /> My Groups
              </p>
              <div className="space-y-3">
                {myGroups.map(g => <GroupCard key={g.id} group={g} />)}
              </div>
            </div>
          )}

          {/* All Groups */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Globe className="w-3.5 h-3.5" /> {myGroups.length > 0 ? 'Discover More' : 'All Groups'}
            </p>
            {otherGroups.length === 0 ? (
              <div className="glass-panel p-10 rounded-3xl text-center opacity-40">
                <Users className="w-10 h-10 mx-auto mb-3" />
                <p className="font-medium">No other groups yet.</p>
                <p className="text-sm mt-1">Be the first to create one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {otherGroups.map(g => <GroupCard key={g.id} group={g} />)}
              </div>
            )}
          </div>

          {groups.length === 0 && (
            <div className="text-center py-16 opacity-40">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-2">No Groups Yet</h2>
              <p className="max-w-xs mx-auto">Create the first small group and invite your congregation to join.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
