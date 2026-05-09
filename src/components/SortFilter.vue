<template>
    <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Sort by:</label>
        <select
            :value="modelValue"
            @input="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
            class="w-full text-sm border border-gray-300 rounded px-3 py-2"
        >
            <option value="duration">Duration</option>
            <option value="title">Title</option>
            <option value="channel">Channel</option>
            <option value="views">Views</option>
        </select>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string;
}>();

defineEmits<{
    "update:modelValue": [value: string];
}>();
</script>
