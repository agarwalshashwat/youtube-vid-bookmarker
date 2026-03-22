export function sendMessageToTab(tabId: number, message: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Failed to communicate'));
      } else if (response && (response as Record<string, unknown>).error) {
        reject(new Error((response as Record<string, unknown>).error as string));
      } else {
        resolve(response);
      }
    });
  });
}

export async function waitForContentScript(tabId: number, maxRetries = 3, delay = 1000): Promise<true> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const r = await sendMessageToTab(tabId, { action: 'ping' }) as { status?: string } | null;
      if (r && r.status === 'ready') return true;
    } catch {
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Content script not available. Please refresh the YouTube page.');
}

export async function getCurrentTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
