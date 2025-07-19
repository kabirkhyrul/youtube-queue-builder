<script setup lang="ts">
import { ref, onMounted, computed, Ref } from "vue";

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

const videos: Ref<VideoData[]> = ref([]);
const isLoading: Ref<boolean> = ref(false);
const successMessage: Ref<string> = ref("");
const errorMessage: Ref<string> = ref("");
const canScan: Ref<boolean> = ref(false);
const scanButtonText: Ref<string> = ref("Scan Current Page");
const sortBy: Ref<string> = ref("duration");
const channelFilter: Ref<string[]> = ref([]);

const uniqueChannels = computed((): string[] => {
    const channels = videos.value.map((video: VideoData) => video.channel).filter(Boolean);
    return [...new Set(channels)].sort();
});

const filteredVideos = computed((): VideoData[] => {
    let filtered: VideoData[] = videos.value;

    // Apply channel filter
    if (channelFilter.value.length > 0) {
        filtered = filtered.filter((video) =>
            channelFilter.value.includes(video.channel),
        );
    }

    // Apply sorting
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

const showMessage = (message: string, type: string = "success"): void => {
    if (type === "success") {
        successMessage.value = message;
        errorMessage.value = "";
        setTimeout(() => {
            successMessage.value = "";
        }, 3000);
    } else {
        errorMessage.value = message;
        successMessage.value = "";
        setTimeout(() => {
            errorMessage.value = "";
        }, 5000);
    }
};

const loadInitialData = async (): Promise<void> => {
    try {
        // Test background script connectivity
        try {
            const testResponse = await chrome.runtime.sendMessage({
                action: "test",
            });
            console.log("Background script test:", testResponse);
        } catch (testError) {
            console.warn("Background script test failed:", testError);
        }

        const data = await chrome.storage.local.get([
            "videos",
            "lastScanCount",
        ]);
        videos.value = data.videos || [];

        await checkCurrentTab();
    } catch (error) {
        showMessage("Error loading data: " + (error as Error).message, "error");
    }
};

const checkCurrentTab = async (): Promise<void> => {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

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
};

const scanCurrentPage = async (): Promise<void> => {
    isLoading.value = true;

    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        if (!tab.url || !tab.url.includes("youtube.com/results")) {
            showMessage(
                "Please navigate to YouTube search results first",
                "error",
            );
            return;
        }

        const response = await chrome.tabs.sendMessage(tab.id, {
            action: "scanPage",
        });

        if (response.success) {
            showMessage("Page scanned successfully!");
            setTimeout(() => loadInitialData(), 1000);
        }
    } catch (error) {
        showMessage("Error scanning page: " + (error as Error).message, "error");
    } finally {
        isLoading.value = false;
    }
};

const addCurrentToQueue = async (): Promise<void> => {
    if (filteredVideos.value.length === 0) {
        showMessage("No videos found", "error");
        return;
    }

    isLoading.value = true;

    try {
        console.log("Sending addCurrentToQueue message...");
        console.log("Filtered videos to queue:", filteredVideos.value);

        const response = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Request timeout"));
            }, 10000);

            chrome.runtime.sendMessage(
                {
                    action: "addCurrentToQueue",
                    videos: filteredVideos.value,
                },
                (response) => {
                    clearTimeout(timeout);
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                },
            );
        });

        console.log("Received response:", response);

        if (response && response.success) {
            showMessage(`Added ${response.count} videos to YouTube queue!`);
        } else {
            const errorMsg = response ? response.error : "No response received";
            showMessage("Queue failed: " + errorMsg, "error");
        }
    } catch (error) {
        console.error("Queue error:", error);
        showMessage("Queue error: " + (error as Error).message, "error");
    } finally {
        isLoading.value = false;
    }
};

const openVideo = (video: VideoData): void => {
    const url = video.url.startsWith("http")
        ? video.url
        : `https://www.youtube.com${video.url}`;
    window.open(url, "_blank");
};

onMounted(() => {
    loadInitialData();
});
</script>

<template>
    <Header />
    <Notifications
        :success-message="successMessage"
        :error-message="errorMessage"
    />
    <Controls
        :videos="videos"
        :filtered-videos="filteredVideos"
        :can-scan="canScan"
        :is-loading="isLoading"
        :scan-button-text="scanButtonText"
        :unique-channels="uniqueChannels"
        v-model:sort-by="sortBy"
        v-model:channel-filter="channelFilter"
        @scan-page="scanCurrentPage"
        @add-to-queue="addCurrentToQueue"
    />
    <VideoList :filtered-videos="filteredVideos" @open-video="openVideo" />
</template>
