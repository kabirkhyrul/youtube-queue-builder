<script setup>
import { ref, computed } from "vue";
import Header from "./components/Header.vue";
import Notifications from "./components/Notifications.vue";
import Controls from "./components/Controls.vue";
import VideoList from "./components/VideoList.vue";

// Reactive State
const successMessage = ref("");
const errorMessage = ref("");
const videos = ref([]);
const isLoading = ref(false);
const sortBy = ref("duration");
const channelFilter = ref([]);

// This is a placeholder for extension logic.
const canScan = computed(() => true);

const scanButtonText = computed(() => {
    if (isLoading.value) return "Scanning...";
    if (videos.value.length > 0) return "Rescan Page";
    return "Scan Page for Videos";
});

const uniqueChannels = computed(() => {
    const channelNames = videos.value.map((video) => video.channel);
    return [...new Set(channelNames)].sort();
});

const filteredVideos = computed(() => {
    // Create a copy to avoid sorting the original ref array in place
    let processedVideos = [...videos.value];

    // Filter by selected channels
    if (channelFilter.value.length > 0) {
        processedVideos = processedVideos.filter((video) =>
            channelFilter.value.includes(video.channel),
        );
    }

    // Sort the videos based on the raw numeric data
    processedVideos.sort((a, b) => {
        switch (sortBy.value) {
            case "duration":
                return b.duration - a.duration; // Descending
            case "views":
                return b.views - a.views; // Descending
            case "title":
                return a.title.localeCompare(b.title); // Ascending
            case "channel":
                return a.channel.localeCompare(b.channel); // Ascending
            default:
                return 0;
        }
    });

    // Map to new objects with formatted strings for display in the component
    return processedVideos.map((video) => {
        const formatDuration = (secs) => {
            if (isNaN(secs) || secs < 0) return "0:00";
            const minutes = Math.floor(secs / 60);
            const seconds = Math.floor(secs % 60);
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        };

        const formatViews = (count) => {
            if (isNaN(count) || count < 0) return "0 views";
            if (count >= 1000000)
                return `${(count / 1000000).toFixed(1)}M views`;
            if (count >= 1000) return `${Math.floor(count / 1000)}K views`;
            return `${count} views`;
        };

        return {
            ...video,
            duration: formatDuration(video.duration),
            views: formatViews(video.views),
        };
    });
});

// --- Methods ---

const scanCurrentPage = async () => {
    isLoading.value = true;
    errorMessage.value = "";
    successMessage.value = "";
    videos.value = [];
    channelFilter.value = [];

    // Simulate an async operation (e.g., communicating with a content script)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock data with raw numbers for sorting and strings for other metadata
    videos.value = [
        {
            videoId: "v1",
            title: "Getting Started with Vue 3",
            channel: "Vue Mastery",
            duration: 725,
            views: 102345,
            publishedTime: "1 year ago",
            thumbnail:
                "https://via.placeholder.com/128x96.png/007bff/ffffff?text=Vue",
            description:
                "Learn the basics of Vue 3 in this comprehensive tutorial.",
        },
        {
            videoId: "v2",
            title: "A Funky Beat",
            channel: "Music Producer",
            duration: 185,
            views: 54321,
            publishedTime: "6 months ago",
            thumbnail:
                "https://via.placeholder.com/128x96.png/28a745/ffffff?text=Music",
            description: "A funky beat to chill/study to.",
        },
        {
            videoId: "v3",
            title: "How to Build a Chrome Extension",
            channel: "Expert Coder",
            duration: 1250,
            views: 250123,
            publishedTime: "2 years ago",
            thumbnail:
                "https://via.placeholder.com/128x96.png/ffc107/000000?text=Code",
            description:
                "Build a Chrome extension from scratch with Manifest V3.",
        },
        {
            videoId: "v4",
            title: "Vue 3 Composition API in Depth",
            channel: "Vue Mastery",
            duration: 2430,
            views: 80456,
            publishedTime: "11 months ago",
            thumbnail:
                "https://via.placeholder.com/128x96.png/007bff/ffffff?text=Vue",
            description: "A deep dive into the Vue 3 Composition API.",
        },
        {
            videoId: "v5",
            title: "Unreal Engine 5 for Beginners",
            channel: "Game Dev",
            duration: 3610,
            views: 500890,
            publishedTime: "8 months ago",
            thumbnail:
                "https://via.placeholder.com/128x96.png/6c757d/ffffff?text=Game",
            description:
                "Everything you need to know to get started with Unreal Engine 5.",
        },
        {
            videoId: "v6",
            title: "Another Video by Expert Coder",
            channel: "Expert Coder",
            duration: 620,
            views: 150000,
            publishedTime: "3 months ago",
            thumbnail:
                "https://via.placeholder.com/128x96.png/ffc107/000000?text=Code",
            description: "Another great video on modern web development.",
        },
    ];

    successMessage.value = `Found ${videos.value.length} videos on the page.`;
    isLoading.value = false;
};

const addCurrentToQueue = async () => {
    if (filteredVideos.value.length === 0) return;
    isLoading.value = true;
    errorMessage.value = "";
    successMessage.value = "";

    await new Promise((resolve) => setTimeout(resolve, 1500));
    successMessage.value = `Successfully added ${filteredVideos.value.length} videos to your queue.`;

    // Clear the list after adding to the queue
    videos.value = [];
    channelFilter.value = [];
    isLoading.value = false;
};

const openVideo = (video) => {
    console.log("Request to open video:", video.videoId, video.title);
    // In a real Chrome extension, you would use:
    // chrome.tabs.create({ url: `https://www.youtube.com/watch?v=${video.videoId}` });
    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    window.open(videoUrl, "_blank");
    successMessage.value = `Opening "${video.title}" in a new tab.`;
};
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
