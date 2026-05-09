<template>
    <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Filter by views:</label>
        <div class="grid grid-cols-2 gap-2">
            <input
                type="number"
                min="0"
                :value="min"
                @input="$emit('update:min', ($event.target as HTMLInputElement).value)"
                placeholder="Min"
                class="w-full text-sm border border-gray-300 rounded px-3 py-2"
            />
            <input
                type="number"
                min="0"
                :value="max"
                @input="$emit('update:max', ($event.target as HTMLInputElement).value)"
                placeholder="Max"
                class="w-full text-sm border border-gray-300 rounded px-3 py-2"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    min: string;
    max: string;
}>();

defineEmits<{
    "update:min": [value: string];
    "update:max": [value: string];
}>();
</script>
