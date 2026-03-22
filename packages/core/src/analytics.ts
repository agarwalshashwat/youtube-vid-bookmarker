import type { AnalyticsEvent } from '@clipmark/types';

const STORAGE_KEY = 'analytics_events';
const MAX_EVENTS = 500;

async function recordEvent(event: Omit<AnalyticsEvent, 'at'>): Promise<void> {
  const full: AnalyticsEvent = { ...event, at: new Date().toISOString() };
  const result = await new Promise<Record<string, AnalyticsEvent[]>>(resolve =>
    chrome.storage.local.get({ [STORAGE_KEY]: [] }, r => resolve(r as Record<string, AnalyticsEvent[]>))
  );
  const events = result[STORAGE_KEY];
  events.push(full);
  const trimmed = events.slice(-MAX_EVENTS);
  await new Promise<void>(resolve => chrome.storage.local.set({ [STORAGE_KEY]: trimmed }, resolve));
}

export async function getEvents(): Promise<AnalyticsEvent[]> {
  const result = await new Promise<Record<string, AnalyticsEvent[]>>(resolve =>
    chrome.storage.local.get({ [STORAGE_KEY]: [] }, r => resolve(r as Record<string, AnalyticsEvent[]>))
  );
  return result[STORAGE_KEY];
}

export interface AnalyticsStats {
  totalCreated: number;
  totalDeleted: number;
  totalRevisited: number;
  createdByDay: Record<string, number>;
  videoFrequency: Record<string, number>;
}

export async function computeStats(): Promise<AnalyticsStats> {
  const events = await getEvents();
  const created   = events.filter(e => e.type === 'bookmark_created');
  const deleted   = events.filter(e => e.type === 'bookmark_deleted');
  const revisited = events.filter(e => e.type === 'bookmark_revisited');

  const createdByDay: Record<string, number> = {};
  created.forEach(e => {
    const day = e.at.slice(0, 10);
    createdByDay[day] = (createdByDay[day] || 0) + 1;
  });

  const videoFrequency: Record<string, number> = {};
  created.forEach(e => {
    if (e.videoId) videoFrequency[e.videoId] = (videoFrequency[e.videoId] || 0) + 1;
  });

  return {
    totalCreated:   created.length,
    totalDeleted:   deleted.length,
    totalRevisited: revisited.length,
    createdByDay,
    videoFrequency,
  };
}

export const analytics = {
  clipmarkCreated:  (videoId: string)                    => recordEvent({ type: 'bookmark_created',  videoId }),
  clipmarkDeleted:  (videoId: string)                    => recordEvent({ type: 'bookmark_deleted',  videoId }),
  clipmarkRevisited:(videoId: string, timestamp: number) => recordEvent({ type: 'bookmark_revisited', videoId, timestamp }),
  exported:         ()                                   => recordEvent({ type: 'export' }),
  // @deprecated aliases
  bookmarkCreated:  (videoId: string)                    => recordEvent({ type: 'bookmark_created',  videoId }),
  bookmarkDeleted:  (videoId: string)                    => recordEvent({ type: 'bookmark_deleted',  videoId }),
  bookmarkRevisited:(videoId: string, timestamp: number) => recordEvent({ type: 'bookmark_revisited', videoId, timestamp }),
};
