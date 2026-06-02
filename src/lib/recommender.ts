import { SEED_PROMPTS, SEED_IDEAS, SEED_POSITIONS, SEED_DARES, Prompt, IntimacyIdea, Position, GameDare } from './seedData';
import { HistoryItem, FavoriteItem } from './db';

export type MoodType = 'Chill' | 'Intimate' | 'Playful' | 'Sensual';

interface ScoringParameters {
  currentMood: MoodType;
  history: HistoryItem[];
  favorites: FavoriteItem[];
  currentTime: Date;
}

// Helper to check if a date is "late-night" (9 PM to 5 AM)
export function isLateNight(date: Date): boolean {
  const hours = date.getHours();
  return hours >= 21 || hours < 5;
}

// -------------------------------------------------------------
// RECOMMEND PROMPTS
// -------------------------------------------------------------
export function getRecommendedPrompts({
  currentMood,
  history,
  favorites,
  currentTime,
}: ScoringParameters): Prompt[] {
  const seenIds = new Set(history.map((h) => h.itemId));
  const favIds = new Set(favorites.filter((f) => f.itemType === 'prompt').map((f) => f.itemId));
  const lateNightMode = isLateNight(currentTime);

  const scored = SEED_PROMPTS.map((p) => {
    let score = 100;

    // 1. Freshness / Seen history check (No-Repeat Logic)
    if (seenIds.has(p.id)) {
      const histItem = history.find((h) => h.itemId === p.id);
      if (histItem) {
        const hoursSinceSeen = (currentTime.getTime() - new Date(histItem.lastSeenAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceSeen < 48) {
          // Do not show anything seen in the last 48 hours
          score = 0;
          return { item: p, score };
        } else {
          // Mild penalty for older seen items
          score -= 60;
        }
      }
    }

    // 2. Mood Alignment (Critical Boost)
    if (p.moodTag === currentMood) {
      score += 80;
    } else {
      score -= 20;
    }

    // 3. Time of Day Context
    if (lateNightMode) {
      if (p.category === 'Late-night' || p.category === 'Erotic') {
        score += 50;
      }
    } else {
      if (p.category === 'Fun' || p.category === 'Romantic') {
        score += 30;
      }
      if (p.category === 'Erotic') {
        // Less erotic prompts in broad daylight
        score -= 40;
      }
    }

    // 4. Favorites Affinity (Bookmarked Category Boost)
    const favPrompts = favorites.filter((f) => f.itemType === 'prompt');
    const favCategories = new Set(
      favPrompts
        .map((f) => SEED_PROMPTS.find((sp) => sp.id === f.itemId)?.category)
        .filter(Boolean)
    );
    if (favCategories.has(p.category)) {
      score += 25; // boost similar categories
    }

    // 5. Special Favorite check
    if (favIds.has(p.id)) {
      score += 15; // favorited items get a tiny priority boost to repeat eventually
    }

    return { item: p, score };
  });

  // Filter out zero-scores, sort desc
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}

// -------------------------------------------------------------
// RECOMMEND INTIMACY IDEAS
// -------------------------------------------------------------
export function getRecommendedIdeas({
  currentMood,
  history,
  favorites,
  currentTime,
}: ScoringParameters): IntimacyIdea[] {
  const seenIds = new Set(history.map((h) => h.itemId));
  const completedIds = new Set(history.filter((h) => h.completed).map((h) => h.itemId));
  const lateNightMode = isLateNight(currentTime);

  const scored = SEED_IDEAS.map((idea) => {
    let score = 100;

    // 1. Seen / Completed Check
    if (completedIds.has(idea.id)) {
      // Completed challenges are heavily penalized so new ones show up
      score -= 90;
    } else if (seenIds.has(idea.id)) {
      const histItem = history.find((h) => h.itemId === idea.id);
      if (histItem) {
        const hoursSinceSeen = (currentTime.getTime() - new Date(histItem.lastSeenAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceSeen < 72) {
          // Do not repeat recently skipped ideas
          score = 0;
          return { item: idea, score };
        } else {
          score -= 30;
        }
      }
    }

    // 2. Mood Alignment Mapping
    // Chill maps to Romantic, Comfort, Connection
    // Intimate maps to Connection, Comfort, Affection, Desire
    // Playful maps to Date-Night, Surprise, Affection
    // Sensual maps to Desire, Atmosphere, Affection
    const moodMap: Record<MoodType, string[]> = {
      Chill: ['Romantic', 'Comfort', 'Connection'],
      Intimate: ['Connection', 'Comfort', 'Affection', 'Desire'],
      Playful: ['Date-Night', 'Surprise', 'Affection'],
      Sensual: ['Desire', 'Atmosphere', 'Affection'],
    };

    if (moodMap[currentMood].includes(idea.category)) {
      score += 70;
    }

    // 3. Time of Day Context
    if (lateNightMode) {
      if (idea.category === 'Desire' || idea.category === 'Atmosphere') {
        score += 40;
      }
      if (idea.spiceLevel === 'Spicy') {
        score += 30;
      }
    } else {
      if (idea.category === 'Date-Night' || idea.category === 'Romantic') {
        score += 20;
      }
      if (idea.spiceLevel === 'Spicy') {
        score -= 40;
      }
    }

    // 4. Favorites Affinity
    const favIdeas = favorites.filter((f) => f.itemType === 'idea');
    const favCategories = new Set(
      favIdeas
        .map((f) => SEED_IDEAS.find((si) => si.id === f.itemId)?.category)
        .filter(Boolean)
    );
    if (favCategories.has(idea.category)) {
      score += 25;
    }

    return { item: idea, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}

// -------------------------------------------------------------
// RECOMMEND POSITIONS
// -------------------------------------------------------------
export function getRecommendedPositions({
  currentMood,
  favorites,
}: Omit<ScoringParameters, 'history' | 'currentTime'>): Position[] {
  const scored = SEED_POSITIONS.map((pos) => {
    let score = 100;

    // 1. Mood mapping
    // Chill: Relaxed energy, Beginner difficulty
    // Intimate: lotus / embrace silhouttes, Comfortable difficulty
    // Playful: Active energy, Comfortable difficulty
    // Sensual: Intense energy, Advanced difficulty, crescent / bridge silhouettes
    if (currentMood === 'Chill') {
      if (pos.energyLevel === 'Relaxed') score += 50;
      if (pos.difficulty === 'Beginner') score += 40;
    } else if (currentMood === 'Intimate') {
      if (pos.silhouetteType === 'lotus' || pos.silhouetteType === 'embrace' || pos.silhouetteType === 'fusion') score += 60;
      if (pos.difficulty === 'Comfortable') score += 30;
    } else if (currentMood === 'Playful') {
      if (pos.energyLevel === 'Active') score += 50;
      if (pos.difficulty === 'Comfortable') score += 30;
    } else if (currentMood === 'Sensual') {
      if (pos.energyLevel === 'Intense') score += 50;
      if (pos.difficulty === 'Advanced') score += 40;
      if (pos.silhouetteType === 'bridge' || pos.silhouetteType === 'crescent') score += 40;
    }

    // 2. Favorites affinity
    const hasFav = favorites.some((f) => f.itemType === 'position' && f.itemId === pos.id);
    if (hasFav) {
      score += 30;
    }

    return { item: pos, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}

// -------------------------------------------------------------
// RECOMMEND GAME DARES
// -------------------------------------------------------------
export function getRecommendedDares(
  temp: 'Mild' | 'Medium' | 'Spicy',
  history: HistoryItem[],
  currentTime: Date
): GameDare[] {
  const seenIds = new Set(history.map((h) => h.itemId));

  const scored = SEED_DARES.filter((d) => d.spiceLevel === temp).map((d) => {
    let score = 100;

    // 1. Seen checking
    if (seenIds.has(d.id)) {
      const histItem = history.find((h) => h.itemId === d.id);
      if (histItem) {
        const hoursSinceSeen = (currentTime.getTime() - new Date(histItem.lastSeenAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceSeen < 24) {
          score = 0;
          return { item: d, score };
        } else {
          score -= 50;
        }
      }
    }

    return { item: d, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}
