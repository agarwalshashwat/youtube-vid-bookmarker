import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bookmarker — YouTube Timestamp Collections',
  description: 'View and share timestamped bookmarks for YouTube videos.',
  openGraph: {
    title: 'Bookmarker',
    description: 'Curated timestamp guides for YouTube videos.',
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
