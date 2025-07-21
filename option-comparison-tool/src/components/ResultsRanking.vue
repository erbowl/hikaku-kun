<template>
  <div class="results-ranking">
    <div v-if="store.options.length === 0" class="text-center py-8 text-gray-500">
      選択肢を追加するとランキングが表示されます。
    </div>
    <div v-else class="space-y-4">
      <div
        v-for="(option, index) in store.rankedOptions"
        :key="option.id"
        class="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
        :class="{
          'border-yellow-400 bg-yellow-50': index === 0,
          'border-gray-300': index !== 0
        }"
      >
        <!-- Ranking Header -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <div 
              class="flex items-center justify-center w-8 h-8 rounded-full font-bold text-white"
              :class="{
                'bg-yellow-500': index === 0,
                'bg-gray-400': index === 1,
                'bg-orange-500': index === 2,
                'bg-gray-500': index > 2
              }"
            >
              {{ index + 1 }}
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ option.name }}</h3>
              <div class="flex items-center space-x-2">
                <span class="text-2xl font-bold text-blue-600">{{ option.score.toFixed(1) }}</span>
                <span class="text-sm text-gray-500">ポイント</span>
                <div v-if="index === 0" class="text-yellow-600 text-sm font-medium">
                  🏆 最高スコア
                </div>
              </div>
            </div>
          </div>
          <button
            @click="toggleDetails(option.id)"
            class="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <span v-if="expandedOptions.has(option.id)">▼</span>
            <span v-else>▶</span>
          </button>
        </div>

        <!-- Score Breakdown (Expandable) -->
        <div v-if="expandedOptions.has(option.id)" class="mt-4 space-y-3">
          <h4 class="text-sm font-medium text-gray-700 border-b pb-1">スコア内訳</h4>
          <div class="grid gap-2">
            <div
              v-for="criterium in store.criteria"
              :key="criterium.id"
              class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
            >
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-700">{{ criterium.name }}</span>
                <span class="text-xs text-gray-500">(重み: {{ criterium.weight }})</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-600">
                  {{ store.evaluations[option.id]?.[criterium.id] || 0 }} × {{ criterium.weight }} =
                </span>
                <span class="text-sm font-semibold text-blue-600">
                  {{ (option.breakdown[criterium.id] || 0).toFixed(1) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="mt-3">
            <div class="flex justify-between text-xs text-gray-600 mb-1">
              <span>スコア進捗</span>
              <span>{{ option.score.toFixed(1) }} / {{ maxPossibleScore.toFixed(1) }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(option.score / maxPossibleScore) * 100}%` }"
              ></div>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              最大スコアの {{ ((option.score / maxPossibleScore) * 100).toFixed(1) }}%
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div v-else class="mt-3 flex space-x-4 text-sm text-gray-600">
          <span>{{ store.criteria.length }} 観点で評価</span>
          <span>•</span>
          <span>最大スコア: {{ maxPossibleScore.toFixed(1) }}</span>
          <span>•</span>
          <span>達成率: {{ ((option.score / maxPossibleScore) * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 class="text-sm font-semibold text-blue-900 mb-2">統計情報</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-blue-700 font-medium">評価済み選択肢</span>
            <div class="text-blue-900 font-semibold">{{ store.options.length }}個</div>
          </div>
          <div>
            <span class="text-blue-700 font-medium">評価観点</span>
            <div class="text-blue-900 font-semibold">{{ store.criteria.length }}項目</div>
          </div>
          <div>
            <span class="text-blue-700 font-medium">最高スコア</span>
            <div class="text-blue-900 font-semibold">
              {{ store.rankedOptions[0]?.score.toFixed(1) || '0.0' }}
            </div>
          </div>
          <div>
            <span class="text-blue-700 font-medium">スコア差</span>
            <div class="text-blue-900 font-semibold">
              {{ store.rankedOptions.length > 1 
                  ? (store.rankedOptions[0].score - store.rankedOptions[1].score).toFixed(1)
                  : '0.0' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComparisonStore } from '@/stores/comparison'

const store = useComparisonStore()
const expandedOptions = ref(new Set<string>())

const maxPossibleScore = computed(() => {
  return store.criteria.reduce((sum, criterium) => sum + (5 * criterium.weight), 0)
})

function toggleDetails(optionId: string) {
  if (expandedOptions.value.has(optionId)) {
    expandedOptions.value.delete(optionId)
  } else {
    expandedOptions.value.add(optionId)
  }
}
</script>

<style scoped>
.results-ranking {
  width: 100%;
}

/* Smooth transitions for expand/collapse */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
