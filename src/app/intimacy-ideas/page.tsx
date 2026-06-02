'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Compass, CheckCircle2, Bookmark, Flame, Clock, Sparkles, Link2 } from 'lucide-react';
import { fetchIntimacyIdeas, toggleFavorite, getFavorites, addToHistory, getHistory, getCoupleProfile } from '@/lib/db';
import { IntimacyIdea, SEED_IDEAS } from '@/lib/seedData';
import { getRecommendedIdeas, MoodType } from '@/lib/recommender';
import { publishActiveState, subscribeToActiveState } from '@/lib/sync';
import SensualCard from '@/components/SensualCard';
import confetti from 'canvas-confetti';

type CategoryType = 'All' | 'Romantic' | 'Date-Night' | 'Affection' | 'Connection' | 'Surprise' | 'Desire' | 'Comfort' | 'Atmosphere';

export default function IntimacyIdeas() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('All');
  const [ideas, setIdeas] = useState<IntimacyIdea[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  // Sync and Pairing States
  const [coupleId, setCoupleId] = useState<string>('');
  const [partnerActiveId, setPartnerActiveId] = useState<string | null>(null);
  const [partnerNotification, setPartnerNotification] = useState<string>('');

  // 1. Fetch Couple Profile & Onboard Sync Channel
  useEffect(() => {
    async function initSync() {
      const profile = await getCoupleProfile();
      if (profile?.id) {
        setCoupleId(profile.id);
        
        // Broadcast that we entered the Intimacy Activities page
        publishActiveState(profile.id, '/intimacy-ideas', null);

        // Subscribe to partner broadcasts
        const unsubscribe = subscribeToActiveState(profile.id, (payload) => {
          if (payload.activePath === '/intimacy-ideas') {
            if (payload.activeItemId) {
              const activeId = payload.activeItemId;
              setPartnerActiveId(activeId);
              
              const match = SEED_IDEAS.find(i => i.id === activeId);
              if (match) {
                if (payload.extra?.completed) {
                  // Partner marked it completed
                  if (!completedIds.includes(activeId)) {
                    setCompletedIds(prev => [...prev, activeId]);
                  }
                  setPartnerNotification(`Partner completed: ${match.title}!`);
                  
                  // Burst happy synchronized confetti!
                  confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6 },
                    colors: ['#ff2a6d', '#c5a880', '#1f0b33'],
                  });
                } else if (payload.extra?.uncompleted) {
                  setCompletedIds(prev => prev.filter(id => id !== activeId));
                  setPartnerNotification(`Partner unmarked: ${match.title}`);
                } else {
                  setPartnerNotification(`Partner is viewing: ${match.title}`);
                }
              }
            } else if (payload.extra?.category) {
              setActiveCategory(payload.extra.category);
              setPartnerNotification(`Partner switched feed to "${payload.extra.category}"`);
              setTimeout(() => setPartnerNotification(''), 4000);
            } else {
              setPartnerActiveId(null);
            }
          }
        });
        return () => unsubscribe();
      }
    }
    initSync();
  }, [positionsCheckPlaceholder()]); // Depend on general mount

  // Helper placeholder to satisfy compile rules
  function positionsCheckPlaceholder() {
    return completedIds.length;
  }

  // 2. Check for syncId in URL parameters (in case they joined from a dashboard toast)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const syncId = params.get('syncId');
      if (syncId) {
        setPartnerActiveId(syncId);
        setTimeout(() => {
          const el = document.getElementById(`idea-card-${syncId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      }
    }
  }, []);

  // 3. Load ideas
  useEffect(() => {
    loadIdeasAndState();
  }, [activeCategory]);

  const loadIdeasAndState = async () => {
    // Load favorites
    const favs = await getFavorites();
    setFavoriteIds(favs.filter(f => f.itemType === 'idea').map(f => f.itemId));

    // Load completed state from history
    const hist = await getHistory();
    setCompletedIds(hist.filter(h => h.itemType === 'idea' && h.completed).map(h => h.itemId));

    // Retrieve global couple mood
    const currentMood = (typeof window !== 'undefined'
      ? localStorage.getItem('pd_current_mood') || 'Chill'
      : 'Chill') as MoodType;

    // Retrieve scored ideas from recommendation engine
    const today = new Date();
    const recommended = getRecommendedIdeas({
      currentMood,
      history: hist,
      favorites: favs,
      currentTime: today,
    });

    // Filter recommended pool down to active category
    const pool = activeCategory === 'All'
      ? recommended
      : recommended.filter(idea => idea.category === activeCategory);

    setIdeas(pool);
  };

  const handleFavoriteToggle = async (id: string) => {
    const isFav = await toggleFavorite('idea', id);
    if (isFav) {
      setFavoriteIds(prev => [...prev, id]);
    } else {
      setFavoriteIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleCompleteToggle = async (id: string) => {
    const isAlreadyCompleted = completedIds.includes(id);
    
    if (!isAlreadyCompleted) {
      // Mark as completed, add to history
      await addToHistory('idea', id, true);
      setCompletedIds(prev => [...prev, id]);

      // Broadcast completion!
      if (coupleId) {
        publishActiveState(coupleId, '/intimacy-ideas', id, { completed: true });
      }

      // High impact reward confetti
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff2a6d', '#c5a880', '#1f0b33', '#ffffff'],
      });
    } else {
      // Remove completion state
      await addToHistory('idea', id, false);
      setCompletedIds(prev => prev.filter(item => item !== id));
      
      // Broadcast un-completion!
      if (coupleId) {
        publishActiveState(coupleId, '/intimacy-ideas', id, { uncompleted: true });
      }
    }
  };

  const handleCardFocus = (id: string) => {
    if (coupleId) {
      publishActiveState(coupleId, '/intimacy-ideas', id);
    }
  };

  const handleCategorySelect = (cat: CategoryType) => {
    setActiveCategory(cat);
    if (coupleId) {
      publishActiveState(coupleId, '/intimacy-ideas', null, { category: cat });
    }
  };

  const categories: CategoryType[] = ['All', 'Romantic', 'Date-Night', 'Affection', 'Connection', 'Surprise', 'Desire', 'Comfort', 'Atmosphere'];

  const getSpiceBadge = (spice: string) => {
    switch (spice) {
      case 'Spicy':
        return 'text-sensual-pink border-sensual-pink/20 bg-sensual-pink/5';
      case 'Medium':
        return 'text-purple-400 border-purple-500/20 bg-purple-500/5';
      case 'Mild':
      default:
        return 'text-rose-gold border-rose-gold/20 bg-rose-gold/5';
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
          <Heart className="w-6 h-6 fill-sensual-pink/10" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-gold-gradient">Intimacy Activities</h1>
        <p className="text-xs text-zinc-500 mt-1 max-w-[280px]">
          Spark romantic connection, shared exploration, and passionate challenges.
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

      {/* Category Horizontal Filter List */}
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

      {/* Main Grid View */}
      <div className="flex-1 flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {ideas.map((idea, idx) => {
            const isFav = favoriteIds.includes(idea.id);
            const isCompleted = completedIds.includes(idea.id);
            const isPartnerViewing = partnerActiveId === idea.id;

            return (
              <motion.div
                key={idea.id}
                id={`idea-card-${idea.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => handleCardFocus(idea.id)}
                className="relative"
              >
                {/* Active Partner Border Glow */}
                {isPartnerViewing && (
                  <div className="absolute inset-0 bg-sensual-purple/5 border-2 border-sensual-purple rounded-3xl animate-pulse -z-10 pointer-events-none" />
                )}

                <SensualCard
                  glowColor={isPartnerViewing ? 'purple' : isCompleted ? 'gold' : isFav ? 'pink' : 'purple'}
                  className={`p-5 border transition-all duration-500 relative ${
                    isPartnerViewing ? 'border-sensual-purple/50 bg-sensual-purple/5' :
                    isCompleted ? 'opacity-70 bg-sensual-purple/5 border-rose-gold/20' : 'bg-black/20 border-white/5'
                  }`}
                  hoverScale={false}
                >
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Category and Spice badges */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-sans">
                          {idea.category}
                        </span>
                        {isPartnerViewing && (
                          <span className="px-1.5 py-0.5 bg-sensual-purple/20 border border-sensual-purple/30 rounded text-[7px] font-sans font-bold uppercase tracking-wider text-purple-300 animate-pulse">
                            Partner Focused
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${getSpiceBadge(idea.spiceLevel)}`}>
                        {idea.spiceLevel}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl font-serif font-bold ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {idea.title}
                    </h3>

                    {/* Description */}
                    <p className={`text-xs font-sans leading-relaxed ${isCompleted ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {idea.description}
                    </p>

                    {/* Footer Data Metrics */}
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-sans">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-rose-gold/60" />
                          {idea.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-sensual-pink/60" />
                          {idea.sensoryFocus}
                        </span>
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* Favorite button */}
                        <button
                          onClick={() => handleFavoriteToggle(idea.id)}
                          className={`p-2 rounded-xl border transition-all duration-300 ${
                            isFav ? 'bg-sensual-pink/10 border-sensual-pink/40 text-sensual-pink' : 'bg-transparent border-white/5 text-zinc-600 hover:text-zinc-400'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* Complete button */}
                        <button
                          onClick={() => handleCompleteToggle(idea.id)}
                          className={`
                            px-3 py-2
                            rounded-xl
                            border
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wider
                            flex items-center gap-1.5
                            transition-all duration-300
                            ${
                              isCompleted
                                ? 'bg-rose-gold/10 border-rose-gold text-rose-gold'
                                : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-sensual-pink/20 hover:text-zinc-200'
                            }
                          `}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isCompleted ? 'COMPLETED' : 'MARK DONE'}
                        </button>
                      </div>
                    </div>
                  </div>
                </SensualCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {ideas.length === 0 && (
          <div className="text-center py-12 text-zinc-600 text-sm font-sans flex flex-col items-center gap-2">
            <Sparkles className="w-8 h-8 text-zinc-700 animate-pulse" />
            No activities available.
          </div>
        )}
      </div>
    </div>
  );
}
