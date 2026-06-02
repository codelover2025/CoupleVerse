'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Star, Flame, Eye, Heart, Link2 } from 'lucide-react';
import SpinWheel from '@/components/SpinWheel';
import ScratchCard from '@/components/ScratchCard';
import SensualCard from '@/components/SensualCard';
import { getHistory, addToHistory, getCoupleProfile } from '@/lib/db';
import { getRecommendedDares } from '@/lib/recommender';
import { publishActiveState, subscribeToActiveState } from '@/lib/sync';
import confetti from 'canvas-confetti';

type GameMode = 'wheel' | 'scratch' | 'mystery';
type TempType = 'Mild' | 'Medium' | 'Spicy';

interface SecretDare {
  id: string;
  text: string;
  category: string;
}

const DECK_CHALLENGES = [
  "Hold your partner's hands, lock eyes, and state three distinct things you appreciate about their character.",
  "Give your partner a 2-minute sensual foot massage using lotion or oil.",
  "Without using words, show your partner how much you love them for 1 full minute.",
  "Put on a slow song and dance together closely in the middle of the room for at least 3 minutes.",
  "Take turns naming a place in the house you've always wanted to try sharing a quiet intimate moment.",
  "Trace a piece of ice slowly along your partner's arm, collarbone, or neck.",
  "Feed your partner a grape, strawberry, or chocolate blindfolded, describing its texture first.",
  "Lock eyes for 2 minutes in silence. If either laughs, they must give the other a neck massage.",
  "Sit cross-legged facing each other. Take turns whispering one highly flirty thing you want to explore later.",
  "Use a silk tie or ribbon to blindfold your partner, and place three soft kisses on surprise spots.",
  "Give your partner a deep, slow hug for 60 seconds, focusing entirely on their heartbeat.",
  "Draw a light trace with your fingers from your partner's wrist up to their shoulder, blowing softly.",
  "Lean in and whisper a secret flirty promise that you have never put into words before.",
  "Give your partner a 3-minute back massage focusing purely on the shoulders and spine.",
  "Plant a soft, lingering kiss on the back of your partner's neck, breathing closely.",
  "Trace the contours of your partner's face slowly with your index finger, describing what you admire.",
  "Take turns stating your absolute favorite intimate memory of us, sharing a deep kiss after."
];

