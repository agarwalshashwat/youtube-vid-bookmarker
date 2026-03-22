import type { Clipmark, UserProfile, SavedSearch } from '@clipmark/types';

export const API_BASE = 'https://clipmark-chi.vercel.app';

export function bmKey(videoId: string): string {
  return `bm_${videoId}`;
}

export function syncGet<T extends Record<string, unknown>>(defaults: T): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(defaults, r => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(r as T);
    });
  });
}

export function syncSet(data: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

export async function getVideoClipmarks(videoId: string): Promise<Clipmark[]> {
  const key = bmKey(videoId);
  const r = await syncGet({ [key]: [] as Clipmark[] });
  return r[key] as Clipmark[];
}

/** @deprecated Use getVideoClipmarks */
export const getVideoBookmarks = getVideoClipmarks;

export async function saveVideoClipmarks(videoId: string, clipmarks: Clipmark[]): Promise<void> {
  await syncSet({ [bmKey(videoId)]: clipmarks });
  // Best-effort cloud sync
  try {
    const { bmUser } = await syncGet({ bmUser: null as UserProfile | null });
    if (bmUser?.accessToken) {
      await fetch(`${API_BASE}/api/bookmarks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bmUser.accessToken}`,
        },
        body: JSON.stringify({ videoId, bookmarks: clipmarks }),
      });
    }
  } catch {
    // Best-effort
  }
}

/** @deprecated Use saveVideoClipmarks */
export const saveVideoBookmarks = saveVideoClipmarks;

export async function getAllClipmarks(): Promise<Clipmark[]> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, result => {
      if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
      const clipmarks: Clipmark[] = [];
      for (const [key, val] of Object.entries(result)) {
        if (key.startsWith('bm_') && Array.isArray(val)) clipmarks.push(...(val as Clipmark[]));
      }
      resolve(clipmarks);
    });
  });
}

/** @deprecated Use getAllClipmarks */
export const getAllBookmarks = getAllClipmarks;

export async function getVideoTitles(): Promise<Record<string, string>> {
  const r = await syncGet({ videoTitles: {} as Record<string, string> });
  return r.videoTitles || {};
}

export async function getVideoDurations(): Promise<Record<string, number>> {
  const r = await syncGet({ videoDurations: {} as Record<string, number> });
  return r.videoDurations || {};
}

export async function getUser(): Promise<UserProfile | null> {
  const r = await syncGet({ bmUser: null as UserProfile | null });
  return r.bmUser;
}

export async function checkPro(): Promise<boolean> {
  const user = await getUser();
  return user?.isPro === true;
}

export async function getSavedSearches(): Promise<SavedSearch[]> {
  const r = await syncGet({ savedSearches: [] as SavedSearch[] });
  return r.savedSearches;
}

export async function saveSavedSearch(name: string, query: string, sort: string): Promise<void> {
  const searches = await getSavedSearches();
  searches.push({ id: Date.now(), name, query, sort: sort as SavedSearch['sort'] });
  await syncSet({ savedSearches: searches });
}

export async function deleteSavedSearch(id: number): Promise<void> {
  const searches = await getSavedSearches();
  await syncSet({ savedSearches: searches.filter(s => s.id !== id) });
}
