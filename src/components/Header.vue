<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Sun as SunIcon, Moon as MoonIcon } from "lucide-vue-next";

const isDark = ref(false);

const updateTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  updateTheme();
};

onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    isDark.value = true;
  } else {
    isDark.value = false;
  }
  updateTheme();
});
</script>

<template>
  <div class="mb-3 px-1 flex items-center justify-between">
    <div>
      <h1 class="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
        YouTube Queue Builder
      </h1>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
        Scan search results and queue videos
      </p>
    </div>
    <!-- Day/Night Toggle Button -->
    <button @click="toggleTheme" class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer active:scale-95" aria-label="Toggle theme">
      <SunIcon v-if="isDark" class="w-4 h-4 text-amber-500" />
      <MoonIcon v-else class="w-4 h-4 text-slate-600 dark:text-slate-300" />
    </button>
  </div>
</template>
