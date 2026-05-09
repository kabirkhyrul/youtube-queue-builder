# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome Manifest V3 extension that scans YouTube search results and builds video queues. Built with Vue 3 + TypeScript + Tailwind CSS 4 + Vite. Uses Bun as the package manager.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start Vite dev server (sidebar UI only)
bun run build        # Build extension to dist/
bun run preview      # Serve production build
```

**Linting:** `bun run eslint --fix <file-path>` — run only at the end of the full work process.

**Manual testing after build:**

1. Open `chrome://extensions/`, enable Developer mode, load unpacked from `dist/`
2. Visit `https://www.youtube.com/results?search_query=...`
3. Open the sidebar and test scan, filter, sort, and queue creation

No automated test framework is configured. Prefer colocated `*.test.ts` files if tests are added later.

## Architecture

Three separate entry points compiled by Vite:

| Entry | Role |
|-------|------|
| `src/main.ts` → `index.html` | Vue 3 sidebar UI (side panel) |
| `src/content.ts` | Content script — scans YouTube search DOM on `youtube.com/results*` |
| `src/background.ts` | Service worker — stores data, creates queue URLs, opens tabs |

Communication flow:

1. User clicks "Scan" in `Controls.vue` → `chrome.tabs.sendMessage` to content script
2. Content script scans `ytd-video-renderer` nodes → `chrome.runtime.sendMessage({ action: "videosFound", videos })`
3. Background stores to `chrome.storage.local`
4. `App.vue` reads storage and passes data down to components

Queue creation: `Controls.vue` sends `{ action: "addCurrentToQueue", videos: filteredVideos }` → background builds YouTube watch queue URL from `videoId` fields.

## Data Flow for Lists/Filters

The shared shape is `VideoData` in `src/types.ts`. The stable key is `videoId` — never assume an `id` field.

- `src/content.ts` → `YouTubeVideoScanner.extractVideoData()` builds each `VideoData` from DOM
- `src/App.vue` owns `videos`, `sortBy`, `channelFilter`, `filteredVideos` state; loads from storage on mount
- `src/components/Controls.vue` receives `videos`, computes filtered/sorted list, emits `filtered-videos-updated`
- `src/components/VideoList.vue` renders the final `filteredVideos` prop; uses `video.videoId` as `v-for` key

Before adding list, filter, sort, scan, or queue features — consult this flow and `AGENTS.md`.

## Coding Conventions

- **Indentation:** 4 spaces in `.vue` files, 2 spaces in `.ts` files
- **Quotes:** double quotes in imports and string literals
- **Components:** PascalCase filenames (`VideoList.vue`)
- **Functions/variables:** camelCase (`scanCurrentPage`, `filteredVideos`)
- **Types:** all shared interfaces live in `src/types.ts`

## Build Configuration

`vite.config.ts` uses a multi-entry Rollup setup: `content.js` and `background.js` output at the dist root; all other assets go into `dist/assets/`. jQuery is bundled inline with the content script.

Chrome manifest lives at `public/manifest.json` (copied as-is to `dist/`). Permissions: `activeTab`, `tabs`, `storage`, `alarms`, `sidePanel`. Host permissions: `https://www.youtube.com/*`.
