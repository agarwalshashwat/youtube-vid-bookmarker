-- Run this in your Supabase project → SQL Editor

CREATE TABLE public.collections (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id    TEXT        NOT NULL,
  video_title TEXT,
  bookmarks   JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  view_count  INTEGER     DEFAULT 0
);

-- Index for fast lookups by video (useful later for "popular videos" feature)
CREATE INDEX idx_collections_video_id ON public.collections (video_id);

-- Row Level Security — open read/insert for MVP (no auth)
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collections"
  ON public.collections FOR SELECT USING (true);

CREATE POLICY "Anyone can create collections"
  ON public.collections FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can increment view_count"
  ON public.collections FOR UPDATE USING (true) WITH CHECK (true);
