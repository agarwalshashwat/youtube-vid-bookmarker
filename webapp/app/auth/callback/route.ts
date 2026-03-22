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
          setAll(list: { name: string; value: string; options?: object }[]) { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never)); },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Ensure profile row exists (trigger only fires on first-ever INSERT into auth.users)
      const emailPrefix = (data.session.user.email ?? '').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      await supabase
        .from('profiles')
        .upsert({ id: data.session.user.id, username: emailPrefix }, { onConflict: 'id', ignoreDuplicates: true });

      if (extensionId) {
        // Fetch pro status to pass to extension
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', data.session.user.id)
          .single();

        const p = new URLSearchParams({
          access_token:  data.session.access_token,
          refresh_token: data.session.refresh_token,
          user_id:       data.session.user.id,
          user_email:    data.session.user.email || '',
          is_pro:        String(profile?.is_pro ?? false),
          extensionId,
        });
        return NextResponse.redirect(`${origin}/auth/extension-success?${p.toString()}`);
      }
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
}
