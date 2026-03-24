import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Loader2, MessageSquare, Moon, Star, Coffee } from 'lucide-react';

const VIBES = [
  { id: 'cosmic', name: 'Cosmic Oracle', icon: Star, description: 'Answers from the deep universe.' },
  { id: 'noir', name: 'Film Noir Detective', icon: Moon, description: 'Gritty, rain-soaked monologues.' },
  { id: 'soap', name: 'Soap Opera', icon: Sparkles, description: 'Overdramatic and scandalous.' },
  { id: 'roommate', name: 'Passive Aggressive', icon: Coffee, description: 'Slightly annoyed you even asked.' }
];

const MAX_REQUESTS = 3;
const TIME_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export default function App() {
  const [dilemma, setDilemma] = useState('');
  const [vibe, setVibe] = useState(VIBES[0]);
  const [answer, setAnswer] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [rateLimitError, setRateLimitError] = useState('');

  // Helper to check and update frontend rate limits
  const checkFrontendRateLimit = () => {
    const history = JSON.parse(localStorage.getItem('oracle_history') || '[]');
    const now = Date.now();
    
    // Keep only requests from the last hour
    const recentRequests = history.filter((time: number) => now - time < TIME_WINDOW_MS);
    
    if (recentRequests.length >= MAX_REQUESTS) {
      const oldestRequest = recentRequests[0];
      const timeUntilReset = Math.ceil((TIME_WINDOW_MS - (now - oldestRequest)) / 60000);
      return `The Oracle requires rest. Please try again in ${timeUntilReset} minutes.`;
    }

    // Save the new request time
    recentRequests.push(now);
    localStorage.setItem('oracle_history', JSON.stringify(recentRequests));
    return null;
  };

  const askOracle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dilemma.trim()) return;

    setRateLimitError('');
    
    // 1. Check frontend soft limit
    const limitMessage = checkFrontendRateLimit();
    if (limitMessage) {
      setRateLimitError(limitMessage);
      return;
    }

    setIsThinking(true);
    setAnswer('');

    try {
      // 2. Call secure Netlify Function
      const response = await fetch('/.netlify/functions/ask-oracle', {
        method: 'POST',
        body: JSON.stringify({ dilemma, vibe }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If the backend blocked it, show the backend's error message
        throw new Error(data.error || 'Failed to fetch');
      }

      setAnswer(data.answer);
    } catch (error: any) {
      console.error(error);
      setAnswer(error.message || 'The cosmic connection was interrupted. The stars refuse to align today. Try again later.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedbackStatus('submitting');
    const formData = new FormData(e.currentTarget);
    
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData as any).toString()
    }).then(() => {
      setFeedbackStatus('success');
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setFeedbackStatus('idle'), 5000);
    }).catch((error) => {
      console.error(error);
      setFeedbackStatus('error');
      setTimeout(() => setFeedbackStatus('idle'), 5000);
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-fuchsia-900/20 blur-[120px]" />
      </div>

      <main className="flex-grow z-10 flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full mb-4 ring-1 ring-indigo-500/30"
            >
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold oracle-text tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-100 to-slate-500"
            >
              Mundane Oracle
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto font-light"
            >
              Overthinking the little things so you don't have to. Submit your trivial dilemma to the void.
            </motion.p>
          </div>

          {/* Main Interaction Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-3xl p-6 md:p-8 relative glow-effect"
          >
            <form onSubmit={askOracle} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="dilemma" className="block text-sm font-medium text-slate-300 ml-1">
                  What plagues your mind?
                </label>
                <textarea
                  id="dilemma"
                  rows={3}
                  value={dilemma}
                  onChange={(e) => setDilemma(e.target.value)}
                  placeholder="e.g., Should I eat the leftover pizza for breakfast or be a responsible adult and make oatmeal?"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300 ml-1">
                  Choose your Oracle's Vibe
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VIBES.map((v) => {
                    const Icon = v.icon;
                    const isSelected = vibe.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVibe(v)}
                        className={`flex items-start p-3 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? 'bg-indigo-500/20 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                            : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mt-0.5 mr-3 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <div className={`font-medium text-sm ${isSelected ? 'text-indigo-200' : 'text-slate-300'}`}>
                            {v.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{v.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {rateLimitError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {rateLimitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isThinking || !dilemma.trim()}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white rounded-2xl font-medium shadow-lg shadow-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isThinking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Consulting the void...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    Seek Answer
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Answer Area */}
          <AnimatePresence mode="wait">
            {answer && (
              <motion.div
                key="answer"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="glass-panel rounded-3xl p-8 border-l-4 border-l-indigo-500"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <vibe.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-medium text-indigo-200">The Oracle Speaks</h3>
                </div>
                <div className="prose prose-invert prose-indigo max-w-none oracle-text text-lg leading-relaxed text-slate-200">
                  {answer.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Netlify Form Section */}
      <footer className="z-10 bg-slate-900/50 border-t border-slate-800/50 py-12 mt-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <MessageSquare className="w-6 h-6 text-slate-500 mx-auto mb-3" />
            <h2 className="text-xl font-medium text-slate-200">Confess to the Developers</h2>
            <p className="text-sm text-slate-400 mt-2">Have a feature request or just want to say hi? Send it into our void.</p>
          </div>
          
          <form 
            name="oracle-feedback" 
            method="POST" 
            data-netlify="true" 
            netlify-honeypot="bot-field"
            onSubmit={handleFeedbackSubmit}
            className="space-y-4"
          >
            <input type="hidden" name="form-name" value="oracle-feedback" />
            <p className="hidden">
              <label>Don't fill this out if you're human: <input name="bot-field" /></label>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="sr-only">Name</label>
                <input type="text" id="name" name="name" placeholder="Your Name" required className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input type="email" id="email" name="email" placeholder="Your Email" required className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="sr-only">Message</label>
              <textarea id="message" name="message" rows={3} placeholder="Your message to the void..." required className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"></textarea>
            </div>
            <button 
              type="submit" 
              disabled={feedbackStatus === 'submitting'}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {feedbackStatus === 'submitting' ? 'Sending...' : 
               feedbackStatus === 'success' ? 'Received by the void!' : 
               feedbackStatus === 'error' ? 'Error sending message' : 
               'Send Message'}
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}