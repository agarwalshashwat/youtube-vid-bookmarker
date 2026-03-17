import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase, type Bookmark } from '@/lib/supabase';

const FREE_SHARE_LIMIT = 5;

// Service-role client for Pro + collection-count checks (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Handle preflight CORS requests from the extension
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, videoTitle, bookmarks, userId } = body as {
      videoId: string;
      videoTitle: string;
      bookmarks: Bookmark[];
      userId?: string;
    };

    if (!videoId || !Array.isArray(bookmarks) || bookmarks.length === 0) {
      return NextResponse.json(
        { error: 'videoId and a non-empty bookmarks array are required' },
        { status: 400 }
      );
    }

    // ── Free-tier limit check ────────────────────────────────────────────────
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_pro')
        .eq('id', userId)
        .single();

      const isPro = profile?.is_pro === true;

      if (!isPro) {
        const { count } = await supabaseAdmin
          .from('collections')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        if ((count ?? 0) >= FREE_SHARE_LIMIT) {
          return NextResponse.json(
            {
              error: 'free_limit_reached',
              message: `Free plan allows ${FREE_SHARE_LIMIT} shared collections. Upgrade to Clipmark Pro for unlimited sharing.`,
              limit: FREE_SHARE_LIMIT,
              count,
            },
            { status: 403 }
          );
        }
      }
    }

    // Sort bookmarks by timestamp before storing
    const sorted = [...bookmarks].sort((a, b) => a.timestamp - b.timestamp);

    const { data, error } = await supabase
      .from('collections')
      .insert({
        video_id:    videoId,
        video_title: videoTitle || null,
        bookmarks:   sorted,
        user_id:     userId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save collection' }, { status: 500 });
    }

    // Return current collection count for free-tier nudge in the extension
    let collectionsUsed: number | null = null;
    if (userId) {
      const { count } = await supabaseAdmin
        .from('collections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      collectionsUsed = count ?? null;
    }

    return NextResponse.json({ shareId: data.id, collectionsUsed, freeLimit: FREE_SHARE_LIMIT }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
