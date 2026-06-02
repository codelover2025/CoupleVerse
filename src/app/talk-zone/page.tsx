'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, Bookmark, RefreshCw, Sparkles, Star, Link2 } from 'lucide-react';
import { fetchPrompts, toggleFavorite, getFavorites, addToHistory, getHistory, clearHistory, getCoupleProfile } from '@/lib/db';
import { Prompt, SEED_PROMPTS } from '@/lib/seedData';
import { getRecommendedPrompts, MoodType } from '@/lib/recommender';
import { publishActiveState, subscribeToActiveState } from '@/lib/sync';
import ScratchCard from '@/components/ScratchCard';
import SensualCard from '@/components/SensualCard';
import confetti from 'canvas-confetti';

type CategoryType = 'All' | 'Romantic' | 'Deep' | 'Flirty' | 'Fun' | 'Late-night' | 'Erotic' | 'Desire' | 'Trust';

export default function TalkZone() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('All');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [scratchKey, setScratchKey] = useState<number>(0);
  const [deckCompleted, setDeckCompleted] = useState(false);
  const [historyIds, setHistoryIds] = useState<string[]>([]);

  // Sync and Pairing States
  const [coupleId, setCoupleId] = useState<string>('');
  const [isSyncedSelection, setIsSyncedSelection] = useState(false);
  const [partnerNotification, setPartnerNotification] = useState<string>('');

  // 1. Fetch Couple Profile & Onboard Sync Channel
  useEffect(() => {
    async function initSync() {
      const profile = await getCoupleProfile();
      if (profile?.id) {
        setCoupleId(profile.id);
        
        // Broadcast that we entered the Talk Zone
        publishActiveState(profile.id, '/talk-zone', null);

        // Subscribe to partner broadcasts
        const unsubscribe = subscribeToActiveState(profile.id, (payload) => {
          if (payload.activePath === '/talk-zone') {
            if (payload.activeItemId) {
              const matchedPrompt = SEED_PROMPTS.find(p => p.id === payload.activeItemId);
              if (matchedPrompt) {
                // If it's a new prompt, update and refresh scratch
                setCurrentPrompt(matchedPrompt);
                setIsSyncedSelection(true);
                setScratchKey(prev => prev + 1);
                
                // Show notification badge
                setPartnerNotification(payload.extra?.revealed ? 'Partner revealed this card!' : 'Partner selected a card!');
                
                if (payload.extra?.revealed) {
                  // Partner revealed it, play matching confetti!
                  confetti({
                    particleCount: 25,
                    spread: 50,
                    origin: { y: 0.7 },
                    colors: ['#ff2a6d', '#8a2be2', '#c5a880'],
                  });
                }
                
                // Reset sync alerts after 6 seconds
                setTimeout(() => {
                  setIsSyncedSelection(false);
                  setPartnerNotification('');
                }, 6000);
              }
            } else if (payload.extra?.category) {
              // Partner changed category
              setActiveCategory(payload.extra.category);
              setPartnerNotification(`Partner switched category to "${payload.extra.category}"`);
              setTimeout(() => setPartnerNotification(''), 4000);
            }
          }
        });
        return () => unsubscribe();
      }
    }
    initSync();
  }, []);

  // 2. Check for syncId in URL parameters (in case they joined from a dashboard toast)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const syncId = params.get('syncId');
      if (syncId) {
        const matchedPrompt = SEED_PROMPTS.find(p => p.id === syncId);
        if (matchedPrompt) {
          setCurrentPrompt(matchedPrompt);
          setIsSyncedSelection(true);
          setPartnerNotification('Loaded partner\'s sync card!');
          setTimeout(() => {
            setIsSyncedSelection(false);
            setPartnerNotification('');
          }, 5000);
        }
      }
    }
  }, []);

  // 3. Load favorites and next recommended prompt
  useEffect(() => {
    loadFavoritesAndPrompt();
  }, [activeCategory]);

  const loadFavoritesAndPrompt = async () => {
    // Load favorites
    const favs = await getFavorites();
    setFavoriteIds(favs.filter(f => f.itemType === 'prompt').map(f => f.itemId));

    // Load seen history
    const hist = await getHistory();
    const seenIds = hist.filter(h => h.itemType === 'prompt').map(h => h.itemId);
    setHistoryIds(seenIds);

    // Retrieve global couple mood
    const currentMood = (typeof window !== 'undefined'
      ? localStorage.getItem('pd_current_mood') || 'Chill'
      : 'Chill') as MoodType;

    // Retrieve scored prompts from recommendation engine
    const today = new Date();
    const recommended = getRecommendedPrompts({
      currentMood,
      history: hist,
      favorites: favs,
      currentTime: today,
    });

    // Filter recommended pool down to active category
    const pool = activeCategory === 'All'
      ? recommended
      : recommended.filter(p => p.category === activeCategory);

    if (pool.length > 0) {
      setDeckCompleted(false);
      // Pick from the top 3 recommendations randomly to maintain surprise
      const limit = Math.min(3, pool.length);
      const randomIndex = Math.floor(Math.random() * limit);
      const selectedPrompt = pool[randomIndex];
      
      setCurrentPrompt(selectedPrompt);

      // Broadcast new card selected (unrevealed state)
      if (coupleId) {
        publishActiveState(coupleId, '/talk-zone', selectedPrompt.id);
      }
    } else {
      const totalInCategory = SEED_PROMPTS.filter(sp => activeCategory === 'All' || sp.category === activeCategory);
      if (totalInCategory.length > 0) {
        setDeckCompleted(true);
      }
      setCurrentPrompt(null);
    }
  };

  const handleReveal = async () => {
    if (currentPrompt) {
      await addToHistory('prompt', currentPrompt.id);
      
      // Broadcast revealed state so partner's device also trigger confetti/reveal!
      if (coupleId) {
        publishActiveState(coupleId, '/talk-zone', currentPrompt.id, { revealed: true });
      }

      // Spark gentle stars celebration
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#c5a880', '#ff2a6d'],
      });
    }
  };

  const handleNextPrompt = async () => {
    setScratchKey(prev => prev + 1);
    await loadFavoritesAndPrompt();
  };

  const handleResetDeck = async () => {
    await clearHistory();
    setDeckCompleted(false);
    setScratchKey(prev => prev + 1);
    await loadFavoritesAndPrompt();
  };

  const handleFavoriteToggle = async () => {
    if (!currentPrompt) return;
    const isFav = await toggleFavorite('prompt', currentPrompt.id);
    if (isFav) {
      setFavoriteIds(prev => [...prev, currentPrompt.id]);
    } else {
      setFavoriteIds(prev => prev.filter(id => id !== currentPrompt.id));
    }
  };

  const handleCategorySelect = (cat: CategoryType) => {
    setActiveCategory(cat);
    if (coupleId) {
      publishActiveState(coupleId, '/talk-zone', null, { category: cat });
    }
  };

  const categories: CategoryType[] = ['All', 'Romantic', 'Deep', 'Flirty', 'Fun', 'Late-night', 'Erotic', 'Desire', 'Trust'];

  const getSpiceStyle = (cat: string) => {
    switch (cat) {
      case 'Erotic':
      case 'Desire':
        return 'text-sensual-pink border-sensual-pink/20 bg-sensual-pink/5';
      case 'Flirty':
      case 'Late-night':
        return 'text-purple-400 border-purple-500/20 bg-purple-500/5';
      case 'Romantic':
      case 'Deep':
      case 'Trust':
        return 'text-rose-gold border-rose-gold/20 bg-rose-gold/5';
      default:
        return 'text-zinc-400 border-white/5 bg-white/5';
    }
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

        <div className="p-3 bg-sensual-purple/10 border border-sensual-purple/20 rounded-full mb-3 text-sensual-pink">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-gold-gradient">The Talk Zone</h1>
        <p className="text-xs text-zinc-500 mt-1 max-w-[280px]">
          Intimate and playful conversation starters designed to deepen your bond.
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

      {/* Category Horizontal Scrolling Container */}
      <div className="w-full overflow-x-auto pb-4 scrollbar-none flex gap-2 mb-6">
        {categories.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`
                px-4 py-2
                rounded-full
                text-xs
                font-sans
                font-semibold
                border
                whitespace-nowrap
                transition-all duration-300
                ${
                  isActive
                    ? 'bg-gradient-to-r from-sensual-pink to-velvet-crimson border-sensual-pink/30 text-white shadow-md'
                    : 'bg-[#120818]/60 border-white/5 text-zinc-400 hover:text-zinc-200'
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Action Stage */}
      <div className="flex-1 flex flex-col justify-center items-center my-4 min-h-[300px]">
        <AnimatePresence mode="wait">
          {deckCompleted ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full text-center"
            >
              <SensualCard glowColor="gold" className="p-8 border-rose-gold/20">
                <Star className="w-12 h-12 text-rose-gold mx-auto mb-4 animate-spin" style={{ animationDuration: '8s' }} />
                <h3 className="text-2xl font-serif text-gold-gradient font-bold mb-2">Category Fully Explored</h3>
                <p className="text-zinc-400 text-sm font-sans leading-relaxed mb-6">
                  You have revealed and discussed all {activeCategory === 'All' ? '' : `"${activeCategory}"`} conversation cards! To browse through them again:
                </p>
                <button
                  onClick={handleResetDeck}
                  className="w-full bg-gradient-to-r from-sensual-pink to-velvet-crimson text-white py-3.5 rounded-xl font-serif font-bold text-sm tracking-widest shadow-md"
                >
                  RESET DECK ROTATION
                </button>
              </SensualCard>
            </motion.div>
          ) : currentPrompt ? (
            <motion.div
              key={currentPrompt.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col gap-6"
            >
              {/* Scratch surface */}
              <div className="w-full aspect-[16/10] relative">
                {isSyncedSelection && (
                  <div className="absolute inset-0 bg-sensual-purple/10 border-2 border-sensual-purple rounded-3xl -z-10 animate-pulse pointer-events-none" />
                )}
                
                <ScratchCard
                  keyTrigger={scratchKey.toString()}
                  onReveal={handleReveal}
                  overlayText="Scratch slowly to reveal topic..."
                  content={
                    <div className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border mb-4 inline-block ${getSpiceStyle(currentPrompt.category)}`}>
                        {currentPrompt.category}
                      </span>
                      <p className="text-xl sm:text-2xl font-serif text-zinc-100 italic leading-relaxed">
                        "{currentPrompt.question}"
                      </p>
                    </div>
                  }
                />
              </div>

              {/* Deck actions */}
              <div className="flex gap-4 w-full">
                {/* Save favorite */}
                <button
                  onClick={handleFavoriteToggle}
                  className={`
                    p-4
                    rounded-2xl
                    border
                    flex items-center justify-center
                    transition-all duration-300
                    ${
                      favoriteIds.includes(currentPrompt.id)
                        ? 'bg-rose-gold/10 border-rose-gold text-rose-gold'
                        : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300'
                    }
                  `}
                >
                  <Bookmark className="w-5 h-5 fill-current" />
                </button>

                {/* Draw next */}
                <button
                  onClick={handleNextPrompt}
                  className="flex-1 bg-gradient-to-r from-sensual-pink to-velvet-crimson text-white rounded-2xl py-4 font-serif font-bold text-base tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,42,109,0.25)] hover:shadow-[0_0_25px_rgba(255,42,109,0.4)] active:scale-[0.98] transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  DRAW NEXT CARD
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-sm font-sans flex flex-col items-center gap-2">
              <Sparkles className="w-8 h-8 text-zinc-700 animate-pulse" />
              No prompts available.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
