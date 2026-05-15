import $ from "jquery";

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


declare global {
  interface Window {
    youtubeScanner: YouTubeVideoScanner;
  }
}

class YouTubeVideoScanner {
  videos: VideoData[];

  constructor() {
    this.videos = [];
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
    const $nameEl = $("ytd-channel-name#channel-title yt-formatted-string#text");
    if ($nameEl.length > 0) {
      const name = $nameEl.text().trim();
      const href = $nameEl.find("a").attr("href") || location.pathname.replace(/\/videos.*$/, "");
      return { name, url: href };
    }
    // Fallback: parse the page <title> e.g. "Sony Music South - YouTube"
    const name = document.title.replace(/\s*-\s*YouTube$/, "").trim() || "Unknown Channel";
    return { name, url: location.pathname.replace(/\/videos.*$/, "") };
  }

  extractVideoData(videoElement: Element): VideoData | null {
    const $video = $(videoElement);
    const $badges = $video.find(".ytBadgeShapeText");
    const $durationEl = $badges.first();

    // Channel page uses yt-lockup-view-model inside ytd-rich-item-renderer
    const $lockupTitleEl = $video.find("a.ytLockupMetadataViewModelTitle");
    const isChannelPage = $lockupTitleEl.length > 0;

    let title: string, url: string, thumbnail: string, views: string, publishedTime: string, description: string, channel: string, channelUrl: string;

    if (isChannelPage) {
      const $h3 = $video.find("h3.ytLockupMetadataViewModelHeadingReset");
      title = $h3.attr("title")?.trim() || $lockupTitleEl.text().trim();
      url = $lockupTitleEl.attr("href") || $video.find("a.ytLockupViewModelContentImage").attr("href") || "";
      thumbnail = $video.find(".ytThumbnailViewModelImage img").attr("src") || "";
      const $metaSpans = $video.find(".ytContentMetadataViewModelMetadataText");
      views = $metaSpans.eq(0).text().trim() || "0 views";
      publishedTime = $metaSpans.eq(1).text().trim() || "Unknown";
      description = "";
      const channelInfo = this.getChannelPageName();
      channel = channelInfo.name;
      channelUrl = channelInfo.url;
    } else {
      const $titleEl = $video.find("#video-title");
      if ($titleEl.length === 0 || !$titleEl.attr("href")) return null;
      title = $titleEl.text().trim();
      url = $titleEl.attr("href") || "";
      thumbnail = $video.find("yt-image img").attr("src") || "";
      const $metaItems = $video.find(".inline-metadata-item");
      views = $metaItems.eq(0).text().trim() || "0 views";
      publishedTime = $metaItems.eq(1).text().trim() || "Unknown";
      description = $video.find(".metadata-snippet-text").text().trim();
      const $channelEl = $video.find(".long-byline #text > a");
      channel = $channelEl.length > 0 ? $channelEl.text().trim() : "Unknown Channel";
      channelUrl = $channelEl.length > 0 ? $channelEl.attr("href") || "" : "";
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) return null;

    const duration = $durationEl.text().trim();
    const is4K = $badges.toArray().some((el) => $(el).text().trim().toLowerCase() === "4k");
    const isOfficialChannel = $video.find("badge-shape[aria-label='Official Artist Channel']").length > 0;
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
    const match =
      url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
    return match ? match[1] : null;
  }

  isChannelVideosPage(): boolean {
    return /^\/@[^/]+\/videos/.test(location.pathname);
  }

  scanCurrentPage(): void {
    const selector = this.isChannelVideosPage()
      ? "ytd-rich-item-renderer"
      : "ytd-video-renderer";
    const $videoContainers = $(selector);
    const videos: VideoData[] = [];

    $videoContainers.each((index, container) => {
      const data = this.extractVideoData(container);
      if (data) videos.push(data);
    });

    this.videos = videos;
  }

  init(): void {
    const onPage = location.pathname === "/results" || this.isChannelVideosPage();
    if (onPage) {
      if (document.readyState === "loading") {
        $(document).ready(() => this.setupScanning());
      } else {
        this.setupScanning();
      }
    }
  }

  setupScanning(): void {
    this.scanCurrentPage();
    const $contentsEl = $("#contents");
    if ($contentsEl.length > 0) {
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      const observer = new MutationObserver(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.scanCurrentPage(), 500);
      });
      observer.observe($contentsEl[0], { childList: true, subtree: true });
    }
  }
}

// Initialize when DOM is ready
$(document).ready(function () {
  const scanner = new YouTubeVideoScanner();
  scanner.init();

  // Make scanner available globally for message listener
  window.youtubeScanner = scanner;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === "scanPage" && window.youtubeScanner) {
      window.youtubeScanner.scanCurrentPage();
      sendResponse({ success: true });
    } else if (request.action === "getVideos" && window.youtubeScanner) {
      sendResponse({ videos: window.youtubeScanner.videos });
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
