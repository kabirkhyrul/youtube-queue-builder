<template>
    <div>
        <label class="sr-only">Filter by views</label>
        <div class="grid grid-cols-2 gap-1.5">
            <input type="number" min="0" :value="min"
                @input="$emit('update:min', ($event.target as HTMLInputElement).value)" placeholder="Min"
                class="w-full rounded border border-gray-300 px-2 py-1 text-sm leading-none" />
            <input type="number" min="0" :value="max"
                @input="$emit('update:max', ($event.target as HTMLInputElement).value)" placeholder="Max"
                class="w-full rounded border border-gray-300 px-2 py-1 text-sm leading-none" />
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
