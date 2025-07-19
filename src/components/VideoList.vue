<template>
    <div v-if="filteredVideos.length > 0" class="space-y-3">
        <div
            v-for="video in filteredVideos"
            :key="video.id"
            class="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            @click="$emit('open-video', video)"
        >
            <div class="flex space-x-4">
                <div class="flex-shrink-0">
                    <img
                        v-if="video.thumbnail"
                        :src="video.thumbnail"
                        :alt="video.title"
                        class="w-32 h-24 object-cover rounded-lg"
                    />
                    <div
                        v-else
                        class="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center"
                    >
                        <span class="text-gray-400 text-xs">No thumbnail</span>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h3
                        class="text-base font-medium text-gray-900 mb-2 leading-snug"
                        :title="video.title"
                    >
                        {{ video.title }}
                    </h3>
                    <div
                        class="flex items-center space-x-3 text-sm text-gray-600 mb-2"
                    >
                        <span
                            class="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                            >{{ video.duration }}</span
                        >
                        <span class="font-medium">{{ video.channel }}</span>
                    </div>
                    <div
                        class="flex items-center space-x-3 text-sm text-gray-500"
                    >
                        <span>{{ video.views }}</span>
                        <span v-if="video.views && video.publishedTime">•</span>
                        <span>{{ video.publishedTime }}</span>
                    </div>
                    <div
                        v-if="video.description"
                        class="mt-2 text-sm text-gray-600 line-clamp-2"
                    >
                        {{ video.description }}
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div
        v-else
        class="bg-white rounded-lg p-8 border border-gray-200 text-center"
    >
        <div class="text-gray-500 mb-2">
            <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
            </svg>
        </div>
        <h3 class="text-sm font-medium text-gray-900 mb-1">
            {{
                videos.length === 0
                    ? "No videos found yet"
                    : "No videos match the current filter"
            }}
        </h3>
        <p class="text-sm text-gray-500">
            {{
                videos.length === 0
                    ? "Scan a YouTube search page to find videos"
                    : "Try adjusting your filters"
            }}
        </p>
    </div>

    <div v-if="isLoading" class="mt-4 text-center">
        <div class="text-sm text-gray-600">Processing...</div>
    </div>
</template>

<script setup>
defineProps({
    filteredVideos: {
        type: Array,
        required: true,
    },
});

defineEmits(["open-video"]);
</script>
