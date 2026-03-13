import { createServerSupabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ extensionId?: string; error?: string }>;
}) {
  const { extensionId, error } = await searchParams;

  async function signInWithGoogle() {
    'use server';
    const supabase = await createServerSupabase();

    const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const callbackUrl = new URL(`${appUrl}/auth/callback`);
    if (extensionId) callbackUrl.searchParams.set('extensionId', extensionId);

    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    });

    if (data.url) redirect(data.url);
  }

  return (
    <main style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: 24, padding: '0 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
      background: '#f3f4f6',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 36, height: 36, background: '#14B8A6', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: 'white',
        }}>▶</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
          Bookmarker
        </span>
      </div>

      {/* Card */}
      <div style={{
        background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb',
        padding: '32px 28px', width: '100%', maxWidth: 360,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
            Sign in to Bookmarker
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            {extensionId
              ? 'Sign in to sync your bookmarks across devices and share collections.'
              : 'Sign in to manage your bookmark collections.'}
          </p>
        </div>

        {error && (
          <p style={{
            fontSize: 13, color: '#ef4444', background: '#fef2f2',
            padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #ef4444',
          }}>
            Sign-in failed — please try again.
          </p>
        )}

        <form action={signInWithGoogle}>
          <button
            type="submit"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '10px 16px', background: '#111827', color: 'white',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {/* Google SVG icon */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }}>
          By signing in you agree to our terms. Your bookmarks are private by default.
        </p>
      </div>
    </main>
  );
}
