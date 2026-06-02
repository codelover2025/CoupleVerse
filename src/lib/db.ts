import { createClient } from '@supabase/supabase-js';
import { SEED_PROMPTS, SEED_IDEAS, SEED_POSITIONS, Prompt, IntimacyIdea, Position } from './seedData';

// Initialize Supabase only if environment variables are provided
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper keys for local storage
const LS_KEYS = {
  COUPLE: 'pd_couple',
  FAVORITES: 'pd_favorites',
  HISTORY: 'pd_history',
};

// Interface definitions
export interface CoupleProfile {
  id: string;
  partner1Name: string;
  partner2Name: string;
  anniversaryDate: string;
  pinHash?: string;
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  coupleId: string;
  itemType: 'prompt' | 'idea' | 'position';
  itemId: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  coupleId: string;
  itemType: 'prompt' | 'idea' | 'position' | 'game';
  itemId: string;
  lastSeenAt: string;
  completed: boolean;
}

// -------------------------------------------------------------
// PROFILE METHODS
// -------------------------------------------------------------
export async function getCoupleProfile(): Promise<CoupleProfile | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          partner1Name: data.partner1_name,
          partner2Name: data.partner2_name,
          anniversaryDate: data.anniversary_date,
          pinHash: data.pin_hash,
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.warn('Supabase fetch couple failed, using local fallback:', e);
    }
  }

  // Local storage fallback
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LS_KEYS.COUPLE);
    return raw ? JSON.parse(raw) : null;
  }
  return null;
}

export async function saveCoupleProfile(
  partner1Name: string,
  partner2Name: string,
  anniversaryDate: string,
  pin?: string
): Promise<CoupleProfile> {
  const profile: CoupleProfile = {
    id: typeof window !== 'undefined' ? localStorage.getItem('pd_couple_id') || Math.random().toString(36).substr(2, 9) : Math.random().toString(36).substr(2, 9),
    partner1Name,
    partner2Name,
    anniversaryDate,
    pinHash: pin || '',
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('pd_couple_id', profile.id);
    localStorage.setItem(LS_KEYS.COUPLE, JSON.stringify(profile));
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('couples').upsert({
        id: profile.id,
        partner1_name: partner1Name,
        partner2_name: partner2Name,
        anniversary_date: anniversaryDate,
        pin_hash: profile.pinHash,
        created_at: profile.createdAt,
      });
      if (error) throw error;
    } catch (e) {
      console.error('Failed to sync couple with Supabase:', e);
    }
  }

  return profile;
}

// -------------------------------------------------------------
// CORE CONTENT METHODS (Filtered by no-repeat logic)
// -------------------------------------------------------------
export async function fetchPrompts(category?: string): Promise<Prompt[]> {
  // Static dataset serves as main library, filtered dynamically
  let list = [...SEED_PROMPTS];
  if (category && category !== 'All') {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }
  return list;
}

export async function fetchIntimacyIdeas(category?: string): Promise<IntimacyIdea[]> {
  let list = [...SEED_IDEAS];
  if (category && category !== 'All') {
    list = list.filter((i) => i.category.toLowerCase() === category.toLowerCase() || i.category.replace('-', '').toLowerCase() === category.replace('-', '').toLowerCase());
  }
  return list;
}

export async function fetchPositions(difficulty?: string): Promise<Position[]> {
  let list = [...SEED_POSITIONS];
  if (difficulty && difficulty !== 'All') {
    list = list.filter((p) => p.difficulty.toLowerCase() === difficulty.toLowerCase());
  }
  return list;
}

// -------------------------------------------------------------
// FAVORITES METHODS
// -------------------------------------------------------------
export async function getFavorites(): Promise<FavoriteItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('favorites').select('*');
      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          coupleId: d.couple_id,
          itemType: d.item_type,
          itemId: d.item_id,
          createdAt: d.created_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase favorites fetch failed, falling back:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LS_KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [];
  }
  return [];
}

