<template>
    <div class="relative">
        <!-- Selected tags -->
        <div v-if="modelValue.length > 0" class="mb-1.5 flex flex-wrap gap-1">
            <span
                v-for="word in modelValue"
                :key="word"
                class="tag-badge"
            >
                {{ word }}
                <button
                    type="button"
                    @click="removeWord(word)"
                    class="ml-0.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 focus:outline-none cursor-pointer"
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
            class="input-field"
        />

        <!-- Dropdown -->
        <div
            v-if="showDropdown && filteredWords.length > 0"
            class="dropdown-menu"
        >
            <button
                v-for="word in filteredWords"
                :key="word"
                type="button"
                @mousedown.prevent="toggleWord(word)"
                class="dropdown-item"
                :class="{ 'dropdown-item-active': modelValue.includes(word) }"
            >
                <input
                    type="checkbox"
                    :checked="modelValue.includes(word)"
                    class="checkbox-custom"
                    tabindex="-1"
                    readonly
                />
                {{ word }}
            </button>
        </div>

        <p v-if="showDropdown && words.length === 0" class="dropdown-menu px-2 py-2 text-center text-xs text-slate-400 dark:text-slate-500">
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
