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
                @click="scanCurrentPage"
                :disabled="!canScan || isLoading"
                class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {{ scanButtonText }}
            </button>

            <button
                @click="addCurrentToQueue"
                :disabled="filteredVideos.length === 0 || isLoading"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Add All to YouTube Queue
            </button>
        </div>

        <!-- Filters and Sort -->
        <div v-if="props.videos.length > 0" class="grid grid-cols-1 gap-3">
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1"
                    >Sort by:</label
                >
                <select
                    :value="props.sortBy"
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
                    :value="props.channelFilter"
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
                    v-if="props.channelFilter.length > 0"
                    class="mt-1 flex items-center justify-between"
                >
                    <span class="text-xs text-gray-500">
                        {{ props.channelFilter.length }} channel{{
                            props.channelFilter.length > 1 ? "s" : ""
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
import { computed, ref, onMounted, watch, Ref } from 'vue';
import type { VideoData } from '../types';

interface Props {
  videos: VideoData[];
  sortBy: string;
  channelFilter: string[];
}

const props = defineProps<Props>();

const isLoading: Ref<boolean> = ref(false);
const canScan: Ref<boolean> = ref(false);
const scanButtonText: Ref<string> = ref('Scan Current Page');

const uniqueChannels = computed((): string[] => {
  const channels = props.videos.map((video: VideoData) => video.channel).filter(Boolean);
  return [...new Set(channels)].sort();
});

const filteredVideos = computed((): VideoData[] => {
  let filtered: VideoData[] = props.videos;

  // Apply channel filter
  if (props.channelFilter.length > 0) {
    filtered = filtered.filter((video) =>
      props.channelFilter.includes(video.channel)
    );
  }

  // Apply sorting
  filtered = [...filtered].sort((a: VideoData, b: VideoData) => {
    switch (props.sortBy) {
      case 'duration':
        return (b.durationInSeconds || 0) - (a.durationInSeconds || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'channel':
        return a.channel.localeCompare(b.channel);
      case 'views':
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      default:
        return 0;
    }
  });

  return filtered;
});

const emit = defineEmits<{
  'update:sortBy': [value: string];
  'update:channelFilter': [value: string[]];
  'videos-updated': [videos: VideoData[]];
  'filtered-videos-updated': [videos: VideoData[]];
  'show-message': [message: string, type?: string];
}>();

const checkCurrentTab = async (): Promise<void> => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab.url && tab.url.includes('youtube.com/results')) {
      scanButtonText.value = 'Scan Current Page';
      canScan.value = true;
    } else {
      scanButtonText.value = 'Navigate to YouTube Search';
      canScan.value = false;
    }
  } catch (error) {
    console.error('Error checking current tab:', error);
  }
};

const scanCurrentPage = async (): Promise<void> => {
  isLoading.value = true;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.url || !tab.url.includes('youtube.com/results')) {
      emit('show-message', 'Please navigate to YouTube search results first', 'error');
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'scanPage',
    });

    if (response.success) {
      emit('show-message', 'Page scanned successfully!');
      setTimeout(async () => {
        const data = await chrome.storage.local.get(['videos']);
        emit('videos-updated', data.videos || []);
      }, 1000);
    }
  } catch (error) {
    emit('show-message', 'Error scanning page: ' + (error as Error).message, 'error');
  } finally {
    isLoading.value = false;
  }
};

const addCurrentToQueue = async (): Promise<void> => {
  if (filteredVideos.value.length === 0) {
    emit('show-message', 'No videos found', 'error');
    return;
  }

  isLoading.value = true;

  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      chrome.runtime.sendMessage(
        {
          action: 'addCurrentToQueue',
          videos: filteredVideos.value,
        },
        (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });

    if (response && (response as any).success) {
      emit('show-message', `Added ${(response as any).count} videos to YouTube queue!`);
    } else {
      const errorMsg = (response as any) ? (response as any).error : 'No response received';
      emit('show-message', 'Queue failed: ' + errorMsg, 'error');
    }
  } catch (error) {
    emit('show-message', 'Queue error: ' + (error as Error).message, 'error');
  } finally {
    isLoading.value = false;
  }
};

const handleChannelFilterChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement;
  const selectedOptions = Array.from(target.selectedOptions).map(option => option.value);
  emit('update:channelFilter', selectedOptions);
};

onMounted(() => {
  checkCurrentTab();
});

// Watch for changes to filteredVideos and emit updates
watch(filteredVideos, (newFilteredVideos) => {
  emit('filtered-videos-updated', newFilteredVideos);
}, { immediate: true });

</script>
