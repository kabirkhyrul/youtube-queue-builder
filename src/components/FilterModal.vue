<template>
    <div>
        <button @click="open = true"
            class="flex w-full items-center justify-between rounded border border-gray-300 bg-white px-2 py-1 text-left hover:bg-gray-50">
            <span class="truncate text-sm leading-none text-gray-700">
                {{ modelValue.length > 0 ? `${modelValue.length} ${itemLabel}${modelValue.length > 1 ? "s" : ""}
                selected` : placeholder }}
            </span>
        </button>

        <Teleport to="body">
            <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                @click.self="open = false">
                <div class="flex max-h-[70vh] w-80 flex-col rounded-lg bg-white shadow-xl">
                    <!-- Header -->
                    <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2">
                        <label class="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                :checked="allSelected"
                                :indeterminate="someSelected && !allSelected"
                                @change="toggleAll"
                                class="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span class="text-sm font-medium text-gray-800">{{ placeholder }}</span>
                        </label>
                        <button @click="open = false" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Scrollable item list -->
                    <div class="flex flex-1 flex-wrap overflow-y-auto px-3 py-1.5">
                        <label v-for="item in items" :key="item"
                            class="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-gray-50">
                            <input type="checkbox" :value="item" :checked="modelValue.includes(item)"
                                @change="toggle(item)"
                                class="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span class="truncate text-sm text-gray-700">{{ item }}</span>
                        </label>
                        <p v-if="items.length === 0" class="py-4 text-center text-sm text-gray-400">No {{ itemLabel }}s
                            available</p>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between border-t border-gray-200 px-3 py-2">
                        <span class="text-sm text-gray-500">{{ modelValue.length }} selected</span>
                        <div class="flex gap-2">
                            <button v-if="modelValue.length > 0" @click="$emit('update:modelValue', [])"
                                class="text-sm text-gray-500 hover:text-gray-700 px-2 py-1">
                                Clear all
                            </button>
                            <button @click="open = false"
                                class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
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
import { shallowRef, computed } from "vue";

const props = defineProps<{
    modelValue: string[];
    items: string[];
    placeholder: string;
    itemLabel: string;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string[]];
}>();

const open = shallowRef(false);

const allSelected = computed((): boolean =>
    props.items.length > 0 && props.items.every((item) => props.modelValue.includes(item))
);

const someSelected = computed((): boolean =>
    props.items.some((item) => props.modelValue.includes(item))
);

const toggle = (item: string): void => {
    const current = props.modelValue;
    if (current.includes(item)) {
        emit("update:modelValue", current.filter((v) => v !== item));
    } else {
        emit("update:modelValue", [...current, item]);
    }
};

const toggleAll = (): void => {
    if (allSelected.value) {
        emit("update:modelValue", []);
    } else {
        emit("update:modelValue", [...props.items]);
    }
};
</script>
