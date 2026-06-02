'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, AlertCircle, Heart, Star, Zap, UserX, Link2, Copy, Check, QrCode } from 'lucide-react';
import { getCoupleProfile, CoupleProfile, getFavorites, getHistory, clearHistory, joinCoupleSession } from '@/lib/db';
import { SEED_PROMPTS, SEED_IDEAS, SEED_POSITIONS } from '@/lib/seedData';
import { getRecommendedPrompts, getRecommendedIdeas, getRecommendedPositions } from '@/lib/recommender';
import { subscribeToActiveState, ActiveStatePayload } from '@/lib/sync';
import SensualCard from '@/components/SensualCard';

type MoodType = 'Chill' | 'Intimate' | 'Playful' | 'Sensual';

interface DailySpark {
  title: string;
  category: string;
  content: string;
  actionText: string;
  actionUrl: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<MoodType>('Chill');
  const [anniversaryDays, setAnniversaryDays] = useState<number | null>(null);
  const [dailySpark, setDailySpark] = useState<DailySpark | null>(null);
  const [surpriseItem, setSurpriseItem] = useState<{ title: string; desc: string; type: string } | null>(null);
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);

  // Sync and Pairing States
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [partnerActiveState, setPartnerActiveState] = useState<ActiveStatePayload | null>(null);
  const [activeSyncToast, setActiveSyncToast] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await getCoupleProfile();
      if (!data) {
        router.push('/');
        return;
      }
      setProfile(data);
      setIsLoading(false);

      // Compute anniversary days
      if (data.anniversaryDate) {
        const anniversary = new Date(data.anniversaryDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - anniversary.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setAnniversaryDays(diffDays);
      }
    }
    loadData();
  }, [router]);

  // Recalculate Daily Spark dynamically when mood changes
  useEffect(() => {
    if (profile) {
      generateDailySpark();
    }
  }, [selectedMood, profile]);

  // Real-time synchronization subscription
  useEffect(() => {
    if (profile?.id) {
      const unsubscribe = subscribeToActiveState(profile.id, (payload) => {
        setPartnerActiveState(payload);
        setActiveSyncToast(true);
        
        // Hide the toast after 12 seconds automatically
        const timer = setTimeout(() => {
          setActiveSyncToast(false);
        }, 12000);
        return () => clearTimeout(timer);
      });
      return () => unsubscribe();
    }
  }, [profile?.id]);

  const generateDailySpark = async () => {
    const favs = await getFavorites();
    const hist = await getHistory();
    const today = new Date();

    const recommendedPrompts = getRecommendedPrompts({
      currentMood: selectedMood,
      history: hist,
      favorites: favs,
      currentTime: today,
    });

    const recommendedIdeas = getRecommendedIdeas({
      currentMood: selectedMood,
      history: hist,
      favorites: favs,
      currentTime: today,
    });

    const day = today.getDate();
    // Alternating between prompt spark and activity challenge spark
    if (day % 2 === 0 && recommendedPrompts.length > 0) {
      const topPrompt = recommendedPrompts[day % Math.min(5, recommendedPrompts.length)];
      setDailySpark({
        title: 'Conversation Starter',
        category: topPrompt.category,
        content: topPrompt.question,
        actionText: 'Go to Talk Zone',
        actionUrl: '/talk-zone',
      });
    } else if (recommendedIdeas.length > 0) {
      const topIdea = recommendedIdeas[day % Math.min(5, recommendedIdeas.length)];
      setDailySpark({
        title: 'Action Challenge',
        category: topIdea.category,
        content: topIdea.description,
        actionText: 'Intimacy Activities',
        actionUrl: '/intimacy-ideas',
      });
    } else {
      setDailySpark({
        title: 'Sensual Connection',
        category: 'Affection',
        content: 'Hold your partner close in a slow, lingering hug for 2 full minutes in silence.',
        actionText: 'Intimacy Activities',
        actionUrl: '/intimacy-ideas',
      });
    }
  };

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pd_current_mood', mood);
    }
  };

  const handleSurpriseMe = async () => {
    const favs = await getFavorites();
    const hist = await getHistory();
    const today = new Date();

    const recPrompts = getRecommendedPrompts({
      currentMood: selectedMood,
      history: hist,
      favorites: favs,
      currentTime: today,
    });

    const recIdeas = getRecommendedIdeas({
      currentMood: selectedMood,
      history: hist,
      favorites: favs,
      currentTime: today,
    });

    const recPositions = getRecommendedPositions({
      currentMood: selectedMood,
      favorites: favs,
    });

    const pool: { title: string; desc: string; type: string }[] = [];

    // Collate highest recommendation options
    if (recPrompts.length > 0) {
      recPrompts.slice(0, 4).forEach((p) => {
        pool.push({ title: `Prompt: ${p.category}`, desc: p.question, type: 'prompt' });
      });
    }
    if (recIdeas.length > 0) {
      recIdeas.slice(0, 4).forEach((i) => {
        pool.push({ title: `Intimacy Idea: ${i.title}`, desc: i.description, type: 'idea' });
      });
    }
    if (recPositions.length > 0) {
      recPositions.slice(0, 4).forEach((pos) => {
        pool.push({ title: `Kamasutra Position: ${pos.name}`, desc: pos.description, type: 'position' });
      });
    }

    if (pool.length === 0) {
      pool.push({
        title: 'Tender Back Trace',
        desc: 'Place a trace of slow feather-light touch letters along your partner\'s bare back, letting them guess.',
        type: 'idea',
      });
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    setSurpriseItem(pool[randomIndex]);
    setShowSurpriseModal(true);
  };

  const handleResetProfile = async () => {
    if (confirm("Are you sure you want to clear your local private profile? This deletes all data and favorites.")) {
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      await clearHistory();
      router.push('/setup');
    }
  };

  const handleCopyCode = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleMergeSessions = async () => {
    if (!pairingCodeInput || pairingCodeInput.trim() === profile?.id) return;
    setIsMerging(true);
    try {
      const mergedProfile = await joinCoupleSession(pairingCodeInput.trim());
      if (mergedProfile) {
        setProfile(mergedProfile);
        setShowPairingModal(false);
        setPairingCodeInput('');
      }
    } catch (err) {
      alert("Failed to pair with that code. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-sensual-dark">
        <Heart className="w-10 h-10 text-sensual-pink animate-pulse" />
      </div>
    );
  }

  const moodCards = [
    { type: 'Chill' as MoodType, label: 'Chill & Relaxed', desc: 'Cozy, quiet, and tender dialogues.', icon: Heart, glow: 'purple' },
    { type: 'Intimate' as MoodType, label: 'Vulnerable & Deep', desc: 'Deep-dives into fears, dreams, and bonds.', icon: Star, glow: 'gold' },
    { type: 'Playful' as MoodType, label: 'Fun & Flirty', desc: 'Silly, energetic, and laughing dares.', icon: Zap, glow: 'pink' },
    { type: 'Sensual' as MoodType, label: 'Sensual & Spicy', desc: 'Slow, heated, erotic discoveries.', icon: Sparkles, glow: 'pink' },
  ];

  return (
    <div className="flex-1 flex flex-col px-6 py-8 relative">
      {/* Top Welcome & Pairing Status Bar */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-gold-gradient">
            {profile?.partner1Name} & {profile?.partner2Name}
          </h2>
          {anniversaryDays !== null && (
            <p className="text-[10px] tracking-wider text-zinc-500 uppercase font-sans mt-0.5">
              Partners in connection — {anniversaryDays} days together
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Live Link Heartbeat Status Widget */}
          <button
            onClick={() => setShowPairingModal(true)}
            title="Manage Partner Connection Link"
            className="flex items-center gap-1.5 px-3 py-2 bg-sensual-purple/10 border border-white/5 rounded-xl hover:bg-sensual-pink/10 hover:border-sensual-pink/20 transition-all group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sensual-pink opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sensual-pink"></span>
            </span>
            <span className="text-[10px] uppercase font-bold text-rose-gold tracking-widest font-sans group-hover:text-sensual-pink transition-all">
              Live Link
            </span>
          </button>

          <button
            onClick={handleResetProfile}
            title="Reset Sanctuary profile"
            className="p-2.5 bg-sensual-purple/10 border border-white/5 rounded-xl hover:bg-sensual-pink/10 hover:border-sensual-pink/20 transition-all text-zinc-500 hover:text-sensual-pink"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mood Selector Grid */}
      <div className="mb-8">
        <h3 className="text-sm font-serif uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5 font-bold">
          <Compass className="w-4 h-4 text-sensual-pink" /> Set Your Shared Mood
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {moodCards.map((card) => {
            const isSelected = selectedMood === card.type;
            const Icon = card.icon;

            return (
              <SensualCard
                key={card.type}
                glowColor={isSelected ? (card.glow as 'pink' | 'gold' | 'purple' | 'none') : 'none'}
                onClick={() => handleMoodSelect(card.type)}
                className={`p-4 border transition-all duration-300 ${
                  isSelected ? 'bg-sensual-purple/20 border-sensual-pink/30' : 'border-white/5 hover:border-white/10 bg-black/20'
                }`}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'text-sensual-pink bg-sensual-pink/10' : 'text-zinc-600 bg-white/5'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-serif font-semibold mt-1 ${isSelected ? 'text-zinc-200' : 'text-zinc-400'}`}>
                    {card.label}
                  </span>
                  <span className="text-[10px] text-zinc-600 leading-normal font-sans">
                    {card.desc}
                  </span>
                </div>
              </SensualCard>
            );
          })}
        </div>
      </div>

      {/* Daily Spark Panel */}
      {dailySpark && (
        <div className="mb-8">
          <h3 className="text-sm font-serif uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5 font-bold">
            <Star className="w-4 h-4 text-rose-gold animate-spin" style={{ animationDuration: '6s' }} /> Your Daily Spark
          </h3>

          <SensualCard glowColor="gold" className="p-5 border border-rose-gold/15 bg-gradient-to-br from-sensual-purple/10 to-transparent">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-gold bg-rose-gold/10 px-2 py-0.5 rounded">
                {dailySpark.title}
              </span>
              <span className="text-[10px] text-zinc-500 font-sans italic">{dailySpark.category}</span>
            </div>
            
            <p className="text-zinc-200 text-sm font-serif italic mb-4 leading-relaxed">
              "{dailySpark.content}"
            </p>

            <button
              onClick={() => router.push(dailySpark.actionUrl)}
              className="w-full bg-rose-gold/10 hover:bg-rose-gold/20 text-rose-gold border border-rose-gold/20 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all font-sans"
            >
              {dailySpark.actionText}
            </button>
          </SensualCard>
        </div>
      )}

      {/* "Surprise Me" Sensual trigger */}
      <div className="mt-auto pb-4">
        <SensualCard glowColor="pink" className="p-1.5" hoverScale={false}>
          <button
            onClick={handleSurpriseMe}
            className="w-full bg-gradient-to-r from-sensual-pink via-velvet-crimson to-sensual-purple py-4 rounded-xl text-white font-serif font-bold text-base tracking-widest shadow-[0_0_15px_rgba(255,42,109,0.2)] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
            SURPRISE ME ({selectedMood.toUpperCase()})
          </button>
        </SensualCard>
      </div>

      {/* Dynamic Surprise Modal Overlay */}
      <AnimatePresence>
        {showSurpriseModal && surpriseItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[380px]"
            >
              <SensualCard glowColor="pink" className="p-6 border border-sensual-pink/30 bg-sensual-dark relative">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-sensual-pink/10 border border-sensual-pink/20 rounded-full mb-3 text-sensual-pink animate-bounce">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">
                    Your Tailored Surprise
                  </span>
                  <h4 className="text-xl font-serif text-gold-gradient font-bold mb-4">
                    {surpriseItem.title}
                  </h4>
                  <p className="text-zinc-200 text-sm font-sans italic leading-relaxed mb-6">
                    "{surpriseItem.desc}"
                  </p>
                  
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowSurpriseModal(false)}
                      className="flex-1 py-3 bg-zinc-900 border border-white/5 rounded-xl text-xs text-zinc-400 font-semibold uppercase tracking-wider transition-all"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowSurpriseModal(false);
                        if (surpriseItem.type === 'prompt') router.push('/talk-zone');
                        if (surpriseItem.type === 'position') router.push('/positions');
                        if (surpriseItem.type === 'idea') router.push('/intimacy-ideas');
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-sensual-pink to-velvet-crimson text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                      Explore
                    </button>
                  </div>
                </div>
              </SensualCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Live Link Pairing Modal */}
      <AnimatePresence>
        {showPairingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-[380px]"
            >
              <SensualCard glowColor="purple" className="p-6 border border-sensual-purple/30 bg-sensual-dark relative" hoverScale={false}>
                <div className="flex flex-col items-center">
                  <div className="p-2.5 bg-sensual-purple/10 border border-sensual-purple/20 rounded-full mb-3 text-purple-400">
                    <Link2 className="w-5 h-5 animate-pulse" />
                  </div>
                  
                  <h3 className="text-xl font-serif text-gold-gradient font-bold mb-1">Lover's Sync Center</h3>
                  <p className="text-[11px] text-zinc-500 font-sans text-center mb-6 leading-relaxed">
                    Link separate devices to instantly view active cards, wheel spins, and private positions together in real-time.
                  </p>

                  {/* QR Code Segment */}
                  {profile?.id && (
                    <div className="flex flex-col items-center bg-white/5 border border-white/5 p-4 rounded-2xl mb-6 relative group overflow-hidden">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&color=255-42-109&bgcolor=7-3-12&data=${encodeURIComponent(
                          (typeof window !== 'undefined' ? window.location.origin : '') + '/setup?code=' + profile.id
                        )}`}
                        alt="Pairing QR Code"
                        className="w-32 h-32 rounded-xl object-contain border border-white/5 bg-[#07030c] shadow-[0_0_10px_rgba(255,42,109,0.15)]"
                      />
                      <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-sans mt-2 flex items-center gap-1">
                        <QrCode className="w-3 h-3 text-sensual-pink" /> Scan to Pair Instantly
                      </span>
                    </div>
                  )}

                  {/* Pairing Code Display */}
                  <div className="w-full bg-[#07030c] border border-white/5 p-3 rounded-xl flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-sans font-bold">Your Pairing Code</span>
                      <span className="text-sm font-mono text-zinc-300 font-bold tracking-widest uppercase">{profile?.id}</span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2.5 bg-sensual-purple/10 border border-white/5 rounded-lg text-zinc-400 hover:text-sensual-pink transition-all"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Connect input fields */}
                  <div className="w-full flex flex-col gap-2 border-t border-white/5 pt-4">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans font-bold block">
                      Connect to Partner's Session
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pairingCodeInput}
                        onChange={(e) => setPairingCodeInput(e.target.value)}
                        placeholder="e.g. k7g8e2h1x"
                        className="flex-1 px-3 py-2.5 bg-[#07030c] rounded-xl border border-white/5 text-zinc-300 placeholder-zinc-700 text-xs font-mono font-bold tracking-widest uppercase focus:outline-none focus:border-sensual-purple/40"
                      />
                      <button
                        onClick={handleMergeSessions}
                        disabled={isMerging || !pairingCodeInput}
                        className="px-4 py-2.5 bg-gradient-to-r from-sensual-purple to-purple-800 text-white rounded-xl text-xs font-bold font-serif hover:opacity-90 transition-all uppercase tracking-widest"
                      >
                        {isMerging ? 'Merging...' : 'Link'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPairingModal(false)}
                    className="w-full py-3 bg-zinc-900 border border-white/5 rounded-xl text-xs text-zinc-500 font-bold uppercase tracking-wider mt-6 transition-all"
                  >
                    Close Link Panel
                  </button>
                </div>
              </SensualCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Active Partner Partner Synchronization Toast Notification */}
      <AnimatePresence>
        {activeSyncToast && partnerActiveState && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 left-6 right-6 z-40 max-w-[380px] mx-auto"
          >
            <SensualCard glowColor="pink" className="p-3 border border-sensual-pink/35 bg-[#050107]/95 shadow-[0_0_20px_rgba(255,42,109,0.3)]" hoverScale={false}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sensual-pink opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sensual-pink"></span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-sensual-pink font-sans font-bold">Lover's Sync Active</span>
                    <span className="text-[11px] text-zinc-300 font-sans leading-normal">
                      Partner just opened: <span className="font-semibold text-rose-gold">{
                        partnerActiveState.activePath === '/talk-zone' ? 'The Talk Zone' :
                        partnerActiveState.activePath === '/games' ? 'Games & Dares' :
                        partnerActiveState.activePath === '/intimacy-ideas' ? 'Intimacy Ideas' :
                        partnerActiveState.activePath === '/positions' ? 'Kamasutra Library' : 'The Dashboard'
                      }</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveSyncToast(false);
                    router.push(`${partnerActiveState.activePath}?syncId=${partnerActiveState.activeItemId || ''}`);
                  }}
                  className="px-3 py-1.5 bg-sensual-pink/15 hover:bg-sensual-pink/20 text-sensual-pink border border-sensual-pink/20 rounded-lg text-[9px] font-sans font-bold uppercase tracking-wider transition-all"
                >
                  Join Partner
                </button>
              </div>
            </SensualCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
