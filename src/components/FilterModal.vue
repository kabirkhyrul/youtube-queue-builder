<template>
    <div>
        <button @click="open = true"
            class="w-full text-sm text-left border border-gray-300 rounded px-3 py-2 bg-white hover:bg-gray-50 flex items-center justify-between">
            <span class="text-gray-700">
                {{ modelValue.length > 0 ? `${modelValue.length} ${itemLabel}${modelValue.length > 1 ? "s" : ""} selected` : placeholder }}
            </span>
        </button>

        <Teleport to="body">
            <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                @click.self="open = false">
                <div class="bg-white rounded-lg shadow-xl w-80 max-h-[70vh] flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <span class="text-sm font-medium text-gray-800">{{ placeholder }}</span>
                        <button @click="open = false" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Scrollable item list -->
                    <div class="overflow-y-auto flex-1 px-4 py-2 flex flex-wrap">
                        <label v-for="item in items" :key="item"
                            class="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded px-1">
                            <input type="checkbox" :value="item" :checked="modelValue.includes(item)"
                                @change="toggle(item)"
                                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span class="text-sm text-gray-700 truncate">{{ item }}</span>
                        </label>
                        <p v-if="items.length === 0" class="text-sm text-gray-400 py-4 text-center">No {{ itemLabel }}s available</p>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                        <span class="text-xs text-gray-500">{{ modelValue.length }} selected</span>
                        <div class="flex gap-2">
                            <button v-if="modelValue.length > 0" @click="$emit('update:modelValue', [])"
                                class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">
                                Clear all
                            </button>
                            <button @click="open = false"
                                class="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
    modelValue: string[];
    items: string[];
    placeholder: string;
    itemLabel: string;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string[]];
}>();

const open = ref(false);

const toggle = (item: string): void => {
    const current = props.modelValue;
    if (current.includes(item)) {
        emit("update:modelValue", current.filter((v) => v !== item));
    } else {
        emit("update:modelValue", [...current, item]);
    }
};
</script>
