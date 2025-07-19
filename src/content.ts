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

  extractVideoData(videoElement: Element): VideoData | null {
    const $video = $(videoElement);
    const $titleEl = $video.find("#video-title");
    const $durationEl = $video.find(".badge-shape-wiz__text").first();
    const $channelEl = $video.find("ytd-channel-name:first #text > a");
    const $viewsEl = $video.find("#metadata-line > span:nth-child(3)");
    const $timeEl = $video.find("#metadata-line > span:nth-child(4)");
    const $thumbnailEl = $video.find("#thumbnail > yt-image > img");
    const $descriptionEl = $video.find(".metadata-snippet-text");

    if (
      $titleEl.length === 0 ||
      $durationEl.length === 0 ||
      !$titleEl.attr("href")
    )
      return null;

    const title = $titleEl.text().trim();
    const duration = $durationEl.text().trim();
    const url = $titleEl.attr("href") || "";
    const videoId = this.extractVideoId(url);
    const channel =
      $channelEl.length > 0 ? $channelEl.text().trim() : "Unknown Channel";
    const channelUrl =
      $channelEl.length > 0 ? $channelEl.attr("href") || "" : "";
    const views = $viewsEl.length > 0 ? $viewsEl.text().trim() : "0 views";
    const publishedTime =
      $timeEl.length > 0 ? $timeEl.text().trim() : "Unknown";

    const thumbnail =
      $thumbnailEl.length > 0 ? $thumbnailEl.attr("src") || "" : "";
    const description =
      $descriptionEl.length > 0 ? $descriptionEl.text().trim() : "";

    if (!videoId) return null;

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
      viewsCount: this.parseViews(views),
      isLong: this.isLongVideo(duration),
    };
  }

  extractVideoId(url: string): string | null {
    const match =
      url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
    return match ? match[1] : null;
  }

  scanCurrentPage(): void {
    const $videoContainers = $("ytd-video-renderer");
    const videos: VideoData[] = [];

    $videoContainers.each((index, container) => {
      const data = this.extractVideoData(container);
      if (data) videos.push(data);
    });

    this.videos = videos;
    chrome.runtime.sendMessage({ action: "videosFound", videos });
  }

  init(): void {
    if (location.pathname === "/results") {
      // Wait for page to be fully loaded
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
      const observer = new MutationObserver(() => this.scanCurrentPage());
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
