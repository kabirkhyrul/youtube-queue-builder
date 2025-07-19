<script setup>
import { ref } from "vue";
import Header from "./components/Header.vue";
import Notifications from "./components/Notifications.vue";

const successMessage = ref("");
const errorMessage = ref("");
</script>

<template>
    <Header />
    <Notifications
        :successMessage="successMessage"
        :errorMessage="errorMessage"
    />
</template>
