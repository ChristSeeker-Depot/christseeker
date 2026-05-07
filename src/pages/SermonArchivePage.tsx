import { Link } from 'react-router-dom';
import { ArrowLeft, Archive } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SermonArchivePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-3 mb-8">
        <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
        <h1 className="text-2xl font-bold">Sermon Archive</h1>
      </header>
      
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
        <Archive className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
        <p className="max-w-xs">A comprehensive library of past sermons, transcripts, and AI-generated notes from your church.</p>
      </div>
    </div>
  );
}
