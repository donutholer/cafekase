import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStores';
import { motion } from 'framer-motion';

export function Chat() {
  const [input, setInput] = useState('');
  const { messages, loading, sendUserMessage, drinkRecommendation, reset, initialize } = useChatStore();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const message = input;
    setInput('');
    await sendUserMessage(message);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] h-[90vh] max-h-[800px] bg-[#0a0a0a] rounded-[40px] overflow-hidden flex flex-col shadow-[0_50px_100px_rgba(255,255,255,0.1),0_0_0_1px_rgba(255,255,255,0.1)]">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-[#0a0a0a] to-transparent relative z-10">
          <h1 className="text-[28px] font-semibold tracking-tight text-white mb-1">☕ Cafekase</h1>
          <p className="text-sm text-gray-500 font-normal">Curated coffee, perfectly yours</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
          {messages.filter(m => m.content).map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] px-[18px] py-[14px] rounded-[20px] text-[15px] leading-relaxed ${
                  message.role === 'user' 
                    ? 'bg-white text-black' 
                    : 'bg-[#1a1a1a] text-white border border-[#2a2a2a]'
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-[#1a1a1a] px-5 py-4 rounded-[20px] border border-[#2a2a2a]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
          
          {drinkRecommendation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-4"
            >
              <div className="w-full">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[20px] p-6">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Perfect Drink</div>
                  <div className="text-xl font-medium text-white">{drinkRecommendation}</div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input or Restart */}
        <div className="p-6 bg-[#0a0a0a] border-t border-[#1a1a1a]">
          {!drinkRecommendation ? (
            <form onSubmit={handleSend} className="flex gap-3 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white px-5 py-[14px] rounded-full text-[15px] outline-none transition-all focus:bg-[#222] focus:border-[#444] placeholder-gray-500"
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_4px_20px_rgba(255,255,255,0.3)] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          ) : (
            <button 
              onClick={reset}
              className="w-full py-4 bg-white text-black rounded-full text-base font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)] active:translate-y-0"
            >
              Start New Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}