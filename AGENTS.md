# Repository Guidelines

## Project Structure & Module Organization

This is a Vite + Vue 3 + TypeScript Chrome extension for scanning YouTube search results and building queues.

- `src/main.ts` mounts the Vue sidebar UI from `src/App.vue`.
- `src/components/` contains UI components such as `Controls.vue`, `VideoList.vue`, `Header.vue`, and `Notifications.vue`.
- `src/content.ts` is the YouTube page content script. It scans search result DOM nodes and sends video data through Chrome extension messaging.
- `src/background.ts` contains the extension background logic.
- `src/types.ts` defines shared TypeScript interfaces.
- `public/manifest.json` is the source Chrome extension manifest.
- `dist/` is generated build output used for unpacked extension loading.

## List Render & Filter Data Flow

Use this map before adding list, filter, sort, scan, or queue features:

- The shared video JSON shape is `VideoData` in `src/types.ts`. The stable video key is `videoId`; do not assume an `id` field exists.
- `src/content.ts` owns YouTube DOM scanning. `YouTubeVideoScanner.extractVideoData()` builds each `VideoData` object from a `ytd-video-renderer`, including `title`, `duration`, `url`, `videoId`, `channel`, `views`, `publishedTime`, `thumbnail`, `description`, `durationInSeconds`, `viewsCount`, and `isLong`.
- `src/content.ts` sends scanned results with `chrome.runtime.sendMessage({ action: "videosFound", videos })`.
- `src/background.ts` listens for `videosFound` and persists the array with `chrome.storage.local.set({ videos: request.videos })`.
- `src/stores/videoStore.ts` (Pinia setup store) owns all state (`videos`, `sortBy`, `channelFilter`, view/date filters, `isLoading`, `canScan`) and exposes computed `filteredVideos`, `uniqueChannels`, and actions `loadFromStorage`, `checkCurrentTab`, `scanCurrentPage`, `addCurrentToQueue`.
- `src/App.vue` calls `store.loadFromStorage()` on mount; passes `notificationsRef` to `Controls` for toast messages.
- `src/components/Controls.vue` consumes the store directly — no props for filter state, no emits for filter changes. Only prop: `notificationsRef`.
- `src/components/VideoList.vue` receives `filteredVideos` as a prop from `App.vue` and uses `video.videoId` as the `v-for` key.
- Queue creation: `Controls.vue` calls `store.addCurrentToQueue()`, which sends `chrome.runtime.sendMessage({ action: "addCurrentToQueue", videos: filteredVideos.value })`; `src/background.ts` builds the YouTube queue URL from `videoId`.

## Build, Test, and Development Commands

Use Bun, since this repo includes `bun.lock`.

```bash
bun install
```

Installs dependencies.

```bash
bun run dev
```

Starts the Vite dev server for local UI development.

```bash
bun run build
```

Builds the Chrome extension into `dist/`.

```bash
bun run preview
```

Serves the production build for inspection.

## Coding Style & Naming Conventions

Use TypeScript for extension logic and Vue single-file components for UI. Keep shared data contracts in `src/types.ts`.

Follow existing indentation: Vue component scripts/templates use 4 spaces, while standalone TypeScript files currently use 2 spaces. Use double quotes in imports and string literals to match the current code.

Name Vue components in PascalCase, for example `VideoList.vue`. Name functions and local variables in camelCase, for example `scanCurrentPage` and `filteredVideos`.

## Testing Guidelines

No automated test framework is currently configured. Before submitting changes, run:

```bash
bun run build
```

For behavior changes, manually load `dist/` in `chrome://extensions/`, visit a YouTube search page such as `https://www.youtube.com/results?search_query=vue+tutorial`, then verify scanning, sorting, filtering, and queue creation.

If tests are added later, prefer colocated `*.test.ts` files near the module being tested and add the runner command to `package.json`.

## Commit & Pull Request Guidelines

Recent history uses short imperative commits, often with a `feat:` prefix, for example `feat: Implement component structure`. Keep commits focused and describe user-visible behavior or technical scope.

Pull requests should include a concise summary, manual test steps, and screenshots or screen recordings for sidebar UI changes. Mention Chrome extension permissions or manifest changes explicitly, because they affect installation and review.

## Security & Configuration Tips

Keep extension permissions narrow in `public/manifest.json`. Do not add external services or collect user data without documenting the reason in the README and PR description.
