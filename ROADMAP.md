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

## Phase 5 — Revisit & Learning ✅ Done

> Turn bookmarks into a study tool.

- [x] **▶ Revisit Mode** — plays each bookmarked segment sequentially (default 60s clips) with HUD overlay showing clip progress and countdown
- [x] `pendingRevision` stored in `chrome.storage.local`; content script picks it up when the YouTube tab loads
- [x] **Spaced Revisit** — bookmarks store `reviewSchedule: [1, 3, 7]` (days after creation); popup shows "📚 Revisit Today" panel when reviews are due
- [x] Clicking a due item marks it reviewed and navigates to the timestamp
- [x] **Custom revisit reminders** — per-video reminder with user-defined interval (days); stored as `rem_{videoId}` in `chrome.storage.sync`; popup shows active reminder with change/clear controls

---

## Phase 6 — Polish & UX ✅ Done

> Make every pixel intentional.

- [x] Popup redesign — dark-first palette, rounded popup card, fused input+auto button
- [x] Quick tag chips — `#important`, `#note`, `#review`, `#idea` one-click insert below input
- [x] Title shimmer — skeleton animation while video title loads
- [x] Save button renamed "Save Moment" — more emotionally resonant
- [x] Sign-in as icon button — SVG person icon keeps header from overflowing
- [x] Header separator — feature pills (Summary/Share/Post) visually separated from nav/auth
- [x] **Clipmark logo** — teal rounded-square play+bookmark icon; cropped/resized to `icon-16/48/128.png` and `clipmark-logo.png` used in popup and dashboard headers
- [x] **Groups view** — playlist-like video grouping in dashboard; create/rename/delete groups, toggle videos in/out; stored as `vgroups` in `chrome.storage.sync`
- [x] **Sign-out button** — SVG icon in popup header; clears `bmUser` from sync storage
- [x] **✦ Pro upgrade button** — always-visible purple pill in popup header; opens `/upgrade` in new tab; hidden when user is already Pro

---

## Phase 7 — Monetization ✅ Done

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
- No Revisit Mode

### Pro Tier Unlocks
- Unlimited shared collections
- AI auto-fill, summaries, smart tag suggestions
- Social post generation (X, LinkedIn, Threads)
- Revisit Mode
- Priority support

### Implementation
- [x] Dodo Payments integration — Merchant of Record, handles VAT/global compliance
- [x] `POST /api/checkout` (Server Action) — creates Dodo `checkoutSessions`, passes `metadata.user_id` for webhook mapping
- [x] `POST /api/webhooks/dodo` — verifies signature, handles `payment.succeeded`, `subscription.active/renewed` → `is_pro=true`; `subscription.cancelled/expired` → `is_pro=false`
- [x] Supabase service-role client in webhook handler to bypass RLS
- [x] `/upgrade` page — Free / Pro Monthly / Pro Annual pricing cards with feature comparison table
- [x] Success banner on `?success=true`; "Already on Pro" banner for existing subscribers
- [x] `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_SECRET`, `DODO_MONTHLY_PRODUCT_ID`, `DODO_ANNUAL_PRODUCT_ID`, `DODO_LIFETIME_PRODUCT_ID` env vars
- [ ] Supabase migration: `ALTER TABLE profiles ADD COLUMN is_pro BOOLEAN DEFAULT false` *(run once in prod — manual step)*
- [ ] Lifetime → Annual migration logic for when lifetime offer ends

---

## Phase 7.5 — Quick Wins ✅ Done

> High-impact, low-effort features before major new phases.

### UX Polish (1-2 days each)
- [x] **Onboarding tour** — 3-step overlay on first install: "1. Play video → 2. Press Alt+S → 3. See your bookmarks"
- [ ] Empty state illustrations — friendly graphics when no bookmarks exist
- [x] Keyboard shortcut hints — tooltip on Save Moment button showing Alt+S shortcut
- [ ] Success animations — confetti or checkmark animation on first share

### Engagement Hooks
- [ ] **Bookmark streak** — "5-day streak! 🔥" badge in popup for daily usage
- [ ] Weekly digest email — "You bookmarked 12 moments this week" (opt-in, Pro)
- [ ] Milestone celebrations — "100 bookmarks!" toast with share prompt

