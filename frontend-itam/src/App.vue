<script setup>
import InventoryTable from "./components/InventoryTable.vue";
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1
          class="text-3xl font-bold leading-tight text-gray-900 border-l-4 border-homedepot-orange pl-4"
        >
          ITAM Dashboard
        </h1>
      </div>
    </header>
    <main>
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <InventoryTable />
      </div>
    </main>
  </div>
</template>

<style scoped></style>
