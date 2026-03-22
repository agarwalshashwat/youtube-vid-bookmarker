import type { Clipmark } from '@clipmark/types';
import { parseTags, getTagColor } from './tags.js';
import { formatTimestamp } from './format.js';
import { getVideoClipmarks, saveVideoClipmarks, getVideoTitles, syncGet, syncSet, bmKey } from './storage.js';
import { getCurrentTab, waitForContentScript, sendMessageToTab } from './messaging.js';
import { analytics } from './analytics.js';

export interface SaveClimarkInput {
  videoId: string;
  timestamp: number;
  description: string;
  duration?: number;
}

/** @deprecated Use SaveClimarkInput */
export type SaveBookmarkInput = SaveClimarkInput;

export type SaveResult =
  | { ok: true; clipmark: Clipmark }
  | { ok: false; error: string };

export async function createClipmark(input: SaveClimarkInput): Promise<SaveResult> {
  const tab = await getCurrentTab();
  if (!tab?.url?.includes('youtube.com/watch')) {
    return { ok: false, error: 'Please navigate to a YouTube video first!' };
  }

  try {
    await waitForContentScript(tab.id!);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const existing = await getVideoClipmarks(input.videoId);
  if (existing.some(b => Math.floor(b.timestamp) === Math.floor(input.timestamp))) {
    return { ok: false, error: 'A clipmark already exists at this timestamp.' };
  }

  let description = input.description.trim();

  if (!description) {
    try {
      const txRes = await sendMessageToTab(tab.id!, {
        action: 'getTranscriptAtTimestamp',
        timestamp: input.timestamp,
      }) as { text?: string } | null;
      if (txRes?.text) description = txRes.text;
    } catch {}

    if (!description) {
      try {
        const chRes = await sendMessageToTab(tab.id!, { action: 'getCurrentChapter' }) as { chapter?: string } | null;
        if (chRes?.chapter) description = chRes.chapter;
      } catch {}
    }

    if (!description) {
      description = `Clipmark at ${formatTimestamp(input.timestamp)}`;
    }
  }

  const tags = parseTags(description);
  const color = getTagColor(tags);
  const videoTitles = await getVideoTitles();

  const clipmark: Clipmark = {
    id: Date.now(),
    videoId: input.videoId,
    timestamp: input.timestamp,
    description,
    tags,
    color,
    createdAt: new Date().toISOString(),
    videoTitle: videoTitles[input.videoId] || null,
    reviewSchedule: [1, 3, 7],
    lastReviewed: null,
    duration: input.duration,
  };

  const clipmarks = await getVideoClipmarks(input.videoId);
  clipmarks.push(clipmark);
  await saveVideoClipmarks(input.videoId, clipmarks);

  if (input.duration) {
    const vd = (await syncGet({ videoDurations: {} as Record<string, number> })).videoDurations;
    vd[input.videoId] = input.duration;
    await syncSet({ videoDurations: vd });
  }

  try { await sendMessageToTab(tab.id!, { action: 'showSaveFlash' }); } catch {}

  analytics.clipmarkCreated(input.videoId);

  return { ok: true, clipmark };
}

/** @deprecated Use createClipmark */
export const createBookmark = async (input: SaveClimarkInput) => {
  const result = await createClipmark(input);
  if (result.ok) return { ok: true as const, bookmark: result.clipmark };
  return result;
};

export async function deleteClipmark(videoId: string, clipmarkId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const key = bmKey(videoId);
    chrome.storage.sync.get({ [key]: [] }, result => {
      if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
      const updated = (result[key] as Clipmark[]).filter(b => b.id !== clipmarkId);
      chrome.storage.sync.set({ [key]: updated }, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else {
          analytics.clipmarkDeleted(videoId);
          resolve();
        }
      });
    });
  });
}

/** @deprecated Use deleteClipmark */
export const deleteBookmark = deleteClipmark;

export async function updateClipmark(videoId: string, clipmarkId: number, patch: Partial<Clipmark>): Promise<void> {
  return new Promise((resolve, reject) => {
    const key = bmKey(videoId);
    chrome.storage.sync.get({ [key]: [] }, result => {
      if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
      const updated = (result[key] as Clipmark[]).map(b => b.id === clipmarkId ? { ...b, ...patch } : b);
      chrome.storage.sync.set({ [key]: updated }, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      });
    });
  });
}

/** @deprecated Use updateClipmark */
export const updateBookmark = updateClipmark;

export async function markClipmarkRevisited(videoId: string, clipmarkId: number, timestamp: number): Promise<void> {
  await updateClipmark(videoId, clipmarkId, { lastReviewed: new Date().toISOString() });
  analytics.clipmarkRevisited(videoId, timestamp);
}

/** @deprecated Use markClipmarkRevisited */
export const markBookmarkRevisited = markClipmarkRevisited;
