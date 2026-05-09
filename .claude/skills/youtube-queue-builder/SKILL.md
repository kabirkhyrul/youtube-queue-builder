---
name: youtube-queue-builder
description: Use when working in the youtube-queue-builder repository, a Bun/Vite/Vue 3/TypeScript Chrome extension that scans YouTube search results, stores video metadata, and builds YouTube watch queues. Applies to source edits, reviews, debugging, manifest changes, build verification, and extension behavior testing.
---

# YouTube Queue Builder Skill

## Repo Profile

This repo is a Chrome Manifest V3 extension built with Bun, Vite, Vue 3, TypeScript, Tailwind CSS, and Chrome extension APIs.

Key paths:

- `src/App.vue` and `src/components/*.vue`: sidebar UI.
- `src/content.ts`: YouTube search-results DOM scanner.
- `src/background.ts`: background service worker and queue creation.
- `src/types.ts`: shared TypeScript data contracts.
- `public/manifest.json`: source extension manifest.
- `vite.config.ts`: multi-entry build for `index.html`, `content.ts`, and `background.ts`.
- `dist/`: generated extension output; update it only when the task requires a build artifact.

## Default Workflow

1. Inspect the exact file or behavior named by the user before editing.
2. Keep changes narrow: UI changes in Vue components, page scanning in `content.ts`, privileged Chrome API behavior in `background.ts`, and permissions/routes in `public/manifest.json`.
3. Preserve the MV3 split: content scripts read YouTube DOM and use messaging/storage; background code handles tab creation and privileged APIs.
4. Run `bun run build` after source or manifest changes unless the user asked for analysis only.
5. For behavior changes, manually describe the Chrome test path: load `dist/` in `chrome://extensions/`, open `https://www.youtube.com/results?search_query=...`, scan, filter/sort, and queue.

## Current Best Practices

Use official docs first when behavior is uncertain:

- Chrome Extensions docs: Manifest V3 is the current Chrome extension platform; keep `manifest_version: 3`.
- Chrome content scripts docs: content scripts can access the DOM and limited extension APIs, and should communicate with other extension parts through `chrome.runtime` messaging.
- Chrome manifest migration docs: keep host access in `host_permissions`, not mixed into general `permissions`.
- Chrome Web Store best practices: minimize permissions, document privacy-sensitive changes, and test extension functionality end to end.
- Vite docs: `vite build` is the production build path; this repo maps extension entries through `rollupOptions.input`.
- Vue docs: prefer Vue 3 Composition API with `<script setup lang="ts">` for components.

## Coding Rules

- Match local style: 4-space indentation in `.vue` files and 2-space indentation in standalone `.ts` files.
- Use double quotes for imports and string literals.
- Keep shared types in `src/types.ts`; do not duplicate `VideoData` shape unless narrowing is local and intentional.
- Keep Vue component names in PascalCase and handlers/state in camelCase.
- Avoid adding dependencies unless the user asks or the complexity clearly justifies it.

## Extension-Specific Guardrails

- Do not widen `host_permissions` beyond YouTube without a clear user requirement.
- Do not move YouTube DOM scraping into the background service worker; it belongs in `src/content.ts`.
- Do not call privileged APIs from content scripts if messaging to `src/background.ts` is the correct MV3 boundary.
- Be careful with YouTube selectors. Prefer resilient checks and null handling because YouTube DOM changes often.
- Do not collect or transmit user data outside local browser storage unless explicitly requested and documented.

## Verification

Preferred command:

```bash
bun run build
```

There is no configured automated test runner. If tests are added, add the package script and prefer focused `*.test.ts` files close to the relevant module.
