import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, HeartHandshake, Trash2, Ghost } from 'lucide-react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSamaritans, setShowSamaritans] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadMessages();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear this chat? This cannot be undone.")) return;
    try {
      await supabase.from('chat_messages').delete().eq('user_id', user?.id);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !profile) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Optimistic UI
    const newUserMsg: Message = { id: crypto.randomUUID(), role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      // Save user message to DB if not incognito
      if (!isIncognito) {
        await supabase.from('chat_messages').insert([{
          user_id: user.id,
          role: 'user',
          content: userMessage
        }]);
      }

      // Detect crisis words for Samaritan prompt
      const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'self harm'];
      const isCrisis = crisisKeywords.some(kw => userMessage.toLowerCase().includes(kw));
      if (isCrisis) {
        setShowSamaritans(true);
      }

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          denomination: profile.denomination
        }
      });

      if (error) throw error;

      const assistantMsgContent = data?.reply || "I am currently unable to reflect on this. Let us pray together in silence.";
      
      // Save AI message to DB if not incognito
      if (!isIncognito) {
        await supabase.from('chat_messages').insert([{
          user_id: user.id,
          role: 'assistant',
          content: assistantMsgContent
        }]);
      }

      const newAssistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: assistantMsgContent };
      setMessages(prev => [...prev, newAssistantMsg]);

    } catch (err) {
      console.error('Chat error:', err);
      // Fallback message
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: "I'm having trouble connecting right now, my friend. Please hold on." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-3xl mx-auto h-screen flex flex-col p-4 md:p-6 transition-colors duration-500 ${isIncognito ? 'bg-[#1a1a1a] text-white' : ''}`}>
      <header className="flex items-center justify-between mb-4 animate-fade-in shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/">
            <motion.div whileTap={{ scale: 0.90 }} className="p-2 opacity-70 hover:opacity-100 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
          </Link>
          <h1 className="text-xl font-bold">Theological Peer</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button 
            whileTap={{ scale: 0.90 }} 
            onClick={() => setIsIncognito(!isIncognito)}
            className={`p-2 rounded-full transition-all ${isIncognito ? 'bg-indigo-500/20 text-indigo-400' : 'opacity-50 hover:opacity-100'}`}
            title="Incognito Mode (Does not save messages)"
          >
            <Ghost className="w-5 h-5" />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.90 }} 
            onClick={handleClearChat}
            className="p-2 opacity-50 hover:opacity-100 text-red-500 transition-opacity"
            title="Clear Chat History"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      {!isIncognito && (
        <div className="bg-[#E3EBF3]/30 border border-[#E3EBF3]/50 p-3 rounded-xl mb-6 shrink-0 animate-fade-in text-xs opacity-75 text-[#2D3436]">
          ChristSeeker is a tool to help you explore Scripture and tradition. It is a 'Knowledgeable Peer' designed to point you back to the Word, your local church, and your own prayer life. It is not a substitute for the Holy Spirit or the wisdom of a human pastor.
        </div>
      )}
      
      {isIncognito && (
        <div className="bg-indigo-900/30 border border-indigo-500/30 p-3 rounded-xl mb-6 shrink-0 animate-fade-in text-xs text-indigo-200">
          Incognito Mode is active. New messages will not be saved to your spiritual journal.
        </div>
      )}

      {showSamaritans && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-4 flex items-start gap-4 shrink-0"
        >
          <HeartHandshake className="w-6 h-6 mt-1" />
          <div>
            <h3 className="font-bold">You are not alone.</h3>
            <p className="text-sm mt-1">If you are in deep distress, please reach out for immediate support. The Samaritans are available 24/7 in the UK.</p>
            <p className="font-bold mt-2">Call: 111 (NHS) or 116 123 (Samaritans)</p>
          </div>
          <button onClick={() => setShowSamaritans(false)} className="ml-auto opacity-50 hover:opacity-100 text-xl">&times;</button>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 pb-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center opacity-50 animate-fade-in">
            <p>Grace and peace to you.<br/>How can we reflect together today?</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? `${isIncognito ? 'bg-indigo-600' : 'bg-[#2D3436]'} text-white rounded-br-sm` 
                : `${isIncognito ? 'bg-[#2d2d2d]' : 'glass-panel'} rounded-bl-sm`
            }`}>
              <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className={`${isIncognito ? 'bg-[#2d2d2d]' : 'glass-panel'} p-4 rounded-2xl rounded-bl-sm flex gap-2`}>
              <span className={`w-2 h-2 ${isIncognito ? 'bg-indigo-400' : 'bg-[#2D3436]'} rounded-full animate-bounce`}></span>
              <span className={`w-2 h-2 ${isIncognito ? 'bg-indigo-400' : 'bg-[#2D3436]'} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></span>
              <span className={`w-2 h-2 ${isIncognito ? 'bg-indigo-400' : 'bg-[#2D3436]'} rounded-full animate-bounce`} style={{ animationDelay: '0.4s' }}></span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="shrink-0 pt-4 animate-slide-in-bottom">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isIncognito ? "Whisper your thoughts..." : "Share your thoughts..."}
            className={`w-full pl-6 pr-14 py-4 rounded-full ${isIncognito ? 'bg-[#2d2d2d] text-white border-none' : 'glass-panel'} focus:outline-none focus:ring-2 focus:ring-${isIncognito ? 'indigo-500' : '[#2D3436]'} transition-all`}
          />
          <motion.button
            whileTap={{ scale: 0.90 }}
            type="submit"
            disabled={!input.trim() || loading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 ${isIncognito ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#2D3436] hover:bg-[#1a1f20]'} text-white rounded-full disabled:opacity-50 transition-colors`}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
