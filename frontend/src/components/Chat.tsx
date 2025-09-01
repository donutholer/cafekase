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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-light tracking-wider mb-2">CAFÉKASE</h1>
            <div className="w-16 h-px bg-white mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm uppercase tracking-widest">
              Curated. Personalized. Perfect.
            </p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="h-[calc(100vh-280px)] overflow-y-auto px-6 py-8">
          <div className="space-y-8">
            {messages.filter(m => m.content).map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] ${
                    message.role === 'user' 
                      ? 'text-right' 
                      : 'text-left'
                  }`}
                >
                  <div className={`inline-block p-6 rounded-none border ${
                    message.role === 'user' 
                      ? 'border-white bg-white text-black' 
                      : 'border-gray-800 bg-gray-900 text-white'
                  }`}>
                    <p className="text-sm leading-relaxed font-light">
                      {message.content}
                    </p>
                  </div>
                  <div className={`text-xs text-gray-500 mt-2 uppercase tracking-wider ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {message.role === 'user' ? 'You' : 'Cafékase'}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="border border-gray-800 bg-gray-900 p-6 rounded-none">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" 
                           style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" 
                           style={{ animationDelay: '200ms' }} />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" 
                           style={{ animationDelay: '400ms' }} />
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      Thinking...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Section */}
        <div className="border-t border-gray-800 px-6 py-6">
          {!drinkRecommendation ? (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-transparent border border-gray-800 px-6 py-4 text-sm 
                           placeholder-gray-500 focus:outline-none focus:border-white 
                           transition-colors duration-300 font-light"
                  disabled={loading}
                />
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              </div>
              
              <div className="flex justify-center">
                <button 
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-8 py-3 border border-white text-white bg-transparent 
                           hover:bg-white hover:text-black transition-all duration-300 
                           disabled:opacity-30 disabled:cursor-not-allowed text-xs 
                           uppercase tracking-widest font-light"
                >
                  {loading ? 'Processing...' : 'Send'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">
                  Your experience is complete
                </p>
                <button 
                  onClick={reset}
                  className="px-12 py-4 border border-white text-white bg-transparent 
                           hover:bg-white hover:text-black transition-all duration-300 
                           text-xs uppercase tracking-widest font-light"
                >
                  Begin Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}