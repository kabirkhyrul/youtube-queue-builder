<template>
  <div v-if="successMessage"
    class="mb-2 rounded-lg border border-green-200 dark:border-green-900 bg-green-50/70 dark:bg-green-950/20 px-2.5 py-1.5 text-xs leading-snug text-green-800 dark:text-green-300 shadow-xs">
    {{ successMessage }}
  </div>

  <div v-if="errorMessage"
    class="mb-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/20 px-2.5 py-1.5 text-xs leading-snug text-red-800 dark:text-red-300 shadow-xs">
    {{ errorMessage }}
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';

const successMessage = shallowRef('');
const errorMessage = shallowRef('');

const showMessage = (message: string, type: string = 'success'): void => {
  if (type === 'success') {
    successMessage.value = message;
    errorMessage.value = '';
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } else {
    errorMessage.value = message;
    successMessage.value = '';
    setTimeout(() => {
      errorMessage.value = '';
    }, 5000);
  }
};

defineExpose({
  showMessage
});
</script>
