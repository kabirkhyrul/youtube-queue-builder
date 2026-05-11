<template>
    <div v-if="filteredVideos.length > 0" class="space-y-1.5">
        <div v-for="video in filteredVideos" :key="video.videoId"
            class="cursor-pointer rounded-md border border-gray-200 bg-white p-2 transition-shadow hover:shadow-sm"
            @click="openVideo(video)">
            <div class="flex gap-2">
                <div class="flex-shrink-0">
                    <img v-if="video.thumbnail" :src="video.thumbnail" :alt="video.title"
                        class="h-14 w-20 rounded object-cover" />
                    <div v-else class="flex h-14 w-20 items-center justify-center rounded bg-gray-200">
                        <span class="text-[10px] text-gray-400">No image</span>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="mb-0.5 line-clamp-2 text-sm font-medium leading-snug text-gray-900" :title="video.title">
                        {{ video.title }}
                    </h3>
                    <div class="mb-0.5 flex items-center gap-1.5 text-sm leading-none text-gray-600">
                        <span
                            class="rounded bg-blue-50 px-1 py-0.5 font-mono text-[10px] font-medium leading-none text-blue-700">{{
                                video.duration }}</span>
                        <span class="truncate font-medium">{{ video.channel }}</span>
                    </div>
                    <div class="flex items-center gap-1 text-sm leading-none text-gray-500">
                        <span class="truncate">{{ video.views }}</span>
                        <span v-if="video.views && video.publishedTime">•</span>
                        <span class="truncate">{{ video.publishedTime }}</span>
                    </div>
                </div>
            </div>
        </div>
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

<script setup lang="ts">
import type { VideoData } from '../types';

interface Props {
    filteredVideos: VideoData[];
}

defineProps<Props>();

const openVideo = (video: VideoData): void => {
    const url = video.url.startsWith('http')
        ? video.url
        : `https://www.youtube.com${video.url}`;
    window.open(url, '_blank');
};
</script>
