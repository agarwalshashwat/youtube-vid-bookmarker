# Clipmark — YouTube Video Bookmarker

> **Turn long YouTube videos into searchable, revisable knowledge.**

A Chrome extension + Next.js webapp that lets you bookmark timestamps in YouTube videos, replay only what matters, and share structured knowledge with the world.

Live at **[clipmark-chi.vercel.app](https://clipmark-chi.vercel.app)**

---

## Who is it for?

### Developers — Interview & Tutorial Recap
You have a system design interview tomorrow. You're not watching that 2-hour lecture again.

Open your bookmarks, hit **▶ Revisit Mode**, and the extension plays only your saved clips — back to back, automatically. `2 hours → 6 minutes`.

### Students — Lecture Revisit
A 1.5-hour physics lecture has 20 minutes of content worth revisiting. Clipmark plays only those moments. And **Spaced Revisit** resurfaces your bookmarks 1, 3, and 7 days later — like flashcards for video.

### Tech Creators — Content to Posts
You watched a 3-hour podcast. You want a LinkedIn post and a shareable guide. Bookmark the key moments, hit **✍ Post**, and AI writes a platform-tuned caption with a share link attached. One session becomes a published post, a newsletter section, and a replayable guide.

---

## Features

### Core Bookmarking
- **One-click save** — description is optional; auto-fills from transcript, chapter title, or "Bookmark at M:SS"
- **Alt+B silent save** — instantly bookmark the current moment from any YouTube video
- **Ctrl+Shift+S / Cmd+Shift+S** — quick save bookmark
- **Player button** — bookmark icon injected into the YouTube player controls
- **Visual progress bar markers** — colored markers appear on the YouTube seek bar; clusters when >8 bookmarks
- **Inline edit** — click any description to edit in-place

### Tags & Colors
- **`#tag` syntax** — type `#important`, `#review`, `#key`, etc. in descriptions
- **Named tag colors** — `important` → red, `review` → orange, `note` → blue, `question` → green, `todo` → purple, `key` → pink
- **Custom tags** — unknown tags get a deterministic hash-based color
- **Colored markers** — each progress bar marker reflects its bookmark's tag color

### AI Features (Pro)
- **✦ Auto** button — pre-fills description from the video's live transcript at the current timestamp
- **✦ Summary** — AI-generated overview, key topics, and action items for your bookmarks (Claude Haiku)
- **Smart tag suggestions** — after auto-fill, AI suggests relevant tags as clickable chips
- **✍ Post** — generate platform-tuned posts for X/Twitter, LinkedIn, or Threads from your bookmarks

### Revisit & Learning
- **Revisit Mode** — "▶ Revisit" button on every video card in the dashboard; opens the video and plays each bookmarked segment sequentially (default 60s clips) with a HUD overlay showing clip progress and countdown to the next clip
- **Spaced Revisit** — bookmarks are scheduled for review at 1, 3, and 7 days after creation; a "📚 Revisit Today" panel appears in the popup whenever reviews are due
- **Custom revisit reminders** — set a per-video reminder interval (e.g. every 3 days); stored in `chrome.storage.sync` as `rem_{videoId}`; popup shows the next due date with change/clear controls

### Dashboard
- **Editorial card layout** — each video gets a two-column card: left panel with rounded thumbnail (gradient overlay, YouTube badge, duration, hover play button), visual timeline scrubber with colored dots, and Revisit/Group action buttons; right panel with large title, bookmark count/date metadata, and a vertical timeline thread of all bookmarks
- **Vertical bookmark timeline** — single connecting thread line with colored dot markers, timestamp badges, type labels ("ANNOTATED BOOKMARK" / "QUICK CLIP"), and hover-reveal action buttons; collapse/expand cards with more than 3 bookmarks
- **Timeline view** — chronological view of all bookmarks across all videos with month/year markers
- **Groups view** — playlist-style grouping of videos; create/rename/delete groups, add any video to multiple groups
- **Search & sort** — filter by description, title, or tag; sort newest/oldest/timestamp
- **Card, timeline, and groups view toggle**
- **Bulk delete** — checkbox selection with a "Delete (N)" action

### Side Panel
- **Persistent side panel** — access bookmarks alongside any YouTube video without leaving the page

### Export & Import
- **Export JSON / CSV / Markdown** — full backup or paste-ready timestamped links
- **Import JSON** — merge from backup, deduplicates by ID

### Sync & Sharing
- **`chrome.storage.sync`** — bookmarks sync automatically across all your Chrome instances
- **↗ Share** — publish bookmarks for any video to a public URL (`/v/{shareId}`)
- **Public profile** — `/u/[username]` page with avatar and collection grid
- **Embed widget** — `<iframe>`-embeddable page at `/embed/{shareId}`
- **Cloud sync** — bookmarks pushed to Supabase when signed in (Bearer token auth)
- **Sign in with Google** — OAuth flow through the webapp; token stored in extension sync storage

### Pro & Monetization
- **✦ Pro upgrade button** — always-visible in popup header; opens `/upgrade` page; hidden when already Pro
- **Upgrade page** — Free / Pro Monthly ($5/mo) / Pro Annual ($40/yr) pricing cards with feature comparison
- **Dodo Payments** — Merchant of Record checkout; handles VAT/global tax compliance
- **Webhook sync** — `POST /api/webhooks/dodo` sets `is_pro` on Supabase profile in real time

---

## Project Structure

```
clipmark/
├── extension/                     # Chrome Extension (Manifest V3)
│   ├── manifest.json              # MV3 config — permissions, commands, host_permissions
│   ├── vite.config.ts             # Vite + @crxjs/vite-plugin build config
│   ├── tsconfig.json              # TypeScript config for React UI
│   ├── assets/icons/              # Extension icons (16/48/128px + logo)
│   ├── src/
│   │   ├── background/
│   │   │   └── background.js      # Service worker: auth token storage, messaging (vanilla JS)
│   │   ├── content/
│   │   │   └── content.js         # YouTube page: markers, keyboard shortcuts, revisit mode (vanilla JS)
│   │   ├── pages/
│   │   │   ├── bookmarks.html     # Dashboard entry point (React)
│   │   │   └── side-panel.html    # Side panel entry point (React)
│   │   ├── side-panel/            # React app — side panel UI
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   └── components/        # Header, SaveMoment, BookmarkList, AISummaryPanel, …
│   │   ├── dashboard/             # React app — bookmarks dashboard
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── useDashboard.ts    # Central state hook (filter, sort, view, selection)
│   │   │   └── components/        # CardsView, TimelineView, GroupsView, AnalyticsView, …
│   │   └── shared/
│   │       └── components/        # Shared React components (BookmarkItem, TagBadge, Toast)
│   └── styles/
│       ├── side-panel.css         # Side panel styles
│       ├── bookmarks.css          # Dashboard styles
│       └── design-tokens.css      # Shared CSS design tokens
│
├── packages/
│   ├── types/                     # Shared TypeScript interfaces (Bookmark, UserProfile, …)
│   ├── core/                      # Shared utilities for extension React UI
│   │   └── src/
│   │       ├── tags.ts            # TAG_COLORS, parseTags, getTagColor
│   │       ├── format.ts          # formatTimestamp, relativeTime, extractVideoId
│   │       ├── storage.ts         # bmKey, syncGet/Set, getAllBookmarks, getVideoBookmarks
│   │       ├── messaging.ts       # sendMessageToTab, waitForContentScript
│   │       ├── bookmarks.ts       # createBookmark, deleteBookmark, updateBookmark
│   │       └── analytics.ts       # Local analytics (chrome.storage.local, 500-event window)
│   └── design-system/             # Shared design tokens (extension + webapp)
│
├── webapp/                        # Next.js 14 + Supabase
│   ├── app/
│   │   ├── api/
│   │   │   ├── share/             # POST — store bookmark collection, return shareId
│   │   │   ├── bookmarks/         # PUT  — upsert per-video bookmarks (cloud sync)
│   │   │   ├── summarize/         # POST — AI summary via Claude Haiku
│   │   │   ├── suggest-tags/      # POST — AI tag suggestions via Claude Haiku
│   │   │   ├── generate-post/     # POST — AI social post via Claude Haiku
│   │   │   └── webhooks/dodo/     # POST — Dodo Payments webhook → update is_pro
│   │   ├── upgrade/               # Pricing page + Server Action checkout
│   │   ├── v/[shareId]/           # Public shared collection page
│   │   ├── embed/[shareId]/       # Embeddable iframe page
│   │   ├── u/[username]/          # Public user profile page
│   │   └── auth/                  # Google OAuth callback + extension handoff
│   ├── lib/
│   │   └── supabase.ts
│   ├── migrations/                # SQL schema migrations
│   └── middleware.ts
```

---

## Storage Schema

Bookmarks are stored per-video in `chrome.storage.sync`:

```js
// Key: "bm_{videoId}"  →  Value: Bookmark[]
{
  id:             number,     // Date.now() — also creation sort key
  videoId:        string,
  timestamp:      number,     // seconds (float)
  description:    string,
  tags:           string[],   // parsed from #tag in description
  color:          string,     // derived from first tag
  createdAt:      string,     // ISO date
  videoTitle:     string,
  reviewSchedule: number[],   // days after creation to resurface [1, 3, 7]
  lastReviewed:   string|null // ISO date of last spaced-revisit interaction
}

// Key: "rem_{videoId}"  →  Value: RevisitReminder
{
  days:     number,  // user-defined revisit interval in days
  nextDue:  string,  // ISO date of next reminder
  setAt:    string,  // ISO date reminder was created/updated
}

// Key: "vgroups"  →  Value: VideoGroup[]
{
  id:       string,    // uuid
  name:     string,    // group label
  videoIds: string[],  // list of videoIds in this group
}
```

---

## Installation

### Load unpacked (development)
```bash
npm install               # install all workspace dependencies
make ext-build            # bundle extension with Vite → extension/dist/
```
1. Go to `chrome://extensions/` → enable **Developer mode**
2. Click **Load unpacked** → select `extension/dist/`

For HMR during extension UI development:
```bash
make ext-dev              # vite dev server (auto-reloads on save)
```

### Run the webapp locally
```bash
cd webapp
npm install
# Add .env.local:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   ANTHROPIC_API_KEY
#   NEXT_PUBLIC_APP_URL=http://localhost:3000
#   DODO_PAYMENTS_API_KEY
#   DODO_PAYMENTS_WEBHOOK_SECRET
#   DODO_MONTHLY_PRODUCT_ID
#   DODO_ANNUAL_PRODUCT_ID
#   DODO_LIFETIME_PRODUCT_ID
npm run dev
```

Update `API_BASE` at the top of `packages/core/src/storage.ts` to `http://localhost:3000` for local development.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+B`  | Silent-save bookmark at current timestamp |
| `Ctrl+Shift+S` / `Cmd+Shift+S` | Quick save bookmark |

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Extension UI | React 18, TypeScript, Vite + @crxjs/vite-plugin |
| Extension logic | Vanilla JS (content.js, background.js — Chrome MV3) |
| Shared packages | `@clipmark/types` (TypeScript interfaces), `@clipmark/core` (utilities + analytics) |
| Webapp | Next.js 14, TypeScript |
| Database | Supabase (PostgreSQL + JSONB) |
| Auth | Google OAuth via Supabase |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| Payments | Dodo Payments (Merchant of Record) |
| Hosting | Vercel |

---

## License

MIT
