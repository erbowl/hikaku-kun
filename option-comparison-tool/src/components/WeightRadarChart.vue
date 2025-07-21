<template>
  <div class="weight-radar-chart">
    <h4>観点の重み分布</h4>
    <div v-if="store.criteria.length === 0" class="empty-chart">
      <p>観点を追加すると重み分布が表示されます</p>
    </div>
    <canvas v-else ref="radarChart"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import { useComparisonStore } from '@/stores/comparison'
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const store = useComparisonStore()
const radarChart = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

function createChart() {
  if (!radarChart.value || store.criteria.length === 0) return

  const labels = store.criteria.map(c => c.name)
  const weights = store.criteria.map(c => c.weight)

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(radarChart.value, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: '重み',
          data: weights,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          borderWidth: 2,
        }
      ]
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
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.r}`;
            }
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 10,
          min: 0,
          ticks: {
            stepSize: 2,
            font: {
              family: "'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif"
            }
          },
          pointLabels: {
            font: {
              family: "'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif",
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          angleLines: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  })
}

onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

// 観点データの変更を監視してチャートを更新
watch(() => store.criteria, () => {
  nextTick(() => {
    createChart()
  })
}, { deep: true })
</script>

<style scoped>
.weight-radar-chart {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 1rem;
}

.weight-radar-chart h4 {
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
}

canvas {
  display: block;
  width: 100% !important;
  height: 300px !important;
}

@media (max-width: 768px) {
  .weight-radar-chart {
    max-width: 100%;
    padding: 0.75rem;
  }
  
  .weight-radar-chart h4 {
    font-size: 14px;
  }
  
  canvas {
    height: 250px !important;
  }
}
</style>
