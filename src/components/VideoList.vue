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
    <!-- Skeleton loader state during page scans -->
    <div v-if="store.isLoading && filteredVideos.length === 0" class="space-y-1.5">
        <div v-for="i in 4" :key="i" class="flex gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 animate-pulse">
            <div class="h-14 w-20 flex-shrink-0 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div class="flex-1 space-y-2 py-0.5 min-w-0">
                <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-11/12"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                <div class="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
            </div>
        </div>
    </div>

    <div v-else-if="filteredVideos.length > 0" class="space-y-1.5 pb-16">
        <div class="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5">
            <input
                type="checkbox"
                :checked="store.allFilteredSelected"
                :indeterminate="store.someFilteredSelected && !store.allFilteredSelected"
                @change="store.toggleSelectAll()"
                class="checkbox-custom"
            />
            <span class="text-xs font-medium text-slate-600 dark:text-slate-300">
                Select all
                <span v-if="store.someFilteredSelected" class="text-blue-600 dark:text-blue-400 font-semibold ml-1">
                    ({{ filteredVideos.filter(v => store.selectedVideoIdSet.has(v.videoId)).length }} selected)
                </span>
            </span>
        </div>
        <VideoItem v-for="video in filteredVideos" :key="video.videoId" :video="video" />
    </div>

    <div v-else class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
        <div class="mb-2 text-slate-400 dark:text-slate-500">
            <svg class="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        </div>
        <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No videos found yet
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
            Scan a YouTube search page or channel videos tab to start building a queue.
        </p>
    </div>
</template>
