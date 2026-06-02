'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, KeyRound, Sparkles } from 'lucide-react';
import { getCoupleProfile, CoupleProfile } from '@/lib/db';
import SensualCard from '@/components/SensualCard';

export default function LandingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pinInput, setPinInput] = useState<string>('');
  const [isPinError, setIsPinError] = useState(false);
  const [isPinScreen, setIsPinScreen] = useState(false);

  useEffect(() => {
    async function checkSetup() {
      const data = await getCoupleProfile();
      setProfile(data);
      setIsLoading(false);
    }
    checkSetup();
  }, []);

  const handleEnterClick = () => {
    if (profile && profile.pinHash) {
      setIsPinScreen(true);
    } else if (profile) {
      router.push('/dashboard');
    } else {
      router.push('/setup');
    }
  };

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const newVal = pinInput + num;
      setPinInput(newVal);
      setIsPinError(false);

      if (newVal.length === 4) {
        verifyPin(newVal);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const verifyPin = (enteredPin: string) => {
    if (profile && enteredPin === profile.pinHash) {
      // Success: animate and transition
      router.push('/dashboard');
    } else {
      // Error shaking effect
      setIsPinError(true);
      setPinInput('');
      // Trigger a subtle vibration if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-sensual-dark">
        <Heart className="w-10 h-10 text-sensual-pink animate-pulse" />
        <span className="mt-4 text-xs tracking-widest text-zinc-500 uppercase">Synchronizing...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-12 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!isPinScreen ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex-1 flex flex-col justify-between h-full"
          >
            {/* Header branding */}
            <div className="flex flex-col items-center pt-8">
              <div className="p-3 bg-sensual-pink/10 border border-sensual-pink/20 rounded-full mb-4">
                <Heart className="w-8 h-8 text-sensual-pink fill-sensual-pink/20" />
              </div>
              <h1 className="text-5xl font-bold font-serif text-gold-gradient tracking-wide text-center">
                PURE DESIRE
              </h1>
              <p className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 mt-2 font-sans">
                A Private Sanctuary for Two
              </p>
            </div>

            {/* Premium Centerpiece Visual */}
            <div className="my-8 flex justify-center items-center">
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Glowing Concentric Orbs */}
                <div className="absolute w-full h-full rounded-full border border-rose-gold/10 scale-100 animate-pulse duration-1000" />
                <div className="absolute w-5/6 h-5/6 rounded-full border border-sensual-pink/10 scale-95 animate-pulse duration-700" />
                <div className="absolute w-2/3 h-2/3 rounded-full bg-gradient-to-tr from-sensual-purple/20 to-velvet-crimson/10 blur-xl opacity-60" />
                
                {/* Text overlay */}
                <div className="relative text-center px-6">
                  <p className="text-zinc-300 text-sm leading-relaxed italic font-serif">
                    "Intimacy is not just physical. It is dialogue, discovery, and shared secrets."
                  </p>
                </div>
              </div>
            </div>

            {/* CTA action button */}
            <div className="flex flex-col items-center">
              <SensualCard glowColor="pink" className="w-full max-w-[320px] p-1.5" hoverScale={false}>
                <button
                  onClick={handleEnterClick}
                  className="w-full bg-gradient-to-r from-sensual-pink via-velvet-crimson to-sensual-purple py-4 rounded-xl text-white font-serif font-bold text-lg tracking-widest shadow-md flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {profile ? 'ENTER SANCTUARY' : 'CREATE PORTAL'}
                </button>
              </SensualCard>

              <span className="text-[10px] text-zinc-600 mt-4 flex items-center gap-1.5 font-sans">
                <Lock className="w-3 h-3 text-zinc-600" />
                End-to-End Cryptographic Local Privacy
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex-1 flex flex-col justify-between"
          >
            {/* PIN Screen Header */}
            <div className="flex flex-col items-center pt-8">
              <KeyRound className="w-8 h-8 text-rose-gold mb-3 animate-bounce" />
              <h2 className="text-3xl font-serif text-gold-gradient font-bold">Verify Identity</h2>
              <p className="text-xs text-zinc-500 mt-1">Enter your couple's private lock PIN</p>
            </div>

            {/* PIN Bubble Displays */}
            <div className="flex flex-col items-center my-6">
              <motion.div
                animate={isPinError ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex gap-4 mb-4"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const hasVal = pinInput.length > idx;
                  return (
                    <motion.div
                      key={idx}
                      animate={hasVal ? { scale: 1.1, backgroundColor: '#ff2a6d' } : { scale: 1, backgroundColor: '#130c1c' }}
                      className={`w-4 h-4 rounded-full border border-rose-gold/20 shadow-md ${
                        hasVal ? 'shadow-sensual-pink/50' : ''
                      }`}
                    />
                  );
                })}
              </motion.div>
              {isPinError && (
                <span className="text-xs text-sensual-pink font-sans font-medium tracking-wide">
                  Invalid security key. Try again.
                </span>
              )}
            </div>

            {/* Tactile Keypad */}
            <div className="w-full max-w-[320px] mx-auto grid grid-cols-3 gap-4 mb-8">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <motion.button
                  key={num}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleKeyPress(num)}
                  className="w-16 h-16 rounded-full glass-card border border-white/5 flex items-center justify-center font-serif text-2xl text-zinc-200 hover:text-white hover:border-sensual-pink/20 hover:bg-sensual-pink/5 transition-all mx-auto"
                >
                  {num}
                </motion.button>
              ))}
              <button
                onClick={() => setIsPinScreen(false)}
                className="w-16 h-16 rounded-full flex items-center justify-center font-sans text-xs text-zinc-500 hover:text-zinc-300 mx-auto"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleKeyPress('0')}
                className="w-16 h-16 rounded-full glass-card border border-white/5 flex items-center justify-center font-serif text-2xl text-zinc-200 hover:text-white mx-auto"
              >
                0
              </motion.button>
              <button
                onClick={handleBackspace}
                className="w-16 h-16 rounded-full flex items-center justify-center font-sans text-xs text-zinc-500 hover:text-zinc-300 mx-auto"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
