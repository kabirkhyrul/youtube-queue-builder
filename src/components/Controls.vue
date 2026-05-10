<template>
  <!-- Controls Section -->
  <div class="bg-white rounded-lg p-4 border border-gray-200 mb-4 sticky top-0 z-10 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <span class="text-sm font-medium text-gray-700">Videos found:</span>
      <span class="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{{ store.filteredVideos.length }}</span>
    </div>

    <div class="flex justify-between gap-3 mb-4">
      <button @click="handleScan" :disabled="!store.canScan || store.isLoading"
        class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
        {{ store.scanButtonText }}
      </button>

      <button @click="handleAddToQueue" :disabled="store.filteredVideos.length === 0 || store.isLoading"
        class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
        Add All to YouTube Queue
      </button>
    </div>

    <!-- Filters and Sort -->
    <div v-if="store.videos.length > 0" class="grid grid-cols-1 gap-3">
      <SortFilter :modelValue="store.sortBy" @update:modelValue="store.sortBy = $event" />
      <ChannelFilter :modelValue="store.channelFilter" :channels="store.uniqueChannels"
        @update:modelValue="store.channelFilter = $event" />
      <ViewsFilter :min="store.minViewsFilter" :max="store.maxViewsFilter"
        @update:min="store.minViewsFilter = $event" @update:max="store.maxViewsFilter = $event" />
      <DateFilter :modelValue="store.publishedTimeFilter" :dates="store.uniquePublishedTimes"
        @update:modelValue="(v: string[]) => store.publishedTimeFilter = v" />
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="store.only4KFilter"
            class="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm text-gray-700">4K only</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="store.onlyOfficialFilter"
            class="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm text-gray-700">Official channels only</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useVideoStore } from "../stores/videoStore";
import SortFilter from "./SortFilter.vue";
import ChannelFilter from "./ChannelFilter.vue";
import ViewsFilter from "./ViewsFilter.vue";
import DateFilter from "./DateFilter.vue";

const props = defineProps<{ notificationsRef: any }>();

const store = useVideoStore();

const handleScan = async (): Promise<void> => {
  const error = await store.scanCurrentPage();
  if (error) {
    props.notificationsRef?.showMessage(error, "error");
  } else {
    props.notificationsRef?.showMessage("Page scanned successfully!");
  }
};

const handleAddToQueue = async (): Promise<void> => {
  const result = await store.addCurrentToQueue();
  if (result.success) {
    props.notificationsRef?.showMessage(`Added ${result.count} videos to YouTube queue!`);
  } else {
    props.notificationsRef?.showMessage("Queue failed: " + result.error, "error");
  }
};

onMounted(() => {
  store.checkCurrentTab();
});
</script>
