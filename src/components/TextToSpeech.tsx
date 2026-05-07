import { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import { motion } from 'framer-motion';

interface TextToSpeechProps {
  text: string;
  className?: string;
}

export default function TextToSpeech({ text, className = '' }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
    }
    
    // Stop speaking when component unmounts
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggle = () => {
    if (!isSupported) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Clean text by removing markdown formatting
    const cleanText = text.replace(/[*#_\[\]]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Attempt to set a pleasant English voice
    const voices = window.speechSynthesis.getVoices();
    const goodVoice = voices.find(v => 
      (v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Samantha')) 
      && v.lang.startsWith('en')
    );
    if (goodVoice) utterance.voice = goodVoice;
    
    utterance.rate = 0.95; // Slightly slower
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  if (!isSupported) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleToggle}
      className={`p-2 rounded-full transition-colors flex items-center justify-center ${isPlaying ? 'bg-[var(--accent)] text-white shadow-md' : 'opacity-60 hover:opacity-100 bg-[var(--bg-primary)] border border-[var(--bg-card-border)]'} ${className}`}
      title={isPlaying ? "Stop listening" : "Listen"}
    >
      {isPlaying ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </motion.button>
  );
}
