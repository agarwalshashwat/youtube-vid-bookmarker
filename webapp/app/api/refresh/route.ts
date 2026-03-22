import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// POST /api/refresh
// Body: { refresh_token: string }
// Returns: { access_token, refresh_token, expires_at }
export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json() as { refresh_token: string };
    if (!refresh_token) {
      return NextResponse.json({ error: 'refresh_token is required' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error || !data.session) {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    }

    return NextResponse.json({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at:    data.session.expires_at,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
