import { X, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface DayPlan {
  day: number;
  scripture: string;
  reflection: string;
  action_item: string;
}

interface DevotionalPlanModalProps {
  sermonTitle: string;
  plan: DayPlan[];
  onClose: () => void;
}

export default function DevotionalPlanModal({ sermonTitle, plan, onClose }: DevotionalPlanModalProps) {
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  const toggleDay = (day: number) => {
    setCompletedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative max-h-[85vh] flex flex-col"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-card-border)' }}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 opacity-50 hover:opacity-100 rounded-full transition-all hover:bg-white/10">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6 pr-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>Sermon-to-Action Plan</p>
          <h2 className="text-2xl font-bold leading-tight">{sermonTitle}</h2>
          <p className="text-sm opacity-60 mt-2">A personalized 7-day journey based on this teaching.</p>
        </div>

        <div className="overflow-y-auto custom-scrollbar pr-4 flex-1 space-y-6 pb-4">
          {plan.map((dayPlan) => {
            const isCompleted = completedDays.includes(dayPlan.day);
            return (
              <div 
                key={dayPlan.day} 
                className={`p-6 rounded-3xl transition-all border-2 ${isCompleted ? 'opacity-60 border-[var(--accent)]/50' : 'border-transparent'}`}
                style={{ background: 'var(--bg-card)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: isCompleted ? 'var(--accent)' : 'var(--bg-card-border)', color: isCompleted ? '#fff' : 'inherit' }}>
                      {dayPlan.day}
                    </div>
                    <h3 className="font-bold text-lg">{dayPlan.scripture}</h3>
                  </div>
                  <button onClick={() => toggleDay(dayPlan.day)}>
                    <CheckCircle2 className={`w-6 h-6 transition-colors ${isCompleted ? 'text-[var(--accent)]' : 'opacity-20'}`} />
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{dayPlan.reflection}</p>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">Action Step</p>
                    <p className="text-sm font-medium">{dayPlan.action_item}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
