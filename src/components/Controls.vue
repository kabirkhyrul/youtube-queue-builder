<script setup lang="ts">
import { onMounted } from "vue";
import { useVideoStore } from "../stores/videoStore";
import type Notifications from "./Notifications.vue";
import SortFilter from "./SortFilter.vue";
import ChannelFilter from "./ChannelFilter.vue";
import ViewsFilter from "./ViewsFilter.vue";
import DateFilter from "./DateFilter.vue";

const props = defineProps<{
  notificationsRef: InstanceType<typeof Notifications> | null;
}>();

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

<template>
  <div class="sticky top-0 z-10 mb-1.5 rounded-md border border-gray-200 bg-white p-2 shadow-sm">
    <div class="mb-1.5 flex items-center gap-1.5">
      <span class="mr-auto text-sm font-medium text-gray-500">Videos</span>
      <span class="rounded-full bg-blue-50 px-1.5 py-0.5 text-sm font-semibold leading-none text-blue-700">
        {{ store.filteredVideos.length }}
      </span>
      <button @click="handleScan" :disabled="!store.canScan || store.isLoading"
        class="rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium leading-none text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
        {{ store.scanButtonText }}
      </button>
      <button @click="handleAddToQueue" :disabled="store.filteredVideos.length === 0 || store.isLoading"
        class="rounded border border-transparent bg-blue-600 px-2 py-1 text-sm font-medium leading-none text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
        Queue
      </button>
    </div>

    <div v-if="store.videos.length > 0" class="grid grid-cols-1 gap-1.5">
      <SortFilter :modelValue="store.sortBy" @update:modelValue="(v) => store.sortBy = v as typeof store.sortBy" />
      <div class="grid grid-cols-2 gap-1.5">
        <ChannelFilter :modelValue="store.channelFilter" :channels="store.uniqueChannels"
          @update:modelValue="store.channelFilter = $event" />
        <DateFilter :modelValue="store.publishedTimeFilter" :dates="store.uniquePublishedTimes"
          @update:modelValue="(v: string[]) => store.publishedTimeFilter = v" />
      </div>
      <ViewsFilter :min="store.minViewsFilter" :max="store.maxViewsFilter" @update:min="store.minViewsFilter = $event"
        @update:max="store.maxViewsFilter = $event" />
      <div class="flex flex-wrap gap-x-2.5 gap-y-1">
        <label class="flex cursor-pointer items-center gap-1">
          <input type="checkbox" v-model="store.only4KFilter"
            class="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm text-gray-700">4K</span>
        </label>
        <label class="flex cursor-pointer items-center gap-1">
          <input type="checkbox" v-model="store.onlyOfficialFilter"
            class="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm text-gray-700">Official</span>
        </label>
      </div>
    </div>
  </div>
</template>
