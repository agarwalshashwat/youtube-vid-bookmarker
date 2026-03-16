# Clipmark — Product Roadmap

> Turn long YouTube videos into searchable, revisable knowledge.

---

## Current State

| Property | Value |
|----------|-------|
| Product name | Clipmark |
| Type | Chrome Extension (Manifest V3) + Next.js 14 webapp |
| Stack | Vanilla JS extension · Next.js + TypeScript + Supabase |
| Storage | `chrome.storage.sync` + Supabase `user_bookmarks` (when signed in) |
| Auth | Google OAuth via Supabase; token stored in sync storage |
| AI | Claude Haiku — transcript auto-fill, summaries, tag suggestions, social posts |
| Live at | https://clipmark-chi.vercel.app |

---

## Phase 1 — Core Extension ✅ Done

> Build a bookmarking tool worth using every day on YouTube.

- [x] One-click bookmark — description optional; auto-fills from transcript → chapter → "Bookmark at M:SS"
- [x] Inline edit — click any description in the popup to edit in-place
- [x] **Alt+S** silent save — instant bookmark with toast confirmation
- [x] **Alt+B** — opens popup (manifest `commands`)
- [x] Tag parsing — `#important`, `#review`, `#todo` etc. auto-extracted from descriptions
- [x] Named tag colors — important → red, review → orange, note → blue, question → green, todo → purple, key → pink
- [x] Custom tag colors — unknown tags get a deterministic hash-based color
- [x] Colored progress bar markers — each marker reflects its bookmark's tag color
- [x] Export JSON / CSV / Markdown — full backup or paste-ready timestamped links
- [x] Import JSON — merge from backup, deduplicates by ID
- [x] `chrome.storage.sync` — per-video key architecture (`bm_{videoId}`), one-time migration from local
- [x] YouTube player bookmark button — injected into `.ytp-right-controls`, pulse animation on save
- [x] Visual save flash — sparkle overlay on player frame (~700ms)
- [x] Marker clustering — nearby markers merge into a cluster when >8 bookmarks on a video
- [x] Copy timestamped link — ⎘ button on every bookmark
- [x] Bulk delete — checkbox selection with "Delete (N)" action in dashboard toolbar

---

## Phase 2 — Dashboard ✅ Done

> A full-page view of all bookmarks, organized and explorable.

- [x] Video-grouped card view — cinematic thumbnail, visual timeline scrubber with colored dots, bookmark rows
- [x] Timeline view — chronological view of all bookmarks across all videos; alternating left/right layout with month/year markers
- [x] Search — filter by description, video title, or tag in real time
- [x] Sort — newest first / oldest first / by timestamp
- [x] Card and timeline view toggle
- [x] Dark theme with teal + purple palette — `#0F172A` base, `#1E293B` surfaces, `#14B8A6` accent, `#8B5CF6` secondary

---

## Phase 3 — Backend & Sharing ✅ Done

> Make bookmarks shareable and add cloud sync.

- [x] **↗ Share** — publishes bookmarks for a video to a public URL (`/v/{shareId}`)
- [x] Public share page — video title + clickable timestamp list, any visitor can jump to the moment
- [x] View count tracking per shared collection
- [x] Embed widget — `<iframe>`-embeddable page at `/embed/{shareId}`
- [x] **Sign in with Google** — extension opens OAuth flow in webapp, token sent back via `chrome.runtime.sendMessage`
- [x] Public profile page — `/u/[username]` with avatar and collection grid
- [x] Cloud bookmark sync — `PUT /api/bookmarks` upserts to Supabase `user_bookmarks` on every save/delete
- [x] **✍ Post** — AI-generated social post for X/Twitter, LinkedIn, or Threads from current video's bookmarks (Pro)

---

## Phase 4 — AI Features ✅ Done

> Move from manual notes to smart notes.

- [x] **✦ Auto** — pre-fills description from live transcript at current timestamp (Claude Haiku)
- [x] Transcript cached per-video; invalidates on SPA navigation
- [x] Auto-transcript on all empty saves — same chain used for Alt+S silent save
- [x] **✦ Summary** — AI overview, key topics, and action items for current video's bookmarks
- [x] Smart tag suggestions — after Auto fill, AI suggests relevant tags as clickable chips
- [x] Pro paywall — `is_pro` flag on profiles; Summary, Tags, Social gated behind Pro

---

## Phase 5 — Revision & Learning ✅ Done

> Turn bookmarks into a study tool.

- [x] **▶ Revision Mode** — plays each bookmarked segment sequentially (default 60s clips) with HUD overlay showing clip progress and countdown
- [x] `pendingRevision` stored in `chrome.storage.local`; content script picks it up when the YouTube tab loads
- [x] **Spaced Revision** — bookmarks store `reviewSchedule: [1, 3, 7]` (days after creation); popup shows "📚 Revision Today" panel when reviews are due
- [x] Clicking a due item marks it reviewed and navigates to the timestamp

---

## Phase 6 — Polish & UX ✅ Done

> Make every pixel intentional.

- [x] Popup redesign — dark-first palette, rounded popup card, fused input+auto button
- [x] Quick tag chips — `#important`, `#note`, `#review`, `#idea` one-click insert below input
- [x] Title shimmer — skeleton animation while video title loads
- [x] Save button renamed "Save Moment" — more emotionally resonant
- [x] Sign-in as icon button — SVG person icon keeps header from overflowing
- [x] Header separator — feature pills (Summary/Share/Post) visually separated from nav/auth

