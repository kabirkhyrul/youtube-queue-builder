<template>
    <div
        v-if="successMessage"
        class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
    >
        {{ successMessage }}
    </div>

    <div
        v-if="errorMessage"
        class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
    >
        {{ errorMessage }}
    </div>
</template>

<script setup lang="ts">
interface Props {
  successMessage?: string;
  errorMessage?: string;
}

defineProps<Props>();
</script>
