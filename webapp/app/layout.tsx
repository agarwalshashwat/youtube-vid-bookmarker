import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Clipmark — YouTube Timestamp Bookmarks',
  description: 'Save, tag, and share timestamped moments from YouTube videos. AI-powered bookmarking.',
  openGraph: {
    title: 'Clipmark',
    description: 'Turn YouTube videos into searchable, shareable knowledge.',
    type: 'website',
  },
};

// Inline script runs synchronously before first paint to avoid flash of wrong theme.
const themeScript = `
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch(e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
