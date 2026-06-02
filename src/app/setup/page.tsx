'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, Calendar, UserCheck, Link2 } from 'lucide-react';
import { saveCoupleProfile, joinCoupleSession } from '@/lib/db';
import SensualCard from '@/components/SensualCard';

export default function SetupPage() {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  
  // New profile state
  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [pin, setPin] = useState('');
  
  // Joining state
  const [pairingCode, setPairingCode] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isJoining) {
      if (!pairingCode || pairingCode.trim().length < 4) {
        setError('Please enter a valid Pairing Code.');
        setIsLoading(false);
        return;
      }
      try {
        const profile = await joinCoupleSession(pairingCode.trim());
        if (profile) {
          router.push('/dashboard');
        } else {
          setError('Could not join session. Please double check the code.');
        }
      } catch (err) {
        setError('Failed to connect. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!partner1 || !partner2) {
        setError('Please provide names for both partners.');
        setIsLoading(false);
        return;
      }
      if (pin && (pin.length !== 4 || isNaN(Number(pin)))) {
        setError('Passcode PIN must be exactly a 4-digit number.');
        setIsLoading(false);
        return;
      }

      try {
        await saveCoupleProfile(partner1, partner2, anniversary, pin);
        router.push('/dashboard');
      } catch (err) {
        setError('Something went wrong during saving. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-start px-6 py-12 relative">
      <div className="flex flex-col items-center pt-4 mb-6">
        <Heart className="w-8 h-8 text-sensual-pink fill-sensual-pink/20 animate-pulse mb-3" />
        <h1 className="text-4xl font-serif text-gold-gradient font-bold text-center">Onboard Your Partnership</h1>
        <p className="text-xs text-zinc-500 mt-1 text-center max-w-[280px]">
          Enter details below to establish or synchronize your private couple environment.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex justify-center gap-2 mb-6 max-w-[380px] w-full mx-auto">
        <button
          onClick={() => { setIsJoining(false); setError(''); }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-serif font-bold border transition-all ${
            !isJoining
              ? 'bg-sensual-pink/10 border-sensual-pink/30 text-rose-gold'
              : 'bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Initialize New Session
        </button>
        <button
          onClick={() => { setIsJoining(true); setError(''); }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-serif font-bold border transition-all ${
            isJoining
              ? 'bg-sensual-purple/20 border-sensual-purple/30 text-purple-400'
              : 'bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Join Existing Session
        </button>
      </div>

      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[380px] mx-auto"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <SensualCard glowColor={isJoining ? 'purple' : 'pink'} className="p-6 flex flex-col gap-4" hoverScale={false}>
            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-sensual-pink bg-sensual-pink/5 border border-sensual-pink/20 p-3 rounded-lg text-center font-sans"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {!isJoining ? (
                <motion.div
                  key="new-session-inputs"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {/* Partner 1 Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold tracking-wider text-rose-gold uppercase font-serif flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-rose-gold/60" />
                      Partner One (Your Name)
                    </label>
                    <input
                      type="text"
                      value={partner1}
                      onChange={(e) => setPartner1(e.target.value)}
                      placeholder="e.g. Aarav"
                      className="w-full px-4 py-3 bg-sensual-dark/80 rounded-xl border border-white/5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-sensual-pink/40 focus:ring-1 focus:ring-sensual-pink/20 text-sm font-sans"
                    />
                  </div>

                  {/* Partner 2 Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold tracking-wider text-rose-gold uppercase font-serif flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-rose-gold/60" />
                      Partner Two (Their Name)
                    </label>
                    <input
                      type="text"
                      value={partner2}
                      onChange={(e) => setPartner2(e.target.value)}
                      placeholder="e.g. Diya"
                      className="w-full px-4 py-3 bg-sensual-dark/80 rounded-xl border border-white/5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-sensual-pink/40 focus:ring-1 focus:ring-sensual-pink/20 text-sm font-sans"
                    />
                  </div>

                  {/* Anniversary Date Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold tracking-wider text-rose-gold uppercase font-serif flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-gold/60" />
                      Anniversary Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={anniversary}
                      onChange={(e) => setAnniversary(e.target.value)}
                      className="w-full px-4 py-3 bg-sensual-dark/80 rounded-xl border border-white/5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-sensual-pink/40 focus:ring-1 focus:ring-sensual-pink/20 text-sm font-sans"
                    />
                  </div>

                  {/* Private 4-Digit PIN */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold tracking-wider text-rose-gold uppercase font-serif flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-gold/60" />
                      Secret 4-Digit Passcode (Lock PIN)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Four numeric digits (e.g. 1234)"
                      className="w-full px-4 py-3 bg-sensual-dark/80 rounded-xl border border-white/5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-sensual-pink/40 focus:ring-1 focus:ring-sensual-pink/20 text-sm font-sans"
                    />
                    <span className="text-[10px] text-zinc-600 font-sans italic leading-relaxed">
                      * Ensures complete device lock. Leave empty to disable startup passcode locks.
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="join-session-inputs"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4 py-4"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-wider text-purple-400 uppercase font-serif flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-purple-400/60" />
                      Partner's Secret Pairing Code
                    </label>
                    <input
                      type="text"
                      value={pairingCode}
                      onChange={(e) => setPairingCode(e.target.value)}
                      placeholder="Enter the 9-character code (e.g. k7g8e2h1x)"
                      className="w-full px-4 py-3 bg-sensual-dark/80 rounded-xl border border-white/5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-sensual-purple/40 focus:ring-1 focus:ring-sensual-purple/20 text-sm font-sans text-center font-mono tracking-widest uppercase"
                    />
                    <span className="text-[10px] text-zinc-600 font-sans italic leading-relaxed mt-1 block">
                      * Enter the exact Pairing Code from your partner's dashboard screen (found in their "Live Link" menu).
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SensualCard>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r ${
              isJoining
                ? 'from-sensual-purple to-purple-800'
                : 'from-sensual-pink to-velvet-crimson'
            } text-white py-4 rounded-xl font-serif font-bold text-lg tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(255,42,109,0.2)] mt-2 flex justify-center items-center`}
          >
            {isLoading ? 'ESTABLISHING...' : isJoining ? 'LINK SANCTUARY SESSION' : 'INITIALIZE SANCTUARY'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
