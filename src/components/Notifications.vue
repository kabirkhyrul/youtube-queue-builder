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
import { ref, Ref } from 'vue';

const successMessage: Ref<string> = ref('');
const errorMessage: Ref<string> = ref('');

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
