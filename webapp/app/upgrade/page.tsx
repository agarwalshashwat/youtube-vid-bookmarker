import { createServerSupabase } from '@/lib/supabase';
import { createCheckoutSession } from './actions';

const FEATURES = [
  { label: 'Unlimited local bookmarks',          free: true,  pro: true  },
  { label: 'Shareable public pages',             free: true,  pro: true  },
  { label: 'Cloud sync across devices',          free: true,  pro: true  },
  { label: 'Public collections limit',           free: '5',   pro: '∞'   },
  { label: 'AI auto-fill from transcript',       free: false, pro: true  },
  { label: 'AI summaries',                       free: false, pro: true  },
  { label: 'Smart tag suggestions',              free: false, pro: true  },
  { label: 'Social post generation',             free: false, pro: true  },
  { label: 'Revision Mode',                      free: false, pro: true  },
  { label: 'Spaced revision',                    free: false, pro: true  },
];

function Check() {
  return <span style={{ color: '#14B8A6', fontWeight: 700 }}>✓</span>;
}
function Cross() {
  return <span style={{ color: '#374151' }}>—</span>;
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  let isPro = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single();
    isPro = profile?.is_pro ?? false;
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px', borderBottom: '1px solid #1f2937',
      }}>
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
        }}>
          <span style={{
            width: 32, height: 32, background: '#14B8A6', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: 'white', fontWeight: 700,
          }}>▶</span>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: '#f9fafb' }}>
            Clipmark
          </span>
        </a>
        {user && (
          <span style={{ fontSize: 13, color: '#6b7280' }}>{user.email}</span>
        )}
      </nav>

      {/* Success banner */}
      {success && (
        <div style={{
          background: '#14B8A620', border: '1px solid #14B8A640',
          borderRadius: 10, padding: '14px 24px', margin: '24px auto',
          maxWidth: 600, textAlign: 'center', fontSize: 15, color: '#14B8A6',
          fontWeight: 600,
        }}>
          Payment successful — welcome to Clipmark Pro!
        </div>
      )}

      {/* Already Pro banner */}
      {isPro && !success && (
        <div style={{
          background: '#8B5CF620', border: '1px solid #8B5CF640',
          borderRadius: 10, padding: '14px 24px', margin: '24px auto',
          maxWidth: 600, textAlign: 'center', fontSize: 15, color: '#a78bfa',
          fontWeight: 600,
        }}>
          You&apos;re already on Clipmark Pro
        </div>
      )}

      {/* Header */}
      <section style={{ textAlign: 'center', padding: '56px 24px 48px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#8B5CF620', border: '1px solid #8B5CF640',
          borderRadius: 20, padding: '5px 14px', fontSize: 12,
          color: '#a78bfa', fontWeight: 600, letterSpacing: '0.3px', marginBottom: 20,
        }}>
          ✦ Upgrade to Pro
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800,
          letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 16,
          background: 'linear-gradient(135deg, #f9fafb 0%, #9ca3af 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Unlock everything in Clipmark
        </h1>
        <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
          AI auto-fill, summaries, revision mode, and unlimited sharing — all in one plan.
        </p>
      </section>

      {/* Pricing cards */}
      <section style={{
        display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap',
        padding: '0 24px 64px', maxWidth: 900, margin: '0 auto',
      }}>

        {/* Free */}
        <div style={{
          flex: '1 1 240px', maxWidth: 280, background: '#111827',
          border: '1px solid #1f2937', borderRadius: 16, padding: '32px 28px',
        }}>
          <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>FREE</p>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 40, fontWeight: 800 }}>$0</span>
            <span style={{ fontSize: 14, color: '#6b7280' }}> / forever</span>
          </div>
          <div style={{
            padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
            color: '#4b5563', textAlign: 'center', marginBottom: 28,
            border: '1px solid #1f2937',
          }}>
            {isPro ? 'Previous plan' : 'Current plan'}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ Unlimited local bookmarks</li>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ 5 shared collections</li>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ Cloud sync</li>
            <li style={{ fontSize: 13, color: '#4b5563' }}>— AI features</li>
            <li style={{ fontSize: 13, color: '#4b5563' }}>— Revision Mode</li>
          </ul>
        </div>

        {/* Pro Monthly */}
        <div style={{
          flex: '1 1 240px', maxWidth: 280, background: '#111827',
          border: '1px solid #14B8A640', borderRadius: 16, padding: '32px 28px',
        }}>
          <p style={{ fontSize: 13, color: '#14B8A6', fontWeight: 600, marginBottom: 8 }}>PRO MONTHLY</p>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 40, fontWeight: 800 }}>$5</span>
            <span style={{ fontSize: 14, color: '#6b7280' }}> / month</span>
          </div>
          <form action={createCheckoutSession}>
            <input type="hidden" name="plan" value="monthly" />
            <button type="submit" style={{
              width: '100%', padding: '11px 0', borderRadius: 8,
              background: isPro ? '#1f2937' : '#14B8A6',
              color: isPro ? '#6b7280' : 'white',
              fontSize: 14, fontWeight: 700, border: 'none',
              cursor: isPro ? 'default' : 'pointer', marginBottom: 28,
            }}
              disabled={isPro}
            >
              {isPro ? 'Current plan' : 'Upgrade monthly'}
            </button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ Everything in Free</li>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ Unlimited shared collections</li>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ AI auto-fill + summaries</li>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ Smart tag suggestions</li>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ Social post generation</li>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ Revision + Spaced Revision</li>
          </ul>
        </div>

        {/* Pro Annual */}
        <div style={{
          flex: '1 1 240px', maxWidth: 280, background: '#111827',
          border: '2px solid #8B5CF6', borderRadius: 16, padding: '32px 28px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
            background: '#8B5CF6', borderRadius: 20, padding: '3px 14px',
            fontSize: 11, fontWeight: 700, color: 'white', whiteSpace: 'nowrap',
          }}>
            BEST VALUE — SAVE 33%
          </div>
          <p style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600, marginBottom: 8 }}>PRO ANNUAL</p>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 800 }}>$40</span>
            <span style={{ fontSize: 14, color: '#6b7280' }}> / year</span>
          </div>
          <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 20 }}>~$3.33 / month</p>
          <form action={createCheckoutSession}>
            <input type="hidden" name="plan" value="annual" />
            <button type="submit" style={{
              width: '100%', padding: '11px 0', borderRadius: 8,
              background: isPro ? '#1f2937' : '#8B5CF6',
              color: isPro ? '#6b7280' : 'white',
              fontSize: 14, fontWeight: 700, border: 'none',
              cursor: isPro ? 'default' : 'pointer', marginBottom: 28,
            }}
              disabled={isPro}
            >
              {isPro ? 'Current plan' : 'Upgrade annually'}
            </button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ Everything in Pro Monthly</li>
            <li style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>✓ 2 months free vs monthly</li>
            <li style={{ fontSize: 13, color: '#9ca3af' }}>✓ Priority support</li>
          </ul>
        </div>

      </section>

      {/* Feature comparison table */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{
          fontSize: 20, fontWeight: 700, color: '#f3f4f6',
          marginBottom: 24, textAlign: 'center',
        }}>
          Full feature comparison
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <th style={{ textAlign: 'left', padding: '10px 0', color: '#6b7280', fontWeight: 600 }}>Feature</th>
              <th style={{ textAlign: 'center', padding: '10px 0', color: '#6b7280', fontWeight: 600, width: 80 }}>Free</th>
              <th style={{ textAlign: 'center', padding: '10px 0', color: '#14B8A6', fontWeight: 600, width: 80 }}>Pro</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map(({ label, free, pro }) => (
              <tr key={label} style={{ borderBottom: '1px solid #111827' }}>
                <td style={{ padding: '11px 0', color: '#d1d5db' }}>{label}</td>
                <td style={{ textAlign: 'center', padding: '11px 0' }}>
                  {free === true ? <Check /> : free === false ? <Cross /> : (
                    <span style={{ color: '#9ca3af', fontSize: 13 }}>{free}</span>
                  )}
                </td>
                <td style={{ textAlign: 'center', padding: '11px 0' }}>
                  {pro === true ? <Check /> : pro === false ? <Cross /> : (
                    <span style={{ color: '#14B8A6', fontSize: 13, fontWeight: 600 }}>{pro}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1f2937', padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 24, height: 24, background: '#14B8A6', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: 'white',
          }}>▶</span>
          <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 600 }}>Clipmark</span>
        </div>
        <p style={{ fontSize: 12, color: '#374151' }}>
          Cancel anytime. Payments processed by Dodo Payments.
        </p>
      </footer>
    </main>
  );
}
