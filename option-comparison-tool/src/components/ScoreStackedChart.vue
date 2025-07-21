<template>
  <div class="score-stacked-chart">
    <h4>スコア内訳</h4>
    <div v-if="store.options.length === 0 || store.criteria.length === 0" class="empty-chart">
      <p>選択肢と観点を追加するとスコア内訳が表示されます</p>
    </div>
    <canvas v-else ref="stackedChart"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import { useComparisonStore } from '@/stores/comparison'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const store = useComparisonStore()
const stackedChart = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

// 観点ごとに異なる色を生成
function getColorForCriteria(index: number) {
  const colors = [
    { bg: 'rgba(59, 130, 246, 0.8)', border: '#3b82f6' },
    { bg: 'rgba(30, 64, 175, 0.8)', border: '#1e40af' },
    { bg: 'rgba(147, 197, 253, 0.8)', border: '#93c5fd' },
    { bg: 'rgba(37, 99, 235, 0.8)', border: '#2563eb' },
    { bg: 'rgba(96, 165, 250, 0.8)', border: '#60a5fa' },
    { bg: 'rgba(219, 234, 254, 0.8)', border: '#dbeafe' },
    { bg: 'rgba(191, 219, 254, 0.8)', border: '#bfdbfe' },
    { bg: 'rgba(54, 162, 235, 0.8)', border: '#36a2eb' }
  ]
  return colors[index % colors.length]
}

function createChart() {
  if (!stackedChart.value || store.options.length === 0 || store.criteria.length === 0) return

  if (chartInstance) {
    chartInstance.destroy()
  }

  const labels = store.options.map(option => option.name)
  
  // 各観点ごとのデータセットを作成
  const datasets = store.criteria.map((criteria, index) => {
    const color = getColorForCriteria(index)
    const data = store.options.map(option => {
      const evaluation = store.evaluations[option.id]?.[criteria.id] || 0
      return evaluation * criteria.weight
    })
    
    return {
      label: criteria.name,
      data: data,
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 1
    }
  })

  chartInstance = new Chart(stackedChart.value, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              family: "'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif"
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const criteriaName = context.dataset.label
              const score = Math.round(context.parsed.y)
              return `${criteriaName}: ${score}ポイント`
            },
            footer: function(tooltipItems) {
              let total = 0
              tooltipItems.forEach(item => {
                total += item.parsed.y
              })
              return `合計: ${Math.round(total)}ポイント`
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            font: {
              family: "'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif"
            }
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            font: {
              family: "'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif"
            }
          },
          title: {
            display: true,
            text: 'スコア',
            font: {
              family: "'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif",
              size: 12
            }
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    }
  })
}

onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

// データ変更の監視
watch([() => store.options, () => store.criteria, () => store.evaluations], () => {
  nextTick(() => {
    createChart()
  })
}, { deep: true })
</script>

<style scoped>
.score-stacked-chart {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 1rem;
}

.score-stacked-chart h4 {
  margin: 0 0 1rem 0;
  text-align: center;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.empty-chart {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-style: italic;
  border: 1px dashed #ccc;
  border-radius: 4px;
  background: #f9f9f9;
  text-align: center;
}

canvas {
  display: block;
  width: 100% !important;
  height: 300px !important;
}

@media (max-width: 768px) {
  .score-stacked-chart {
    max-width: 100%;
    padding: 0.75rem;
  }
  
  .score-stacked-chart h4 {
    font-size: 14px;
  }
  
  canvas {
    height: 250px !important;
  }
}
</style>
