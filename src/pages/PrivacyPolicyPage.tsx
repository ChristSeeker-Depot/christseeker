import { motion } from 'framer-motion';
import { Shield, Eye, Trash2, ArrowLeft, Database, Mic, Brain, Globe, Clock, FileText, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const lastUpdated = '4 May 2025';

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col pb-16" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-3 mb-8">
        <Link to="/settings"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-xs opacity-40 mt-0.5">Last updated: {lastUpdated}</p>
        </div>
      </header>

      <div className="space-y-8">

        {/* 1. Who We Are */}
        <section>
          <div className="flex items-center gap-3 mb-3 text-[var(--accent)]">
            <Shield className="w-5 h-5" />
            <h2 className="text-lg font-bold">1. Who We Are (Data Controller)</h2>
          </div>
          <div className="glass-panel p-5 rounded-2xl text-sm opacity-80 leading-relaxed space-y-2" style={{ background: 'var(--bg-card)' }}>
            <p><strong>ChristSeeker</strong> is operated by <strong>Elijah Nixon</strong>, based in the United Kingdom.</p>
            <p>For all data protection enquiries, please contact us at: <a href="mailto:19e.nixon@gmail.com" className="underline text-[var(--accent)]">19e.nixon@gmail.com</a></p>
            <p>As the Data Controller, we are responsible for deciding how and why your personal data is processed, in compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
          </div>
        </section>

        {/* 2. What Data We Collect */}
        <section>
          <div className="flex items-center gap-3 mb-3 text-[var(--accent)]">
            <FileText className="w-5 h-5" />
            <h2 className="text-lg font-bold">2. What Data We Collect & Why</h2>
          </div>
          <div className="space-y-3">

            <div className="glass-panel p-5 rounded-2xl border border-white/5" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-blue-400" /><h3 className="font-bold text-sm">Account Information</h3></div>
              <p className="text-xs opacity-60 leading-relaxed mb-1">Your email address and password (or Google account identifier).</p>
              <p className="text-[10px] opacity-40"><strong>Legal basis:</strong> Contract — necessary to provide you with the ChristSeeker service.</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/5" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2 mb-2"><Mic className="w-4 h-4 text-blue-400" /><h3 className="font-bold text-sm">Audio Processing (Live Features)</h3></div>
              <p className="text-xs opacity-60 leading-relaxed mb-1">When you use Live Subtitles or AI Note Taker, your audio is streamed in real-time to <strong>Deepgram</strong> for transcription. We do not store raw audio files. Deepgram processes audio under their enterprise data agreement and does not retain audio for model training in our configuration.</p>
              <p className="text-[10px] opacity-40"><strong>Legal basis:</strong> Consent — you explicitly start the session and are notified before audio is captured.</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/5" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2 mb-2"><Database className="w-4 h-4 text-emerald-400" /><h3 className="font-bold text-sm">Journal Entries, Notes & Transcripts</h3></div>
              <p className="text-xs opacity-60 leading-relaxed mb-1">Text you write in your Prayer Journal and Sermon Notes is stored securely in our database (Supabase). Live sermon transcripts are stored temporarily for congregation members in your church to view during an active session.</p>
              <p className="text-[10px] opacity-40"><strong>Legal basis:</strong> Contract — this data is the core service you have signed up for.</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/5" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2 mb-2"><Brain className="w-4 h-4 text-purple-400" /><h3 className="font-bold text-sm">AI Conversations & Devotionals</h3></div>
              <p className="text-xs opacity-60 leading-relaxed mb-1">Messages you send to the AI Peer are processed by <strong>Google Gemini</strong>. Only the text content is sent; no personally identifiable metadata is included in AI requests. Google processes this data under their API Terms of Service and does not use API data for model training.</p>
              <p className="text-[10px] opacity-40"><strong>Legal basis:</strong> Legitimate interest — to provide you with personalised, faith-based AI responses.</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/5" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-amber-400" /><h3 className="font-bold text-sm">App Preferences & Local Storage</h3></div>
              <p className="text-xs opacity-60 leading-relaxed mb-1">Certain preferences (e.g. subtitle size, auto-scroll) are stored in your browser's <strong>localStorage</strong>. This data never leaves your device and is not transmitted to our servers.</p>
              <p className="text-[10px] opacity-40"><strong>Legal basis:</strong> Legitimate interest — to remember your preferences between sessions.</p>
            </div>

          </div>
        </section>

        {/* 3. Data Retention */}
        <section>
          <div className="flex items-center gap-3 mb-3 text-[var(--accent)]">
            <Clock className="w-5 h-5" />
            <h2 className="text-lg font-bold">3. How Long We Keep Your Data</h2>
          </div>
          <div className="glass-panel p-5 rounded-2xl text-xs opacity-70 leading-relaxed space-y-2" style={{ background: 'var(--bg-card)' }}>
            <p><strong>Account data:</strong> Retained for as long as your account is active.</p>
            <p><strong>Journal entries & sermon notes:</strong> Retained until you delete them or erase your account.</p>
            <p><strong>Live session transcripts:</strong> Retained until the hosting leader ends the session. After 30 days of inactivity, old inactive sessions are automatically removed.</p>
            <p><strong>AI conversation messages:</strong> Retained in your account history until you delete them or erase your account.</p>
            <p><strong>Audio data:</strong> Not retained — audio is streamed and immediately discarded after transcription.</p>
          </div>
        </section>

        {/* 4. Third Parties */}
        <section>
          <div className="flex items-center gap-3 mb-3 text-[var(--accent)]">
            <Globe className="w-5 h-5" />
            <h2 className="text-lg font-bold">4. Third-Party Processors</h2>
          </div>
          <div className="glass-panel p-5 rounded-2xl text-xs opacity-70 leading-relaxed space-y-3" style={{ background: 'var(--bg-card)' }}>
            <div><p className="font-bold opacity-100">Supabase Inc. (USA)</p><p>Provides our database, authentication, and serverless functions. Data is encrypted at rest and in transit. <a href="https://supabase.com/privacy" className="underline">Privacy Policy ↗</a></p></div>
            <div><p className="font-bold opacity-100">Deepgram Inc. (USA)</p><p>Processes audio for real-time transcription. Used only during active Live Subtitle sessions. <a href="https://deepgram.com/privacy" className="underline">Privacy Policy ↗</a></p></div>
            <div><p className="font-bold opacity-100">Google LLC (USA) — Gemini API</p><p>Powers AI theological conversations and sermon summaries. Text only; no audio or personal identifiers sent. <a href="https://policies.google.com/privacy" className="underline">Privacy Policy ↗</a></p></div>
            <div><p className="font-bold opacity-100">Stripe Inc. (USA)</p><p>Processes voluntary donations. ChristSeeker never sees or stores your payment card details. <a href="https://stripe.com/privacy" className="underline">Privacy Policy ↗</a></p></div>
          </div>
        </section>

        {/* 5. Your Rights */}
        <section>
          <div className="flex items-center gap-3 mb-3 text-[var(--accent)]">
            <Eye className="w-5 h-5" />
            <h2 className="text-lg font-bold">5. Your Rights Under UK GDPR</h2>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { title: 'Right of Access', desc: 'You can view all your data in your Journal and Chat history at any time.' },
              { title: 'Right to Rectification', desc: 'You can update your profile information in Settings at any time.' },
              { title: 'Right to Erasure ("Right to be Forgotten")', desc: 'You can permanently delete all your data using the "Erase All Data" button in Settings → Account.' },
              { title: 'Right to Data Portability', desc: 'To request an export of your data, email us at 19e.nixon@gmail.com.' },
              { title: 'Right to Withdraw Consent', desc: 'You may stop using Live Subtitles at any time. Closing the session immediately stops audio capture.' },
              { title: 'Right to Object', desc: 'You may object to any processing based on legitimate interest by contacting us.' },
            ].map(r => (
              <div key={r.title} className="glass-panel p-4 rounded-xl flex gap-3" style={{ background: 'var(--bg-card)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                <div><p className="font-bold opacity-90">{r.title}</p><p className="opacity-50 leading-relaxed mt-0.5">{r.desc}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Supervisory Authority */}
        <section>
          <div className="flex items-center gap-3 mb-3 text-[var(--accent)]">
            <Trash2 className="w-5 h-5" />
            <h2 className="text-lg font-bold">6. Supervisory Authority</h2>
          </div>
          <div className="glass-panel p-5 rounded-2xl text-xs opacity-70 leading-relaxed" style={{ background: 'var(--bg-card)' }}>
            <p>If you believe your data protection rights have been violated, you have the right to lodge a complaint with the UK's supervisory authority:</p>
            <p className="mt-2 font-bold opacity-100">Information Commissioner's Office (ICO)</p>
            <p>Website: <a href="https://ico.org.uk" className="underline">ico.org.uk</a> | Tel: 0303 123 1113</p>
            <p className="mt-2">We would, however, appreciate the opportunity to address your concerns before you contact the ICO. Please email us first at <a href="mailto:19e.nixon@gmail.com" className="underline">19e.nixon@gmail.com</a>.</p>
          </div>
        </section>

        {/* 7. Contact */}
        <section>
          <div className="flex items-center gap-3 mb-3 text-[var(--accent)]">
            <Mail className="w-5 h-5" />
            <h2 className="text-lg font-bold">7. Contact Us</h2>
          </div>
          <div className="glass-panel p-5 rounded-2xl text-xs opacity-70 leading-relaxed" style={{ background: 'var(--bg-card)' }}>
            <p>For any privacy-related questions, data requests, or concerns, please contact:</p>
            <p className="mt-2 font-bold opacity-100">Elijah Nixon — ChristSeeker</p>
            <p>Email: <a href="mailto:19e.nixon@gmail.com" className="underline text-[var(--accent)]">19e.nixon@gmail.com</a></p>
            <p className="mt-3 opacity-40">We aim to respond to all data-related enquiries within 30 days in accordance with UK GDPR requirements.</p>
          </div>
        </section>

        <footer className="pt-4 pb-12 text-center">
          <p className="text-[10px] opacity-30 uppercase tracking-widest font-bold">ChristSeeker — UK GDPR Compliant</p>
        </footer>

      </div>
    </div>
  );
}
