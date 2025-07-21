<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-gray-900">選択肢比較支援ツール</h1>
            <input
              v-model="store.projectName"
              @blur="store.saveToLocalStorage"
              class="text-lg font-medium text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-white focus:border focus:border-blue-500 rounded px-2 py-1"
              placeholder="プロジェクト名"
            />
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="exportData"
              class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              エクスポート
            </button>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              @change="importData"
              class="hidden"
            />
            <button
              @click="triggerImport"
              class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              インポート
            </button>
            <button
              @click="loadSampleData"
              class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              サンプルデータ
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Settings Area -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Options Management -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">選択肢管理</h2>
          <div class="space-y-3">
            <div class="flex space-x-2">
              <input
                v-model="newOptionName"
                @keyup.enter="addOption"
                class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="新しい選択肢名"
              />
              <button
                @click="addOption"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                追加
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="option in store.options"
                :key="option.id"
                class="flex items-center space-x-2 p-2 bg-gray-50 rounded"
              >
                <input
                  v-model="option.name"
                  @blur="store.saveToLocalStorage"
                  class="flex-1 bg-transparent border-0 focus:outline-none focus:bg-white focus:border focus:border-blue-500 rounded px-2 py-1"
                />
                <button
                  @click="store.removeOption(option.id)"
                  class="text-red-500 hover:text-red-700 p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Criteria Management -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">観点・重み管理</h2>
          <div class="space-y-3">
            <div class="flex space-x-2">
              <input
                v-model="newCriteriaName"
                class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="新しい観点名"
              />
              <input
                v-model.number="newCriteriaWeight"
                type="number"
                min="1"
                max="10"
                class="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="重み"
              />
              <button
                @click="addCriteria"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                追加
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="criterium in store.criteria"
                :key="criterium.id"
                class="flex items-center space-x-2 p-2 bg-gray-50 rounded"
              >
                <input
                  v-model="criterium.name"
                  @blur="store.saveToLocalStorage"
                  class="flex-1 bg-transparent border-0 focus:outline-none focus:bg-white focus:border focus:border-blue-500 rounded px-2 py-1"
                />
                <input
                  v-model.number="criterium.weight"
                  @change="store.saveToLocalStorage"
                  type="number"
                  min="1"
                  max="10"
                  class="w-16 bg-transparent border-0 focus:outline-none focus:bg-white focus:border focus:border-blue-500 rounded px-2 py-1 text-center"
                />
                <button
                  @click="store.removeCriteria(criterium.id)"
                  class="text-red-500 hover:text-red-700 p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Evaluation Table -->
      <div class="bg-white rounded-lg shadow mb-8">
        <div class="p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">評価入力テーブル</h2>
          <div class="overflow-x-auto">
            <EvaluationTable />
          </div>
        </div>
      </div>

      <!-- Results Area -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <!-- Charts -->
        <div class="space-y-8">
          <!-- Radar Chart -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">観点の重み分布</h3>
            <WeightRadarChart />
          </div>

          <!-- Stacked Bar Chart -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">スコア内訳</h3>
            <ScoreStackedChart />
          </div>
        </div>

        <!-- Ranking -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">結果ランキング</h3>
          <ResultsRanking />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useComparisonStore } from '@/stores/comparison'
import EvaluationTable from '@/components/EvaluationTable.vue'
import WeightRadarChart from '@/components/WeightRadarChart.vue'
import ScoreStackedChart from '@/components/ScoreStackedChart.vue'
import ResultsRanking from '@/components/ResultsRanking.vue'

const store = useComparisonStore()

// Form data
const newOptionName = ref('')
const newCriteriaName = ref('')
const newCriteriaWeight = ref(5)
const fileInput = ref<HTMLInputElement>()

// Methods
function addOption() {
  if (newOptionName.value.trim()) {
    store.addOption(newOptionName.value.trim())
    newOptionName.value = ''
    store.saveToLocalStorage()
  }
}

function addCriteria() {
  if (newCriteriaName.value.trim()) {
    store.addCriteria(newCriteriaName.value.trim(), newCriteriaWeight.value)
    newCriteriaName.value = ''
    newCriteriaWeight.value = 5
    store.saveToLocalStorage()
  }
}

function exportData() {
  const data = store.exportProject()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.name || 'comparison-project'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function triggerImport() {
  fileInput.value?.click()
}

function importData(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      store.loadProject(data)
      store.saveToLocalStorage()
    } catch (error) {
      alert('ファイルの読み込みに失敗しました。')
    }
  }
  reader.readAsText(file)
}

function loadSampleData() {
  // Clear existing data
  store.options.length = 0
  store.criteria.length = 0
  store.evaluations = {}
  
  // Add sample options
  store.addOption('スマートフォンA')
  store.addOption('スマートフォンB')
  store.addOption('スマートフォンC')
  
  // Add sample criteria
  store.addCriteria('価格', 8)
  store.addCriteria('性能', 9)
  store.addCriteria('デザイン', 6)
  store.addCriteria('バッテリー', 7)
  store.addCriteria('カメラ', 5)
  
  // Add sample evaluations
  // スマートフォンA: 価格重視の中級機
  store.setEvaluation(store.options[0].id, store.criteria[0].id, 4) // 価格
  store.setEvaluation(store.options[0].id, store.criteria[1].id, 3) // 性能
  store.setEvaluation(store.options[0].id, store.criteria[2].id, 3) // デザイン
  store.setEvaluation(store.options[0].id, store.criteria[3].id, 4) // バッテリー
  store.setEvaluation(store.options[0].id, store.criteria[4].id, 3) // カメラ
  
  // スマートフォンB: 高性能フラッグシップ
  store.setEvaluation(store.options[1].id, store.criteria[0].id, 2) // 価格
  store.setEvaluation(store.options[1].id, store.criteria[1].id, 5) // 性能
  store.setEvaluation(store.options[1].id, store.criteria[2].id, 5) // デザイン
  store.setEvaluation(store.options[1].id, store.criteria[3].id, 3) // バッテリー
  store.setEvaluation(store.options[1].id, store.criteria[4].id, 5) // カメラ
  
  // スマートフォンC: バランス型
  store.setEvaluation(store.options[2].id, store.criteria[0].id, 3) // 価格
  store.setEvaluation(store.options[2].id, store.criteria[1].id, 4) // 性能
  store.setEvaluation(store.options[2].id, store.criteria[2].id, 4) // デザイン
  store.setEvaluation(store.options[2].id, store.criteria[3].id, 5) // バッテリー
  store.setEvaluation(store.options[2].id, store.criteria[4].id, 4) // カメラ
  
  store.saveToLocalStorage()
}

// Initialize
onMounted(() => {
  const loaded = store.loadFromLocalStorage()
  // If no saved data exists, load sample data
  if (!loaded || (store.options.length === 0 && store.criteria.length === 0)) {
    loadSampleData()
  }
})
</script>
