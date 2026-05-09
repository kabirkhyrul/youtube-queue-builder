import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { VideoData } from "../types";

export const useVideoStore = defineStore("video", () => {
  // State
  const videos = ref<VideoData[]>([]);
  const sortBy = ref<string>("duration");
  const channelFilter = ref<string[]>([]);
  const minViewsFilter = ref<string>("");
  const maxViewsFilter = ref<string>("");
  const minPublishedDateFilter = ref<string>("");
  const maxPublishedDateFilter = ref<string>("");
  const isLoading = ref<boolean>(false);
  const canScan = ref<boolean>(false);
  const scanButtonText = ref<string>("Scan Current Page");

  // Derived
  const uniqueChannels = computed((): string[] => {
    const channels = videos.value.map((v: VideoData) => v.channel).filter(Boolean);
    return [...new Set(channels)].sort();
  });

  const getDateStart = (dateValue: string): number => new Date(`${dateValue}T00:00:00`).getTime();
  const getDateEnd = (dateValue: string): number => new Date(`${dateValue}T23:59:59`).getTime();

  const parsePublishedTime = (publishedTime: string): number | null => {
    const normalized = publishedTime.toLowerCase().trim();
    const now = new Date();

    if (normalized.includes("today") || normalized.includes("just now")) {
      return now.getTime();
    }

    if (normalized.includes("yesterday")) {
      now.setDate(now.getDate() - 1);
      return now.getTime();
    }

    const match = normalized.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case "second":
        now.setSeconds(now.getSeconds() - amount);
        break;
      case "minute":
        now.setMinutes(now.getMinutes() - amount);
        break;
      case "hour":
        now.setHours(now.getHours() - amount);
        break;
      case "day":
        now.setDate(now.getDate() - amount);
        break;
      case "week":
        now.setDate(now.getDate() - amount * 7);
        break;
      case "month":
        now.setMonth(now.getMonth() - amount);
        break;
      case "year":
        now.setFullYear(now.getFullYear() - amount);
        break;
      default:
        return null;
    }

    return now.getTime();
  };

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

    if (minPublishedDateFilter.value || maxPublishedDateFilter.value) {
      const minDate = minPublishedDateFilter.value ? getDateStart(minPublishedDateFilter.value) : 0;
      const maxDate = maxPublishedDateFilter.value ? getDateEnd(maxPublishedDateFilter.value) : Infinity;
      filtered = filtered.filter((video) => {
        const publishedAt = parsePublishedTime(video.publishedTime);
        return publishedAt !== null && publishedAt >= minDate && publishedAt <= maxDate;
      });
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
    minPublishedDateFilter,
    maxPublishedDateFilter,
    isLoading,
    canScan,
    scanButtonText,
    // Computed
    uniqueChannels,
    filteredVideos,
    // Actions
    loadFromStorage,
    checkCurrentTab,
    scanCurrentPage,
    addCurrentToQueue,
  };
});
