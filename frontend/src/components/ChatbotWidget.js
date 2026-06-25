'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, HeartPulse, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ChatbotWidget() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Welcome to KSJ Global Medical assistant! I can recommend products, track orders, or answer health-related queries. \n\n⚠️ *Suggestions are for informational purposes only. Always consult a doctor before taking medication.*"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Initialize unique session ID
  useEffect(() => {
    let storedSession = localStorage.getItem('ksj-chat-session');
    if (!storedSession) {
      storedSession = 'sess-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ksj-chat-session', storedSession);
    }
    setSessionId(storedSession);
  }, []);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage;
    setInputMessage('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/chatbot/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId, message: userText })
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'ai', text: 'Sorry, I am facing connectivity issues. Please try again.' }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'I am unable to reach the server right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Chat Bubble Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-medical-600 hover:bg-medical-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform transform hover:scale-105 duration-200"
          title="Open AI Medical Assistant"
        >
          <MessageSquare size={24} className="animate-bounce" />
        </button>
      )}

      {/* Chat Pane Panel */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-80 md:w-96 h-[500px] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="bg-medical-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <HeartPulse size={18} className="text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">KSJ Medical Assistant</h4>
                <span className="text-xxs text-slate-200">AI Chatbot is Online</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  
                  {/* Icon Avatar */}
                  <div className={`p-1.5 rounded-full text-xxs flex items-center justify-center shrink-0 ${
                    msg.sender === 'user' ? 'bg-medical-100 text-medical-800' : 'bg-pharmacy-100 text-pharmacy-800'
                  }`}>
                    {msg.sender === 'user' ? <User size={12} /> : <HeartPulse size={12} />}
                  </div>

                  {/* Message bubble */}
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-medical-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                  }`}>
                    {msg.text}
                  </div>

                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="p-1.5 rounded-full bg-pharmacy-100 text-pharmacy-800 shrink-0">
                    <HeartPulse size={12} />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-3 rounded-2xl rounded-tl-none text-xs">
                    <span className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Action */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask about dosage, medicines, track order..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-800 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-full focus:outline-none focus:ring-1 focus:ring-medical-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="bg-medical-600 hover:bg-medical-700 disabled:bg-slate-300 text-white p-2 rounded-full shadow-md shrink-0 transition-colors"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
