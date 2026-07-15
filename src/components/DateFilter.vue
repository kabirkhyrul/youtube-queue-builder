<script setup lang="ts">
import DateFilterModal from "./DateFilterModal.vue";

defineProps<{
    modelValue: string[];
    dates: string[];
}>();

defineEmits<{
    "update:modelValue": [value: string[]];
}>();
</script>

<template>
    <DateFilterModal
        :dates="dates"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
    />
</template>
