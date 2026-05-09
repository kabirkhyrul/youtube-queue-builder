<template>
    <FilterModal
        :items="dates"
        :model-value="modelValue"
        placeholder="Filter by published time"
        item-label="date"
        @update:model-value="$emit('update:modelValue', $event)"
    />
</template>

<script setup lang="ts">
import FilterModal from "./FilterModal.vue";

defineProps<{
    modelValue: string[];
    dates: string[];
}>();

defineEmits<{
    "update:modelValue": [value: string[]];
}>();
</script>
