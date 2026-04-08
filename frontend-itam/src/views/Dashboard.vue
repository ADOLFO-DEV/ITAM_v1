<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/60">
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">Panel de Control</h2>
        <p class="text-slate-500 text-sm mt-1">Resumen en tiempo real y métricas del sistema ITAM</p>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="(item, index) in statItems" :key="index"
           class="transition-all duration-500 ease-out fill-mode-both"
           :style="{ animationDelay: `${index * 100}ms`, animationName: 'fadeSlideUp' }">
        <StatCard 
          :title="item.title" 
          :value="item.value" 
          :colorTheme="item.theme">
          <component :is="item.icon" class="w-7 h-7" stroke-width="1.5" />
        </StatCard>
      </div>
    </div>

    <!-- Charts Row 1: Gama & Distrito -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <div 
        class="bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
        style="animation: fadeSlideUp 0.8s ease-out 0.4s both;"
      >
        <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <span class="w-2 h-6 rounded-full bg-gradient-to-b from-[#F96302] to-orange-400 mr-3"></span>
          Distribución por Gama
        </h3>
        <div class="h-[300px] relative">
          <Bar v-if="chartData.labels && chartData.labels.length" :data="chartData" :options="chartOptions" />
          <div v-else class="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl">
            <div class="flex flex-col items-center animate-pulse">
              <div class="w-8 h-8 border-4 border-slate-200 border-t-[#F96302] rounded-full animate-spin mb-3"></div>
              Cargando métricas...
            </div>
          </div>
        </div>
      </div>

      <div 
        class="bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
        style="animation: fadeSlideUp 0.8s ease-out 0.5s both;"
      >
        <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <span class="w-2 h-6 rounded-full bg-gradient-to-b from-blue-600 to-indigo-500 mr-3"></span>
          Asignación por Distrito
        </h3>
        <div class="h-[300px] relative">
          <Doughnut v-if="chartDataDistrito.labels && chartDataDistrito.labels.length" :data="chartDataDistrito" :options="doughnutOptions" />
          <div v-else class="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl">
            <div class="flex flex-col items-center animate-pulse">
              <div class="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              Cargando métricas...
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row 2: Renovaciones Line Chart -->
    <div class="grid grid-cols-1 gap-6 mt-8">
      <div 
        class="bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
        style="animation: fadeSlideUp 0.8s ease-out 0.6s both;"
      >
        <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <span class="w-2 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-teal-400 mr-3"></span>
          Próximas Renovaciones (Próximos 18 Meses)
        </h3>
        <div class="h-[350px] relative">
          <LineChart v-if="chartDataRenovacion.labels && chartDataRenovacion.labels.length" :data="chartDataRenovacion" :options="lineOptions" />
          <div v-else class="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl">
            <div class="flex flex-col items-center animate-pulse">
              <div class="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
              Cargando métricas...
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes fadeSlideUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
.fill-mode-both { animation-fill-mode: both; }
</style>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Smartphone, CheckCircle, DollarSign, Clock } from 'lucide-vue-next';
import StatCard from '../components/StatCard.vue';
import api from '../api/axios';
import { Bar, Doughnut, Line as LineChart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement, PointElement, LineElement, Filler);

const stats = ref({
  totalSlots: 0,
  activeAvailableSlots: 0,
  totalCostoCompra: 0,
  renovacionProxima: 0,
  gamaDistribution: [],
  distritoDistribution: [],
  renovacionesMensuales: []
});

const chartData = ref({});
const chartDataDistrito = ref({});
const chartDataRenovacion = ref({});

// Options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9', drawBorder: false } },
    x: { grid: { display: false, drawBorder: false } }
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'right',
      labels: { usePointStyle: true, boxWidth: 8, padding: 20, font: { size: 11 } }
    }
  },
  cutout: '65%'
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false,
    }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9', drawBorder: false } },
    x: { grid: { display: false, drawBorder: false } }
  },
  elements: {
    line: { tension: 0.4 } // Smooth line curve
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
};

const formattedCost = computed(() => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(stats.value.totalCostoCompra);
});

const statItems = computed(() => [
  { title: "Total de Activos", value: stats.value.totalSlots, theme: "blue", icon: Smartphone },
  { title: "Activos Disponibles/Activos", value: stats.value.activeAvailableSlots, theme: "green", icon: CheckCircle },
  { title: "Inversión Estimada", value: formattedCost.value, theme: "orange", icon: DollarSign },
  { title: "Renovación (<90d)", value: stats.value.renovacionProxima, theme: "red", icon: Clock }
]);

const loadStats = async () => {
  try {
    const response = await api.get('/stats');
    const result = response.data;
    if (result.success) {
      stats.value = result.data;
      
      // 1. Gama Distribution (Bar)
      chartData.value = {
        labels: stats.value.gamaDistribution.map(g => g.gama),
        datasets: [
          {
            label: 'Equipos',
            backgroundColor: '#F96302', // THD Orange
            borderRadius: 6,
            data: stats.value.gamaDistribution.map(g => g.count)
          }
        ]
      };

      // 2. Distrito Distribution (Doughnut)
      const modernPalette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#0ea5e9'];
      const backgroundColorsForDistritos = stats.value.distritoDistribution.map((_, i) => modernPalette[i % modernPalette.length]);

      chartDataDistrito.value = {
        labels: stats.value.distritoDistribution.map(d => d.distrito),
        datasets: [
          {
            data: stats.value.distritoDistribution.map(d => d.count),
            backgroundColor: backgroundColorsForDistritos,
            borderWidth: 0,
            hoverOffset: 4
          }
        ]
      };

      // 3. Renovaciones Mensuales (Line Chart)
      chartDataRenovacion.value = {
        labels: stats.value.renovacionesMensuales.map(r => r.mesLabel),
        datasets: [
          {
            label: 'Equipos a renovar',
            data: stats.value.renovacionesMensuales.map(r => r.count),
            borderColor: '#10b981', // Emerald 500
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: true,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#10b981',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
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
