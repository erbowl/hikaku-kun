<template>
  <div class="radar-chart-container">
    <div v-if="store.criteria.length === 0" class="text-center py-8 text-gray-500">
      観点を追加するとレーダーチャートが表示されます。
    </div>
    <div v-else ref="chartContainer" class="w-full h-80">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'vue-chartjs'
import { useComparisonStore } from '@/stores/comparison'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const store = useComparisonStore()
const chartContainer = ref<HTMLDivElement>()
const chartCanvas = ref<HTMLCanvasElement>()
let chartInstance: ChartJS | null = null

const chartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: '重み',
      data: [] as number[],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
    },
  ],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          return `${context.label}: ${context.parsed.r}`
        }
      }
    }
  },
  scales: {
    r: {
      beginAtZero: true,
      max: 10,
      ticks: {
        stepSize: 2,
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      angleLines: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      pointLabels: {
        font: {
          size: 12,
        },
      },
    },
  },
}

function updateChartData() {
  chartData.value.labels = store.criteria.map(c => c.name)
  chartData.value.datasets[0].data = store.criteria.map(c => c.weight)
  
  if (chartInstance) {
    chartInstance.update()
  }
}

function createChart() {
  if (!chartCanvas.value) return
  
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  
  chartInstance = new ChartJS(ctx, {
    type: 'radar',
    data: chartData.value,
    options: chartOptions,
  })
}

function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

onMounted(() => {
  nextTick(() => {
    updateChartData()
    createChart()
  })
})

watch(
  () => store.criteria,
  () => {
    updateChartData()
    if (!chartInstance && store.criteria.length > 0) {
      nextTick(() => {
        createChart()
      })
    }
  },
  { deep: true }
)

watch(
  () => store.criteria.length,
  (newLength) => {
    if (newLength === 0) {
      destroyChart()
    } else if (!chartInstance) {
      nextTick(() => {
        updateChartData()
        createChart()
      })
    }
  }
)
</script>

<style scoped>
.radar-chart-container {
  width: 100%;
}
</style>
