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
const minViewsFilter: Ref<string> = ref("");
const maxViewsFilter: Ref<string> = ref("");
const minPublishedDateFilter: Ref<string> = ref("");
const maxPublishedDateFilter: Ref<string> = ref("");
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
        :min-views-filter="minViewsFilter"
        :max-views-filter="maxViewsFilter"
        :min-published-date-filter="minPublishedDateFilter"
        :max-published-date-filter="maxPublishedDateFilter"
        @update:sort-by="sortBy = $event"
        @update:channel-filter="channelFilter = $event"
        @update:min-views-filter="minViewsFilter = $event"
        @update:max-views-filter="maxViewsFilter = $event"
        @update:min-published-date-filter="minPublishedDateFilter = $event"
        @update:max-published-date-filter="maxPublishedDateFilter = $event"
        @videos-updated="handleVideosUpdated"
        @filtered-videos-updated="handleFilteredVideosUpdated"
        @show-message="handleShowMessage"
    />
    <VideoList :filtered-videos="filteredVideos" />
</template>
