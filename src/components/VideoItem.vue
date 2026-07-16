<script setup lang="ts">
import type { VideoData } from "../types";
import { useVideoStore } from "../stores/videoStore";

interface Props {
    video: VideoData;
}

const props = defineProps<Props>();
const store = useVideoStore();

const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const mm = String(m).padStart(h ? 2 : 1, "0");
    const ss = String(s).padStart(2, "0");
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const openVideo = (): void => {
    window.open(`https://www.youtube.com/watch?v=${props.video.videoId}`, "_blank");
};
</script>

<template>
    <div class="card-video group"
        :class="store.selectedVideoIdSet.has(video.videoId) ? 'card-video-selected' : ''">
        <div class="flex gap-2">
            <div class="flex-shrink-0 flex items-start pt-1">
                <input
                    type="checkbox"
                    :checked="store.selectedVideoIdSet.has(video.videoId)"
                    @change="store.toggleVideoSelection(video.videoId)"
                    class="checkbox-custom"
                />
            </div>
            <div class="flex-shrink-0" @click="openVideo">
                <img v-if="video.thumbnail" :src="video.thumbnail" :alt="video.title"
                    class="h-14 w-20 rounded-md object-cover border border-slate-100 dark:border-slate-800/80 shadow-xs transition-transform duration-250 group-hover:scale-[1.02]" />
                <div v-else class="flex h-14 w-20 items-center justify-center rounded-md bg-slate-200 dark:bg-slate-800">
                    <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">No image</span>
                </div>
            </div>
            <div class="flex-1 min-w-0" @click="openVideo">
                <h3 class="mb-1 line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" :title="video.title">
                    {{ video.title }}
                </h3>
                <div class="mb-1 flex items-center gap-1.5 text-[11px] leading-none text-slate-650 dark:text-slate-350">
                    <span
                        class="rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/30 dark:border-slate-700/50 px-1 py-0.5 font-mono text-[9px] font-bold leading-none text-slate-700 dark:text-slate-300">{{
                            formatDuration(video.duration) }}</span>
                    <span class="truncate font-semibold text-slate-700 dark:text-slate-300">{{ video.channel }}</span>
                </div>
                <div class="flex items-center gap-1 text-[10px] leading-none text-slate-500 dark:text-slate-400">
                    <span class="truncate">{{ video.views }}</span>
                    <span v-if="video.views && video.publishedTime" class="text-slate-350 dark:text-slate-750 font-bold">•</span>
                    <span class="truncate">{{ video.publishedTime }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
