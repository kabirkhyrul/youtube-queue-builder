import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { VideoData } from "../types";

type SortOption = "duration" | "title" | "channel" | "views" | "viewsPerDay" | "publishedTime";

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

const textCollator = new Intl.Collator(undefined, { sensitivity: "base" });

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

const createPublishedTimeTimestampMap = (items: VideoData[]): Map<string, number> => {
  const now = Date.now();
  const timestamps = new Map<string, number>();

  for (const video of items) {
    if (video.publishedTime && !timestamps.has(video.publishedTime)) {
      timestamps.set(video.publishedTime, getPublishedTimeTimestamp(video.publishedTime, now));
    }
  }

  return timestamps;
};

const comparePublishedTimeLabels = (a: string, b: string, timestamps: Map<string, number>): number => {
  const timestampA = timestamps.get(a) ?? Number.NEGATIVE_INFINITY;
  const timestampB = timestamps.get(b) ?? Number.NEGATIVE_INFINITY;

  if (timestampA === timestampB) {
    return textCollator.compare(a, b);
  }

  return timestampB - timestampA;
};

export const useVideoStore = defineStore("video", () => {
  // State
  const videos = ref<VideoData[]>([]);
  const selectedVideoIds = ref<string[]>([]);
  const sortBy = ref<SortOption>("duration");
  const channelFilter = ref<string[]>([]);
  const minViewsFilter = ref<string>("");
  const maxViewsFilter = ref<string>("");
  const minDurationFilter = ref<string>("");
  const maxDurationFilter = ref<string>("");
  const publishedTimeFilter = ref<string[]>([]);
  const only4KFilter = ref<boolean>(false);
  const onlyOfficialFilter = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const canScan = ref<boolean>(false);
  const scanButtonText = computed(() => (canScan.value ? "Scan Current Page" : "Navigate to YouTube Search or Channel Videos"));

  // Derived
  const selectedVideoIdSet = computed(() => new Set(selectedVideoIds.value));
  const channelFilterSet = computed(() => new Set(channelFilter.value));
  const publishedTimeFilterSet = computed(() => new Set(publishedTimeFilter.value));
  const publishedTimeTimestamps = computed(() => createPublishedTimeTimestampMap(videos.value));
  const viewFilterBounds = computed(() => ({
    min: minViewsFilter.value ? Number(minViewsFilter.value) : 0,
    max: maxViewsFilter.value ? Number(maxViewsFilter.value) : Infinity,
  }));
  const durationFilterBounds = computed(() => ({
    min: minDurationFilter.value ? Number(minDurationFilter.value) : 0,
    max: maxDurationFilter.value ? Number(maxDurationFilter.value) : Infinity,
  }));

  const uniqueChannels = computed((): string[] => {
    const channels = new Set<string>();

    for (const video of videos.value) {
      if (video.channel) {
        channels.add(video.channel);
      }
    }

    return [...channels].sort((a, b) => textCollator.compare(a, b));
  });

  const uniquePublishedTimes = computed((): string[] => {
    const timestamps = publishedTimeTimestamps.value;

    return [...timestamps.keys()].sort((a, b) => comparePublishedTimeLabels(a, b, timestamps));
  });

  const filteredVideos = computed((): VideoData[] => {
    const channels = channelFilterSet.value;
    const publishedTimes = publishedTimeFilterSet.value;
    const timestamps = publishedTimeTimestamps.value;
    const { min: minViews, max: maxViews } = viewFilterBounds.value;
    const { min: minDuration, max: maxDuration } = durationFilterBounds.value;
    const shouldFilterViews = Boolean(minViewsFilter.value || maxViewsFilter.value);
    const shouldFilterDuration = Boolean(minDurationFilter.value || maxDurationFilter.value);

    const filtered = videos.value.filter((video) => {
      if (channels.size > 0 && !channels.has(video.channel)) {
        return false;
      }

      if (shouldFilterViews) {
        const viewsCount = video.viewsCount || 0;
        if (viewsCount < minViews || viewsCount > maxViews) {
          return false;
        }
      }

      if (shouldFilterDuration) {
        const durationInSeconds = video.durationInSeconds || 0;
        if (durationInSeconds < minDuration || durationInSeconds > maxDuration) {
          return false;
        }
      }

      if (publishedTimes.size > 0 && !publishedTimes.has(video.publishedTime)) {
        return false;
      }

      if (only4KFilter.value && !video.is4K) {
        return false;
      }

      if (onlyOfficialFilter.value && !video.isOfficialChannel) {
        return false;
      }

      return true;
    });

    return filtered.sort((a: VideoData, b: VideoData) => {
      switch (sortBy.value) {
        case "duration":
          return (b.durationInSeconds || 0) - (a.durationInSeconds || 0);
        case "title":
          return textCollator.compare(a.title, b.title);
        case "channel":
          return textCollator.compare(a.channel, b.channel);
        case "views":
          return (b.viewsCount || 0) - (a.viewsCount || 0);
        case "viewsPerDay":
          return (b.viewsPerDay || 0) - (a.viewsPerDay || 0);
        case "publishedTime":
          return comparePublishedTimeLabels(a.publishedTime, b.publishedTime, timestamps);
        default:
          return 0;
      }
    });
  });

  const allFilteredSelected = computed((): boolean => {
    const visible = filteredVideos.value;
    const selected = selectedVideoIdSet.value;
    return visible.length > 0 && visible.every((v) => selected.has(v.videoId));
  });

  const someFilteredSelected = computed((): boolean => {
    const selected = selectedVideoIdSet.value;
    return filteredVideos.value.some((v) => selected.has(v.videoId));
  });

  // Actions
  function toggleVideoSelection(videoId: string): void {
    const current = selectedVideoIds.value;
    const idx = current.indexOf(videoId);
    if (idx !== -1) {
      selectedVideoIds.value = current.filter((id) => id !== videoId);
    } else {
      selectedVideoIds.value = [...current, videoId];
    }
  }

  function toggleSelectAll(): void {
    if (allFilteredSelected.value) {
      const toRemove = new Set(filteredVideos.value.map((v) => v.videoId));
      selectedVideoIds.value = selectedVideoIds.value.filter((id) => !toRemove.has(id));
    } else {
      const existing = new Set(selectedVideoIds.value);
      const toAdd = filteredVideos.value.map((v) => v.videoId).filter((id) => !existing.has(id));
      selectedVideoIds.value = [...selectedVideoIds.value, ...toAdd];
    }
  }

  async function loadFromStorage(): Promise<void> {
    const data = await chrome.storage.local.get(["videos"]);
    videos.value = Array.isArray(data.videos) ? data.videos : [];
  }

  function isScannablePage(url: string): boolean {
    return url.includes("youtube.com/results") || /youtube\.com\/@[^/]+\/videos/.test(url);
  }

  async function checkCurrentTab(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      canScan.value = !!(tab.url && isScannablePage(tab.url));
    } catch (error) {
      console.error("Error checking current tab:", error);
    }
  }

  async function scanCurrentPage(): Promise<string | null> {
    isLoading.value = true;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url || !isScannablePage(tab.url)) {
        return "Please navigate to YouTube search results or a channel's Videos tab first";
      }
      const response = await chrome.tabs.sendMessage(tab.id!, { action: "scanPage" });
      if (response.success) {
        const scanned = await chrome.tabs.sendMessage(tab.id!, { action: "getVideos" });
        videos.value = Array.isArray(scanned?.videos) ? scanned.videos : [];
        await chrome.storage.local.set({ videos: videos.value });
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
    const selected = selectedVideoIdSet.value;
    const videosToQueue = selected.size > 0
      ? filteredVideos.value.filter((v) => selected.has(v.videoId))
      : filteredVideos.value;

    if (videosToQueue.length === 0) {
      return { success: false, error: "No videos found" };
    }
    isLoading.value = true;
    try {
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Request timeout")), 10000);
        chrome.runtime.sendMessage(
          { action: "addCurrentToQueue", videos: videosToQueue },
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
    selectedVideoIds,
    sortBy,
    channelFilter,
    minViewsFilter,
    maxViewsFilter,
    minDurationFilter,
    maxDurationFilter,
    publishedTimeFilter,
    only4KFilter,
    onlyOfficialFilter,
    isLoading,
    canScan,
    // Computed
    scanButtonText,
    selectedVideoIdSet,
    uniqueChannels,
    uniquePublishedTimes,
    filteredVideos,
    allFilteredSelected,
    someFilteredSelected,
    // Actions
    toggleVideoSelection,
    toggleSelectAll,
    loadFromStorage,
    checkCurrentTab,
    scanCurrentPage,
    addCurrentToQueue,
  };
});
