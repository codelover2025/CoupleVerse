-- DATABASE SCHEMA FOR PURE DESIRE (PRIVATE COUPLE APP)
-- Run this in the Supabase SQL Editor to set up your tables.

-- Enable UUID extension if not already done
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Couples Table (Shared session info between partner 1 and 2)
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner1_name TEXT NOT NULL,
    partner2_name TEXT NOT NULL,
    anniversary_date DATE,
    pin_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Couples
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access (for initial demo setup)"
    ON public.couples FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert (on boarding)"
    ON public.couples FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update (with shared PIN or details)"
    ON public.couples FOR UPDATE
    USING (true);

-- 2. Prompts Table (Talk Zone content)
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'Romantic', 'Deep', 'Flirty', 'Fun', 'Late-night', 'Erotic'
    question TEXT NOT NULL,
    mood_tag TEXT NOT NULL, -- 'Chill', 'Intimate', 'Playful', 'Sensual'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Prompts
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access to prompts" ON public.prompts FOR SELECT USING (true);

-- 3. Intimacy Ideas Table (Challenges)
CREATE TABLE IF NOT EXISTS public.intimacy_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Romantic', 'Date-Night', 'Affection', 'Connection', 'Surprise', 'Desire'
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    sensory_focus TEXT NOT NULL,
    spice_level TEXT NOT NULL, -- 'Mild', 'Medium', 'Spicy'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Intimacy Ideas
ALTER TABLE public.intimacy_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access to intimacy_ideas" ON public.intimacy_ideas FOR SELECT USING (true);

-- 4. Positions Table (Tasteful sex positions library)
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL, -- 'Beginner', 'Comfortable', 'Advanced'
    energy_level TEXT NOT NULL, -- 'Relaxed', 'Active', 'Intense'
    duration TEXT NOT NULL,
    sensory_focus TEXT NOT NULL,
    silhouette_type TEXT NOT NULL, -- 'lotus', 'embrace', 'bridge', etc.
    why_try TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Positions
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access to positions" ON public.positions FOR SELECT USING (true);

-- 5. Favorites Table (Saved items)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'prompt', 'idea', 'position'
    item_id TEXT NOT NULL, -- references prompt.id, idea.id or position.id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(couple_id, item_type, item_id)
);

-- Enable RLS for Favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow couples read and write their favorites" ON public.favorites FOR ALL USING (true);

-- 6. User History Table (Smart No-Repeat system)
CREATE TABLE IF NOT EXISTS public.user_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'prompt', 'idea', 'position'
    item_id TEXT NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    UNIQUE(couple_id, item_type, item_id)
);

-- Enable RLS for User History
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow couples read and write their history" ON public.user_history FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category);
CREATE INDEX IF NOT EXISTS idx_ideas_category ON public.intimacy_ideas(category);
CREATE INDEX IF NOT EXISTS idx_positions_difficulty ON public.positions(difficulty);
CREATE INDEX IF NOT EXISTS idx_favorites_couple ON public.favorites(couple_id);
CREATE INDEX IF NOT EXISTS idx_history_couple ON public.user_history(couple_id);
