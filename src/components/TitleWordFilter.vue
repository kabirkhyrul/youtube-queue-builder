<template>
    <div class="relative">
        <!-- Selected tags -->
        <div v-if="modelValue.length > 0" class="mb-1 flex flex-wrap gap-1">
            <span
                v-for="word in modelValue"
                :key="word"
                class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
            >
                {{ word }}
                <button
                    type="button"
                    @click="removeWord(word)"
                    class="ml-0.5 text-blue-500 hover:text-blue-900 focus:outline-none"
                    :aria-label="`Remove ${word}`"
                >
                    <svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                </button>
            </span>
        </div>

        <!-- Search input -->
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Exclude title words..."
            @focus="showDropdown = true"
            @blur="handleBlur"
            class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <!-- Dropdown -->
        <div
            v-if="showDropdown && filteredWords.length > 0"
            class="absolute left-0 right-0 top-full z-50 mt-0.5 max-h-40 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg"
        >
            <button
                v-for="word in filteredWords"
                :key="word"
                type="button"
                @mousedown.prevent="toggleWord(word)"
                class="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                :class="{ 'bg-blue-50 text-blue-700 font-medium': modelValue.includes(word) }"
            >
                <input
                    type="checkbox"
                    :checked="modelValue.includes(word)"
                    class="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    tabindex="-1"
                    readonly
                />
                {{ word }}
            </button>
        </div>

        <p v-if="showDropdown && words.length === 0" class="absolute left-0 right-0 top-full z-50 mt-0.5 rounded border border-gray-200 bg-white px-2 py-2 text-center text-xs text-gray-400 shadow-lg">
            No words available
        </p>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
    modelValue: string[];
    words: string[];
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string[]];
}>();

const searchQuery = ref("");
const showDropdown = ref(false);

const filteredWords = computed((): string[] => {
    const q = searchQuery.value.toLowerCase().trim();
    return props.words.filter((w) => !q || w.toLowerCase().includes(q));
});

const toggleWord = (word: string): void => {
    const current = props.modelValue;
    if (current.includes(word)) {
        emit("update:modelValue", current.filter((v) => v !== word));
    } else {
        emit("update:modelValue", [...current, word]);
    }
};

const removeWord = (word: string): void => {
    emit("update:modelValue", props.modelValue.filter((v) => v !== word));
};

const handleBlur = (): void => {
    setTimeout(() => {
        showDropdown.value = false;
    }, 150);
};
</script>
