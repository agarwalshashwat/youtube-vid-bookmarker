-- User profiles (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT        UNIQUE NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9_]', '', 'g'))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Link collections to users (nullable — anonymous shares still work)
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections (user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Per-user per-video cloud bookmark sync
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id    TEXT        NOT NULL,
  bookmarks   JSONB       NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON public.user_bookmarks (user_id);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_bookmarks' AND policyname = 'Users can read own bookmarks'
  ) THEN
    CREATE POLICY "Users can read own bookmarks"    ON public.user_bookmarks FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can upsert own bookmarks"  ON public.user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own bookmarks"  ON public.user_bookmarks FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own bookmarks"  ON public.user_bookmarks FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
