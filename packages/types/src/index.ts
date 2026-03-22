export interface Clipmark {
  id: number;
  videoId: string;
  timestamp: number;
  description: string;
  tags: string[];
  color: string;
  createdAt: string;
  videoTitle: string | null;
  notes?: string;
  reviewSchedule?: number[];
  lastReviewed?: string | null;
  duration?: number;
}

/** @deprecated Use Clipmark */
export type Bookmark = Clipmark;

export interface UserProfile {
  userId: string;
  userEmail: string;
  accessToken: string;
  refreshToken: string;
  isPro: boolean;
}

export type SortOrder = 'newest' | 'oldest' | 'timestamp';

export type ViewMode = 'cards' | 'timeline' | 'groups' | 'analytics' | 'revisit' | 'videos';

export type Density = 'compact' | 'default' | 'comfortable';

export interface SavedSearch {
  id: number;
  name: string;
  query: string;
  sort: SortOrder;
}

export interface AnalyticsEvent {
  type: 'bookmark_created' | 'bookmark_deleted' | 'bookmark_revisited' | 'export';
  videoId?: string;
  timestamp?: number;
  meta?: Record<string, unknown>;
  at: string;
}

export interface VideoMeta {
  videoId: string;
  title: string | null;
  duration?: number;
}

export interface SharePayload {
  videoId: string;
  videoTitle: string;
  bookmarks: Bookmark[];
}
