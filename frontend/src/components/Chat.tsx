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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="font-mono text-sm">
          <span className="text-gray-500">$</span> cafekase --version 1.0.0
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {messages.filter(m => m.content).map((message, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            {message.role === 'user' ? (
              <div className="flex items-start">
                <span className="text-green-500 mr-2">{'>'}</span>
                <span className="text-white break-words flex-1">{message.content}</span>
              </div>
            ) : (
              <div className="flex items-start">
                <span className="text-gray-500 mr-2">{'$'}</span>
                <span className="text-gray-300 break-words flex-1">{message.content}</span>
              </div>
            )}
          </motion.div>
        ))}
        
        {loading && (
          <div className="flex items-start">
            <span className="text-gray-500 mr-2">{'$'}</span>
            <span className="text-gray-500">
              <span className="inline-block animate-pulse">processing</span>
              <span className="inline-block animate-blink">_</span>
            </span>
          </div>
        )}
        
        {drinkRecommendation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 border border-gray-800"
          >
            <div className="text-xs text-gray-500 mb-2">[RECOMMENDATION]</div>
            <div className="text-white">{drinkRecommendation}</div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        {!drinkRecommendation ? (
          <form onSubmit={handleSend} className="flex items-center font-mono text-sm">
            <span className="text-green-500 mr-2">{'>'}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="type message..."
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-600"
              disabled={loading}
              autoFocus
            />
            <span className="animate-blink text-white ml-1">|</span>
          </form>
        ) : (
          <button 
            onClick={reset}
            className="w-full py-3 px-4 bg-white text-black font-mono text-sm hover:bg-gray-200 transition-colors"
          >
            [ENTER] New Order
          </button>
        )}
      </div>
    </div>
  );
}