interface VideoData {
  title: string;
  duration: string;
  url: string;
  videoId: string;
  channel: string;
  channelUrl: string;
  views: string;
  publishedTime: string;
  thumbnail: string;
  description: string;
  durationInSeconds: number;
  viewsCount: number;
  isLong: boolean;
  is4K: boolean;
  isOfficialChannel: boolean;
  viewsPerDay: number;
}

interface QueueVideo {
  videoId: string;
  title?: string;
}

interface QueueResult {
  success: boolean;
  count: number;
  failed?: string[];
  error?: string;
}


declare global {
  interface Window {
    youtubeScanner: YouTubeVideoScanner;
  }
}

class YouTubeVideoScanner {
  videos: VideoData[];
  scanDiagnostics: string[];

  constructor() {
    this.videos = [];
    this.scanDiagnostics = [];
  }

  reportDiagnostic(message: string, context?: Record<string, string>): void {
    const details = context ? ` ${JSON.stringify(context)}` : "";
    const diagnostic = `[YouTube Queue Builder] ${message}${details}`;
    this.scanDiagnostics.push(diagnostic);
    console.warn(diagnostic);
  }

  publishedTimeToDays(publishedTime: string): number {
    const normalized = publishedTime.trim().toLowerCase();
    const match = normalized.match(/^(\d+)\s*([a-z]+)/);
    if (!match) return 0;
    const value = Number(match[1]);
    const unit = match[2];
    if (unit.startsWith("d")) return value;
    if (unit.startsWith("w")) return value * 7;
    if (unit.startsWith("mo")) return value * 30;
    if (unit.startsWith("y")) return value * 365;
    if (unit.startsWith("h")) return value / 24;
    return 0;
  }

  parseDuration(durationText: string | undefined): number {
    const parts = durationText?.split(":").map(Number) || [];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  }

  isLongVideo(durationText: string): boolean {
    return this.parseDuration(durationText) >= 3600;
  }

  parseViews(viewsText: string | undefined): number {
    if (!viewsText) return 0;

    // Remove "views" text and extra spaces
    const cleanText = viewsText
      .toLowerCase()
      .replace(/[,\s]/g, "")
      .replace("views", "");

    // Handle different suffixes
    const multipliers: Record<string, number> = {
      k: 1000,
      m: 1000000,
      b: 1000000000,
      t: 1000000000000,
    };

    // Check if it has a suffix
    const lastChar = cleanText.slice(-1);
    if (multipliers[lastChar]) {
      const number = parseFloat(cleanText.slice(0, -1));
      return Math.floor(number * multipliers[lastChar]);
    }

    // If no suffix, just parse as number
    return parseInt(cleanText) || 0;
  }

  getChannelPageName(): { name: string; url: string } {
    // channel-title is in the search result sidebar; on the channel page itself
    // the channel name lives in ytd-channel-name#channel-title yt-formatted-string#text
    const nameEl = document.querySelector<HTMLElement>("ytd-channel-name#channel-title yt-formatted-string#text");
    if (nameEl) {
      const name = nameEl.textContent?.trim() || "";
      const href = nameEl.querySelector<HTMLAnchorElement>("a")?.getAttribute("href") || location.pathname.replace(/\/videos.*$/, "");
      return { name, url: href };
    }
    // Fallback: parse the page <title> e.g. "Sony Music South - YouTube"
    const name = document.title.replace(/\s*-\s*YouTube$/, "").trim() || "Unknown Channel";
    return { name, url: location.pathname.replace(/\/videos.*$/, "") };
  }