export default function GamesHub() {
  const [activeMode, setActiveMode] = useState<GameMode>('wheel');
  
  // Scratch Game states
  const [scratchTemp, setScratchTemp] = useState<TempType>('Mild');
  const [currentDare, setCurrentDare] = useState<SecretDare | null>(null);
  const [scratchKey, setScratchKey] = useState(0);

  // Mystery Deck states
  const [mysteryCard, setMysteryCard] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mysteryDeckKey, setMysteryDeckKey] = useState(0);

  // Sync and Pairing States
  const [coupleId, setCoupleId] = useState<string>('');
  const [partnerNotification, setPartnerNotification] = useState<string>('');

  // 1. Fetch Couple Profile & Onboard Sync Channel
  useEffect(() => {
    async function initSync() {
      const profile = await getCoupleProfile();
      if (profile?.id) {
        setCoupleId(profile.id);
        
        // Broadcast that we entered the Games Hub
        publishActiveState(profile.id, '/games', null);

        // Subscribe to partner broadcasts
        const unsubscribe = subscribeToActiveState(profile.id, (payload) => {
          if (payload.activePath === '/games') {
            const extra = payload.extra;
            if (!extra) return;

            if (extra.activeMode) {
              setActiveMode(extra.activeMode);
              setPartnerNotification(`Partner selected game: ${extra.activeMode === 'wheel' ? 'Desire Wheel' : extra.activeMode === 'scratch' ? 'Scratch Cards' : 'Mystery Deck'}`);
              setTimeout(() => setPartnerNotification(''), 4000);
            }

            if (extra.scratchTemp && extra.dare) {
              setScratchTemp(extra.scratchTemp);
              setCurrentDare(extra.dare);
              setScratchKey(prev => prev + 1);
              setPartnerNotification(`Partner generated a ${extra.scratchTemp} Dare!`);
            }

            if (extra.scratchRevealed) {
              // Partner scratched the dare, play confetti!
              confetti({
                particleCount: 30,
                spread: 45,
                colors: ['#ff2a6d', '#8a2be2'],
              });
              setPartnerNotification('Partner scratched and revealed the Dare!');
              setTimeout(() => setPartnerNotification(''), 5000);
            }

            if (extra.mysteryCardText) {
              setMysteryCard(extra.mysteryCardText);
              setMysteryDeckKey(prev => prev + 1);
              setIsFlipped(false);
              setPartnerNotification('Partner drew a Mystery Card...');
              
              if (extra.flip) {
                setTimeout(() => {
                  setIsFlipped(true);
                  confetti({
                    particleCount: 20,
                    spread: 30,
                    colors: ['#aa50fa', '#c5a880'],
                  });
                }, 400);
              }
            }
          }
        });
        return () => unsubscribe();
      }
    }
    initSync();
  }, []);

  const handleModeSelect = (mode: GameMode) => {
    setActiveMode(mode);
    if (coupleId) {
      publishActiveState(coupleId, '/games', null, { activeMode: mode });
    }
  };

  const startScratchDare = async (temp: TempType) => {
    setScratchTemp(temp);
    const hist = await getHistory();
    const today = new Date();
    
    // Fetch scored, fresh dares from recommendation engine
    const recommended = getRecommendedDares(temp, hist, today);
    let chosenDare: SecretDare;

    if (recommended.length > 0) {
      // Pick from the top 3 scored fresh dares randomly to maintain surprise
      const limit = Math.min(3, recommended.length);
      const randomIndex = Math.floor(Math.random() * limit);
      const chosen = recommended[randomIndex];

      chosenDare = {
        id: chosen.id,
        text: chosen.text,
        category: chosen.category,
      };
    } else {
      // Fallback
      chosenDare = {
        id: 'fallback',
        text: "Give your partner a slow, lingering kiss on a spot of their choice that lasts at least 15 seconds.",
        category: "Affection",
      };
    }

    setCurrentDare(chosenDare);
    setScratchKey((prev) => prev + 1);

    // Broadcast new dare generation
    if (coupleId) {
      publishActiveState(coupleId, '/games', null, {
        activeMode: 'scratch',
        scratchTemp: temp,
        dare: chosenDare
      });
    }
  };

  const handleScratchReveal = async () => {
    confetti({
      particleCount: 40,
      spread: 50,
      colors: ['#ff2a6d', '#c5a880'],
    });

    if (currentDare) {
      await addToHistory('game', currentDare.id);
    }

    // Broadcast scratch reveal celebration!
    if (coupleId) {
      publishActiveState(coupleId, '/games', null, {
        activeMode: 'scratch',
        scratchRevealed: true,
        dareId: currentDare?.id
      });
    }
  };

  const drawMysteryCard = () => {
    setIsFlipped(false);
    setMysteryDeckKey(prev => prev + 1);
    
    // Choose a random mystery prompt
    const randIndex = Math.floor(Math.random() * DECK_CHALLENGES.length);
    const chosen = DECK_CHALLENGES[randIndex];
    setMysteryCard(chosen);

    // Broadcast mystery card draw (unflipped state first)
    if (coupleId) {
      publishActiveState(coupleId, '/games', null, {
        activeMode: 'mystery',
        mysteryCardText: chosen,
        flip: true
      });
    }

    // Flip delay for beautiful transition feel
    setTimeout(() => {
      setIsFlipped(true);
      confetti({
        particleCount: 30,
        spread: 40,
        colors: ['#aa50fa', '#c5a880'],
      });
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-8 relative justify-start">
      {/* Page Header */}
      <div className="flex flex-col items-center mb-6 text-center relative w-full">
        {/* Floating Sync indicator */}
        {coupleId && (
          <div className="absolute top-0 right-0 flex items-center gap-1.5 px-2.5 py-1 bg-sensual-pink/10 border border-sensual-pink/20 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sensual-pink opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sensual-pink"></span>
            </span>
            <span className="text-[8px] uppercase tracking-wider text-rose-gold font-bold font-sans">
              Sync Active
            </span>
          </div>
        )}

        <div className="p-3 bg-sensual-purple/10 border border-sensual-purple/20 rounded-full mb-3 text-sensual-pink animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-gold-gradient">Couple Games</h1>
        <p className="text-xs text-zinc-500 mt-1 max-w-[280px]">
          Seductive games and mystery challenges designed to spark playfulness.
        </p>
      </div>

      {/* Partner Notification Banner */}
      <AnimatePresence>
        {partnerNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full bg-sensual-purple/20 border border-sensual-purple/30 p-2.5 rounded-xl text-center mb-4 flex items-center justify-center gap-1.5 text-xs text-purple-400 font-sans"
          >
            <Link2 className="w-3.5 h-3.5 animate-pulse text-purple-400" />
            <span>{partnerNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Mode Horizontal Switchers */}
      <div className="flex gap-2 p-1.5 bg-[#120818]/60 border border-white/5 rounded-2xl mb-6 justify-between">
        {[
          { id: 'wheel', label: 'Desire Wheel' },
          { id: 'scratch', label: 'Scratch Cards' },
          { id: 'mystery', label: 'Mystery Deck' }
        ].map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id as GameMode)}
              className={`
                flex-1 py-2.5
                rounded-xl
                text-xs
                font-semibold
                transition-all duration-300
                ${
                  isActive
                    ? 'bg-gradient-to-r from-sensual-pink to-velvet-crimson text-white shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Main Game Stage */}
      <div className="flex-1 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          {/* 1. Desire Spin Wheel */}
          {activeMode === 'wheel' && (
            <motion.div
              key="wheel"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center"
            >
              <SpinWheel />
            </motion.div>
          )}

          {/* 2. Interactive Scratch Cards */}
          {activeMode === 'scratch' && (
            <motion.div
              key="scratch"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col gap-5 items-center"
            >
              {/* Temperature selectors */}
              <div className="w-full flex gap-3">
                {(['Mild', 'Medium', 'Spicy'] as TempType[]).map((temp) => {
                  const isSelected = scratchTemp === temp && currentDare !== null;
                  const colors = {
                    Mild: 'from-blue-900/40 to-cyan-900/20 border-cyan-800/40 text-cyan-400 hover:border-cyan-500/40',
                    Medium: 'from-purple-900/40 to-indigo-900/20 border-purple-800/40 text-purple-400 hover:border-purple-500/40',
                    Spicy: 'from-red-900/40 to-sensual-pink/20 border-sensual-pink/40 text-sensual-pink hover:border-sensual-pink/70',
                  };
                  return (
                    <button
                      key={temp}
                      onClick={() => startScratchDare(temp)}
                      className={`
                        flex-1 py-3
                        rounded-xl
                        text-xs
                        font-bold
                        border
                        bg-gradient-to-br
                        transition-all duration-300
                        ${colors[temp]}
                        ${isSelected ? 'ring-2 ring-rose-gold/60 scale-102' : 'opacity-60'}
                      `}
                    >
                      <Flame className="w-3.5 h-3.5 mx-auto mb-1" />
                      {temp} Dare
                    </button>
                  );
                })}
              </div>

              {/* Scratch surface Stage */}
              <div className="w-full min-h-[220px] flex items-center justify-center mt-3">
                {currentDare ? (
                  <div className="w-full aspect-[16/10]">
                    <ScratchCard
                      keyTrigger={scratchKey.toString()}
                      onReveal={handleScratchReveal}
                      overlayText={`Scratch to unlock ${scratchTemp} secret...`}
                      content={
                        <div className="p-6">
                          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-rose-gold px-2 py-0.5 rounded bg-rose-gold/10 inline-block mb-3">
                            {currentDare.category}
                          </span>
                          <p className="text-lg font-serif text-zinc-200 italic leading-relaxed">
                            "{currentDare.text}"
                          </p>
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div className="text-center p-8 bg-zinc-950/40 border border-white/5 rounded-2xl w-full flex flex-col items-center justify-center gap-2.5">
                    <Heart className="w-8 h-8 text-zinc-700 animate-pulse" />
                    <p className="text-xs text-zinc-500 font-sans max-w-[200px]">
                      Select a dare temperature level above to generate a scratch lottery card.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 3. 3D Mystery Card Flipping */}
          {activeMode === 'mystery' && (
            <motion.div
              key="mystery"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center gap-6"
            >
              {/* Draw button */}
              <button
                onClick={drawMysteryCard}
                className="w-full max-w-[280px] bg-gradient-to-r from-sensual-pink to-velvet-crimson text-white rounded-2xl py-3.5 font-serif font-bold text-sm tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,42,109,0.2)] active:scale-[0.98] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                DRAW MYSTERY DECK
              </button>

              {/* 3D Card container */}
              <div className="w-64 h-96 [perspective:1000px] mt-2 relative select-none">
                <AnimatePresence mode="wait">
                  {mysteryCard ? (
                    <motion.div
                      key={mysteryDeckKey}
                      style={{ transformStyle: 'preserve-3d' }}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="w-full h-full relative cursor-pointer"
                    >
                      {/* CARD FRONT (Facedown Golden Mesh) */}
                      <div className="absolute inset-0 w-full h-full rounded-2xl border-2 border-rose-gold/40 bg-gradient-to-tr from-[#1b0825] via-[#07030c] to-[#2c0a1e] flex flex-col items-center justify-center p-6 shadow-2xl [backface-visibility:hidden]">
                        {/* Filigree pattern */}
                        <div className="absolute inset-4 border border-rose-gold/10 rounded-xl pointer-events-none" />
                        <div className="p-4 bg-rose-gold/5 border border-rose-gold/20 rounded-full text-rose-gold">
                          <Eye className="w-8 h-8 animate-pulse" />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-rose-gold mt-4 font-sans">
                          Mystery Card
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-zinc-600 mt-1 font-sans">
                          Click above to flip
                        </span>
                      </div>

                      {/* CARD BACK (Revealed Text - Rotated 180deg) */}
                      <div className="absolute inset-0 w-full h-full rounded-2xl border-2 border-sensual-pink/30 bg-sensual-dark flex flex-col items-center justify-center p-6 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div className="absolute inset-4 border border-sensual-pink/5 rounded-xl pointer-events-none" />
                        <span className="text-[9px] uppercase tracking-widest text-sensual-pink font-sans font-bold mb-3 bg-sensual-pink/10 px-2 py-0.5 rounded">
                          Connection Challenge
                        </span>
                        
                        <p className="text-sm font-serif text-zinc-200 text-center italic leading-relaxed px-2">
                          "{mysteryCard}"
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-full h-full rounded-2xl border border-white/5 bg-zinc-950/20 flex flex-col items-center justify-center p-6 text-center text-zinc-600 font-sans border-dashed gap-3">
                      <Star className="w-10 h-10 text-zinc-800 animate-pulse" />
                      <p className="text-xs leading-relaxed max-w-[180px]">
                        Draw a mystery connection challenge from the deck stack.
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
