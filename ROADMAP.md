# YouTube Video Bookmarker — Product Roadmap

> A Chrome extension that lets you bookmark timestamps in YouTube videos. Started as a local-only tool, evolving into a global, shareable, AI-powered product.

---

## Current State

| Property | Value |
|----------|-------|
| Type | Chrome Extension (Manifest V3) |
| Stack | Vanilla JS, no build step, no dependencies |
| Storage | `chrome.storage.sync` (per-video keys) |
| Platforms | YouTube only, Chrome only |
| Users | Solo — no accounts, no sharing |

---

## Phase 1 — Polish Core ✅ Done

> Goal: Make the existing extension delightful and worth telling others about. No backend needed.

### 1.1 UX Improvements
- [x] **One-click bookmark** — description is optional; auto-fills *"Bookmark at 1:23"* if left blank
- [x] **Inline edit** — click any bookmark's description in the popup to edit it in-place (Enter to save, Escape to cancel)
- [x] **Alt+S silent save** — press `Alt+S` on any YouTube video to instantly bookmark the current timestamp with a toast notification
- [x] **Alt+B** — opens popup (existing, via manifest `commands`)

### 1.2 Tags + Color Coding
- [x] **Tag parsing** — type `#important`, `#review`, `#todo` etc. in the description; tags are auto-extracted
- [x] **Named tag colors** — `#important` → red, `#review` → orange, `#note` → blue, `#question` → green, `#todo` → purple, `#key` → pink
- [x] **Custom tag colors** — unknown tags get a deterministic hash-based color
- [x] **Colored progress bar markers** — each marker on the YouTube progress bar reflects its bookmark's tag color
- [x] **Tag badges** — displayed on bookmark rows in popup and dashboard

### 1.3 Export / Import
- [x] **Export JSON** — full backup of all bookmarks
- [x] **Export CSV** — spreadsheet-friendly format
- [x] **Export Markdown** — timestamped clickable links, ready to paste into Notion/Obsidian
- [x] **Import JSON** — merge from a backup file (deduplicates by ID)

### 1.4 Cross-Device Sync
- [x] **`chrome.storage.sync`** — bookmarks now sync automatically across all Chrome instances where the user is signed in
- [x] **Per-video key architecture** — `bm_{videoId}` keys to stay within Chrome's 8KB per-item sync limit
- [x] **One-time migration** — existing `chrome.storage.local` bookmarks are silently migrated to sync on first popup open
- [x] **Debounced title saves** — fixed quota errors caused by YouTube's frequent DOM mutations
- [x] **Stale video element fix** — always queries fresh `document.querySelector('video')` to handle YouTube SPA navigation replacing the video element (was causing all timestamps to show 00:00)

### 1.5 Sort & Filter Dashboard
- [x] **Search** — filter by description, video title, or tag in real time
- [x] **Sort** — newest first / oldest first / by timestamp

### 1.6 Visual Redesign
- [x] **Minimal theme** — indigo accent (`#5865f2`), clean typography, ghost delete button, hairline scrollbar
- [x] **Popup** — compact logo header, filled input on focus, active-press button feedback
- [x] **Dashboard** — page header, card-based video sections, dark pill toasts

---

## Phase 2 — Richer Bookmarks 🔲 Not started

> Goal: More power without adding a backend.

- [ ] **Auto-fill from YouTube chapters** — detect YouTube chapter markers in the DOM and pre-fill the description with the current chapter name when bookmarking
- [ ] **Bulk delete** — checkbox-select multiple bookmarks and delete all at once in the dashboard
- [ ] **Bookmark reordering** — drag to reorder bookmarks within a video
- [ ] **Copy timestamped link** — one-click copy of `youtube.com/watch?v=...&t=...` to clipboard
- [ ] **Marker clustering** — when >8 markers overlap on the progress bar, cluster them to avoid visual noise
- [ ] **Google Drive backup** — optional "Back up to Google Drive" using Google Picker API (no server needed, user owns their data)

---

## Phase 3 — Sharing & Social ✅ Partially done

> Goal: Make bookmarks shareable — the core virality mechanic. **Requires a backend.**

### 3.1 Shareable Public Pages ⭐ Biggest unlock ✅ Done
- [x] Public URL per share ID: `bookmarker.app/v/{shareId}`
- [x] Page shows video title + clickable timestamp timeline
- [x] Any visitor can click a bookmark → opens YouTube at that exact moment
- [x] **"↗ Share" button** in popup — POSTs to `/api/share`, saves collection to Supabase, copies URL to clipboard
- [x] Next.js 14 webapp with Supabase (PostgreSQL + JSONB) backend
- [x] View count tracking per shared collection
- [x] **Viral loop**: every user becomes a distribution channel when they share a "curated guide" to a video

### 3.2 User Accounts
- [ ] Sign in with Google (OAuth)
- [ ] Bookmarks stored in cloud, synced everywhere
- [ ] Public profile: `bookmarker.app/@username` — all public collections

