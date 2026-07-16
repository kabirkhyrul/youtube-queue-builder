import type { VideoData } from "./types";

// ── parsers ──────────────────────────────────────────────────────────────────

function parseDuration(text: string): number {
  const parts = text.trim().split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function parseViews(text: string): number {
  const m = text.match(/([\d.]+)\s*([KMBkmb]?)\s*views?/i);
  if (!m) return 0;
  const mult: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };
  return Math.round(parseFloat(m[1]) * (mult[m[2].toLowerCase()] ?? 1));
}

function parsePublishedTime(text: string): string {
  const m = text.match(/\d+\s+\w+\s+ago/i);
  return m ? m[0] : text;
}

// ── per-card extraction ───────────────────────────────────────────────────────

function extractFromSearchCard(card: Element): VideoData | null {
  // videoId
  const thumbLink = card.querySelector<HTMLAnchorElement>("a#thumbnail");
  const videoIdMatch = thumbLink?.getAttribute("href")?.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (!videoIdMatch) return null;
  const videoId = videoIdMatch[1];

  // title
  const titleEl = card.querySelector<HTMLElement>("a#video-title");
  const title = titleEl?.getAttribute("title")?.trim() ?? "";

  // duration — first badge text that looks like a timestamp
  const durationText = Array.from(card.querySelectorAll(".ytBadgeShapeText"))
    .map((el) => el.textContent?.trim() ?? "")
    .find((t) => /^\d+:\d{2}(:\d{2})?$/.test(t)) ?? "";
  const duration = parseDuration(durationText);

  // channel
  const channelEl = card.querySelector<HTMLAnchorElement>("ytd-channel-name a");
  const channel = channelEl?.textContent?.trim() ?? "";

  // views + publishedTime — inline-metadata-item spans
  const metaSpans = Array.from(
    card.querySelectorAll<HTMLElement>("span.inline-metadata-item")
  ).map((el) => el.textContent?.trim() ?? "");
  const viewsRaw = metaSpans.find((s) => /views?/i.test(s)) ?? "";
  const timeRaw = metaSpans.find((s) => /ago/i.test(s)) ?? "";
  const views = parseViews(viewsRaw);
  const publishedTime = parsePublishedTime(timeRaw);

  // thumbnail
  const thumbImg = card.querySelector<HTMLImageElement>("ytd-thumbnail img");
  const thumbnail = thumbImg?.src ?? thumbImg?.getAttribute("src") ?? "";

  // description — metadata snippet
  const descEl = card.querySelector<HTMLElement>(
    "yt-formatted-string.metadata-snippet-text"
  );
  const description = descEl?.textContent?.trim() ?? "";

  // isOfficialChannel
  const isOfficialChannel = !!card.querySelector(
    '[aria-label="Official Artist Channel"]'
  );

  return { videoId, title, duration, channel, views, publishedTime, thumbnail, description, isOfficialChannel };
}

function extractFromRichCard(card: Element): VideoData | null {
  // videoId — from content-id-* class or thumbnail link
  const host = card.querySelector<HTMLElement>("[class*='content-id-']");
  const contentIdMatch = host?.className.match(/content-id-([a-zA-Z0-9_-]{11})/);
  const thumbLink = card.querySelector<HTMLAnchorElement>("a.ytLockupViewModelContentImage");
  const hrefMatch = thumbLink?.getAttribute("href")?.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  // channel page hrefs have no list param: /watch?v=ID or /watch?v=ID&pp=...
  const bareMatch = thumbLink?.getAttribute("href")?.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
  const videoId = contentIdMatch?.[1] ?? hrefMatch?.[1] ?? bareMatch?.[1] ?? "";
  if (!videoId) return null;

  // title
  const titleEl = card.querySelector<HTMLElement>("h3.ytLockupMetadataViewModelHeadingReset");
  const title = titleEl?.getAttribute("title")?.trim() ?? "";

  // duration
  const durationText = Array.from(card.querySelectorAll(".ytBadgeShapeText"))
    .map((el) => el.textContent?.trim() ?? "")
    .find((t) => /^\d+:\d{2}(:\d{2})?$/.test(t)) ?? "";
  const duration = parseDuration(durationText);

  // channel — homepage has it; channel page doesn't (omit gracefully)
  const channelEl = card.querySelector<HTMLAnchorElement>("a.ytAttributedStringLink");
  const channel = channelEl?.textContent?.trim() ?? "";

  // views + publishedTime — ytContentMetadataViewModelMetadataText spans
  const metaSpans = Array.from(
    card.querySelectorAll<HTMLElement>("span.ytContentMetadataViewModelMetadataText")
  ).map((el) => el.textContent?.trim() ?? "");
  const viewsRaw = metaSpans.find((s) => /views?/i.test(s)) ?? "";
  const timeRaw = metaSpans.find((s) => /ago/i.test(s)) ?? "";
  const views = parseViews(viewsRaw);
  const publishedTime = parsePublishedTime(timeRaw);

  // thumbnail
  const thumbImg = card.querySelector<HTMLImageElement>(".ytThumbnailViewModelImage img");
  const thumbnail = thumbImg?.src ?? thumbImg?.getAttribute("src") ?? "";

  // description — not present on rich grid cards
  const description = "";

  // isOfficialChannel — badge not present on homepage/channel rich cards
  const isOfficialChannel = false;

  return { videoId, title, duration, channel, views, publishedTime, thumbnail, description, isOfficialChannel };
}

