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

## Phase 8 — Server Sync & Insights Platform 🔲 Next (Q2 2026)

> Enable cross-device sync, build analytics infrastructure, unlock data-driven features.

### Goal
Move beyond local-only storage to enable cross-device sync, video insights, and predictive recommendations while maintaining fast offline access.

### Architecture Decision: **Hybrid Approach**

| Layer | Purpose | Technology | Why |
|-------|---------|------------|-----|
| **Client (Extension)** | Instant offline access, low latency | `chrome.storage.sync` (local cache) | Works without internet, no lag |
| **Server (Sync Engine)** | Persistence, backup, cross-device | Supabase PostgreSQL | Always available, multi-device |
| **Analytics Engine** | Insights, heatmaps, engagement data | PostgreSQL aggregations + Redis cache | Powers Smart Watching (Phase 9) |

**Sync Strategy:**
- Client writes locally first (instant feedback)
- Background sync every 30s when online
- Server timestamp wins conflicts
- Offline queue syncs when connection restored

---

### 8.1 Database Schema Expansion

```sql
-- Bookmarks table (new — supplements chrome.storage)
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT,
  video_thumbnail TEXT,
  video_duration INTEGER, -- seconds
  timestamp INTEGER NOT NULL, -- seconds into video
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL, -- soft delete for sync
  UNIQUE(user_id, video_id, timestamp)
);
CREATE INDEX idx_bookmarks_user_video ON bookmarks(user_id, video_id);
CREATE INDEX idx_bookmarks_created ON bookmarks(created_at DESC);

-- Video analytics (aggregate engagement data)
CREATE TABLE video_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id TEXT UNIQUE NOT NULL,
  engagement_heatmap JSONB, -- YouTube's engagement curve data
  total_bookmarks INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  hot_points INTEGER[], -- Array of peak timestamps (seconds)
  avg_bookmark_density DECIMAL, -- bookmarks per minute
  last_analyzed TIMESTAMP,
  INDEX idx_video_id (video_id),
  INDEX idx_total_bookmarks (total_bookmarks DESC)
);

-- User video sessions (watch behavior tracking)
CREATE TABLE user_video_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  watch_duration INTEGER, -- seconds actually watched
  completion_rate DECIMAL, -- % of video watched (0-100)
  bookmark_count INTEGER DEFAULT 0,
  first_watched TIMESTAMP,
  last_watched TIMESTAMP,
  smart_watch_enabled BOOLEAN DEFAULT false,
  smart_watch_completed BOOLEAN DEFAULT false
);
CREATE INDEX idx_sessions_user ON user_video_sessions(user_id, last_watched DESC);
```

---

### 8.2 Sync Engine API

**New Endpoints:**
```
POST   /api/sync/bookmarks          # Bidirectional sync (client ↔ server)
GET    /api/bookmarks?videoId=xxx   # Fetch all for video
POST   /api/bookmarks               # Create bookmark
PATCH  /api/bookmarks/:id           # Update bookmark
DELETE /api/bookmarks/:id           # Soft delete (sets deleted_at)

GET    /api/insights/me             # User's personal analytics
GET    /api/insights/video/:id      # Video engagement heatmap
GET    /api/insights/hot-videos     # Trending videos by bookmark count
```

**Sync Flow (Extension Background Worker):**
```javascript
// extension/src/background/sync-engine.js
class SyncEngine {
  constructor() {
    this.syncInterval = 30000; // 30 seconds
    this.isSyncing = false;
  }

  async start() {
    // Sync immediately on startup
    await this.sync();

    // Then sync every 30s
    setInterval(() => this.sync(), this.syncInterval);

    // Sync on storage changes (from side panel/popup edits)
    chrome.storage.onChanged.addListener(() => {
      this.debouncedSync();
    });
  }

  async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Get local bookmarks
      const local = await chrome.storage.sync.get();
      const lastSync = await this.getLastSyncTimestamp();

      // 2. Send to server, get server changes
      const response = await fetch(`${API_BASE}/api/sync/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          bookmarks: this.extractBookmarks(local),
          lastSync
        })
      });

      const { serverChanges, conflicts } = await response.json();

      // 3. Merge conflicts (server timestamp wins)
      const merged = this.mergeBookmarks(local, serverChanges, conflicts);

      // 4. Update local cache
      await chrome.storage.sync.set(merged);

      // 5. Update sync timestamp
      await this.setLastSyncTimestamp(Date.now());

      console.log('[Sync] ✅ Synced successfully');
    } catch (error) {
      console.error('[Sync] ❌ Sync failed:', error);
      // Queue for retry
    } finally {
      this.isSyncing = false;
    }
  }

  extractBookmarks(storage) {
    // Extract all bm_* keys
    return Object.entries(storage)
      .filter(([key]) => key.startsWith('bm_'))
      .map(([key, bookmarks]) => ({
        video_id: key.replace('bm_', ''),
        bookmarks
      }));
  }

  mergeBookmarks(local, serverChanges, conflicts) {
    // Server timestamp wins for conflicts
    // Return merged object
  }
}

