<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const activos = ref([]);
const searchQuery = ref("");

onMounted(async () => {
  try {
    const response = await axios.get("http://localhost:3000/api/activos");
    activos.value = response.data;
  } catch (error) {
    console.error("Error fetching activos:", error);
  }
});
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">
        Inventario ITAM Corporativo
      </h1>
      <div class="relative w-64">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Buscar IMEI, Teléfono..."
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-homedepot-orange"
        />
        <svg
          class="w-5 h-5 text-gray-500 absolute right-3 top-2.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </div>
    </div>

    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Estatus
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Teléfono
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              IMEI
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Modelo
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Empleado Asignado
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Tienda
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="activos.length === 0">
            <td colspan="6" class="px-6 py-4 text-center text-gray-500">
              Cargando datos o sin resultados...
            </td>
          </tr>
          <tr
            v-for="activo in activos"
            :key="activo.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
              >
                {{ activo.estatus }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
              {{ activo.telefono }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ activo.imei }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ activo.modelo }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
            >
              {{
                activo.empleado
                  ? activo.empleado.nombre_completo
                  : "Sin Asignar"
              }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ activo.empleado ? activo.empleado.tienda : "-" }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <button
        class="bg-homedepot-orange hover:bg-orange-600 text-white font-bold py-2 px-6 rounded transition duration-200"
      >
        Exportar Excel
      </button>
    </div>
  </div>
</template>
