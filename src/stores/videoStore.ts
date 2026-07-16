import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { VideoData } from "../types";

type SortOption = "duration" | "title" | "channel" | "views" | "viewsPerDay" | "publishedTime";

type QueueResult = {
  success: boolean;
  count?: number;
  error?: string;
};

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
  const sortBy = ref<SortOption>("views");
  const channelFilter = ref<string[]>([]);
  const minViewsFilter = ref<string>("99999999");
  const maxViewsFilter = ref<string>("");
  const minDurationFilter = ref<string>("240");
  const maxDurationFilter = ref<string>("");
  const publishedTimeFilter = ref<string[]>([]);
  const titleWordFilter = ref<string[]>([]);
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

  const uniqueTitleWords = computed((): string[] => {
    const words = new Set<string>();
    for (const video of videos.value) {
      for (const segment of video.title.split("|").slice(1)) {
        const trimmed = segment.trim();
        if (trimmed.length > 0) words.add(trimmed);
      }
    }
    return [...words].sort();
  });

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
    const titleWords = titleWordFilter.value;

    const filtered = videos.value.filter((video) => {
      if (channels.size > 0 && !channels.has(video.channel)) {
        return false;
      }

      if (shouldFilterViews) {
        const viewsCount = video.views || 0;
        if (viewsCount < minViews || viewsCount > maxViews) {
          return false;
        }
      }

      if (shouldFilterDuration) {
        const durationInSeconds = video.duration || 0;
        if (durationInSeconds < minDuration || durationInSeconds > maxDuration) {
          return false;
        }
      }

      if (publishedTimes.size > 0 && !publishedTimes.has(video.publishedTime)) {
        return false;
      }

      if (titleWords.length > 0) {
        const segments = video.title.split("|").map((s) => s.trim());
        if (titleWords.some((w) => segments.includes(w))) {
          return false;
        }
      }

      if (onlyOfficialFilter.value && !video.isOfficialChannel) {
        return false;
      }

      return true;
    });

    return filtered.sort((a: VideoData, b: VideoData) => {
      switch (sortBy.value) {
        case "duration":
          return (b.duration || 0) - (a.duration || 0);
        case "title":
          return textCollator.compare(a.title, b.title);
        case "channel":
          return textCollator.compare(a.channel, b.channel);
        case "views":
          return (b.views || 0) - (a.views || 0);
        case "viewsPerDay": {
          const msPerDay = 86_400_000;
          const now = Date.now();
          const ageA = now - (timestamps.get(a.publishedTime) ?? now);
          const ageB = now - (timestamps.get(b.publishedTime) ?? now);
          const daysA = Math.max(ageA / msPerDay, 1);
          const daysB = Math.max(ageB / msPerDay, 1);
          return (b.views / daysB) - (a.views / daysA);
        }
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
    try {
      return new URL(url).hostname === "www.youtube.com";
    } catch {
      return false;
    }
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
        return "Please navigate to a YouTube page with visible video links first";
      }
      const response = await chrome.tabs.sendMessage(tab.id!, { action: "scanVideos" });
      if (response?.success) {
        videos.value = Array.isArray(response.videos) ? response.videos : [];
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
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id || !tab.url || !isScannablePage(tab.url)) {
        return { success: false, error: "Please navigate to a YouTube page with visible video links first" };
      }

      const response = await new Promise<QueueResult>((resolve, reject) => {
        const timeoutMs = Math.max(30000, videosToQueue.length * 2500);
        const timeout = setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
        chrome.tabs.sendMessage(
          tab.id,
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
      if (response.success) {
        return { success: true, count: response.count, error: response.error };
      }
      return { success: false, error: response.error ?? "No response received" };
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
    titleWordFilter,
    only4KFilter,
    onlyOfficialFilter,
    isLoading,
    canScan,
    // Computed
    scanButtonText,
    selectedVideoIdSet,
    uniqueChannels,
    uniqueTitleWords,
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
