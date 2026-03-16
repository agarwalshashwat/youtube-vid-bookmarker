# YouTube Video Bookmarker — Product Roadmap

> A Chrome extension that lets you bookmark timestamps in YouTube videos. Started as a local-only tool, evolving into a global, shareable, AI-powered product.

---

## Current State

| Property | Value |
|----------|-------|
| Type | Chrome Extension (Manifest V3) + Next.js 14 webapp |
| Stack | Vanilla JS extension · Next.js + TypeScript + Supabase backend |
| Storage | `chrome.storage.sync` (local) + Supabase `user_bookmarks` (cloud, when signed in) |
| Platforms | YouTube only, Chrome only |
| Users | Accounts via Google OAuth · public shareable pages · public profiles |

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

## Phase 2 — Richer Bookmarks ✅ Mostly done

> Goal: More power without adding a backend.

- [x] **Auto-fill from YouTube chapters** — reads `.ytp-chapter-title-content` from DOM; used as fallback in `✦ Auto` button and `Alt+S` silent save
- [x] **Bulk delete** — checkbox overlay on cards / inline in list view; "Delete (N)" button appears in dashboard toolbar when items are selected
- [ ] **Bookmark reordering** — drag to reorder bookmarks within a video *(deferred — needs drag-and-drop)*
- [x] **Copy timestamped link** — ⎘ button on every bookmark in popup and dashboard (both card + list views)
- [x] **Marker clustering** — when >8 bookmarks on a video, nearby markers (within 0.8% of duration) merge into a wider cluster marker with multi-line tooltip
- [ ] **Google Drive backup** — optional "Back up to Google Drive" using Google Picker API *(deferred — needs OAuth)*
- [x] **YouTube player bookmark button** *(bonus)* — bookmark icon injected into `.ytp-right-controls`, pulse animation on save; same as `Alt+S`

---

## Phase 3 — Sharing & Social ✅ Mostly done

> Goal: Make bookmarks shareable — the core virality mechanic. **Requires a backend.**

### 3.1 Shareable Public Pages ⭐ Biggest unlock ✅ Done
- [x] Public URL per share ID: `bookmarker.app/v/{shareId}`
- [x] Page shows video title + clickable timestamp timeline
- [x] Any visitor can click a bookmark → opens YouTube at that exact moment
- [x] **"↗ Share" button** in popup — POSTs to `/api/share`, saves collection to Supabase, copies URL to clipboard
- [x] Next.js 14 webapp with Supabase (PostgreSQL + JSONB) backend
- [x] View count tracking per shared collection
- [x] **Viral loop**: every user becomes a distribution channel when they share a "curated guide" to a video

### 3.2 User Accounts ✅ Done
- [x] **Sign in with Google (OAuth)** — extension opens `/signin?extensionId=...`, webapp completes OAuth, sends token back via `chrome.runtime.sendMessage`; stored as `bmUser` in sync storage
- [x] **Sign in / Sign out UI** — `signin-btn` + `user-chip` in popup header; `loadAuthState()` reads `bmUser`
- [x] **Public profile page** — `bookmarker.app/u/[username]` shows avatar, username, collection grid with thumbnails + bookmark snippets (auto-created via Supabase trigger on signup)
- [x] **Cloud bookmark sync** — `PUT /api/bookmarks` upserts per-video bookmarks to `user_bookmarks` table; called automatically after every save/delete when signed in; Bearer token auth for extension requests

### 3.3 Collaboration (Teams) *(deferred — too complex for now)*
- [ ] Shared collections — invite teammates to annotate a video together
- [ ] Comments on individual bookmarks
- [ ] Real-time sync (Supabase Realtime)
- [ ] Use cases: design reviews, QA on recorded sessions, team training

### 3.4 Embed Widget ✅ Done
- [x] `<iframe>`-friendly page at `bookmarker.app/embed/[shareId]` — compact layout with bookmark list, Watch link, powered-by footer
- [x] `next.config.mjs` sets `X-Frame-Options: ALLOWALL` and `Content-Security-Policy: frame-ancestors *` for `/embed/*`

---

## Phase 4 — AI Features ✅ Mostly done

> Goal: Make the product intelligent — move from "manual notes" to "smart notes".

### 4.1 Auto-Description from Transcript ✅ Done
- [x] Reads `ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks` from page DOM
- [x] Fetches JSON3 caption track — prefers English ASR → English manual → any → first available
- [x] Extracts and cleans spoken text in a ~5s window around the bookmarked timestamp (1s before, 4s after)
- [x] **"✦ Auto" button** in popup pre-fills description field; user edits or accepts
- [x] **Alt+S silent save** now uses transcript text instead of generic "Bookmark at M:SS"
- [x] Transcript is cached per-video; cache invalidates automatically on SPA navigation

### 4.2 AI Summary of Bookmarks ✅ Done
- [x] **"✦ Summary" button** in popup header — sends bookmarks to `POST /api/summarize`
- [x] Returns structured result: overview paragraph, key topics list, action items list
- [x] Inline panel in popup (collapsible); uses `claude-haiku-4-5` for speed
- [ ] Export to Markdown / email / Notion *(future)*

### 4.3 Smart Tagging ✅ Done
- [x] **Auto-suggest tags** after ✦ Auto fill — calls `POST /api/suggest-tags` with description + transcript
- [x] Suggested tags appear as clickable color chips; click to append `#tag` to description
- [x] Prefers named tags (important, review, note, question, todo, key); falls back to custom tags
- [ ] Cluster bookmarks by topic across multiple videos *(future)*

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
  ✅ Phase 2    Bulk delete, chapter auto-fill, copy link, player button, marker clustering
  ✅ Phase 3.1  Shareable public pages (Next.js + Supabase)
  ✅ Phase 3.2  User accounts + cloud bookmark sync
  ✅ Phase 3.4  Embed widget (/embed/[shareId])
  ✅ Phase 4.1  AI auto-description from transcript
  ✅ Phase 4.2  AI summary panel in popup (Claude Haiku)
  ✅ Phase 4.3  Smart tag suggestions after auto-fill

NEXT  (go live)
  → Deploy webapp to Vercel + point API_BASE at production URL
  → Run Supabase migration for user_bookmarks table (Phase 3.2 schema)
  → Add ANTHROPIC_API_KEY to Vercel env vars (Phase 4.2/4.3)

LATER  (monetize)
  → Phase 4.4  Semantic search across bookmarks
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
