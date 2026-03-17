import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clipmark — YouTube Timestamp Bookmarks',
  description: 'Save, tag, and share timestamped moments from YouTube videos. AI-powered bookmarking.',
  openGraph: {
    title: 'Clipmark',
    description: 'Turn YouTube videos into searchable, shareable knowledge.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
