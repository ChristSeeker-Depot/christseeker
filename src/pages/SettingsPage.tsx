import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Sun, Moon, Scroll, Type, User, Plus, Users, Copy, Check, LogOut, ShieldCheck, BookOpen, UserCheck, Heart, Sliders, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserProfile } from '../contexts/AuthContext';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } })
};

export default function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [nameSaved, setNameSaved] = useState(false);

  const handleSaveName = async () => {
    await updateProfile({ display_name: displayName });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  // Security card shown for all non-Google users (email/password accounts)
  const isEmailUser = user?.app_metadata?.provider !== 'google';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    if (newPassword !== confirmNewPassword) { setPasswordMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    setPasswordLoading(true);
    setPasswordMsg(null);
    // Re-authenticate with current password first
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user!.email!, password: currentPassword });
    if (signInErr) { setPasswordMsg({ type: 'error', text: 'Current password is incorrect.' }); setPasswordLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordMsg({ type: 'error', text: error.message }); }
    else { setPasswordMsg({ type: 'success', text: 'Password updated successfully!' }); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); }
    setPasswordLoading(false);
  };

  // --- Email Change ---
  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleChangeEmail = async () => {
    if (!newEmail.includes('@')) { setEmailMsg({ type: 'error', text: 'Please enter a valid email address.' }); return; }
    setEmailLoading(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) { setEmailMsg({ type: 'error', text: error.message }); }
    else { setEmailMsg({ type: 'success', text: 'Verification sent to your new email. Click the link to confirm.' }); setNewEmail(''); }
    setEmailLoading(false);
  };

  // --- App Preferences (localStorage) ---
  const [largeSubs, setLargeSubs] = useState(() => localStorage.getItem('cs_large_subs') === 'true');
  const [autoScroll, setAutoScroll] = useState(() => localStorage.getItem('cs_auto_scroll') !== 'false');
  const [confirmDisconnect, setConfirmDisconnect] = useState(() => localStorage.getItem('cs_confirm_disconnect') === 'true');

  const togglePref = (key: string, value: boolean, setter: (v: boolean) => void) => {
    localStorage.setItem(key, String(value));
    setter(value);
  };

  // --- Church Logic ---
  const [churchCode, setChurchCode] = useState('');
  const [churchName, setChurchName] = useState('');
  const [activeAccessCode, setActiveAccessCode] = useState('');
  const [churchLoading, setChurchLoading] = useState(false);
  const [churchError, setChurchError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if ((profile?.role === 'leader' || profile?.role === 'admin') && profile?.church_id) {
      // Fetch church access code
      supabase.from('churches').select('access_code').eq('id', profile.church_id).single()
        .then(({ data }) => {
          if (data) setActiveAccessCode(data.access_code);
        });
      
      // Fetch members
      fetchMembers();
    }
  }, [profile]);

  const fetchMembers = async () => {
    if (!profile?.church_id) return;
    setMembersLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('church_id', profile.church_id)
      .order('display_name', { ascending: true });
    if (data) setMembers(data as UserProfile[]);
    setMembersLoading(false);
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: UserProfile['role']) => {
    if (profile?.role !== 'leader') return; // Only leaders can change roles
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
    if (!error) fetchMembers();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("Remove this member from the church?")) return;
    const { error } = await supabase.from('profiles').update({ 
      church_id: null, 
      church_name: null, 
      role: 'member' 
    }).eq('id', memberId);
    if (!error) fetchMembers();
  };

  const handleJoinChurch = async () => {
    if (!churchCode.trim()) return;
    setChurchLoading(true);
    setChurchError(null);
    try {
      const { data: church, error: churchErr } = await supabase
        .from('churches')
        .select('id, name')
        .eq('access_code', churchCode.toUpperCase())
        .single();

      if (churchErr || !church) throw new Error("Church code not found.");

      await updateProfile({ church_id: church.id, church_name: church.name });
      setChurchCode('');
    } catch (err: any) {
      setChurchError(err.message);
    } finally {
      setChurchLoading(false);
    }
  };

  const handleCreateChurch = async () => {
    if (!churchName.trim() || !user) return;
    setChurchLoading(true);
    setChurchError(null);
    try {
      // Generate a simple unique code
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: church, error: churchErr } = await supabase
        .from('churches')
        .insert({
          name: churchName,
          access_code: accessCode,
          leader_id: user.id
        })
        .select()
        .single();

      if (churchErr) throw churchErr;

      await updateProfile({ 
        role: 'leader', 
        church_id: church.id, 
        church_name: church.name 
      });
      setChurchName('');
    } catch (err: any) {
      setChurchError(err.message);
    } finally {
      setChurchLoading(false);
    }
  };

  const handleLeaveChurch = async () => {
    if (!window.confirm("Leave this church? You will no longer see their live sermons.")) return;
    await updateProfile({ church_id: null, church_name: null, role: 'member' });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleThemeChange = (theme: UserProfile['theme']) => updateProfile({ theme });
  const handleFontChange = (font_size: UserProfile['font_size']) => updateProfile({ font_size });

  const handleEraseAllData = async () => {
    if (!user) return;
    if (!window.confirm("Are you absolutely sure? This permanently deletes all your data and cannot be undone.")) return;
    setLoading(true);
    try {
      // Delete dependent tables FIRST to avoid FK constraint errors, profile last
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
      await supabase.from('journal_entries').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      await signOut();
      navigate('/auth');
    } catch (err) {
      console.error(err);
      alert("Failed to erase data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const themes: { value: UserProfile['theme']; label: string; icon: React.ReactNode; bg: string }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-5 h-5" />, bg: 'bg-[#F8F9FA] border-gray-200' },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" />, bg: 'bg-[#111418] border-gray-700' },
    { value: 'parchment', label: 'Parchment', icon: <Scroll className="w-5 h-5" />, bg: 'bg-[#F5EFDC] border-[#c9a96e]' },
  ];

  const fontSizes: { value: UserProfile['font_size']; label: string }[] = [
    { value: 'sm', label: 'Small' },
    { value: 'base', label: 'Medium' },
    { value: 'lg', label: 'Large' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-4 mb-10 animate-fade-in">
        <Link to="/">
          <motion.div whileTap={{ scale: 0.90 }} className="p-2 opacity-70 hover:opacity-100 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </motion.div>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <div className="space-y-5">

        {/* Profile Card */}
        <motion.div
          className="glass-panel p-6 rounded-3xl"
          variants={cardVariants} custom={0} initial="hidden" animate="visible"
        >
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 opacity-60" />
            <h3 className="font-bold">Profile</h3>
          </div>
          <div className="space-y-2 text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            <p><strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {user?.email}</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Tradition:</strong> {profile?.denomination}</p>
            {profile?.church_name && <p><strong style={{ color: 'var(--text-primary)' }}>Church:</strong> {profile.church_name}</p>}
            <p><strong style={{ color: 'var(--text-primary)' }}>Daily Streak:</strong> 🔥 {profile?.streak ?? 0} days</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Sign-in method:</strong> {user?.app_metadata?.provider === 'google' ? '🔵 Google' : '📧 Email & Password'}</p>
            {user?.created_at && <p><strong style={{ color: 'var(--text-primary)' }}>Member since:</strong> {new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
          </div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Display Name</label>
          <div className="flex gap-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Brother Elijah"
              className="flex-1 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveName}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ background: 'var(--accent)' }}
            >
              {nameSaved ? '✓ Saved' : 'Save'}
            </motion.button>
          </div>
        </motion.div>

        {/* Church Card */}
        <motion.div
          className="glass-panel p-6 rounded-3xl"
          variants={cardVariants} custom={0.5} initial="hidden" animate="visible"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 opacity-60" />
              <h3 className="font-bold">Church Community</h3>
            </div>
            {profile?.role === 'leader' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Leader
              </span>
            )}
            {profile?.role === 'admin' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Admin
              </span>
            )}
          </div>

          {!profile?.church_id ? (
            <div className="space-y-6">
              {/* Join Church */}
              <div>
                <p className="text-xs font-semibold uppercase mb-3 opacity-50">Join your congregation</p>
                <div className="flex gap-2">
                  <input
                    value={churchCode}
                    onChange={(e) => setChurchCode(e.target.value.toUpperCase())}
                    placeholder="Enter Access Code"
                    className="flex-1 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all uppercase"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleJoinChurch}
                    disabled={churchLoading || !churchCode}
                    className="px-6 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}
                  >
                    Join
                  </motion.button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-white/20"><span className="px-2 bg-[var(--bg-primary)]">OR</span></div>
              </div>

              {/* Create Church */}
              <div>
                <p className="text-xs font-semibold uppercase mb-3 opacity-50">Register your church</p>
                <div className="flex flex-col gap-2">
                  <input
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="Church Name (e.g. St. Mark's)"
                    className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateChurch}
                    disabled={churchLoading || !churchName}
                    className="w-full py-3 rounded-xl text-sm font-bold border-2 border-dashed border-white/20 hover:border-[var(--accent)]/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Register as Leader
                  </motion.button>
                </div>
              </div>
              {churchError && <p className="text-red-500 text-xs mt-2 text-center">{churchError}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--bg-card-border)]">
                <p className="text-xs opacity-50 font-bold uppercase mb-1">Current Church</p>
                <h4 className="text-xl font-bold">{profile.church_name}</h4>
                
                {(profile.role === 'leader' || profile.role === 'admin') && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs opacity-50 font-bold uppercase mb-2">Congregation Access Code</p>
                    <div className="flex items-center justify-between bg-[var(--bg-primary)] p-3 rounded-xl border border-white/5">
                      <code className="text-lg font-mono font-bold tracking-widest text-[var(--accent)]">
                        {activeAccessCode || 'Loading...'}
                      </code>
                      <button onClick={() => copyCode(activeAccessCode)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        {copySuccess ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 opacity-50" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Member Directory */}
              {(profile.role === 'leader' || profile.role === 'admin') && (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase opacity-40 mb-3 px-1">Member Directory</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {membersLoading ? (
                       <p className="text-xs opacity-50 py-4 text-center">Loading members...</p>
                    ) : members.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-card)] border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
                            {m.display_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{m.display_name} {m.id === user?.id && '(You)'}</p>
                            <p className="text-[10px] opacity-40 uppercase font-bold tracking-tight">{m.role}</p>
                          </div>
                        </div>
                        
                        {profile.role === 'leader' && m.id !== user?.id && (
                          <div className="flex items-center gap-1">
                            {m.role === 'member' ? (
                               <button onClick={() => handleUpdateMemberRole(m.id, 'admin')} className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-colors" title="Promote to Admin">
                                 <Plus className="w-4 h-4" />
                               </button>
                            ) : m.role === 'admin' ? (
                               <button onClick={() => handleUpdateMemberRole(m.id, 'member')} className="p-2 hover:bg-orange-500/10 rounded-lg text-orange-400 transition-colors" title="Demote to Member">
                                 <ArrowLeft className="w-4 h-4 rotate-270" />
                               </button>
                            ) : null}
                            <button onClick={() => handleRemoveMember(m.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors" title="Remove Member">
                              <LogOut className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleLeaveChurch} className="w-full py-2.5 rounded-xl text-xs font-bold opacity-40 hover:opacity-100 hover:text-red-500 transition-all flex items-center justify-center gap-2">
                <LogOut className="w-3 h-3" /> Leave Church
              </button>
            </div>
          )}
        </motion.div>

        {/* Appearance Card */}
        <motion.div
          className="glass-panel p-6 rounded-3xl"
          variants={cardVariants} custom={1} initial="hidden" animate="visible"
        >
          <div className="flex items-center gap-2 mb-5">
            <Type className="w-5 h-5 opacity-60" />
            <h3 className="font-bold">Appearance</h3>
          </div>

          <p className="text-sm mb-3 font-medium">Theme</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {themes.map(t => (
              <motion.button
                key={t.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleThemeChange(t.value)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 text-sm font-medium transition-all ${t.bg} ${profile?.theme === t.value ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20' : 'border-transparent'}`}
              >
                {t.icon}
                {t.label}
              </motion.button>
            ))}
          </div>

          <p className="text-sm mb-3 font-medium">Font Size</p>
          <div className="flex gap-3 mb-6">
            {fontSizes.map(f => (
              <motion.button
                key={f.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFontChange(f.value)}
                className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${profile?.font_size === f.value ? 'border-[var(--accent)]' : 'border-transparent'}`}
                style={{ background: 'var(--bg-card)' }}
              >
                {f.label}
              </motion.button>
            ))}
          </div>

          <div className="pt-5 border-t border-white/5">
            <p className="text-sm mb-3 font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 opacity-60" /> Favorite Bible Translation
            </p>
            <select
              value={profile?.bible_translation ?? 'NIV'}
              onChange={(e) => updateProfile({ bible_translation: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }}
            >
              <option value="NIV">New International Version (NIV)</option>
              <option value="KJV">King James Version (KJV)</option>
              <option value="ESV">English Standard Version (ESV)</option>
              <option value="NLT">New Living Translation (NLT)</option>
              <option value="NKJV">New King James Version (NKJV)</option>
              <option value="MSG">The Message (MSG)</option>
              <option value="NRSV">New Revised Standard Version (NRSV)</option>
              <option value="AMP">Amplified Bible (AMP)</option>
            </select>
            <p className="text-[10px] mt-2 opacity-40">All scripture passages across ChristSeeker will be displayed in this version.</p>
          </div>
        </motion.div>
        
        {/* Support Card */}
        <motion.div
          className="glass-panel p-6 rounded-3xl"
          variants={cardVariants} custom={2} initial="hidden" animate="visible"
        >
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="font-bold">Support the Mission</h3>
          </div>
          <p className="text-sm opacity-60 mb-4 leading-relaxed">
            Help us cover the costs of global AI servers and infrastructure for churches around the world.
          </p>
          <Link to="/support">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              className="w-full py-3 rounded-xl font-bold text-sm bg-red-500/10 text-red-500 border border-red-500/20"
            >
              Learn More & Donate
            </motion.button>
          </Link>
        </motion.div>

        {/* Privacy Card */}
        <motion.div
          className="glass-panel p-6 rounded-3xl"
          variants={cardVariants} custom={2} initial="hidden" animate="visible"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold">Privacy & Data</h3>
          </div>
          <p className="text-sm opacity-60 mb-4 leading-relaxed">
            Review how your audio, text, and journal entries are handled across ChristSeeker's AI services.
          </p>
          <Link to="/privacy">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}
            >
              View Privacy Center
            </motion.button>
          </Link>
        </motion.div>

        {/* Security Card — email users only */}
        {isEmailUser && (
          <motion.div className="glass-panel p-6 rounded-3xl" variants={cardVariants} custom={2} initial="hidden" animate="visible">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound className="w-5 h-5 opacity-60" />
              <h3 className="font-bold">Security</h3>
            </div>

            {/* Change Password */}
            <div className="space-y-3 mb-6">
              <p className="text-xs font-bold uppercase tracking-widest opacity-40">Change Password</p>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password" className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }} />
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="New password" className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }} />
              <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password" className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }} />
              {passwordMsg && <p className={`text-xs ${passwordMsg.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{passwordMsg.text}</p>}
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleChangePassword} disabled={passwordLoading || !currentPassword || !newPassword}
                className="w-full py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </motion.button>
            </div>

            {/* Change Email */}
            <div className="space-y-3 pt-5 border-t border-white/5">
              <p className="text-xs font-bold uppercase tracking-widest opacity-40">Change Email</p>
              <p className="text-xs opacity-50">Current: <strong>{user?.email}</strong></p>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="New email address" className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text-primary)' }} />
              {emailMsg && <p className={`text-xs ${emailMsg.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{emailMsg.text}</p>}
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleChangeEmail} disabled={emailLoading || !newEmail}
                className="w-full py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                {emailLoading ? 'Sending...' : 'Send Verification'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* App Preferences Card */}
        <motion.div className="glass-panel p-6 rounded-3xl" variants={cardVariants} custom={2} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-5">
            <Sliders className="w-5 h-5 opacity-60" />
            <h3 className="font-bold">App Preferences</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Large subtitle text', sub: 'Bigger font during Live Subtitles', val: largeSubs, key: 'cs_large_subs', set: setLargeSubs },
              { label: 'Auto-scroll transcript', sub: 'Keep latest text in view', val: autoScroll, key: 'cs_auto_scroll', set: setAutoScroll },
              { label: 'Confirm before disconnecting', sub: 'Prevents accidental broadcast cuts', val: confirmDisconnect, key: 'cs_confirm_disconnect', set: setConfirmDisconnect },
            ].map(({ label, sub, val, key, set }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs opacity-40">{sub}</p>
                </div>
                <div onClick={() => togglePref(key, !val, set)}
                  className={`w-9 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer ${val ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Support Card */}
        <motion.div
          className="glass-panel p-6 rounded-3xl"
          variants={cardVariants} custom={2} initial="hidden" animate="visible"
        >
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="font-bold">Support the Mission</h3>
          </div>
          <p className="text-sm opacity-60 mb-4 leading-relaxed">
            Help us cover the costs of global AI servers and infrastructure for churches around the world.
          </p>
          <Link to="/support">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              className="w-full py-3 rounded-xl font-bold text-sm bg-red-500/10 text-red-500 border border-red-500/20"
            >
              Learn More & Donate
            </motion.button>
          </Link>
        </motion.div>

        {/* Account Card */}
        <motion.div
          className="glass-panel p-6 rounded-3xl"
          variants={cardVariants} custom={2} initial="hidden" animate="visible"
        >
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold">Account</h3>
          </div>
          {/* Report a Bug */}
          <Link to="/bug-report" className="block mb-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 rounded-xl border font-medium text-sm transition-colors hover:opacity-80 flex items-center justify-center gap-2"
              style={{ borderColor: 'var(--bg-card-border)', color: 'var(--text-primary)' }}
            >
              🐛 Report a Bug
            </motion.button>
          </Link>
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={signOut}
              className="flex-1 py-3 rounded-xl border font-medium text-sm transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--bg-card-border)', color: 'var(--text-primary)' }}
            >
              Sign Out
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleEraseAllData}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Erase All Data'}
            </motion.button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