---

## Phase 7 — Monetization 🔲 Next

> Convert free users to paying ones.

### Pricing Tiers

| Tier | Price | Notes |
|------|-------|-------|
| **Free** | $0 | Core bookmarking, local storage, limited sharing |
| **Pro Monthly** | $5 / month | Full feature access |
| **Pro Annual** | $40 / year (~$3.33/mo) | Launch offer: same price as lifetime deal |
| ~~**Lifetime**~~ | ~~$40 one-time~~ | *Initial launch offer — will transition to annual after traction* |

### Free Tier Limits
- Unlimited local bookmarks
- 5 public shared collections
- No AI features (Auto, Summary, Tags, Social Post)
- No Revision Mode export

### Pro Tier Unlocks
- Unlimited shared collections
- AI auto-fill, summaries, smart tag suggestions
- Social post generation (X, LinkedIn, Threads)
- Revision Mode
- Priority support

### Implementation Tasks
- [ ] Supabase migration: `ALTER TABLE profiles ADD COLUMN is_pro BOOLEAN DEFAULT false`
- [ ] Stripe integration — `/api/checkout` creates a Stripe session; webhook sets `is_pro = true` on payment
- [ ] Stripe products: Monthly ($5), Annual ($40), Lifetime ($40, limited-time)
- [ ] Pro upgrade prompt — shown when user hits a Pro-gated feature without a subscription
- [ ] Upgrade page at `/upgrade` — tier comparison table + Stripe checkout CTA
- [ ] Lifetime → Annual migration logic for when lifetime offer ends

---

## Phase 8 — Growth 🔲 Later

> Reach users beyond YouTube and Chrome.

### Distribution
- [ ] Chrome Web Store listing — screenshots, description, keyword optimization
- [ ] Submit to Firefox Add-ons (WebExtensions API is mostly MV3-compatible)
- [ ] Edge Add-ons (Chrome extension already compatible — just needs publishing)

### Platform Expansion
- [ ] Vimeo support — large professional/creative audience
- [ ] Loom support — async video messaging, massive enterprise use case
- [ ] Architecture: make `content.js` platform-agnostic with site-specific adapters

### Integrations
- [ ] Notion — push bookmarks as database rows via API
- [ ] Obsidian — export as `.md` files directly to vault
- [ ] Zapier / Make — trigger automations when a bookmark is added
- [ ] Email digest — weekly summary of bookmarks added

### Collaboration
- [ ] Shared collections — invite teammates to annotate a video together
- [ ] Comments on individual bookmarks
- [ ] Real-time sync (Supabase Realtime)

---

## Immediate Next Steps

```
→ Run Supabase migration: ALTER TABLE profiles ADD COLUMN is_pro BOOLEAN DEFAULT false
→ Deploy webapp to Vercel (push to main under webapp/ root)
→ Confirm ANTHROPIC_API_KEY + NEXT_PUBLIC_APP_URL set in Vercel env vars
→ Set up Stripe for Phase 7 monetization
```

---

## Product Positioning

> **Turn long YouTube videos into searchable, revisable knowledge.**

Videos are long. The knowledge inside them is not searchable or revisable by default.
Clipmark turns passive watching into structured, replayable notes — then resurfaces them when you need them most.

---

## Primary Personas

### 1. Developers — Interview & Tutorial Recap
**Problem:** A 2-hour system design lecture is too long to re-watch the night before an interview.
**Solution:** Bookmark key concepts → Revision Mode plays only those clips. `2 hours → 6 minutes`.
**Key features:** Revision Mode, Spaced Revision, tags, AI auto-fill

### 2. Students — Lecture Revision & Exam Prep
**Problem:** A 1.5-hour physics lecture has 20 minutes of examinable content scattered throughout.
**Solution:** Bookmark important moments → Revision Mode before the exam → Spaced Revision resurfaces them 1, 3, and 7 days later.
**Key features:** Revision Mode, Spaced Revision, AI summary, tags

### 3. Tech Creators — Content to Posts
**Problem:** Watching a 3-hour podcast to extract 5 usable insights takes all day.
**Solution:** Bookmark key moments → ✍ Post generates a LinkedIn post or X thread with a share link.
**Key features:** Social Post Generation (Pro), AI Summary (Pro), Share Pages, Embed Widget

---

## Secondary Personas

| Segment | Core Use Case | Key Features |
|---------|--------------|--------------|
| Researchers | Bookmark evidence in documentaries and interviews | Markdown/CSV export, tags, share pages |
| Course creators | Build shareable chapter guides for their own videos | Share pages, embed widget |
| Teams *(Phase 8)* | Collaborative annotation of recorded meetings | Shared collections — not yet built |

---

## Tag Vocabulary

| Tag | Meaning |
|-----|---------|
| `#concept` | A definition or core idea |
| `#example` | A worked example or demo |
| `#interview` | Interview prep content |
| `#revision` | Worth revisiting before an exam |
| `#quote` | A quotable moment |
| `#insight` | A key takeaway |
| `#important` | General high-value moment |
| `#formula` | Mathematical or algorithmic derivation |
