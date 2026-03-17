<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-800">Panel de Control</h2>
        <p class="text-slate-500 text-sm">Resumen de métricas del sistema ITAM</p>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total de Activos" :value="stats.totalSlots" colorTheme="blue">
        <Smartphone class="w-6 h-6" />
      </StatCard>
      
      <StatCard title="Activos Disponibles/Activos" :value="stats.activeAvailableSlots" colorTheme="green">
        <CheckCircle class="w-6 h-6" />
      </StatCard>
      
      <StatCard title="Inversión Estimada" :value="formattedCost" colorTheme="orange">
        <DollarSign class="w-6 h-6" />
      </StatCard>
      
      <StatCard title="Renovación (<90d)" :value="stats.renovacionProxima" colorTheme="red">
        <Clock class="w-6 h-6" />
      </StatCard>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <div class="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Distribución por Gama</h3>
        <div class="h-64">
          <Bar v-if="chartData.labels" :data="chartData" :options="chartOptions" />
          <div v-else class="flex items-center justify-center h-full text-slate-400">
            Cargando gráfico...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Smartphone, CheckCircle, DollarSign, Clock } from 'lucide-vue-next';
import StatCard from '../components/StatCard.vue';
import api from '../api/axios';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const stats = ref({
  totalSlots: 0,
  activeAvailableSlots: 0,
  totalCostoCompra: 0,
  renovacionProxima: 0,
  gamaDistribution: []
});

const chartData = ref({});
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  }
};

const formattedCost = computed(() => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(stats.value.totalCostoCompra);
});

const loadStats = async () => {
  try {
    const response = await api.get('/stats');
    const result = response.data;
    if (result.success) {
      stats.value = result.data;
      
      // Setup Chart Data
      chartData.value = {
        labels: stats.value.gamaDistribution.map(g => g.gama),
        datasets: [
          {
            label: 'Equipos',
            backgroundColor: '#F96302', // THD Orange
            data: stats.value.gamaDistribution.map(g => g.count)
          }
        ]
      };
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }
};

onMounted(() => {
  loadStats();
});
</script>
