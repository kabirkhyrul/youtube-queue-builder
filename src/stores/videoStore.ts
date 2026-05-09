import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { VideoData } from "../types";

const publishedTimeUnits = [
  { keys: ["millisecond", "milliseconds", "ms"], ms: 1 },
  { keys: ["second", "seconds", "sec", "secs", "s"], ms: 1000 },
  { keys: ["month", "months", "mo"], ms: 1000 * 60 * 60 * 24 * 30 },
  { keys: ["minute", "minutes", "min", "mins", "m"], ms: 1000 * 60 },
  { keys: ["hour", "hours", "hr", "hrs", "h"], ms: 1000 * 60 * 60 },
  { keys: ["day", "days", "d"], ms: 1000 * 60 * 60 * 24 },
  { keys: ["week", "weeks", "wk", "wks", "w"], ms: 1000 * 60 * 60 * 24 * 7 },
  { keys: ["year", "years", "yr", "yrs", "y"], ms: 1000 * 60 * 60 * 24 * 365 },
];

const getPublishedTimeTimestamp = (publishedTime: string, now = Date.now()): number => {
  const normalized = publishedTime.trim().toLowerCase();
  const match = normalized.match(/^(\d+)\s*([a-z]+)/);

  if (!match) {
    return Number.NEGATIVE_INFINITY;
  }

  const value = Number(match[1]);
  const unit = publishedTimeUnits.find((item) => item.keys.some((key) => match[2].startsWith(key)));

  if (!unit) {
    return Number.NEGATIVE_INFINITY;
  }

  return now - value * unit.ms;
};

export const useVideoStore = defineStore("video", () => {
  // State
  const videos = ref<VideoData[]>([]);
  const sortBy = ref<string>("duration");
  const channelFilter = ref<string[]>([]);
  const minViewsFilter = ref<string>("");
  const maxViewsFilter = ref<string>("");
  const publishedTimeFilter = ref<string[]>([]);
  const isLoading = ref<boolean>(false);
  const canScan = ref<boolean>(false);
  const scanButtonText = ref<string>("Scan Current Page");

  // Derived
  const uniqueChannels = computed((): string[] => {
    const channels = videos.value.map((v: VideoData) => v.channel).filter(Boolean);
    return [...new Set(channels)].sort();
  });

  const uniquePublishedTimes = computed((): string[] => {
    const dates = videos.value.map((v: VideoData) => v.publishedTime).filter(Boolean);
    const now = Date.now();
    return [...new Set(dates)].sort((a, b) => {
      const timestampDiff = getPublishedTimeTimestamp(b, now) - getPublishedTimeTimestamp(a, now);
      return timestampDiff || a.localeCompare(b);
    });
  });

  const filteredVideos = computed((): VideoData[] => {
    let filtered: VideoData[] = videos.value;

    if (channelFilter.value.length > 0) {
      filtered = filtered.filter((video) => channelFilter.value.includes(video.channel));
    }

    if (minViewsFilter.value || maxViewsFilter.value) {
      const minViews = minViewsFilter.value ? Number(minViewsFilter.value) : 0;
      const maxViews = maxViewsFilter.value ? Number(maxViewsFilter.value) : Infinity;
      filtered = filtered.filter((video) => {
        const viewsCount = video.viewsCount || 0;
        return viewsCount >= minViews && viewsCount <= maxViews;
      });
    }

    if (publishedTimeFilter.value.length > 0) {
      filtered = filtered.filter((video) => publishedTimeFilter.value.includes(video.publishedTime));
    }

    filtered = [...filtered].sort((a: VideoData, b: VideoData) => {
      switch (sortBy.value) {
        case "duration":
          return (b.durationInSeconds || 0) - (a.durationInSeconds || 0);
        case "title":
          return a.title.localeCompare(b.title);
        case "channel":
          return a.channel.localeCompare(b.channel);
        case "views":
          return (b.viewsCount || 0) - (a.viewsCount || 0);
        case "publishedTime":
          return getPublishedTimeTimestamp(b.publishedTime) - getPublishedTimeTimestamp(a.publishedTime);
        default:
          return 0;
      }
    });

    return filtered;
  });

  // Actions
  async function loadFromStorage(): Promise<void> {
    const data = await chrome.storage.local.get(["videos"]);
    videos.value = data.videos || [];
  }

  async function checkCurrentTab(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url && tab.url.includes("youtube.com/results")) {
        scanButtonText.value = "Scan Current Page";
        canScan.value = true;
      } else {
        scanButtonText.value = "Navigate to YouTube Search";
        canScan.value = false;
      }
    } catch (error) {
      console.error("Error checking current tab:", error);
    }
  }

  async function scanCurrentPage(): Promise<string | null> {
    isLoading.value = true;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url || !tab.url.includes("youtube.com/results")) {
        return "Please navigate to YouTube search results first";
      }
      const response = await chrome.tabs.sendMessage(tab.id!, { action: "scanPage" });
      if (response.success) {
        setTimeout(async () => {
          await loadFromStorage();
        }, 1000);
        return null;
      }
      return "Scan failed";
    } catch (error) {
      return "Error scanning page: " + (error as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  async function addCurrentToQueue(): Promise<{ success: boolean; count?: number; error?: string }> {
    if (filteredVideos.value.length === 0) {
      return { success: false, error: "No videos found" };
    }
    isLoading.value = true;
    try {
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Request timeout")), 10000);
        chrome.runtime.sendMessage(
          { action: "addCurrentToQueue", videos: filteredVideos.value },
          (res) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(res);
            }
          }
        );
      });
      if (response?.success) {
        return { success: true, count: response.count };
      }
      return { success: false, error: response?.error ?? "No response received" };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    videos,
    sortBy,
    channelFilter,
    minViewsFilter,
    maxViewsFilter,
    publishedTimeFilter,
    isLoading,
    canScan,
    scanButtonText,
    // Computed
    uniqueChannels,
    uniquePublishedTimes,
    filteredVideos,
    // Actions
    loadFromStorage,
    checkCurrentTab,
    scanCurrentPage,
    addCurrentToQueue,
  };
});
