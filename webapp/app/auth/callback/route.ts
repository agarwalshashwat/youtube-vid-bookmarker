import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code        = searchParams.get('code');
  const extensionId = searchParams.get('extensionId');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll()     { return cookieStore.getAll(); },
          setAll(list) { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      if (extensionId) {
        // Redirect to extension-success page so client JS can send token to extension
        const p = new URLSearchParams({
          access_token:  data.session.access_token,
          refresh_token: data.session.refresh_token,
          user_id:       data.session.user.id,
          user_email:    data.session.user.email || '',
          extensionId,
        });
        return NextResponse.redirect(`${origin}/auth/extension-success?${p.toString()}`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
}