  extractVideoData(videoElement: Element): VideoData | null {
    const badges = Array.from(videoElement.querySelectorAll<HTMLElement>(".ytBadgeShapeText"));
    const durationEl = badges[0];

    // Channel page uses yt-lockup-view-model inside ytd-rich-item-renderer
    const lockupTitleEl = videoElement.querySelector<HTMLAnchorElement>("a.ytLockupMetadataViewModelTitle");
    const isChannelPage = !!lockupTitleEl;

    let title: string, url: string, thumbnail: string, views: string, publishedTime: string, description: string, channel: string, channelUrl: string;

    if (isChannelPage) {
      const h3 = videoElement.querySelector<HTMLElement>("h3.ytLockupMetadataViewModelHeadingReset");
      title = h3?.getAttribute("title")?.trim() || lockupTitleEl?.textContent?.trim() || "";
      url = lockupTitleEl?.getAttribute("href") || videoElement.querySelector<HTMLAnchorElement>("a.ytLockupViewModelContentImage")?.getAttribute("href") || "";
      thumbnail = videoElement.querySelector<HTMLImageElement>(".ytThumbnailViewModelImage img")?.getAttribute("src") || "";
      const metaSpans = Array.from(videoElement.querySelectorAll<HTMLElement>(".ytContentMetadataViewModelMetadataText"));
      views = metaSpans[0]?.textContent?.trim() || "0 views";
      publishedTime = metaSpans[1]?.textContent?.trim() || "Unknown";
      description = "";
      const channelInfo = this.getChannelPageName();
      channel = channelInfo.name;
      channelUrl = channelInfo.url;
    } else {
      const titleEl = videoElement.querySelector<HTMLAnchorElement>("#video-title");
      if (!titleEl?.getAttribute("href")) return null;
      title = titleEl.textContent?.trim() || "";
      url = titleEl.getAttribute("href") || "";
      thumbnail = videoElement.querySelector<HTMLImageElement>("yt-image img")?.getAttribute("src") || "";
      const metaItems = Array.from(videoElement.querySelectorAll<HTMLElement>(".inline-metadata-item"));
      views = metaItems[0]?.textContent?.trim() || "0 views";
      publishedTime = metaItems[1]?.textContent?.trim() || "Unknown";
      description = videoElement.querySelector<HTMLElement>(".metadata-snippet-text")?.textContent?.trim() || "";
      const channelEl = videoElement.querySelector<HTMLAnchorElement>(".long-byline #text > a");
      channel = channelEl ? channelEl.textContent?.trim() || "" : "Unknown Channel";
      channelUrl = channelEl?.getAttribute("href") || "";
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) return null;

    const duration = durationEl?.textContent?.trim() || "";
    const is4K = badges.some((el) => el.textContent?.trim().toLowerCase() === "4k");
    const isOfficialChannel = !!videoElement.querySelector("badge-shape[aria-label='Official Artist Channel']");
    const viewsCount = this.parseViews(views);
    const ageDays = this.publishedTimeToDays(publishedTime);
    const viewsPerDay = ageDays > 0 ? Math.round(viewsCount / ageDays) : viewsCount;

    return {
      title,
      duration,
      url,
      videoId,
      channel,
      channelUrl,
      views,
      publishedTime,
      thumbnail,
      description,
      durationInSeconds: this.parseDuration(duration),
      viewsCount,
      isLong: this.isLongVideo(duration),
      is4K,
      isOfficialChannel,
      viewsPerDay,
    };
  }

