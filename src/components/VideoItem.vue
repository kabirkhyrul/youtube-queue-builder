<script setup lang="ts">
import type { VideoData } from "../types";
import { useVideoStore } from "../stores/videoStore";

interface Props {
    video: VideoData;
}

const props = defineProps<Props>();
const store = useVideoStore();

const openVideo = (): void => {
    const url = props.video.url.startsWith("http")
        ? props.video.url
        : `https://www.youtube.com${props.video.url}`;
    window.open(url, "_blank");
};
</script>

<template>
    <div class="rounded-md border border-gray-200 bg-white p-2 transition-shadow hover:shadow-sm"
        :class="store.selectedVideoIdSet.has(video.videoId) ? 'border-blue-300 bg-blue-50' : ''">
        <div class="flex gap-2">
            <div class="flex-shrink-0 flex items-start pt-1">
                <input
                    type="checkbox"
                    :checked="store.selectedVideoIdSet.has(video.videoId)"
                    @change="store.toggleVideoSelection(video.videoId)"
                    class="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
            </div>
            <div class="flex-shrink-0 cursor-pointer" @click="openVideo">
                <img v-if="video.thumbnail" :src="video.thumbnail" :alt="video.title"
                    class="h-14 w-20 rounded object-cover" />
                <div v-else class="flex h-14 w-20 items-center justify-center rounded bg-gray-200">
                    <span class="text-[10px] text-gray-400">No image</span>
                </div>
            </div>
            <div class="flex-1 min-w-0 cursor-pointer" @click="openVideo">
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
</template>