### Viral Mechanics
- [x] **Watermark on share pages** — "Made with Clipmark" footer CTA with link to Chrome extension
- [ ] Referral program — give 1 month Pro, get 1 month Pro
- [ ] Public stats badge — embeddable "Bookmarked with Clipmark" SVG for READMEs/profiles

### Conversion Optimization
- [x] Soft paywall — show AI summary preview (blurred), "Upgrade to reveal"
- [x] Usage limit nudge — "You've used 4 of 5 free shares this month"
- [ ] Testimonial carousel on /upgrade page

---

## Phase 8 — Power Tools 🔲 Next

> Add workflow features that create stickiness and justify Pro pricing.

### Command Palette & Search
- [ ] **⌘K global search** — instant search across all bookmarks from popup or dashboard
- [ ] Fuzzy search — match partial words, typos, tag names
- [ ] Quick actions — "Go to video", "Share", "Add to group", "Delete" from palette
- [ ] Recent bookmarks shortcut — last 10 bookmarks accessible via ⌘K

### Bulk Operations
- [ ] **Bulk URL import** — paste multiple YouTube URLs, scrape titles, add to library
- [ ] Bulk tag editor — select multiple bookmarks → apply/remove tags at once
- [ ] Bulk move to group — drag-select or checkbox → assign to group
- [ ] Import from YouTube Watch Later — OAuth to pull user's watch later queue (Pro)

### Automations (Pro)
- [ ] **Auto-tag rules** — e.g., videos with "interview" in title → auto-tag `#interview`
- [ ] Auto-summarize on video complete — trigger summary when last bookmark saved
- [ ] Auto-share rule — instantly publish when video has ≥5 bookmarks
- [ ] Scheduled revisit digest — daily/weekly email of due bookmarks

### Transcript Power Features (Pro)
- [ ] **Click-to-bookmark from transcript** — click any transcript line to bookmark it
- [ ] Full transcript download — export transcript as `.txt` or `.srt` with bookmarks highlighted
- [ ] Transcript search — Ctrl+F within transcript, jump to timestamp

---

## Phase 9 — Integrations 🔲 Later

> Push bookmarks where users already work.

### Direct Sync (Pro)
- [ ] **Notion sync** — push bookmarks as database rows with title, tags, timestamp, link
- [ ] **Obsidian vault push** — create `.md` files directly in user's vault folder
- [ ] Readwise integration — send highlights to Readwise for spaced repetition
- [ ] Roam Research — block-level import

### Webhooks & Automation Platforms
- [ ] Outgoing webhooks — POST to user URL on bookmark create/delete/share
- [ ] Zapier integration — trigger automations when events occur
- [ ] Make (Integromat) — same as Zapier for European users
- [ ] IFTTT applets — "If new Clipmark bookmark, then add to Todoist"

### RSS & Feeds
- [ ] **Public RSS feed per user** — subscribe to someone's bookmark stream
- [ ] Private RSS feed — personal feed for self-consumption in readers
- [ ] OPML export — export all followed creators as OPML

---

## Phase 10 — Distribution & Growth 🔲 Later

> Reach users beyond Chrome and grow the brand.

### Chrome Web Store
- [ ] Polished listing — 5 screenshots, feature video, keyword-rich description
- [ ] Localization — Spanish, Portuguese, German, French, Japanese
- [ ] Review prompt — in-extension prompt after 10th bookmark ("Enjoying Clipmark?")

### Cross-Browser
- [ ] Firefox Add-ons — WebExtensions API mostly compatible
- [ ] Edge Add-ons — republish Chrome extension
- [ ] Safari Web Extension — requires Xcode wrapper

### Platform Expansion
- [ ] Vimeo support — creative/professional audience
- [ ] Loom support — async meetings, enterprise use case
- [ ] Twitch VOD support — gaming/streaming niche
- [ ] Architecture: platform-agnostic `content.js` with site adapters

### Mobile
- [ ] Mobile web dashboard — responsive `/bookmarks` page for phone access
- [ ] Progressive Web App — installable on home screen
- [ ] Native companion app (v2) — React Native or Flutter