  extractVideoId(url: string): string | null {
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.pathname !== "/watch") return null;
      return parsed.searchParams.get("v");
    } catch {
      this.reportDiagnostic("Unable to parse video link", { url });
      return null;
    }
  }

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getVideoLinks(): HTMLAnchorElement[] {
    return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="watch?v="]'));
  }

  findVideoCard(videoLink: HTMLAnchorElement, videoId: string): Element | null {
    let current: Element | null = videoLink;
    let fallback: Element | null = null;

    while (current && current !== document.body) {
      const matchingLinks = Array.from(current.querySelectorAll<HTMLAnchorElement>('a[href*="watch?v="]'))
        .filter((link) => this.extractVideoId(link.href) === videoId);
      const hasTitle = !!current.querySelector("#video-title, a.ytLockupMetadataViewModelTitle");

      if (hasTitle && matchingLinks.length >= 2) return current;
      if (!fallback && hasTitle && matchingLinks.length > 0) fallback = current;
      current = current.parentElement;
    }

    if (fallback) return fallback;

    this.reportDiagnostic("Could not resolve a video card from watch link", { videoId });
    return null;
  }

  getVideoCards(): Element[] {
    const cards: Element[] = [];
    const seenIds = new Set<string>();

    for (const link of this.getVideoLinks()) {
      const videoId = this.extractVideoId(link.href);
      if (!videoId || seenIds.has(videoId)) continue;

      const card = this.findVideoCard(link, videoId);
      if (card) {
        seenIds.add(videoId);
        cards.push(card);
      }
    }

    return cards;
  }

  findVideoElement(videoId: string): Element | null {
    const link = this.getVideoLinks().find((candidate) => this.extractVideoId(candidate.href) === videoId);
    return link ? this.findVideoCard(link, videoId) : null;
  }

  findMenuButton(videoElement: Element): HTMLElement | null {
    return videoElement.querySelector<HTMLElement>(
      "ytd-menu-renderer yt-icon-button#button button, ytd-menu-renderer button[aria-label='Action menu'], ytd-menu-renderer button[aria-label='More actions'], ytd-menu-renderer button"
    );
  }

  clickElement(element: HTMLElement): void {
    element.scrollIntoView({ block: "center", inline: "nearest" });
    element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true, view: window }));
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    element.click();
  }

  isVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  findAddToQueueMenuItem(): HTMLElement | null {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("tp-yt-paper-item[role='menuitem'], ytd-menu-service-item-renderer")
    );

    return items.find((item) => {
      const title = item.querySelector("yt-formatted-string.title")?.textContent ?? item.textContent ?? "";
      return title.trim().toLowerCase() === "add to queue" && this.isVisible(item);
    }) ?? null;
  }

  async waitForElement(getElement: () => HTMLElement | null, timeoutMs = 2500): Promise<HTMLElement | null> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const element = getElement();
      if (element) return element;
      await this.sleep(100);
    }

    return null;
  }

  closeOpenMenu(): void {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }

  async addVideoToQueue(video: QueueVideo): Promise<boolean> {
    const videoElement = this.findVideoElement(video.videoId);
    if (!videoElement) return false;

    const menuButton = this.findMenuButton(videoElement);
    if (!menuButton) return false;

    this.clickElement(menuButton);

    const addToQueueItem = await this.waitForElement(() => this.findAddToQueueMenuItem());
    if (!addToQueueItem) {
      this.closeOpenMenu();
      return false;
    }

    this.clickElement(addToQueueItem);
    await this.sleep(500);
    return true;
  }

  async addVideosToQueue(videos: QueueVideo[]): Promise<QueueResult> {
    if (!videos.length) {
      return { success: false, count: 0, error: "No videos to queue." };
    }

    this.scanCurrentPage();

    const failed: string[] = [];
    let count = 0;

    for (const video of videos) {
      const added = await this.addVideoToQueue(video);
      if (added) {
        count += 1;
      } else {
        failed.push(video.title || video.videoId);
      }
    }

    if (count === 0) {
      return {
        success: false,
        count,
        failed,
        error: "Could not find YouTube's Add to queue action for the selected videos.",
      };
    }

    return {
      success: true,
      count,
      failed: failed.length > 0 ? failed : undefined,
      error: failed.length > 0 ? `${failed.length} videos could not be queued because their menu item was not found.` : undefined,
    };
  }

  isChannelVideosPage(): boolean {
    return /^\/@[^/]+\/videos/.test(location.pathname);
  }

  isYouTubePage(): boolean {
    return location.hostname === "www.youtube.com";
  }

  scanCurrentPage(): void {
    this.scanDiagnostics = [];
    const videoCards = this.getVideoCards();
    const videos: VideoData[] = [];

    videoCards.forEach((card) => {
      const data = this.extractVideoData(card);
      if (data) {
        videos.push(data);
      } else {
        this.reportDiagnostic("Skipped a video card because required metadata was missing");
      }
    });

    this.videos = videos;
    console.debug(`[YouTube Queue Builder] Scan complete: ${videos.length} videos, ${this.scanDiagnostics.length} diagnostics`);
  }

  init(): void {
    if (this.isYouTubePage()) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.setupScanning(), { once: true });
      } else {
        this.setupScanning();
      }
    }
  }

  setupScanning(): void {
    this.scanCurrentPage();
    const observationRoot = document.querySelector<HTMLElement>("#contents") || document.body;
    if (observationRoot) {
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      const observer = new MutationObserver(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.scanCurrentPage(), 500);
      });
      observer.observe(observationRoot, { childList: true, subtree: true });
    }
  }
}

// Initialize when DOM is ready
const initializeScanner = () => {
  const scanner = new YouTubeVideoScanner();
  scanner.init();

  // Make scanner available globally for message listener
  window.youtubeScanner = scanner;
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeScanner, { once: true });
} else {
  initializeScanner();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === "scanPage" && window.youtubeScanner) {
      window.youtubeScanner.scanCurrentPage();
      sendResponse({ success: true });
    } else if (request.action === "getVideos" && window.youtubeScanner) {
      sendResponse({ videos: window.youtubeScanner.videos });
    } else if (request.action === "addCurrentToQueue" && window.youtubeScanner) {
      window.youtubeScanner.addVideosToQueue(request.videos ?? []).then(sendResponse);
      return true;
    } else {
      sendResponse({
        success: false,
        error: "Unknown action or scanner not ready",
      });
    }
  } catch (error) {
    console.error("Content script error:", error);
    sendResponse({ success: false, error: (error as Error).message });
  }
  return true; // Keep message channel open for async response
});
