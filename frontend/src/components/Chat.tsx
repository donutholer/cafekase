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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/30 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h1 className="text-5xl font-thin text-gray-800 mb-2 tracking-tight">
              Cafékase
            </h1>
            <p className="text-gray-600 font-light">
              Your perfect drink, thoughtfully curated
            </p>
          </div>
        </motion.div>

        {/* Chat Container */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-8 space-y-6 scrollbar-hide">
            {messages.filter(m => m.content).map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-500/20 text-gray-800' 
                      : 'bg-white/20 text-gray-700'
                  }`}
                >
                  <p className="text-sm leading-relaxed font-light">
                    {message.content}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {loading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-start"
              >
                <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                           style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                           style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm text-gray-500 font-light">
                      Thinking...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="border-t border-white/20 bg-white/5 backdrop-blur-sm p-6">
            {!drinkRecommendation ? (
              <form onSubmit={handleSend} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Share your preferences..."
                    className="w-full backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl 
                             px-6 py-4 text-gray-700 placeholder-gray-400 focus:outline-none 
                             focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 
                             transition-all duration-300 font-light shadow-lg"
                    disabled={loading}
                  />
                </div>
                
                <div className="flex justify-center">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="backdrop-blur-lg bg-blue-500/30 hover:bg-blue-500/40 border 
                             border-blue-400/50 text-gray-700 px-8 py-3 rounded-2xl 
                             transition-all duration-300 disabled:opacity-50 
                             disabled:cursor-not-allowed font-light shadow-lg
                             hover:shadow-xl hover:border-blue-400/70"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      'Send Message'
                    )}
                  </motion.button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="backdrop-blur-lg bg-green-500/20 border border-green-400/30 rounded-2xl p-6 shadow-lg">
                  <p className="text-gray-700 font-light mb-4">
                    ✨ Your perfect drink recommendation is ready!
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={reset}
                    className="backdrop-blur-lg bg-purple-500/30 hover:bg-purple-500/40 border 
                             border-purple-400/50 text-gray-700 px-8 py-3 rounded-2xl 
                             transition-all duration-300 font-light shadow-lg
                             hover:shadow-xl hover:border-purple-400/70"
                  >
                    Start New Conversation
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}