// ── scanner ───────────────────────────────────────────────────────────────────

function scanPage(): VideoData[] {
  const searchCards = document.querySelectorAll("ytd-video-renderer");
  if (searchCards.length > 0) {
    return Array.from(searchCards)
      .map(extractFromSearchCard)
      .filter((v): v is VideoData => v !== null);
  }

  const richCards = document.querySelectorAll("ytd-rich-item-renderer");
  if (richCards.length > 0) {
    return Array.from(richCards)
      .map(extractFromRichCard)
      .filter((v): v is VideoData => v !== null);
  }

  return [];
}

// ── queue actions ─────────────────────────────────────────────────────────────

type QueueVideo = Pick<VideoData, "videoId" | "title">;

function findVideoCard(videoId: string): Element | null {
  const cards = document.querySelectorAll("ytd-video-renderer, ytd-rich-item-renderer");
  return Array.from(cards).find((card) => {
    const links = Array.from(card.querySelectorAll<HTMLAnchorElement>('a[href*="watch?v="]'));
    return links.some((link) => {
      try {
        return new URL(link.getAttribute("href") ?? "", location.href).searchParams.get("v") === videoId;
      } catch {
        return false;
      }
    });
  }) ?? null;
}

function findMoreActionsButton(card: Element): HTMLElement | null {
  // YouTube replaced ytd-menu-renderer with yt-spec buttons. Keep the old
  // selectors as a fallback for cards rendered by older page versions.
  return card.querySelector<HTMLElement>(
    'button[aria-label="More actions"], button[aria-label="Action menu"], ' +
    "ytd-menu-renderer yt-icon-button#button button, ytd-menu-renderer button"
  );
}

function clickYouTubeElement(element: HTMLElement): void {
  element.scrollIntoView({ block: "center", inline: "nearest" });
  element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, composed: true, view: window }));
  element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, composed: true, view: window }));
  element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, composed: true, view: window }));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, view: window }));
}

function isVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function findAddToQueueMenuItem(): HTMLElement | null {
  const items = document.querySelectorAll<HTMLElement>(
    "tp-yt-paper-item[role='menuitem'], ytd-menu-service-item-renderer, [role='menuitem']"
  );
  return Array.from(items).find((item) => {
    const text = item.querySelector("yt-formatted-string.title")?.textContent ?? item.textContent ?? "";
    return /add\s+to\s+queue/i.test(text) && isVisible(item);
  }) ?? null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function addVideoToQueue(video: QueueVideo): Promise<boolean> {
  const card = findVideoCard(video.videoId);
  const button = card && findMoreActionsButton(card);
  if (!button) return false;

  clickYouTubeElement(button);
  let menuItem: HTMLElement | null = null;
  for (let attempt = 0; attempt < 25 && !menuItem; attempt += 1) {
    menuItem = findAddToQueueMenuItem();
    if (!menuItem) await wait(100);
  }
  if (!menuItem) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    return false;
  }

  clickYouTubeElement(menuItem);
  await wait(500);
  return true;
}

async function addVideosToQueue(videos: QueueVideo[]): Promise<{ success: boolean; count: number; error?: string }> {
  let count = 0;
  for (const video of videos) {
    if (await addVideoToQueue(video)) count += 1;
  }
  return count > 0
    ? { success: true, count }
    : { success: false, count: 0, error: "Could not find YouTube's Add to queue action for the selected videos." };
}

// ── messaging ─────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "scanVideos") {
    const videos = scanPage();
    chrome.storage.local.set({ videos });
    sendResponse({ success: true, count: videos.length, videos });
  } else if (request.action === "addCurrentToQueue") {
    addVideosToQueue(request.videos ?? []).then(sendResponse);
    return true;
  }
  return true;
});
