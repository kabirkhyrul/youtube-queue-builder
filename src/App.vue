<script setup>
import { ref, computed } from "vue";
import Header from "./components/Header.vue";
import Notifications from "./components/Notifications.vue";
import Controls from "./components/Controls.vue";

// Reactive State
const successMessage = ref("");
const errorMessage = ref("");
const videos = ref([]);
const isLoading = ref(false);
const sortBy = ref("duration");
const channelFilter = ref([]);

// This is a placeholder. In a real extension, you'd check if the current tab is a YouTube search page.
const canScan = computed(() => true);

const scanButtonText = computed(() => {
    if (isLoading.value) return "Scanning...";
    if (videos.value.length > 0) return "Scan Again";
    return "Scan Current Page";
});

const uniqueChannels = computed(() => {
    const channelNames = videos.value.map((video) => video.channel);
    return [...new Set(channelNames)].sort();
});

const filteredVideos = computed(() => {
    let processedVideos = [...videos.value];

    // Filter by selected channels
    if (channelFilter.value.length > 0) {
        processedVideos = processedVideos.filter((video) =>
            channelFilter.value.includes(video.channel),
        );
    }

    // Sort the videos
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

    return processedVideos;
});

// Mock function to simulate scanning the page for videos
const scanCurrentPage = async () => {
    isLoading.value = true;
    errorMessage.value = "";
    successMessage.value = "";
    videos.value = [];
    channelFilter.value = [];

    // Simulate an async operation like talking to a content script
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock data for demonstration purposes
    videos.value = [
        {
            id: "v1",
            title: "Getting Started with Vue 3",
            channel: "Vue Mastery",
            duration: 725,
            views: 102345,
        },
        {
            id: "v2",
            title: "A Funky Beat",
            channel: "Music Producer",
            duration: 185,
            views: 54321,
        },
        {
            id: "v3",
            title: "How to Build a Chrome Extension",
            channel: "Expert Coder",
            duration: 1250,
            views: 250123,
        },
        {
            id: "v4",
            title: "Vue 3 Composition API in Depth",
            channel: "Vue Mastery",
            duration: 2430,
            views: 80456,
        },
        {
            id: "v5",
            title: "Unreal Engine 5 for Beginners",
            channel: "Game Dev",
            duration: 3610,
            views: 500890,
        },
        {
            id: "v6",
            title: "Another Video by Expert Coder",
            channel: "Expert Coder",
            duration: 620,
            views: 150000,
        },
    ];

    successMessage.value = `Found ${videos.value.length} videos on the page.`;
    isLoading.value = false;
};

// Mock function to simulate adding videos to the YouTube queue
const addCurrentToQueue = async () => {
    if (filteredVideos.value.length === 0) return;

    isLoading.value = true;
    errorMessage.value = "";
    successMessage.value = "";

    // Simulate an async operation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    successMessage.value = `Successfully added ${filteredVideos.value.length} videos to your queue.`;

    // Clear the list after adding to the queue
    videos.value = [];
    channelFilter.value = [];
    isLoading.value = false;
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
</template>