---

## Phase 11 — Collaboration & Teams 🔲 Future

> Turn Clipmark into a team tool.

### Shared Collections
- [ ] Invite teammates to annotate a video together
- [ ] Real-time sync (Supabase Realtime) — see collaborators' bookmarks live
- [ ] Comments on individual bookmarks
- [ ] Mention teammates with @username

### Team Dashboard
- [ ] Team workspace — shared library visible to all members
- [ ] Admin controls — manage seats, billing, permissions
- [ ] Activity feed — see what teammates are bookmarking

### Enterprise (Future)
- [ ] SSO (SAML/OIDC)
- [ ] Custom domain for share pages (`clips.yourcompany.com`)
- [ ] Audit logs
- [ ] SLA & priority support

---

## Pricing Evolution

> Lessons from Kortex: their lifetime jumped from $40 → $99 as traction grew.

| Stage | Lifetime | Monthly | Annual |
|-------|----------|---------|--------|
| **Launch (current)** | $40 | $5/mo | $40/yr |
| **After 1K paying users** | $59 | $6/mo | $50/yr |
| **After 5K paying users** | $79 | $7/mo | $60/yr |
| **After 10K paying users** | $99 | $8/mo | $70/yr |

**Grandfather clause**: existing lifetime users keep lifetime access regardless of price increases.

---

## Immediate Next Steps

### Week 1 — Launch Readiness
```
→ Run Supabase migration: ALTER TABLE profiles ADD COLUMN is_pro BOOLEAN DEFAULT false
→ Register Dodo webhook endpoint: POST /api/webhooks/dodo (in Dodo dashboard)
→ Set DODO_* product IDs in Vercel env vars
→ Deploy webapp to Vercel (push to main)
→ Confirm env vars: ANTHROPIC_API_KEY, NEXT_PUBLIC_APP_URL, SUPABASE_SERVICE_ROLE_KEY
```

### Week 2 — Chrome Web Store
```
→ Create 5 polished screenshots (popup, dashboard, share page, revisit mode, AI features)
→ Record 30-second feature video
→ Write keyword-optimized description (bookmark, timestamp, YouTube notes, study tool)
→ Submit extension to Chrome Web Store
```

### Week 3 — Quick Wins (Phase 7.5)
```
→ Add onboarding tour (3-step overlay)
→ Implement "Made with Clipmark" watermark on share pages
→ Add keyboard shortcut hints in popup
→ Create soft paywall with blurred AI summary preview
```

### Week 4 — Power Features (Phase 8)
```
→ Implement ⌘K command palette in dashboard
→ Add bulk URL import for content creators
→ Build click-to-bookmark from transcript view
```

### Month 2-3 — Growth & Integrations
```
→ Notion direct sync (Pro)
→ Firefox extension port
→ Referral program
→ Weekly digest emails (opt-in)
```

---

## Competitive Analysis & Positioning

> Clipmark vs alternatives — why users choose us.

### Direct Competitors
| Product | Focus | Clipmark Advantage |
|---------|-------|-------------------|
| YouTube's native "Save" | Basic watch later queue | Timestamped moments, not whole videos |
| Notion Web Clipper | General bookmarking | Native YouTube integration, transcript AI, revisit mode |
| Readwise Reader | Article/highlight tool | Video-first, timestamp markers, visual timeline |
| Video Note (dead) | Timestamp notes | Active development, cloud sync, sharing |

### Adjacent Products (Inspiration Sources)
| Product | What They Do Well | What We Can Learn |
|---------|------------------|-------------------|
| **Kortex** (NotebookLM) | Bulk import, command palette, automations, pricing progression | ⌘K search, auto-rules, raise prices with traction |
| **Raindrop.io** | Beautiful UI, nested collections, browser integration | Visual polish, folder hierarchy, cross-browser |
| **Pocket** | "Read later" simplicity, tagging | One-click save UX, tag discoverability |
| **Hypothesis** | Annotation on any page, social layer | Comments on bookmarks, collaborative annotation |

