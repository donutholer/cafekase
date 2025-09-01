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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-black">Cafekase</h1>
        <p className="text-sm text-gray-500 mt-1">Your personal coffee guide</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.filter(m => m.content).map((message, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
              <div className={`text-xs font-medium mb-2 ${
                message.role === 'user' ? 'text-right text-gray-500' : 'text-gray-500'
              }`}>
                {message.role === 'user' ? 'You' : 'Cafekase'}
              </div>
              <div className={`px-5 py-4 rounded-2xl ${
                message.role === 'user' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-50 text-black border border-gray-100'
              }`}>
                <p className="text-base leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex justify-start"
          >
            <div className="max-w-[85%]">
              <div className="text-xs font-medium mb-2 text-gray-500">
                Cafekase
              </div>
              <div className="px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {drinkRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 mb-6 mx-auto max-w-[90%]"
          >
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-6 border border-gray-200">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500 mb-3">Your Perfect Drink</div>
                <div className="text-xl font-semibold text-black">{drinkRecommendation}</div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 bg-white px-6 py-4 pb-safe">
        {!drinkRecommendation ? (
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-5 py-4 bg-gray-50 rounded-full text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-base"
              disabled={loading}
              autoFocus
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="px-8 py-4 bg-black text-white rounded-full font-medium disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform text-base"
            >
              Send
            </button>
          </form>
        ) : (
          <button 
            onClick={reset}
            className="w-full py-4 bg-black text-white rounded-full font-medium active:scale-95 transition-transform text-base"
          >
            Start New Order
          </button>
        )}
      </div>
    </div>
  );
}