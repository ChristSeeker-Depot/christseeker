import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Archive, Loader2, Sparkles, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { callAI, parseAIJson } from '../lib/ai';
import { useAuth } from '../contexts/AuthContext';
import DevotionalPlanModal from '../components/DevotionalPlanModal';

export default function SermonArchivePage() {
  const { profile } = useAuth();
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedSermon, setSelectedSermon] = useState<any>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [activePlan, setActivePlan] = useState<{sermonTitle: string, plan: any[]}|null>(null);

  const fetchSermons = useCallback(async () => {
    if (!profile?.church_id) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('sermon_archives')
      .select('*')
      .eq('church_id', profile.church_id)
      .order('date', { ascending: false });
      
    if (data) setSermons(data);
    setLoading(false);
  }, [profile?.church_id]);

  useEffect(() => {
    fetchSermons();
  }, [fetchSermons]);

  const handleGeneratePlan = async (sermon: any) => {
    // Check local storage first
    const cacheKey = `devotional_plan_${sermon.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setActivePlan({ sermonTitle: sermon.title, plan: JSON.parse(cached) });
      return;
    }

    setGeneratingPlan(true);
    setSelectedSermon(sermon);

    try {
      const raw = await callAI({
        message: `Create a 7-day personal devotional and actionable challenge based strictly on this sermon transcript: ${sermon.transcript || sermon.ai_notes || sermon.title}. Return ONLY valid JSON structured as an array of objects: [{ "day": 1, "scripture": "Reference", "reflection": "Reflection text", "action_item": "Actionable challenge" }]`,
        denomination: profile?.denomination || 'Non-Denominational',
        mode: 'sermon_to_action',
      });
      const parsed = parseAIJson<any[]>(raw);
      localStorage.setItem(cacheKey, JSON.stringify(parsed));
      setActivePlan({ sermonTitle: sermon.title, plan: parsed });
    } catch (err) {
      console.error("Failed to generate plan", err);
      // Fallback dummy data if AI fails
      const fallback = Array.from({ length: 7 }).map((_, i) => ({
        day: i + 1,
        scripture: "Romans 12:2",
        reflection: `A reflection on day ${i + 1} based on ${sermon.title}.`,
        action_item: "Take 5 minutes to pray about this."
      }));
      setActivePlan({ sermonTitle: sermon.title, plan: fallback });
    } finally {
      setGeneratingPlan(false);
      setSelectedSermon(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen relative" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/"><motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></motion.div></Link>
          <h1 className="text-2xl font-bold">Sermon Archive</h1>
        </div>
      </header>
      
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin opacity-40" /></div>
        ) : !profile?.church_id ? (
           <div className="glass-panel p-8 rounded-3xl text-center opacity-40 italic">You must be linked to a church to view the archive.</div>
        ) : sermons.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center opacity-40 italic flex flex-col items-center">
            <Archive className="w-10 h-10 mb-2" />
            <p>No past sermons found.</p>
          </div>
        ) : (
          sermons.map(sermon => (
            <motion.div key={sermon.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                  <Video className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{sermon.title}</h3>
                  <div className="flex items-center gap-2 text-xs opacity-60">
                    <span className="font-medium">{sermon.speaker || 'Church Pastor'}</span>
                    <span>•</span>
                    <span>{new Date(sermon.date).toLocaleDateString()}</span>
                  </div>
                  {sermon.ai_notes && <p className="text-sm mt-2 line-clamp-2 opacity-80">{sermon.ai_notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 md:flex-col shrink-0">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleGeneratePlan(sermon)}
                  disabled={generatingPlan}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold w-full justify-center disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {generatingPlan && selectedSermon?.id === sermon.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {generatingPlan && selectedSermon?.id === sermon.id ? 'Generating...' : '7-Day Plan'}
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {activePlan && (
          <DevotionalPlanModal 
            sermonTitle={activePlan.sermonTitle} 
            plan={activePlan.plan} 
            onClose={() => setActivePlan(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