### Clipmark's Unfair Advantages
1. **Timestamp precision** — bookmark exact moments, not just videos
2. **Transcript AI** — auto-describe bookmarks from what's being said
3. **Revisit Mode** — turn bookmarks into a study playlist
4. **Visual markers** — see bookmarks on the YouTube progress bar
5. **Share pages** — one-click public curated guide

---

## Product Positioning

> **Turn long YouTube videos into searchable, revisable knowledge.**

Videos are long. The knowledge inside them is not searchable or revisable by default.
Clipmark turns passive watching into structured, replayable notes — then resurfaces them when you need them most.

---

## Primary Personas

### 1. Developers — Interview & Tutorial Recap
**Problem:** A 2-hour system design lecture is too long to re-watch the night before an interview.
**Solution:** Bookmark key concepts → Revisit Mode plays only those clips. `2 hours → 6 minutes`.
**Key features:** Revisit Mode, Spaced Revisit, tags, AI auto-fill

### 2. Students — Lecture Revisit & Exam Prep
**Problem:** A 1.5-hour physics lecture has 20 minutes of examinable content scattered throughout.
**Solution:** Bookmark important moments → Revisit Mode before the exam → Spaced Revisit resurfaces them 1, 3, and 7 days later.
**Key features:** Revisit Mode, Spaced Revisit, AI summary, tags

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
| `#revisit` | Worth revisiting before an exam |
| `#quote` | A quotable moment |
| `#insight` | A key takeaway |
| `#important` | General high-value moment |
| `#formula` | Mathematical or algorithmic derivation |

---

## Feature Ideas Backlog

> Ideas to evaluate — not committed to roadmap yet.

### Differentiators (High Impact)
| Feature | Description | Effort | Pro? |
|---------|-------------|--------|------|
| **Chapter Generator** | Export bookmarks as YouTube chapter timestamps (copy-paste into description) | Medium | ✓ |
| **Clip Creator** | Generate shareable video clips from bookmark → bookmark+30s | High | ✓ |
| **Study Mode Quiz** | Flashcard-style quiz from bookmarks: "What was discussed at 12:34?" | High | ✓ |
| **Transcript Highlights** | View full transcript with bookmarked sections highlighted | Medium | ✓ |
| **Voice Memo Bookmarks** | Dictate bookmark description via microphone | Low | - |

### Engagement Features
| Feature | Description | Effort |
|---------|-------------|--------|
| **"Bookmark This" browser action** | Right-click any YouTube link → add to Clipmark | Low |
| **Chrome omnibox search** | Type "cm [query]" in address bar to search bookmarks | Low |
| **Bookmark from URL** | Paste youtube.com/watch?v=xxx&t=120 → auto-create bookmark at 2:00 | Low |
| **Multi-video revisit playlist** | Combine bookmarks from multiple videos into one revisit session | Medium |

### Social / Viral
| Feature | Description | Effort |
|---------|-------------|--------|
| **Public leaderboard** | Top sharers this week (opt-in) | Low |
| **"Fork" a collection** | Copy someone's public collection to your account | Low |
| **Embed as React component** | `<ClipmarkEmbed shareId="xxx" />` npm package | Medium |
| **Discord bot** | `/clipmark share <video-url>` posts bookmark summary | Medium |

### Content Creator Tools
| Feature | Description | Effort | Pro? |
|---------|-------------|--------|------|
| **Bulk video import** | Paste 50 YouTube URLs → add to library with titles | Medium | ✓ |
| **Channel tracker** | Get notified when a channel uploads, auto-add to library | High | ✓ |
| **Playlist import** | Import entire YouTube playlist with video titles | Medium | ✓ |
| **Batch summarize** | Run AI summary on 10 videos at once | Medium | ✓ |

---

## Metrics to Track

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **DAU/MAU ratio** | >20% | Measures stickiness |
| **Bookmarks per user** | >15 after 30 days | Engagement depth |
| **Share rate** | >5% of users share at least 1 collection | Viral coefficient |
| **Free → Pro conversion** | >3% | Revenue sustainability |
| **Revisit mode usage** | >10% of Pro users weekly | Justifies Pro differentiation |
| **Chrome Web Store rating** | >4.5 stars | Social proof for new installs |
| **Time to first bookmark** | <60s after install | Onboarding quality |
