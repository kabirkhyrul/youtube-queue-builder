<template>
    <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Filter by published time:</label>
        <select
            :value="modelValue"
            @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
            class="w-full text-sm border border-gray-300 rounded px-3 py-2"
        >
            <option value="">All dates</option>
            <option v-for="date in dates" :key="date" :value="date">{{ date }}</option>
        </select>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string;
    dates: string[];
}>();

defineEmits<{
    "update:modelValue": [value: string];
}>();
</script>
