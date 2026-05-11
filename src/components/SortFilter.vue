<template>
    <div>
        <label class="sr-only">Sort by</label>
        <div class="flex flex-wrap gap-x-2 gap-y-1">
            <label v-for="(label, value) in labels" :key="value" class="flex cursor-pointer items-center gap-1">
                <input type="radio" :value="value" :checked="modelValue === value"
                    @change="$emit('update:modelValue', value)"
                    class="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span class="text-sm leading-none text-gray-700">{{ label }}</span>
            </label>
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
