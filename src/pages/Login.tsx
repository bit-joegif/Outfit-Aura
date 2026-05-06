import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Shirt, Sparkles, Mail, Lock, LogIn, UserPlus, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';

export function Login() {
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Login failed:', error);
    }
  };

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-muted/10 rounded-full blur-3xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md p-8 text-center"
      >
        <div className="inline-flex items-center justify-center mb-8">
           <span className="font-serif text-6xl italic font-bold tracking-tighter opacity-20">O</span>
        </div>
        
        <h1 className="text-5xl font-serif mb-6 text-brand-text leading-tight">
          Outfit <br />
          <span className="italic">Aura</span>
        </h1>
        
        <AnimatePresence mode="wait">
          {!isEmailMode ? (
            <motion.div
              key="google-mode"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <p className="art-label opacity-60 mb-12 max-w-xs mx-auto leading-relaxed">
                Start your day <br />
                with own style
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  className="art-button-primary w-full shadow-2xl flex items-center justify-center gap-3 active:scale-95 transform transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Enter with Google
                </button>

                <button
                  onClick={() => setIsEmailMode(true)}
                  className="art-button-secondary w-full flex items-center justify-center gap-3 active:scale-95 transform transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Email Access
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="email-mode"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <form onSubmit={handleEmailAction} className="space-y-4 text-left">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input
                    type="email"
                    required
                    placeholder="Studio Identity (Email)"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-brand-border rounded-sm text-[11px] uppercase tracking-widest outline-none focus:border-brand-text transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input
                    type="password"
                    required
                    placeholder="Access Code (Password)"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-brand-border rounded-sm text-[11px] uppercase tracking-widest outline-none focus:border-brand-text transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {isSignUp && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                    <input
                      type="password"
                      required
                      placeholder="Confirm Access Code"
                      className="w-full pl-12 pr-4 py-4 bg-white border border-brand-border rounded-sm text-[11px] uppercase tracking-widest outline-none focus:border-brand-text transition-colors"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                )}

                {error && (
                  <p className="text-[10px] text-red-500 uppercase tracking-tighter text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="art-button-primary w-full shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {isSignUp ? 'Initiate Account' : 'Authenticate'}
                </button>
              </form>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity font-bold"
                >
                  {isSignUp ? 'Already joined? Sign In' : 'New to Aura? Create Identity'}
                </button>
                
                <button
                  onClick={() => setIsEmailMode(false)}
                  className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-all"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Return to Portal options
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-brand-border">
           <p className="text-[9px] uppercase tracking-[0.4em] opacity-30">Rule-Based Coordination Engine</p>
        </div>
      </motion.div>
    </div>
  );
}