### 3.3 Collaboration (Teams)
- [ ] Shared collections — invite teammates to annotate a video together
- [ ] Comments on individual bookmarks
- [ ] Real-time sync (like Google Docs for video)
- [ ] Use cases: design reviews, QA on recorded sessions, team training

### 3.4 Embed Widget
- [ ] `<iframe>` embed of a bookmark collection for blogs and course platforms
- [ ] Course creators can embed "chapter guides" on their own sites

---

## Phase 4 — AI Features ✅ Partially done

> Goal: Make the product intelligent — move from "manual notes" to "smart notes".

### 4.1 Auto-Description from Transcript ✅ Done
- [x] Reads `ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks` from page DOM
- [x] Fetches JSON3 caption track — prefers English ASR → English manual → any → first available
- [x] Extracts and cleans spoken text in a ~5s window around the bookmarked timestamp (1s before, 4s after)
- [x] **"✦ Auto" button** in popup pre-fills description field; user edits or accepts
- [x] **Alt+S silent save** now uses transcript text instead of generic "Bookmark at M:SS"
- [x] Transcript is cached per-video; cache invalidates automatically on SPA navigation

### 4.2 AI Summary of Bookmarks
- [ ] "Summarize this video based on my bookmarks" — send bookmark descriptions + timestamps to Claude API
- [ ] Returns structured summary: key topics, decisions, action items
- [ ] Export to Markdown / email / Notion

### 4.3 Smart Tagging
- [ ] Auto-suggest tags based on description text and surrounding transcript
- [ ] Cluster bookmarks by topic across multiple videos

### 4.4 Semantic Search
- [ ] "Find all bookmarks where they mention authentication"
- [ ] Full-text + semantic search across all bookmark descriptions and transcript context

---

## Phase 5 — Platform Expansion 🔲 Not started

> Goal: Reach users beyond YouTube and Chrome.

### 5.1 Multi-Platform Video Support
- [ ] **Vimeo** — large professional/creative audience
- [ ] **Twitch VODs** — developer and gaming streams
- [ ] **Loom** — async video messaging, massive enterprise use case
- [ ] **Twitter/X Videos** — social video
- [ ] Architecture: make `content.js` platform-agnostic with site-specific adapters

### 5.2 Multi-Browser
- [ ] **Firefox** — WebExtensions API is mostly compatible with MV3
- [ ] **Safari** — Safari App Extension (requires Xcode)
- [ ] **Edge** — already compatible with Chrome extensions, just needs publishing

### 5.3 Web App
- [ ] Dashboard accessible at `bookmarker.app` without the extension
- [ ] Mobile-optimized for viewing shared collections
- [ ] No video playback needed — just timestamped links and notes

---

## Phase 6 — Integrations 🔲 Not started

> Goal: Fit into users' existing productivity stacks.

| Integration | Value |
|-------------|-------|
| **Notion** | Push bookmarks as Notion database rows via API |
| **Obsidian** | Export as `.md` files directly to vault folder |
| **Roam Research** | Block-reference compatible Markdown export |
| **Zapier / Make** | Trigger automations when a bookmark is added |
| **Slack** | Bot that posts bookmarks to a channel |
| **Email digest** | Weekly summary of bookmarks added |

---

## Monetization Strategy 🔲 Not started

| Tier | Price | What's included |
|------|-------|-----------------|
| **Free** | $0 | Unlimited bookmarks, Chrome sync, 5 public shared collections, JSON/CSV/MD export |
| **Pro** | ~$5/mo | Unlimited public collections, AI auto-descriptions + summaries, all integrations, multi-platform support |
| **Teams** | ~$12/user/mo | Shared collections, collaborative annotation, admin dashboard, SSO/Google Workspace |

---

## Build Order Recommendation

```
DONE
  ✅ Phase 1    Polish core (UX, tags, export, sync, redesign)
  ✅ Phase 3.1  Shareable public pages (Next.js + Supabase)
  ✅ Phase 4.1  AI auto-description from transcript

NEXT  (no backend, fast to ship)
  → Phase 2    Bulk delete, chapter auto-fill, Drive backup, copy link

THEN  (grow user base)
  → Phase 3.2  User accounts (Google OAuth)
  → Deploy webapp to Vercel + point API_BASE at production URL

LATER  (monetize)
  → Phase 4.2–4.4  AI summaries + smart tagging + semantic search
  → Phase 3.3      Teams / collaboration
  → Phase 5        Multi-platform + multi-browser
  → Phase 6        Integrations
```

---

## Target Users

| Segment | Use Case |
|---------|----------|
| Students | Bookmark lecture moments to review before exams |
| Researchers | Mark evidence clips in documentaries and interviews |
| Developers | Save progress in long tutorial series |
| Content creators | Reference and annotate competitor content |
| Teams | Collaborative review of recorded meetings, design walkthroughs, QA sessions |
| Course creators | Build shareable chapter guides for their videos |
