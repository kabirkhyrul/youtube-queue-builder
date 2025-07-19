<template>
    <!-- Controls Section -->
    <div
        class="bg-white rounded-lg p-4 border border-gray-200 mb-4 sticky top-0 z-10 shadow-sm"
    >
        <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-medium text-gray-700"
                >Videos found:</span
            >
            <span
                class="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                >{{ filteredVideos.length }}</span
            >
        </div>

        <div class="flex justify-between gap-3 mb-4">
            <button
                @click="$emit('scanCurrentPage')"
                :disabled="!canScan || isLoading"
                class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {{ scanButtonText }}
            </button>

            <button
                @click="$emit('addCurrentToQueue')"
                :disabled="filteredVideos.length === 0 || isLoading"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Add All to YouTube Queue
            </button>
        </div>

        <!-- Filters and Sort -->
        <div v-if="videos.length > 0" class="grid grid-cols-1 gap-3">
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1"
                    >Sort by:</label
                >
                <select
                    :value="sortBy"
                    @input="$emit('update:sortBy', ($event.target as HTMLSelectElement).value)"
                    class="w-full text-sm border border-gray-300 rounded px-3 py-2"
                >
                    <option value="duration">Duration</option>
                    <option value="title">Title</option>
                    <option value="channel">Channel</option>
                    <option value="views">Views</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1"
                    >Filter by channels:</label
                >
                <select
                    :value="channelFilter"
                    @input="handleChannelFilterChange"
                    multiple
                    class="w-full text-sm border border-gray-300 rounded px-3 py-2 min-h-[80px]"
                >
                    <option
                        v-for="channel in uniqueChannels"
                        :key="channel"
                        :value="channel"
                    >
                        {{ channel }}
                    </option>
                </select>
                <div
                    v-if="channelFilter.length > 0"
                    class="mt-1 flex items-center justify-between"
                >
                    <span class="text-xs text-gray-500">
                        {{ channelFilter.length }} channel{{
                            channelFilter.length > 1 ? "s" : ""
                        }}
                        selected
                    </span>
                    <button
                        @click="$emit('update:channelFilter', [])"
                        class="text-xs text-blue-600 hover:text-blue-800"
                    >
                        Clear all
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface VideoData {
  title: string;
  duration: string;
  url: string;
  videoId: string;
  channel: string;
  channelUrl: string;
  views: string;
  publishedTime: string;
  thumbnail: string;
  description: string;
  durationInSeconds: number;
  viewsCount: number;
  isLong: boolean;
}

interface Props {
  filteredVideos: VideoData[];
  canScan: boolean;
  isLoading: boolean;
  scanButtonText: string;
  videos: VideoData[];
  sortBy: string;
  channelFilter: string[];
  uniqueChannels: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  scanCurrentPage: [];
  addCurrentToQueue: [];
  'update:sortBy': [value: string];
  'update:channelFilter': [value: string[]];
}>();

const handleChannelFilterChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(target.selectedOptions).map(option => option.value);
    emit('update:channelFilter', selectedOptions);
};

</script>
