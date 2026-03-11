import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Bookmark {
  id: number;
  videoId: string;
  timestamp: number;
  description: string;
  tags: string[];
  color: string;
  createdAt: string;
  videoTitle: string | null;
}

export interface Collection {
  id: string;           // UUID — this is the shareId
  video_id: string;
  video_title: string | null;
  bookmarks: Bookmark[];
  created_at: string;
  view_count: number;
}
