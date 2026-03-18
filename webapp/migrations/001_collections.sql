-- Collections: public shared bookmark pages
CREATE TABLE IF NOT EXISTS public.collections (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id    TEXT        NOT NULL,
  video_title TEXT,
  bookmarks   JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  view_count  INTEGER     DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_collections_video_id ON public.collections (video_id);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Anyone can view collections'
  ) THEN
    CREATE POLICY "Anyone can view collections" ON public.collections FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Anyone can create collections'
  ) THEN
    CREATE POLICY "Anyone can create collections" ON public.collections FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Anyone can increment view_count'
  ) THEN
    CREATE POLICY "Anyone can increment view_count" ON public.collections FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
