export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function relativeTime(ts: number): string {
  const diff   = Date.now() - ts;
  const mins   = Math.floor(diff / 60000);
  const hrs    = Math.floor(diff / 3600000);
  const days   = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  if (hrs < 24)    return `${hrs}h ago`;
  if (days < 30)   return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function extractVideoId(url: string): string | null {
  try {
    return new URLSearchParams(new URL(url).search).get('v');
  } catch {
    return null;
  }
}

export function debugLog(category: string, message: string, data: unknown = null): void {
  console.log(`[Clipmark][${category}][${new Date().toISOString()}] ${message}`, data ?? '');
}
