<script setup lang="ts">
import type { VideoData } from "../types";
import { useVideoStore } from "../stores/videoStore";
import VideoItem from "./VideoItem.vue";

interface Props {
    filteredVideos: VideoData[];
}

defineProps<Props>();

const store = useVideoStore();
</script>

<template>
    <div v-if="filteredVideos.length > 0" class="space-y-1.5">
        <div class="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5">
            <input
                type="checkbox"
                :checked="store.allFilteredSelected"
                :indeterminate="store.someFilteredSelected && !store.allFilteredSelected"
                @change="store.toggleSelectAll()"
                class="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span class="text-sm text-gray-600">
                Select all
                <span v-if="store.someFilteredSelected" class="text-blue-600 font-medium">
                    ({{ filteredVideos.filter(v => store.selectedVideoIdSet.has(v.videoId)).length }} selected)
                </span>
            </span>
        </div>
        <VideoItem v-for="video in filteredVideos" :key="video.videoId" :video="video" />
    </div>
    <div v-else class="rounded-md border border-gray-200 bg-white p-4 text-center">
        <div class="mb-1 text-gray-500">
            <svg class="mx-auto h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        </div>
        <h3 class="text-sm font-medium text-gray-900">
            No videos found yet
        </h3>
        <p class="text-sm text-gray-500">
            Scan a YouTube search page to find videos
        </p>
    </div>
</template>
