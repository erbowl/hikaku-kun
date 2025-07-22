<template>
  <div class="weight-pie-chart">
    <h4>観点の重み分布</h4>
    <div v-if="store.criteria.length === 0" class="empty-chart">
      <p>観点を追加すると重み分布が表示されます</p>
    </div>
    <canvas v-else ref="pieChart"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick, onUnmounted } from 'vue'
import { useComparisonStore } from '@/stores/comparison'
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from 'chart.js'

Chart.register(ArcElement, DoughnutController, Tooltip, Legend)

const store = useComparisonStore()
const pieChart = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

// カラーパレット（ScoreStackedChartと同じ配色を使用）
const colors = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
]

function getResponsiveSettings() {
  const width = window.innerWidth
  return {
    fontSize: width > 768 ? 12 : 10,
    padding: width > 768 ? 15 : 10,
    boxWidth: width > 768 ? 15 : 12
  }
}

function createChart() {
  if (!pieChart.value || store.criteria.length === 0) return

  const labels = store.criteria.map(c => c.name)
  const weights = store.criteria.map(c => c.weight)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  
  // パーセンテージを計算
  const percentages = weights.map(weight => 
    totalWeight > 0 ? (weight / totalWeight * 100) : 0
  )

  const responsive = getResponsiveSettings()

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(pieChart.value, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: percentages,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#fff',
          borderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              family: "'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif",
              size: responsive.fontSize
            },
            padding: responsive.padding,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: responsive.boxWidth
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const percentage = context.parsed.toFixed(1);
              const weight = weights[context.dataIndex];
              return `${label}: ${percentage}% (重み: ${weight})`;
            }
          }
        }
      },
      cutout: '40%', // ドーナツチャートの中央の穴のサイズ
    }
  })
}

// リサイズイベントの監視
function handleResize() {
  nextTick(() => {
    createChart()
  })
}

onMounted(() => {
  nextTick(() => {
    createChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.destroy()
  }
})

// 観点データの変更を監視してチャートを更新
watch(() => store.criteria, () => {
  nextTick(() => {
    createChart()
  })
}, { deep: true })
</script>

<style scoped>
.weight-pie-chart {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 1rem;
}

.weight-pie-chart h4 {
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
  max-width: 100%;
}

@media (max-width: 768px) {
  .weight-pie-chart {
    max-width: 100%;
    padding: 0.75rem;
  }
  
  .weight-pie-chart h4 {
    font-size: 14px;
  }
  
  canvas {
    height: 250px !important;
  }
}

@media (max-width: 480px) {
  .weight-pie-chart {
    padding: 0.5rem;
  }
  
  canvas {
    height: 200px !important;
  }
}
</style>
