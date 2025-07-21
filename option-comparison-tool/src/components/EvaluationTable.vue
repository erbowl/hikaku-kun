<template>
  <div class="evaluation-table">
    <div v-if="store.options.length === 0 || store.criteria.length === 0" class="text-center py-8 text-gray-500">
      評価を開始するには、まず選択肢と観点を追加してください。
    </div>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
              選択肢 \ 観点
            </th>
            <th
              v-for="criterium in store.criteria"
              :key="criterium.id"
              class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32"
            >
              <div class="flex flex-col items-center space-y-1">
                <span>{{ criterium.name }}</span>
                <span class="text-blue-600 font-semibold">(重み: {{ criterium.weight }})</span>
              </div>
            </th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              合計スコア
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="option in store.options"
            :key="option.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r">
              {{ option.name }}
            </td>
            <td
              v-for="criterium in store.criteria"
              :key="`${option.id}-${criterium.id}`"
              class="px-6 py-4 whitespace-nowrap text-center"
            >
              <select
                :value="store.evaluations[option.id]?.[criterium.id] || 3"
                @change="updateEvaluation(option.id, criterium.id, $event)"
                class="w-16 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="getEvaluationClass(store.evaluations[option.id]?.[criterium.id] || 3)"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
              <div class="text-xs text-gray-500 mt-1">
                {{ getEvaluationLabel(store.evaluations[option.id]?.[criterium.id] || 3) }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <div class="text-lg font-semibold text-blue-600">
                {{ (store.results[option.id]?.totalScore || 0).toFixed(1) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Evaluation Scale Legend -->
    <div class="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 class="text-sm font-medium text-gray-900 mb-2">評価スケール</h4>
      <div class="flex flex-wrap gap-4 text-xs">
        <span class="flex items-center">
          <span class="w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></span>
          1: 非常に低い
        </span>
        <span class="flex items-center">
          <span class="w-3 h-3 bg-red-50 border border-red-200 rounded mr-1"></span>
          2: 低い
        </span>
        <span class="flex items-center">
          <span class="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-1"></span>
          3: 普通
        </span>
        <span class="flex items-center">
          <span class="w-3 h-3 bg-green-50 border border-green-200 rounded mr-1"></span>
          4: 高い
        </span>
        <span class="flex items-center">
          <span class="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></span>
          5: 非常に高い
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useComparisonStore } from '@/stores/comparison'

const store = useComparisonStore()

function updateEvaluation(optionId: string, criteriaId: string, event: Event) {
  const value = parseInt((event.target as HTMLSelectElement).value)
  store.setEvaluation(optionId, criteriaId, value)
  store.saveToLocalStorage()
}

function getEvaluationClass(value: number): string {
  switch (value) {
    case 1:
      return 'bg-red-100 border-red-300 text-red-800'
    case 2:
      return 'bg-red-50 border-red-200 text-red-700'
    case 3:
      return 'bg-gray-100 border-gray-300 text-gray-700'
    case 4:
      return 'bg-green-50 border-green-200 text-green-700'
    case 5:
      return 'bg-green-100 border-green-300 text-green-800'
    default:
      return 'bg-gray-100 border-gray-300 text-gray-700'
  }
}

function getEvaluationLabel(value: number): string {
  switch (value) {
    case 1:
      return '非常に低い'
    case 2:
      return '低い'
    case 3:
      return '普通'
    case 4:
      return '高い'
    case 5:
      return '非常に高い'
    default:
      return '普通'
  }
}
</script>

<style scoped>
.evaluation-table {
  width: 100%;
}

/* Ensure sticky columns work properly */
.sticky {
  position: sticky;
}

/* Custom scrollbar for better UX */
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