export async function toggleFavorite(
  itemType: 'prompt' | 'idea' | 'position',
  itemId: string
): Promise<boolean> {
  const couple = await getCoupleProfile();
  const coupleId = couple ? couple.id : 'anonymous';

  let current = await getFavorites();
  const index = current.findIndex((f) => f.itemType === itemType && f.itemId === itemId);
  let isFavNow = false;

  if (index >= 0) {
    // Remove favorite
    current.splice(index, 1);
  } else {
    // Add favorite
    current.push({
      id: Math.random().toString(36).substr(2, 9),
      coupleId,
      itemType,
      itemId,
      createdAt: new Date().toISOString(),
    });
    isFavNow = true;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_KEYS.FAVORITES, JSON.stringify(current));
  }

  if (isSupabaseConfigured && supabase) {
    try {
      if (isFavNow) {
        await supabase.from('favorites').upsert({
          couple_id: coupleId === 'anonymous' ? undefined : coupleId,
          item_type: itemType,
          item_id: itemId,
        });
      } else {
        await supabase
          .from('favorites')
          .delete()
          .match({ item_type: itemType, item_id: itemId });
      }
    } catch (e) {
      console.error('Supabase toggle favorite failed:', e);
    }
  }

  return isFavNow;
}

// -------------------------------------------------------------
// HISTORY / SMART NO-REPEAT SYSTEM
// -------------------------------------------------------------
export async function getHistory(): Promise<HistoryItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('user_history').select('*');
      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          coupleId: d.couple_id,
          itemType: d.item_type,
          itemId: d.item_id,
          lastSeenAt: d.last_seen_at,
          completed: d.completed,
        }));
      }
    } catch (e) {
      console.warn('Supabase history fetch failed, falling back:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LS_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  }
  return [];
}

export async function addToHistory(
  itemType: 'prompt' | 'idea' | 'position' | 'game',
  itemId: string,
  completed = false
): Promise<void> {
  const couple = await getCoupleProfile();
  const coupleId = couple ? couple.id : 'anonymous';

  let current = await getHistory();
  const index = current.findIndex((h) => h.itemType === itemType && h.itemId === itemId);

  if (index >= 0) {
    current[index].lastSeenAt = new Date().toISOString();
    current[index].completed = completed;
  } else {
    current.push({
      id: Math.random().toString(36).substr(2, 9),
      coupleId,
      itemType,
      itemId,
      lastSeenAt: new Date().toISOString(),
      completed,
    });
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_KEYS.HISTORY, JSON.stringify(current));
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('user_history').upsert({
        couple_id: coupleId === 'anonymous' ? undefined : coupleId,
        item_type: itemType,
        item_id: itemId,
        last_seen_at: new Date().toISOString(),
        completed,
      });
    } catch (e) {
      console.error('Supabase addToHistory sync failed:', e);
    }
  }
}

export async function clearHistory(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_KEYS.HISTORY, JSON.stringify([]));
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('user_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.error('Supabase clearHistory failed:', e);
    }
  }
}

export async function joinCoupleSession(coupleId: string): Promise<CoupleProfile | null> {
  if (!coupleId) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .eq('id', coupleId)
        .single();
      if (!error && data) {
        const profile: CoupleProfile = {
          id: data.id,
          partner1Name: data.partner1_name,
          partner2Name: data.partner2_name,
          anniversaryDate: data.anniversary_date,
          pinHash: data.pin_hash || '',
          createdAt: data.created_at,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('pd_couple_id', profile.id);
          localStorage.setItem(LS_KEYS.COUPLE, JSON.stringify(profile));
        }
        return profile;
      }
    } catch (e) {
      console.error('Supabase join failed, using offline stub:', e);
    }
  }

  // Offline local fallback: construct a stub profile using the code
  const profile: CoupleProfile = {
    id: coupleId,
    partner1Name: 'Partner 1',
    partner2Name: 'Partner 2',
    anniversaryDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('pd_couple_id', profile.id);
    localStorage.setItem(LS_KEYS.COUPLE, JSON.stringify(profile));
  }
  return profile;
}
