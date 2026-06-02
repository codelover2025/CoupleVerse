'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star, BookOpen, Clock, Heart, Bookmark, Edit3, Save, X, Link2 } from 'lucide-react';
import { fetchPositions, toggleFavorite, getFavorites, getCoupleProfile } from '@/lib/db';
import { Position } from '@/lib/seedData';
import { getRecommendedPositions, MoodType } from '@/lib/recommender';
import { publishActiveState, subscribeToActiveState } from '@/lib/sync';
import SensualCard from '@/components/SensualCard';
import Silhouette from '@/components/Silhouette';

type FilterDifficultyType = 'All' | 'Beginner' | 'Comfortable' | 'Advanced';

export default function PositionsLibrary() {
  const [difficultyFilter, setDifficultyFilter] = useState<FilterDifficultyType>('All');
  const [positions, setPositions] = useState<Position[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

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
        
        // Broadcast that we entered the Positions Library
        publishActiveState(profile.id, '/positions', null);

        // Subscribe to partner broadcasts
        const unsubscribe = subscribeToActiveState(profile.id, (payload) => {
          if (payload.activePath === '/positions') {
            if (payload.activeItemId) {
              setPartnerActiveId(payload.activeItemId);
              // Find position name
              const pos = positions.find(p => p.id === payload.activeItemId);
              if (pos) {
                setPartnerNotification(`Partner is viewing: ${pos.name}`);
              }
            } else if (payload.extra?.filter) {
              setDifficultyFilter(payload.extra.filter);
              setPartnerNotification(`Partner filtered to "${payload.extra.filter}" positions`);
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
  }, [positions]);

  // 2. Check for syncId in URL parameters (in case they joined from a dashboard toast)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const syncId = params.get('syncId');
      if (syncId) {
        setPartnerActiveId(syncId);
        setTimeout(() => {
          // Scroll the synced element into view
          const el = document.getElementById(`position-card-${syncId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      }
    }
  }, []);

  // 3. Load positions and favorites
  useEffect(() => {
    loadPositionsAndFavorites();
  }, [difficultyFilter]);

  const loadPositionsAndFavorites = async () => {
    // Load favorites
    const favs = await getFavorites();
    setFavoriteIds(favs.filter(f => f.itemType === 'position').map(f => f.itemId));

    // Load personal notes
    if (typeof window !== 'undefined') {
      const savedNotes = localStorage.getItem('pd_position_notes');
      setPersonalNotes(savedNotes ? JSON.parse(savedNotes) : {});
    }

    // Retrieve global couple mood
    const currentMood = (typeof window !== 'undefined'
      ? localStorage.getItem('pd_current_mood') || 'Chill'
      : 'Chill') as MoodType;

    // Get recommended positions sorted by mood score
    const recommended = getRecommendedPositions({
      currentMood,
      favorites: favs,
    });

    const filtered = difficultyFilter === 'All'
      ? recommended
      : recommended.filter(p => p.difficulty === difficultyFilter);

    setPositions(filtered);
  };

  const handleFavoriteToggle = async (id: string) => {
    const isFav = await toggleFavorite('position', id);
    if (isFav) {
      setFavoriteIds(prev => [...prev, id]);
    } else {
      setFavoriteIds(prev => prev.filter(item => item !== id));
    }
  };

  const startEditingNote = (id: string) => {
    setEditingId(id);
    setNoteInput(personalNotes[id] || '');
  };

  const saveNote = (id: string) => {
    const updated = { ...personalNotes, [id]: noteInput };
    setPersonalNotes(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pd_position_notes', JSON.stringify(updated));
    }
    setEditingId(null);
  };

  const handleCardFocus = (id: string) => {
    if (coupleId) {
      publishActiveState(coupleId, '/positions', id);
    }
  };

  const handleFilterSelect = (filter: FilterDifficultyType) => {
    setDifficultyFilter(filter);
    if (coupleId) {
      publishActiveState(coupleId, '/positions', null, { filter });
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Advanced':
        return 'text-sensual-pink border-sensual-pink/20 bg-sensual-pink/5';
      case 'Comfortable':
        return 'text-purple-400 border-purple-500/20 bg-purple-500/5';
      case 'Beginner':
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
          <Flame className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-gold-gradient">Position Library</h1>
        <p className="text-xs text-zinc-500 mt-1 max-w-[280px]">
          Tasteful and artful illustrations guiding Kama Sutra posture, pacing, and mechanics.
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

      {/* Difficulty Filter Selector */}
      <div className="flex justify-between items-center gap-1.5 p-1 bg-[#120818]/60 border border-white/5 rounded-2xl mb-6">
        {(['All', 'Beginner', 'Comfortable', 'Advanced'] as FilterDifficultyType[]).map(diff => {
          const isActive = difficultyFilter === diff;
          return (
            <button
              key={diff}
              onClick={() => handleFilterSelect(diff)}
              className={`
                flex-1 py-2
                rounded-xl
                text-xs
                font-semibold
                transition-all duration-300
                ${
                  isActive
                    ? 'bg-gradient-to-r from-sensual-pink to-velvet-crimson text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              {diff}
            </button>
          );
        })}
      </div>

      {/* Grid of Position Cards */}
      <div className="flex-1 flex flex-col gap-5">
        <AnimatePresence mode="popLayout">
          {positions.map((pos, idx) => {
            const isFav = favoriteIds.includes(pos.id);
            const hasNote = !!personalNotes[pos.id];
            const isEditing = editingId === pos.id;
            const isPartnerViewing = partnerActiveId === pos.id;

            return (
              <motion.div
                key={pos.id}
                id={`position-card-${pos.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => handleCardFocus(pos.id)}
                className="relative"
              >
                {/* Synced selection background glow */}
                {isPartnerViewing && (
                  <div className="absolute inset-0 bg-sensual-purple/5 border-2 border-sensual-purple rounded-3xl animate-pulse -z-10 pointer-events-none" />
                )}

                <SensualCard 
                  glowColor={isPartnerViewing ? 'purple' : isFav ? 'pink' : 'purple'} 
                  className={`bg-black/25 border transition-all duration-300 ${
                    isPartnerViewing ? 'border-sensual-purple/50 bg-sensual-purple/5' : 'border-white/5'
                  }`} 
                  hoverScale={false}
                >
                  {/* Art Panel */}
                  <div className="relative w-full py-6 bg-gradient-to-b from-[#13071b]/60 to-transparent flex items-center justify-center border-b border-white/5">
                    {isPartnerViewing && (
                      <div className="absolute top-4 left-4 flex items-center gap-1 px-2 py-0.5 bg-sensual-purple/30 border border-sensual-purple/40 rounded text-[8px] font-sans font-bold uppercase tracking-wider text-purple-300 animate-pulse">
                        <Link2 className="w-2.5 h-2.5" /> Partner Viewing
                      </div>
                    )}
                    
                    <Silhouette type={pos.silhouetteType} />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFavoriteToggle(pos.id); }}
                      className={`absolute top-4 right-4 p-2.5 rounded-xl border transition-all duration-300 ${
                        isFav ? 'bg-sensual-pink/15 border-sensual-pink/40 text-sensual-pink' : 'bg-[#08030c]/80 border-white/5 text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Text Details */}
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-serif text-zinc-200 font-bold">{pos.name}</h3>
                      <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border ${getDifficultyBadge(pos.difficulty)}`}>
                        {pos.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {pos.description}
                    </p>

                    {/* Pro tip / Why Try */}
                    <div className="p-3.5 bg-rose-gold/5 border border-rose-gold/10 rounded-xl">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-rose-gold flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3 text-rose-gold animate-pulse" /> Kama Sutra Benefit
                      </span>
                      <p className="text-[11px] text-zinc-300 leading-normal italic font-serif">
                        "{pos.whyTry}"
                      </p>
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-sans py-2 border-t border-b border-white/5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-gold/60" />
                        Pace: {pos.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-sensual-pink/60" />
                        Energy: {pos.energyLevel}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-purple-400/60" />
                        Focus: {pos.sensoryFocus}
                      </span>
                    </div>

                    {/* Personal Notes Row */}
                    <div className="mt-1">
                      {isEditing ? (
                        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                          <textarea
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="Add your private feedback..."
                            className="w-full px-3 py-2 bg-sensual-dark rounded-lg border border-sensual-pink/30 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-sensual-pink/20 h-16 font-sans resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-[10px] font-semibold text-zinc-500 uppercase flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                            <button
                              onClick={() => saveNote(pos.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-sensual-pink/15 border border-sensual-pink/30 text-[10px] font-semibold text-sensual-pink uppercase flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start gap-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex-1">
                            {hasNote ? (
                              <p className="text-[11px] text-purple-300 font-sans leading-normal italic bg-purple-500/5 p-2 rounded-lg border border-purple-500/10">
                                <span className="font-semibold text-[9px] uppercase tracking-wider block text-purple-400/80 mb-0.5">Private Note</span>
                                "{personalNotes[pos.id]}"
                              </p>
                            ) : (
                              <span className="text-[10px] text-zinc-600 font-sans italic">No custom notes yet.</span>
                            )}
                          </div>
                          <button
                            onClick={() => startEditingNote(pos.id)}
                            className="p-1.5 bg-zinc-950 border border-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all"
                            title="Edit notes"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </SensualCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
