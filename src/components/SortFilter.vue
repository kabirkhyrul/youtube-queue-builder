<template>
    <div>
        <span class="sr-only">Sort by</span>
        <div class="flex flex-wrap gap-1">
            <button v-for="(label, value) in labels" :key="value"
                type="button"
                @click="$emit('update:modelValue', value)"
                class="pill-sort"
                :class="modelValue === value ? 'pill-sort-active' : ''"
            >
                {{ label }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string;
}>();

defineEmits<{
    "update:modelValue": [value: string];
}>();

const labels: Record<string, string> = {
    duration: "Duration",
    title: "Title",
    channel: "Channel",
    views: "Views",
    viewsPerDay: "V/Day",
    publishedTime: "Newest",
};
</script>