// Start sync engine
const syncEngine = new SyncEngine();
syncEngine.start();
```

---

### 8.3 Insights Dashboard

**New Page:** `/dashboard/insights`

**Features:**
- 📊 **Global Stats Card**
  - Total bookmarks created
  - Videos watched (>1 bookmark = "watched")
  - Total watch time
  - Average bookmarks per video
  - Most active day of week
  - Most active hour of day

- 📈 **Engagement Heatmap**
  - Visual timeline of all bookmarks across all videos
  - See which parts of videos you bookmark most
  - Identify patterns (openings? climaxes? conclusions?)

- 🎯 **Top Videos**
  - Most bookmarked videos
  - Most rewatched (timestamp revisits)
  - Longest videos
  - Most shared collections

- 🏷️ **Tag Analytics**
  - Tag frequency chart (bar chart)
  - Tag co-occurrence network (which tags appear together)
  - Suggested tags based on patterns

- 📅 **Watch Patterns**
  - Heatmap: Day of week x Hour of day
  - Discover: "You watch most videos on Tuesday evenings"
  - Watch streak tracking

**Example Insight Cards:**
```
┌─────────────────────────────────────┐
│ 🎯 Your Bookmark Patterns           │
│                                     │
│ You've bookmarked 127 moments      │
│ across 23 videos this month.       │
│                                     │
│ • 68% tagged #important            │
│ • Most active: Tuesday 8-10pm      │
│ • Avg 5.5 bookmarks per video      │
│                                     │
│ Top video: "System Design Interview"│
│ (18 bookmarks)                      │
└─────────────────────────────────────┘
```

---

### 8.4 Cross-Device Sync

- Login on any device → see all bookmarks
- Real-time sync via polling (30s interval)
- Future: WebSocket for instant sync (optional enhancement)
- Conflict resolution: server timestamp wins
- Offline queue: changes sync when connection restored

**User Experience:**
1. User bookmarks on laptop → syncs to server in 30s
2. User opens extension on desktop → auto-pulls latest
3. Side panel shows sync indicator: "Synced 12 seconds ago ✓"

---

### 8.5 Implementation Checklist

- [ ] Design & migrate database schema (bookmarks, video_analytics, user_video_sessions)
- [ ] Build sync API endpoints (`/api/sync/bookmarks`, `/api/bookmarks/*`)
- [ ] Implement conflict resolution logic (server timestamp wins)
- [ ] Build SyncEngine class in background worker
- [ ] Add offline queue for failed syncs
- [ ] Migrate existing users (one-time: chrome.storage → server)
- [ ] Build insights dashboard UI (`/dashboard/insights`)
- [ ] Add sync status indicator in side panel
- [ ] Cross-device testing (2+ Chrome profiles)
- [ ] Performance testing (1000+ bookmarks sync time)

**Estimated Effort:** 3-4 weeks (1 backend, 1 sync engine, 1 insights UI, 1 testing/polish)

---

## Phase 9 — Smart Watching 🔥 (Q3 2026) - Pro Feature 💎

> Compress long videos into high-value segments using AI + engagement heatmaps.

### Goal
Enable users to watch only the "hot points" of long videos, saving 50-75% of watch time while retaining key insights.

### The Problem
- A 1-hour video has maybe 15-20 minutes of valuable content
- Users waste time watching filler, intros, tangents
- YouTube shows engagement heatmap, but users must manually skip around

### The Solution: Smart Watching
1. Analyze YouTube's engagement heatmap (shows where users rewatch/slow down)
2. Combine with Clipmark's aggregate bookmark data
3. Identify "hot points" (high-engagement timestamps)
4. Auto-seek between hot points, watch 30-60s at each
5. Result: 1 hour → 18 minutes of pure value

---

### 9.1 How YouTube Engagement Works

When you hover over YouTube's timeline, you see an **area graph** showing:
- **Peaks** = high engagement (users rewatch, leave comments, pause)
- **Valleys** = low engagement (users skip, fast-forward)

**Technical Extraction:**
```javascript
// Access YouTube's internal player data
const ytInitialPlayerResponse = window.ytInitialPlayerResponse;
const heatmap = ytInitialPlayerResponse?.videoDetails?.heatMarkers || [];

// Format: [{timeRangeStartMillis: 120000, heatMarkerIntensityScoreNormalized: 0.85}, ...]
```

---

### 9.2 Smart Watching Algorithm

#### Server-Side Analysis Job
Runs daily (or on-demand) for videos with >10 Clipmark bookmarks:

```javascript
// server/jobs/analyze-video.js
async function analyzeVideo(videoId) {
  // 1. Fetch YouTube's engagement heatmap
  const ytHeatmap = await scrapeYouTubeHeatmap(videoId);

  // 2. Detect peaks (engagement > 70th percentile)
  const ytPeaks = detectPeaks(ytHeatmap, { threshold: 0.7, minGap: 30 });
  // Example: [120, 340, 567, 892, ...] (timestamps in seconds)

  // 3. Get Clipmark bookmark hotspots
  const clipmarkHotspots = await db.query(`
    SELECT timestamp, COUNT(*) as bookmark_count
    FROM bookmarks
    WHERE video_id = $1 AND deleted_at IS NULL
    GROUP BY timestamp
    HAVING COUNT(*) >= 3
    ORDER BY bookmark_count DESC
  `, [videoId]);

  // 4. Merge signals (70% YouTube + 30% Clipmark)
  const hotPoints = mergeSignals(ytPeaks, clipmarkHotspots.map(b => b.timestamp), {
    ytWeight: 0.7,
    clipmarkWeight: 0.3,
    minGap: 30 // seconds between hot points
  });

  // 5. Store in database
  await db.video_analytics.upsert({
    video_id: videoId,
    engagement_heatmap: ytHeatmap,
    hot_points: hotPoints,
    total_bookmarks: clipmarkHotspots.length,
    last_analyzed: new Date()
  });

  return hotPoints;
}

// Peak detection algorithm
function detectPeaks(heatmap, { threshold, minGap }) {
  const sorted = heatmap.sort((a, b) => b.intensity - a.intensity);
  const cutoff = sorted[Math.floor(sorted.length * (1 - threshold))].intensity;

  const peaks = heatmap
    .filter(point => point.intensity >= cutoff)
    .map(point => Math.floor(point.timestamp / 1000)); // convert ms → s

  // Remove peaks too close together
  return deduplicateByGap(peaks, minGap);
}

function mergeSignals(ytPeaks, clipmarkPeaks, { ytWeight, clipmarkWeight, minGap }) {
  // Create weighted score for each timestamp
  const scores = new Map();

  ytPeaks.forEach(ts => {
    scores.set(ts, (scores.get(ts) || 0) + ytWeight);
  });

  clipmarkPeaks.forEach(ts => {
    scores.set(ts, (scores.get(ts) || 0) + clipmarkWeight);
  });

  // Sort by score, deduplicate by minGap
  const sorted = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([ts]) => ts);

  return deduplicateByGap(sorted, minGap);
}
```

---

### 9.3 Client-Side Smart Seeking

**Content Script Injection** (`extension/src/content/smart-watch.js`):

```javascript
class SmartWatcher {
  constructor(videoId, hotPoints, options = {}) {
    this.videoId = videoId;
    this.hotPoints = hotPoints.sort((a, b) => a - b); // [120, 340, 567, ...]
    this.currentIndex = 0;
    this.player = document.querySelector('video');
    this.segmentDuration = options.segmentDuration || 30; // seconds to watch at each hot point
    this.autoBookmark = options.autoBookmark || true;
    this.showProgress = options.showProgress !== false;
  }

  start() {
    // Show overlay
    if (this.showProgress) {
      this.showOverlay();
    }

    // Seek to first hot point
    this.seekToHotPoint(0);

    // Listen for progress
    this.player.addEventListener('timeupdate', this.onTimeUpdate.bind(this));

    console.log(`[SmartWatch] Started: ${this.hotPoints.length} segments`);
  }

  seekToHotPoint(index) {
    if (index >= this.hotPoints.length) {
      this.complete();
      return;
    }

    this.currentIndex = index;
    const timestamp = this.hotPoints[index];

    this.player.currentTime = timestamp;
    this.player.play();

    this.updateOverlay();
    this.showToast(`Segment ${index + 1}/${this.hotPoints.length}`);

    // Auto-bookmark if enabled
    if (this.autoBookmark) {
      this.createBookmark(timestamp);
    }
  }

  onTimeUpdate() {
    const currentTime = this.player.currentTime;
    const hotPoint = this.hotPoints[this.currentIndex];

    // If we've watched {segmentDuration} seconds past the hot point, jump to next
    if (currentTime > hotPoint + this.segmentDuration) {
      this.seekToHotPoint(this.currentIndex + 1);
    }
  }

  complete() {
    this.player.removeEventListener('timeupdate', this.onTimeUpdate);
    this.hideOverlay();
    this.showCompletionModal();

    // Track analytics
    chrome.runtime.sendMessage({
      action: 'trackSmartWatch',
      data: {
        video_id: this.videoId,
        segments_watched: this.hotPoints.length,
        total_watch_time: this.hotPoints.length * this.segmentDuration,
        completed: true
      }
    });
  }

  showOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'clipmark-smartwatch-overlay';
    overlay.innerHTML = `
      <div class="sw-overlay-content">
        <span class="sw-icon">⚡</span>
        <span class="sw-text">Smart Watch Active</span>
        <div class="sw-progress">
          <div class="sw-progress-bar" style="width: 0%"></div>
        </div>
        <span class="sw-counter">Segment 0/${this.hotPoints.length}</span>
        <button class="sw-stop-btn" id="sw-stop">Stop</button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('sw-stop').addEventListener('click', () => {
      this.stop();
    });
  }

  updateOverlay() {
    const progress = ((this.currentIndex + 1) / this.hotPoints.length) * 100;
    document.querySelector('.sw-progress-bar').style.width = `${progress}%`;
    document.querySelector('.sw-counter').textContent = `Segment ${this.currentIndex + 1}/${this.hotPoints.length}`;
  }

  showCompletionModal() {
    const totalTime = this.hotPoints.length * this.segmentDuration;
    const fullDuration = this.player.duration;
    const timeSaved = fullDuration - totalTime;
    const percentSaved = Math.round((timeSaved / fullDuration) * 100);

    const modal = document.createElement('div');
    modal.id = 'clipmark-completion-modal';
    modal.innerHTML = `
      <div class="sw-modal-content">
        <h2>🎉 Smart Watch Complete!</h2>
        <div class="sw-stats">
          <div class="stat">
            <span class="stat-value">${this.hotPoints.length}</span>
            <span class="stat-label">segments watched</span>
          </div>
          <div class="stat">
            <span class="stat-value">${Math.round(totalTime / 60)}m</span>
            <span class="stat-label">vs ${Math.round(fullDuration / 60)}m full</span>
          </div>
          <div class="stat">
            <span class="stat-value">${percentSaved}%</span>
            <span class="stat-label">time saved</span>
          </div>
        </div>
        <p>How valuable was this Smart Watch?</p>
        <div class="sw-rating">
          <button class="rating-btn" data-rating="5">⭐⭐⭐⭐⭐</button>
          <button class="rating-btn" data-rating="4">⭐⭐⭐⭐</button>
          <button class="rating-btn" data-rating="3">⭐⭐⭐</button>
        </div>
        <button class="sw-close-btn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  stop() {
    this.player.removeEventListener('timeupdate', this.onTimeUpdate);
    this.hideOverlay();
    console.log('[SmartWatch] Stopped by user');
  }
}

// Activate via message from side panel
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'startSmartWatch') {
    const { videoId, hotPoints, options } = message;
    const smartWatcher = new SmartWatcher(videoId, hotPoints, options);
    smartWatcher.start();
  }
});
```

---

### 9.4 Side Panel UI

**Smart Watch Card** (shown when hot points are available):

```html
<div class="smart-watch-card" id="smart-watch-card" style="display: none;">
  <div class="sw-header">
    <span class="sw-icon">⚡</span>
    <span class="sw-title">Smart Watch Available</span>
    <span class="pro-badge">PRO</span>
  </div>

  <div class="sw-stats-preview">
    <div class="stat-mini">
      <span class="stat-value" id="sw-segment-count">15</span>
      <span class="stat-label">key moments</span>
    </div>
    <div class="stat-mini">
      <span class="stat-value" id="sw-time-estimate">~18m</span>
      <span class="stat-label">vs 1h 12m full</span>
    </div>
    <div class="stat-mini">
      <span class="stat-value" id="sw-time-saved">75%</span>
      <span class="stat-label">time saved</span>
    </div>
  </div>

  <div class="sw-timeline-preview">
    <div class="timeline-bar" id="sw-timeline-bar">
      <!-- Dynamically populated hot point markers -->
    </div>
  </div>

  <button id="smart-watch-btn" class="sw-btn-primary">
    ⚡ Start Smart Watch
  </button>

  <button id="smart-watch-settings-btn" class="sw-btn-secondary">
    ⚙️ Settings
  </button>
</div>

<!-- Settings Panel (overlay) -->
<div id="smart-watch-settings-panel" class="sw-settings-overlay" style="display:none;">
  <div class="sw-settings-content">
    <div class="sw-settings-header">
      <span>⚡ Smart Watch Settings</span>
      <button id="sw-settings-close">&times;</button>
    </div>

    <div class="sw-setting">
      <label for="segment-duration">Watch duration per segment:</label>
      <input type="range" id="segment-duration" min="15" max="90" value="30" step="5">
      <span class="sw-setting-value"><strong>30</strong> seconds</span>
    </div>

    <div class="sw-setting">
      <label>
        <input type="checkbox" id="auto-bookmark" checked>
        Auto-bookmark each segment visited
      </label>
    </div>

    <div class="sw-setting">
      <label>
        <input type="checkbox" id="show-progress-overlay" checked>
        Show progress overlay during Smart Watch
      </label>
    </div>

    <div class="sw-setting">
      <label for="sensitivity">Segment sensitivity:</label>
      <select id="sensitivity">
        <option value="high">High (more segments, less aggressive)</option>
        <option value="medium" selected>Medium (balanced)</option>
        <option value="low">Low (fewer segments, most aggressive)</option>
      </select>
    </div>

    <button id="sw-save-settings" class="sw-btn-primary">Save Settings</button>
  </div>
</div>
```

**JavaScript** (side-panel.js):

```javascript
// Load Smart Watch availability on video load
async function checkSmartWatchAvailability(videoId) {
  try {
    const response = await fetch(`${API_BASE}/api/insights/video/${videoId}`);
    const { hot_points, engagement_heatmap } = await response.json();

    if (!hot_points || hot_points.length === 0) {
      document.getElementById('smart-watch-card').style.display = 'none';
      return;
    }

    // Show Smart Watch card
    const card = document.getElementById('smart-watch-card');
    card.style.display = 'block';

    // Populate stats
    const totalSeconds = hot_points.length * 30; // assuming 30s per segment
    const videoDuration = await getVideoDuration();
    const timeSaved = Math.round(((videoDuration - totalSeconds) / videoDuration) * 100);

    document.getElementById('sw-segment-count').textContent = hot_points.length;
    document.getElementById('sw-time-estimate').textContent = `~${Math.round(totalSeconds / 60)}m`;
    document.getElementById('sw-time-saved').textContent = `${timeSaved}%`;

    // Render timeline
    renderSmartWatchTimeline(hot_points, videoDuration);

    // Attach click handler
    document.getElementById('smart-watch-btn').addEventListener('click', async () => {
      const settings = await getSmartWatchSettings();

      // Send message to content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, {
        action: 'startSmartWatch',
        videoId,
        hotPoints: hot_points,
        options: {
          segmentDuration: settings.segmentDuration,
          autoBookmark: settings.autoBookmark,
          showProgress: settings.showProgressOverlay
        }
      });
    });
  } catch (error) {
    console.error('[SmartWatch] Failed to check availability:', error);
    document.getElementById('smart-watch-card').style.display = 'none';
  }
}

function renderSmartWatchTimeline(hotPoints, videoDuration) {
  const timeline = document.getElementById('sw-timeline-bar');
  timeline.innerHTML = '';

  hotPoints.forEach(timestamp => {
    const percent = (timestamp / videoDuration) * 100;
    const marker = document.createElement('span');
    marker.className = 'hotpoint-marker';
    marker.style.left = `${percent}%`;
    marker.title = formatTimestamp(timestamp);
    timeline.appendChild(marker);
  });
}
```

---

### 9.5 Analytics Tracking

Track effectiveness and user satisfaction:

```javascript
// After Smart Watch session
async function trackSmartWatchSession(data) {
  await fetch(`${API_BASE}/api/analytics/smart-watch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      video_id: data.video_id,
      segments_watched: data.segments_watched,
      total_watch_time: data.total_watch_time,
      full_video_duration: data.full_video_duration,
      time_saved_percentage: data.time_saved_percentage,
      user_rating: data.user_rating, // 1-5 stars
      completed: data.completed,
      settings_used: {
        segment_duration: data.segment_duration,
        sensitivity: data.sensitivity
      }
    })
  });
}
```

**Key Metrics to Track:**
- Adoption rate (% of Pro users who try Smart Watch)
- Completion rate (% who finish vs stop early)
- Average user rating (1-5 stars)
- Time saved per session
- Re-use rate (users who try it again within 7 days)
- Correlation with bookmark creation (does Smart Watch lead to more bookmarks?)

---

### 9.6 UX Flow

```
1. User opens 1-hour video
   ↓
2. Side panel shows: "⚡ Smart Watch: 15 moments, ~18m (save 75%)"
   ↓
3. User clicks "Start Smart Watch"
   ↓
4. Video seeks to 2:00 (first hot point)
   ↓
5. Overlay shows: "Segment 1/15 • ⚡ Smart Watch Active"
   ↓
6. User watches 30 seconds (2:00 → 2:30)
   ↓
7. Video auto-seeks to 5:40 (next hot point)
   ↓
8. Toast: "Segment 2/15 • 12m remaining"
   ↓
9. Repeat 15 times...
   ↓
10. Completion modal: "🎉 Smart Watch Complete! You watched 18m of a 1h 12m video (75% saved)"
   ↓
11. Ask for rating: "How valuable was this? ⭐⭐⭐⭐⭐"
   ↓
12. Track analytics + update user session stats
```

---

### 9.7 Implementation Checklist

- [ ] Research YouTube heatmap API (ytInitialPlayerResponse structure)
- [ ] Build server-side video analysis job (cron or on-demand)
- [ ] Implement peak detection algorithm
- [ ] Merge YouTube signals + Clipmark bookmark hotspots
- [ ] Store hot_points in video_analytics table
- [ ] Build Smart Watch UI card in side panel
- [ ] Implement SmartWatcher class in content script
- [ ] Add progress overlay with segment counter
- [ ] Build settings panel (segment duration, sensitivity, auto-bookmark)
- [ ] Add completion modal with stats + rating
- [ ] Track analytics (adoption, completion rate, user ratings)
- [ ] Gate behind Pro subscription (`is_pro` check)
- [ ] A/B test with Pro users for feedback
- [ ] Performance testing (does seeking cause buffering?)
- [ ] YouTube ToS compliance review

**Estimated Effort:** 4-6 weeks (1.5 analysis backend, 1.5 client smart seeking, 1 UI, 1 testing/polish)

---

### 9.8 Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| YouTube changes heatmap API | High | Fallback to Clipmark bookmark data only; monitor API structure |
| Constant seeking causes buffering | Medium | Pre-buffer upcoming segments; add "smooth transition" option |
| User finds auto-seeking jarring | Medium | Add preview mode; allow manual control; configurable segment duration |
| Heatmap extraction violates ToS | High | Legal review; fallback to user-contributed bookmark-only approach |
| Server costs for video analysis | Medium | Cache analytics 30 days; only analyze videos with >10 bookmarks |

---

### 9.9 Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| **Adoption rate** | 30% of Pro users try in month 1 | Measures feature discoverability |
| **Completion rate** | 60% finish Smart Watch sessions | Measures UX quality |
| **Re-use rate** | 50% use again within 7 days | Measures stickiness |
| **Average rating** | 4.2+ stars | Measures user satisfaction |
| **Time saved** | >50% on average | Measures effectiveness |
| **Bookmark correlation** | +20% bookmark creation after Smart Watch | Measures engagement impact |

---

## Phase 10 — Power Tools 🔲 Later

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

## Phase 11 — Integrations 🔲 Later

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

## Phase 12 — Distribution & Growth 🔲 Later

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

## Phase 13 — Collaboration & Teams 🔲 Future

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

### Week 4 — Power Features (Phase 10)
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
| Teams *(Phase 13)* | Collaborative annotation of recorded meetings | Shared collections — not yet built |

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
