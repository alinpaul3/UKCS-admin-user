import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { FileBadge, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../components/common/Logo';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        // Auth changed event in Context will handle the profile fetch and redirect
      } else {
        // Register mode validation checks
        if (!displayName.trim()) {
          throw new Error('Please enter your full name');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        
        // Update user display name in Firebase Auth
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: displayName.trim()
          });
        }
        setSuccessMsg('Account registered successfully! Securely linking files...');
      }
    } catch (err: any) {
      let friendlyError = err.message || 'An error occurred. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'This email address is already registered. Please go to the Sign In tab.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'The email address is invalid.';
      }
      setError(friendlyError);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6 animate-fade-in"
      >
        <div className="text-center space-y-2 flex flex-col items-center">
          <Logo size="lg" variant="vertical" theme="light" />
          <p className="text-slate-400 font-medium italic text-[11px] mt-1">Secure Portal Access & Registration</p>
        </div>

        {/* Tab Selection Switch */}
        <div className="flex border border-slate-200/60 p-1 bg-slate-50 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#003366] shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#003366] shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register Student
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <User className="absolute left-3 top-10 text-slate-400" size={18} />
                <Input 
                  label="Full Name"
                  placeholder="E.g. Alina Ahmed"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 text-sm font-medium"
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
             <Mail className="absolute left-3 top-10 text-slate-400" size={18} />
             <Input 
               label="Email Address"
               placeholder="E.g. student@ukcs.in"
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="pl-10 text-sm font-medium"
               required
             />
          </div>

          <div className="relative">
             <Lock className="absolute left-3 top-10 text-slate-400" size={18} />
             <Input 
               label="Password"
               placeholder="••••••••"
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="pl-10 text-sm font-medium"
               required
             />
          </div>

          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <Lock className="absolute left-3 top-10 text-slate-400" size={18} />
                <Input 
                  label="Confirm Password"
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 text-sm font-medium"
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100">
               {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100 flex items-center gap-2">
               <ShieldCheck size={16} />
               <span>{successMsg}</span>
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-sm font-bold uppercase tracking-wider" isLoading={loading}>
            {mode === 'login' ? 'Sign In to Portal' : 'Register Secure Profile'}
          </Button>
        </form>

        <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
           <p className="text-xs text-slate-500 font-medium leading-relaxed">
             Technical Support: <span className="font-bold text-[#003366]">support@ukcs.in</span>
           </p>
           <button 
             type="button"
             onClick={() => navigate('/')} 
             className="text-[10px] text-[#003366] hover:text-slate-900 font-black uppercase tracking-wider block w-full text-center hover:underline cursor-pointer"
           >
             &larr; Return to Verification Gateway
           </button>
        </div>
      </motion.div>
    </div>
  );
}
