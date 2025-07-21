<template>
  <div class="stacked-chart-container">
    <div v-if="store.options.length === 0 || store.criteria.length === 0" class="text-center py-8 text-gray-500">
      選択肢と観点を追加するとスコア内訳が表示されます。
    </div>
    <div v-else ref="chartContainer" class="w-full h-80">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useComparisonStore } from '@/stores/comparison'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const store = useComparisonStore()
const chartContainer = ref<HTMLDivElement>()
const chartCanvas = ref<HTMLCanvasElement>()
let chartInstance: ChartJS | null = null

// Generate colors for each criteria
const colors = [
  'rgba(59, 130, 246, 0.8)',   // blue
  'rgba(16, 185, 129, 0.8)',   // green
  'rgba(245, 158, 11, 0.8)',   // yellow
  'rgba(239, 68, 68, 0.8)',    // red
  'rgba(139, 92, 246, 0.8)',   // purple
  'rgba(236, 72, 153, 0.8)',   // pink
  'rgba(20, 184, 166, 0.8)',   // teal
  'rgba(251, 146, 60, 0.8)',   // orange
  'rgba(168, 85, 247, 0.8)',   // violet
  'rgba(34, 197, 94, 0.8)',    // emerald
]

const chartData = computed(() => {
  const labels = store.options.map(option => option.name)
  const datasets = store.criteria.map((criterium, index) => ({
    label: criterium.name,
    data: store.options.map(option => {
      const evaluation = store.evaluations[option.id]?.[criterium.id] || 0
      return evaluation * criterium.weight
    }),
    backgroundColor: colors[index % colors.length],
    borderColor: colors[index % colors.length].replace('0.8', '1'),
    borderWidth: 1,
  }))

  return {
    labels,
    datasets,
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        boxWidth: 12,
        padding: 15,
        font: {
          size: 11,
        },
      },
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        title: function(context: any) {
          return `${context[0].label}のスコア内訳`
        },
        label: function(context: any) {
          const criteriumName = context.dataset.label
          const score = context.parsed.y
          return `${criteriumName}: ${score.toFixed(1)}`
        },
        afterLabel: function(context: any) {
          const optionId = store.options[context.dataIndex].id
          const totalScore = store.results[optionId]?.totalScore || 0
          if (context.datasetIndex === context.chart.data.datasets.length - 1) {
            return `合計: ${totalScore.toFixed(1)}`
          }
          return ''
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: 'スコア',
      },
    },
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
}

function createChart() {
  if (!chartCanvas.value) return
  
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  
  chartInstance = new ChartJS(ctx, {
    type: 'bar',
    data: chartData.value,
    options: chartOptions,
  })
}

function updateChart() {
  if (chartInstance) {
    chartInstance.data = chartData.value
    chartInstance.update()
  }
}

function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

onMounted(() => {
  nextTick(() => {
    if (store.options.length > 0 && store.criteria.length > 0) {
      createChart()
    }
  })
})

watch(
  [() => store.options, () => store.criteria, () => store.evaluations],
  () => {
    if (store.options.length > 0 && store.criteria.length > 0) {
      if (!chartInstance) {
        nextTick(() => {
          createChart()
        })
      } else {
        updateChart()
      }
    } else {
      destroyChart()
    }
  },
  { deep: true }
)
</script>

<style scoped>
.stacked-chart-container {
  width: 100%;
}
</style>
