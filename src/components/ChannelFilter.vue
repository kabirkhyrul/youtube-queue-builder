<template>
    <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Filter by channels:</label>
        <select
            :value="modelValue"
            @change="handleChange"
            multiple
            class="w-full text-sm border border-gray-300 rounded px-3 py-2 min-h-[80px]"
        >
            <option
                v-for="channel in channels"
                :key="channel"
                :value="channel"
            >
                {{ channel }}
            </option>
        </select>
        <div
            v-if="modelValue.length > 0"
            class="mt-1 flex items-center justify-between"
        >
            <span class="text-xs text-gray-500">
                {{ modelValue.length }} channel{{ modelValue.length > 1 ? "s" : "" }} selected
            </span>
            <button
                @click="$emit('update:modelValue', [])"
                class="text-xs text-blue-600 hover:text-blue-800"
            >
                Clear all
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string[];
    channels: string[];
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string[]];
}>();

const handleChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const selected = Array.from(target.selectedOptions).map((o) => o.value);
    emit("update:modelValue", selected);
};
</script>
