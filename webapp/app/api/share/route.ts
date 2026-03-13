import { NextRequest, NextResponse } from 'next/server';
import { supabase, type Bookmark } from '@/lib/supabase';

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

    return NextResponse.json({ shareId: data.id }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
