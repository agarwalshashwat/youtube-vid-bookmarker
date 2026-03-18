'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '6px 10px',
        color: 'var(--text-sub)',
        fontSize: 16,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.15s, color 0.15s',
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
