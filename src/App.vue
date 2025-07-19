<script setup lang="ts">
import { ref, onMounted, Ref } from "vue";
import Header from "./components/Header.vue";
import Notifications from "./components/Notifications.vue";
import Controls from "./components/Controls.vue";
import VideoList from "./components/VideoList.vue";
import type { VideoData } from "./types";

const videos: Ref<VideoData[]> = ref([]);
const filteredVideos: Ref<VideoData[]> = ref([]);
const sortBy: Ref<string> = ref("duration");
const channelFilter: Ref<string[]> = ref([]);
const notificationsRef = ref();

const loadInitialData = async (): Promise<void> => {
    try {
        const data = await chrome.storage.local.get(["videos"]);
        videos.value = data.videos || [];
    } catch (error) {
        notificationsRef.value?.showMessage("Error loading data: " + (error as Error).message, "error");
    }
};

const handleVideosUpdated = (newVideos: VideoData[]): void => {
    videos.value = newVideos;
};

const handleFilteredVideosUpdated = (newFilteredVideos: VideoData[]): void => {
    filteredVideos.value = newFilteredVideos;
};

const handleShowMessage = (message: string, type?: string): void => {
    notificationsRef.value?.showMessage(message, type);
};

onMounted(() => {
    loadInitialData();
});
</script>

<template>
    <Header />
    <Notifications ref="notificationsRef" />
    <Controls
        :videos="videos"
        :sort-by="sortBy"
        :channel-filter="channelFilter"
        @update:sort-by="sortBy = $event"
        @update:channel-filter="channelFilter = $event"
        @videos-updated="handleVideosUpdated"
        @filtered-videos-updated="handleFilteredVideosUpdated"
        @show-message="handleShowMessage"
    />
    <VideoList :filtered-videos="filteredVideos" />
</template>
