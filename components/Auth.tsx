
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { GlassCard } from './GlassCard';
import { Sparkles, Mail, Lock, ArrowRight, Loader } from 'lucide-react';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover opacity-30" />
      <div className="absolute inset-0 bg-black/60" />
      
      <GlassCard className="w-full max-w-md relative z-10 p-8 flex flex-col gap-6 border-white/10 !bg-black/40 backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-accent-500/20 rounded-full mb-2">
            <Sparkles className="text-accent-500 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Nexus AI</h1>
          <p className="text-white/50 text-sm">
            {isSignUp ? 'Create your cognitive workspace' : 'Welcome back, Operator'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/60 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-accent-500 focus:bg-white/10 transition-all outline-none"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white/60 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-accent-500 focus:bg-white/10 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-xs ${message.type === 'error' ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-500 hover:bg-accent-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 mt-2 shadow-lg shadow-accent-500/20"
          >
            {loading ? <Loader className="animate-spin" size={18} /> : (isSignUp ? 'Sign Up' : 'Sign In')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className="text-xs text-white/50 hover:text-accent-400 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
