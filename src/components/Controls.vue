<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useVideoStore } from "../stores/videoStore";
import type Notifications from "./Notifications.vue";
import SortFilter from "./SortFilter.vue";
import ChannelFilter from "./ChannelFilter.vue";
import ViewsFilter from "./ViewsFilter.vue";
import DateFilter from "./DateFilter.vue";
import TitleWordFilter from "./TitleWordFilter.vue";
import { Scan as ScanIcon, ListPlus as ListPlusIcon } from "lucide-vue-next";

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
    const message = result.error
      ? `Added ${result.count} videos to YouTube queue. ${result.error}`
      : `Added ${result.count} videos to YouTube queue!`;
    props.notificationsRef?.showMessage(message);
  } else {
    props.notificationsRef?.showMessage("Queue failed: " + result.error, "error");
  }
};

const hasActiveFilters = computed(() => {
  return store.channelFilter.length > 0 ||
         store.publishedTimeFilter.length > 0 ||
         store.titleWordFilter.length > 0 ||
         store.minViewsFilter !== "" ||
         store.maxViewsFilter !== "" ||
         store.minDurationFilter !== "" ||
         store.maxDurationFilter !== "" ||
         store.only4KFilter ||
         store.onlyOfficialFilter;
});

const clearAllFilters = () => {
  store.channelFilter = [];
  store.publishedTimeFilter = [];
  store.titleWordFilter = [];
  store.minViewsFilter = "";
  store.maxViewsFilter = "";
  store.minDurationFilter = "";
  store.maxDurationFilter = "";
  store.only4KFilter = false;
  store.onlyOfficialFilter = false;
};

onMounted(() => {
  store.checkCurrentTab();
});
</script>

<template>
  <div class="sticky top-0 z-10 mb-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-sm backdrop-blur-md">
    <!-- Title & Video count row -->
    <div class="mb-2 flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Videos Found</span>
        <span class="badge-count">
          {{ store.filteredVideos.length }}
        </span>
      </div>
    </div>
    <!-- Actions row (Scan & Queue) -->
    <div class="mb-2.5 grid grid-cols-2 gap-1.5">
      <button @click="handleScan" :disabled="!store.canScan || store.isLoading"
        class="btn-scan shadow-xs">
        <ScanIcon class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        <span>{{ store.canScan ? "Scan Page" : "Scan Blocked" }}</span>
      </button>
      <button @click="handleAddToQueue" :disabled="store.filteredVideos.length === 0 || store.isLoading"
        class="btn-queue shadow-sm">
        <ListPlusIcon class="w-3.5 h-3.5" />
        <span>Queue</span>
        <span class="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-extrabold leading-none">
          {{ store.someFilteredSelected ? store.filteredVideos.filter(v => store.selectedVideoIdSet.has(v.videoId)).length : store.filteredVideos.length }}
        </span>
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
      <TitleWordFilter :modelValue="store.titleWordFilter" :words="store.uniqueTitleWords"
        @update:modelValue="store.titleWordFilter = $event" />
      <div class="grid grid-cols-2 gap-1.5">
        <ViewsFilter :min="store.minViewsFilter" :max="store.maxViewsFilter"
          @update:min="store.minViewsFilter = $event" @update:max="store.maxViewsFilter = $event" />
        <ViewsFilter :min="store.minDurationFilter" :max="store.maxDurationFilter" label="Filter by duration"
          minPlaceholder="Min sec" maxPlaceholder="Max sec" @update:min="store.minDurationFilter = $event"
          @update:max="store.maxDurationFilter = $event" />
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-1.5 py-0.5">
        <label class="flex cursor-pointer items-center gap-1.5">
          <input type="checkbox" v-model="store.only4KFilter"
            class="checkbox-custom" />
          <span class="text-xs font-medium text-slate-700 dark:text-slate-300">4K</span>
        </label>
        <label class="flex cursor-pointer items-center gap-1.5">
          <input type="checkbox" v-model="store.onlyOfficialFilter"
            class="checkbox-custom" />
          <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Official</span>
        </label>
      </div>

      <!-- Active dismissible pills -->
      <div v-if="hasActiveFilters" class="flex flex-wrap gap-1 mt-1 pb-0.5 border-t border-slate-200/60 dark:border-slate-800/60 pt-1.5">
        <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 flex items-center mr-0.5 uppercase tracking-wider">Filters:</span>
        <span v-for="ch in store.channelFilter" :key="ch" class="pill-filter">
          {{ ch }}
          <button @click="store.channelFilter = store.channelFilter.filter(c => c !== ch)" class="hover:text-red-500 dark:hover:text-red-400 font-bold ml-0.5 cursor-pointer">×</button>
        </span>
        <span v-for="dt in store.publishedTimeFilter" :key="dt" class="pill-filter">
          {{ dt }}
          <button @click="store.publishedTimeFilter = store.publishedTimeFilter.filter(d => d !== dt)" class="hover:text-red-500 dark:hover:text-red-400 font-bold ml-0.5 cursor-pointer">×</button>
        </span>
        <span v-for="w in store.titleWordFilter" :key="w" class="pill-filter">
          -{{ w }}
          <button @click="store.titleWordFilter = store.titleWordFilter.filter(word => word !== w)" class="hover:text-red-500 dark:hover:text-red-400 font-bold ml-0.5 cursor-pointer">×</button>
        </span>
        <span v-if="store.minViewsFilter || store.maxViewsFilter" class="pill-filter">
          Views
          <button @click="store.minViewsFilter = ''; store.maxViewsFilter = ''" class="hover:text-red-500 dark:hover:text-red-400 font-bold ml-0.5 cursor-pointer">×</button>
        </span>
        <span v-if="store.minDurationFilter || store.maxDurationFilter" class="pill-filter">
          Duration
          <button @click="store.minDurationFilter = ''; store.maxDurationFilter = ''" class="hover:text-red-500 dark:hover:text-red-400 font-bold ml-0.5 cursor-pointer">×</button>
        </span>
        <span v-if="store.only4KFilter" class="pill-filter">
          4K
          <button @click="store.only4KFilter = false" class="hover:text-red-500 dark:hover:text-red-400 font-bold ml-0.5 cursor-pointer">×</button>
        </span>
        <span v-if="store.onlyOfficialFilter" class="pill-filter">
          Official
          <button @click="store.onlyOfficialFilter = false" class="hover:text-red-500 dark:hover:text-red-400 font-bold ml-0.5 cursor-pointer">×</button>
        </span>
        <button @click="clearAllFilters" class="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-auto cursor-pointer self-center">
          Clear All
        </button>
      </div>
    </div>
  </div>
</template>
