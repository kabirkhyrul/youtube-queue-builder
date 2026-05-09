<template>
    <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Filter by published time:</label>
        <div class="grid grid-cols-2 gap-2">
            <input
                type="date"
                :value="min"
                @input="$emit('update:min', ($event.target as HTMLInputElement).value)"
                class="w-full text-sm border border-gray-300 rounded px-3 py-2"
            />
            <input
                type="date"
                :value="max"
                @input="$emit('update:max', ($event.target as HTMLInputElement).value)"
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
