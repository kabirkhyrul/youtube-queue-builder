<template>
  <div v-if="successMessage"
    class="mb-1.5 rounded border border-green-300 bg-green-50 px-2 py-1.5 text-sm leading-snug text-green-700">
    {{ successMessage }}
  </div>

  <div v-if="errorMessage"
    class="mb-1.5 rounded border border-red-300 bg-red-50 px-2 py-1.5 text-sm leading-snug text-red-700">
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
