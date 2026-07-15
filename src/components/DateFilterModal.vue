<script setup lang="ts">
import { shallowRef, computed } from "vue";

const props = defineProps<{
    modelValue: string[];
    dates: string[];
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string[]];
}>();

const open = shallowRef(false);

// Unit order for display — most recent first
const UNIT_ORDER = ["hour", "day", "week", "month", "year"];
const UNIT_LABELS: Record<string, string> = {
    hour: "Hours ago",
    day: "Days ago",
    week: "Weeks ago",
    month: "Months ago",
    year: "Years ago",
};

const detectUnit = (date: string): string => {
    const lower = date.toLowerCase();
    if (/hour|hr/.test(lower)) return "hour";
    if (/day/.test(lower)) return "day";
    if (/week|wk/.test(lower)) return "week";
    if (/month|mo/.test(lower)) return "month";
    if (/year|yr/.test(lower)) return "year";
    return "other";
};

// Group dates by their time unit, preserving original sort order from store
const groups = computed((): { unit: string; label: string; items: string[] }[] => {
    const map = new Map<string, string[]>();
    for (const date of props.dates) {
        const unit = detectUnit(date);
        if (!map.has(unit)) map.set(unit, []);
        map.get(unit)!.push(date);
    }

    const result: { unit: string; label: string; items: string[] }[] = [];
    for (const unit of UNIT_ORDER) {
        if (map.has(unit)) {
            result.push({ unit, label: UNIT_LABELS[unit], items: map.get(unit)! });
        }
    }
    // append any unrecognised units
    for (const [unit, items] of map) {
        if (!UNIT_ORDER.includes(unit)) {
            result.push({ unit, label: unit, items });
        }
    }
    return result;
});

const allSelected = computed((): boolean =>
    props.dates.length > 0 && props.dates.every((d) => props.modelValue.includes(d))
);
const someSelected = computed((): boolean =>
    props.dates.some((d) => props.modelValue.includes(d))
);

const groupAllSelected = (items: string[]): boolean =>
    items.length > 0 && items.every((d) => props.modelValue.includes(d));
const groupSomeSelected = (items: string[]): boolean =>
    items.some((d) => props.modelValue.includes(d));

const toggle = (date: string): void => {
    const current = props.modelValue;
    if (current.includes(date)) {
        emit("update:modelValue", current.filter((v) => v !== date));
    } else {
        emit("update:modelValue", [...current, date]);
    }
};

const toggleAll = (): void => {
    if (allSelected.value) {
        emit("update:modelValue", []);
    } else {
        emit("update:modelValue", [...props.dates]);
    }
};

const toggleGroup = (items: string[]): void => {
    if (groupAllSelected(items)) {
        emit("update:modelValue", props.modelValue.filter((v) => !items.includes(v)));
    } else {
        const toAdd = items.filter((d) => !props.modelValue.includes(d));
        emit("update:modelValue", [...props.modelValue, ...toAdd]);
    }
};
</script>

<template>
    <div>
        <button @click="open = true"
            class="flex w-full items-center justify-between rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer">
            <span class="truncate text-sm leading-none">
                {{ modelValue.length > 0 ? `${modelValue.length} date${modelValue.length > 1 ? "s" : ""} selected` : "Filter by published time" }}
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
                            <span class="text-sm font-medium text-slate-800 dark:text-slate-200">Filter by published time</span>
                        </label>
                        <button @click="open = false" class="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Grouped list -->
                    <div class="flex-1 overflow-y-auto px-3 py-1.5">
                        <p v-if="dates.length === 0" class="py-4 text-center text-sm text-slate-400 dark:text-slate-500">No dates available</p>

                        <div v-for="group in groups" :key="group.unit" class="mb-2">
                            <!-- Group header -->
                            <label class="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                                <input
                                    type="checkbox"
                                    :checked="groupAllSelected(group.items)"
                                    :indeterminate="groupSomeSelected(group.items) && !groupAllSelected(group.items)"
                                    @change="toggleGroup(group.items)"
                                    class="checkbox-custom"
                                />
                                <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-450">{{ group.label }}</span>
                            </label>

                            <!-- Group items -->
                            <label v-for="date in group.items" :key="date"
                                class="flex cursor-pointer items-center gap-2 rounded py-1 pl-6 pr-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                                <input
                                    type="checkbox"
                                    :checked="modelValue.includes(date)"
                                    @change="toggle(date)"
                                    class="checkbox-custom"
                                />
                                <span class="truncate text-sm text-slate-700 dark:text-slate-300">{{ date }}</span>
                            </label>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="modal-footer">
                        <span class="text-xs text-slate-500 dark:text-slate-400">{{ modelValue.length }} selected</span>
                        <div class="flex gap-2">
                            <button v-if="modelValue.length > 0" @click="$emit('update:modelValue', [])"
                                class="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
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
