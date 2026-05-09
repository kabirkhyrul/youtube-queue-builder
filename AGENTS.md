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
