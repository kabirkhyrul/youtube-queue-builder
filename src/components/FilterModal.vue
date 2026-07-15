<template>
    <div>
        <button @click="open = true"
            class="flex w-full items-center justify-between rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer">
            <span class="truncate text-sm leading-none">
                {{ modelValue.length > 0 ? `${modelValue.length} ${itemLabel}${modelValue.length > 1 ? "s" : ""}
                selected` : placeholder }}
            </span>
        </button>

        <Teleport to="body">
            <div v-if="open" class="modal-backdrop"
                @click.self="open = false">
                <div class="modal-container">
                    <!-- Header -->
                    <div class="modal-header">
                        <label class="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                :checked="allSelected"
                                :indeterminate="someSelected && !allSelected"
                                @change="toggleAll"
                                class="checkbox-custom"
                            />
                            <span class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ placeholder }}</span>
                        </label>
                        <button @click="open = false" class="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Scrollable item list -->
                    <div class="flex flex-1 flex-col overflow-y-auto px-3 py-1.5 space-y-0.5">
                        <label v-for="item in items" :key="item"
                            class="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <input type="checkbox" :value="item" :checked="modelValue.includes(item)"
                                @change="toggle(item)"
                                class="checkbox-custom" />
                            <span class="truncate text-sm text-slate-700 dark:text-slate-300">{{ item }}</span>
                        </label>
                        <p v-if="items.length === 0" class="py-4 text-center text-sm text-slate-400 dark:text-slate-500">No {{ itemLabel }}s
                            available</p>
                    </div>

                    <!-- Footer -->
                    <div class="modal-footer">
                        <span class="text-xs text-slate-500 dark:text-slate-400">{{ modelValue.length }} selected</span>
                        <div class="flex gap-2">
                            <button v-if="modelValue.length > 0" @click="$emit('update:modelValue', [])"
                                class="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 cursor-pointer">
                                Clear all
                            </button>
                            <button @click="open = false"
                                class="rounded bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 px-3 py-1 text-xs text-white cursor-pointer active:scale-95 transition-transform font-medium">
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
