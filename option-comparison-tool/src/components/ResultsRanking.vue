<template>
  <div class="results-ranking">
    <h3>評価結果ランキング</h3>
    
    <div v-if="store.options.length === 0 || store.criteria.length === 0" class="empty-state">
      <p>選択肢と観点を追加すると結果が表示されます</p>
    </div>
    
    <div v-else>
      <!-- 統計情報 -->
      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-label">選択肢数:</span>
          <span class="stat-value">{{ store.options.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">観点数:</span>
          <span class="stat-value">{{ store.criteria.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最大可能スコア:</span>
          <span class="stat-value">{{ maxPossibleScore.toFixed(1) }}</span>
        </div>
        <div class="stat-item" v-if="store.rankedOptions.length > 1">
          <span class="stat-label">1位と2位の差:</span>
          <span class="stat-value">{{ scoreDifference.toFixed(1) }}ポイント</span>
        </div>
      </div>

      <!-- ランキングリスト -->
      <div class="ranking-list">
        <div 
          v-for="(option, index) in store.rankedOptions" 
          :key="option.id"
          class="ranking-item"
          :class="{ 'expanded': expandedOptions.has(option.id) }"
        >
          <!-- ランキングヘッダー -->
          <div class="ranking-header" @click="toggleDetails(option.id)">
            <div class="rank-info">
              <span class="rank-number" :class="getRankClass(index + 1)">
                {{ index + 1 }}
              </span>
              <span class="option-name">{{ option.name }}</span>
            </div>
            
            <div class="score-info">
              <div class="score-bar-container">
                <div class="score-bar">
                  <div 
                    class="score-fill" 
                    :style="{ width: `${(option.score / maxPossibleScore) * 100}%` }"
                  ></div>
                </div>
                <span class="score-text">
                  {{ option.score.toFixed(1) }} / {{ maxPossibleScore.toFixed(1) }}
                </span>
              </div>
              
              <button class="expand-btn" :class="{ 'expanded': expandedOptions.has(option.id) }">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 詳細内訳 -->
          <div v-if="expandedOptions.has(option.id)" class="ranking-details">
            <h5>スコア内訳</h5>
            <div class="breakdown-list">
              <div 
                v-for="criteria in store.criteria" 
                :key="criteria.id"
                class="breakdown-item"
              >
                <div class="breakdown-info">
                  <span class="criteria-name">{{ criteria.name }}</span>
                  <span class="weight-info">(重み: {{ criteria.weight }})</span>
                </div>
                <div class="breakdown-score">
                  <span class="evaluation">
                    評価{{ store.evaluations[option.id]?.[criteria.id] || 0 }}
                  </span>
                  <span class="calculation">
                    {{ store.evaluations[option.id]?.[criteria.id] || 0 }} × {{ criteria.weight }} = 
                  </span>
                  <span class="partial-score">
                    {{ (option.breakdown[criteria.id] || 0).toFixed(1) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="total-calculation">
              <strong>合計: {{ option.score.toFixed(1) }}ポイント</strong>
              <span class="percentage">
                ({{ ((option.score / maxPossibleScore) * 100).toFixed(1) }}%)
              </span>
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

const scoreDifference = computed(() => {
  if (store.rankedOptions.length < 2) return 0
  return store.rankedOptions[0].score - store.rankedOptions[1].score
})

function toggleDetails(optionId: string) {
  if (expandedOptions.value.has(optionId)) {
    expandedOptions.value.delete(optionId)
  } else {
    expandedOptions.value.add(optionId)
  }
}

function getRankClass(rank: number): string {
  switch (rank) {
    case 1:
      return 'rank-1st'
    case 2:
      return 'rank-2nd'
    case 3:
      return 'rank-3rd'
    default:
      return 'rank-other'
  }
}
</script>

<style scoped>
.results-ranking {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #333;
  text-align: center;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px dashed #ccc;
}

.stats-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ranking-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  transition: all 0.2s ease;
}

.ranking-item:hover {
  border-color: #4f8cff;
  box-shadow: 0 2px 12px rgba(79, 140, 255, 0.1);
}

.ranking-item.expanded {
  border-color: #4f8cff;
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  user-select: none;
}

.rank-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
}

.rank-1st {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #92400e;
  border: 2px solid #d69e2e;
}

.rank-2nd {
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  color: #374151;
  border: 2px solid #9ca3af;
}

.rank-3rd {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  color: #9a3412;
  border: 2px solid #ea580c;
}

.rank-other {
  background: #f3f4f6;
  color: #6b7280;
  border: 2px solid #d1d5db;
}

.option-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.score-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.score-bar-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.score-bar {
  width: 150px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f8cff, #3b82f6);
  transition: width 0.3s ease;
}

.score-text {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.expand-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.expand-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.expand-btn.expanded {
  transform: rotate(180deg);
  color: #4f8cff;
}

.ranking-details {
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
  background: #fafbfc;
}

.ranking-details h5 {
  margin: 0 0 0.75rem 0;
  font-size: 14px;
  color: #374151;
  font-weight: 600;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.breakdown-info {
  display: flex;
  flex-direction: column;
}

.criteria-name {
  font-weight: 500;
  color: #374151;
}

.weight-info {
  font-size: 12px;
  color: #6b7280;
}

.breakdown-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
}

.evaluation {
  color: #4f8cff;
  font-weight: 500;
}

.calculation {
  color: #6b7280;
}

.partial-score {
  font-weight: 600;
  color: #059669;
  min-width: 40px;
  text-align: right;
}

.total-calculation {
  padding: 0.75rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  text-align: center;
}

.total-calculation strong {
  color: #065f46;
  font-size: 16px;
}

.percentage {
  margin-left: 0.5rem;
  color: #059669;
  font-weight: 500;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .stats-summary {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    min-width: auto;
  }
  
  .ranking-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .score-info {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .score-bar {
    width: 100%;
  }
  
  .breakdown-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .breakdown-score {
    justify-content: space-between;
  }
}
</style>
