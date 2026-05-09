<template>
    <FilterModal
        :items="channels"
        :model-value="modelValue"
        placeholder="Filter by channels"
        item-label="channel"
        @update:model-value="$emit('update:modelValue', $event)"
    />
</template>

<script setup lang="ts">
import FilterModal from "./FilterModal.vue";

defineProps<{
    modelValue: string[];
    channels: string[];
}>();

defineEmits<{
    "update:modelValue": [value: string[]];
}>();
</script>
