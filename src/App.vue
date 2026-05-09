<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useVideoStore } from "./stores/videoStore";
import Header from "./components/Header.vue";
import Notifications from "./components/Notifications.vue";
import Controls from "./components/Controls.vue";
import VideoList from "./components/VideoList.vue";

const store = useVideoStore();
const notificationsRef = ref();

onMounted(async () => {
    try {
        await store.loadFromStorage();
    } catch (error) {
        notificationsRef.value?.showMessage("Error loading data: " + (error as Error).message, "error");
    }
});
</script>

<template>
    <Header />
    <Notifications ref="notificationsRef" />
    <Controls :notifications-ref="notificationsRef" />
    <VideoList :filtered-videos="store.filteredVideos" />
</template>
