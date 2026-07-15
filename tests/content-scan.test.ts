import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const fixturePaths = [
  "youtube-pages/results-page.html",
  "youtube-pages/channels-video-tab.html",
  "youtube-pages/homepage.html",
];

const getWatchVideoIds = (html: string): string[] => {
  const ids: string[] = [];
  const hrefPattern = /href="([^"]*\/watch\?v=[^"]*)"/g;

  for (const match of html.matchAll(hrefPattern)) {
    const href = match[1].replaceAll("&amp;", "&");
    const videoId = new URL(href, "https://www.youtube.com").searchParams.get("v");
    if (videoId) ids.push(videoId);
  }

  return ids;
};

test("content scanner uses watch links instead of renderer tag selectors", () => {
  const source = readFileSync("src/content.ts", "utf8");

  expect(source).toContain('a[href*="watch?v="]');
  expect(source).not.toContain('"ytd-video-renderer"');
  expect(source).not.toContain('"ytd-rich-item-renderer"');
});

test("scanner is enabled for any YouTube page", () => {
  const contentSource = readFileSync("src/content.ts", "utf8");
  const storeSource = readFileSync("src/stores/videoStore.ts", "utf8");

  expect(contentSource).toContain("location.hostname === \"www.youtube.com\"");
  expect(storeSource).toContain("new URL(url).hostname === \"www.youtube.com\"");
});

test.each(fixturePaths)("discovers duplicate watch links and unique video IDs in %s", (fixturePath) => {
  const ids = getWatchVideoIds(readFileSync(fixturePath, "utf8"));
  const uniqueIds = new Set(ids);

  expect(ids.length).toBeGreaterThan(0);
  expect(uniqueIds.size).toBeGreaterThan(0);
  expect(ids.length).toBeGreaterThan(uniqueIds.size);
});
