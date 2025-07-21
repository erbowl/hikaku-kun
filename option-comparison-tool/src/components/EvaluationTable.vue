<template>
  <div class="evaluation-table">
    <div v-if="store.options.length === 0 || store.criteria.length === 0" class="empty-state">
      <p>評価を始めるには、まず選択肢と観点を追加してください。</p>
    </div>
    <div v-else class="table-container">
      <table class="excel-table">
        <thead>
          <tr>
            <th class="option-header">選択肢 / 観点</th>
            <th 
              v-for="criteria in store.criteria" 
              :key="criteria.id" 
              class="criteria-header"
              :title="`重み: ${criteria.weight}`"
            >
              {{ criteria.name }}
              <span class="weight-badge">{{ criteria.weight }}</span>
            </th>
            <th class="score-header">総スコア</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="option in store.options" :key="option.id" class="option-row">
            <td class="option-cell">
              <div class="option-name">{{ option.name }}</div>
            </td>
            <td 
              v-for="criteria in store.criteria" 
              :key="`${option.id}-${criteria.id}`"
              class="evaluation-cell"
            >
              <select 
                :value="store.evaluations[option.id]?.[criteria.id] || 3"
                @change="updateEvaluation(option.id, criteria.id, $event)"
                :class="getEvaluationClass(store.evaluations[option.id]?.[criteria.id] || 3)"
                class="evaluation-select"
                :title="getEvaluationLabel(store.evaluations[option.id]?.[criteria.id] || 3)"
              >
                <option value="1">1 - 非常に低い</option>
                <option value="2">2 - 低い</option>
                <option value="3">3 - 普通</option>
                <option value="4">4 - 高い</option>
                <option value="5">5 - 非常に高い</option>
              </select>
            </td>
            <td class="score-cell">
              <div class="total-score">
                {{ store.results[option.id]?.totalScore?.toFixed(1) || '0.0' }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 評価の凡例 -->
    <div class="legend" v-if="store.options.length > 0 && store.criteria.length > 0">
      <h4>評価スケール</h4>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-value value-1">1</span>
          <span>非常に低い</span>
        </div>
        <div class="legend-item">
          <span class="legend-value value-2">2</span>
          <span>低い</span>
        </div>
        <div class="legend-item">
          <span class="legend-value value-3">3</span>
          <span>普通</span>
        </div>
        <div class="legend-item">
          <span class="legend-value value-4">4</span>
          <span>高い</span>
        </div>
        <div class="legend-item">
          <span class="legend-value value-5">5</span>
          <span>非常に高い</span>
        </div>
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
      return 'eval-1'
    case 2:
      return 'eval-2'
    case 3:
      return 'eval-3'
    case 4:
      return 'eval-4'
    case 5:
      return 'eval-5'
    default:
      return 'eval-3'
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
  margin: 1rem 0;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ccc;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 600px;
}

.excel-table th,
.excel-table td {
  border: 1px solid #d0d0d0;
  padding: 8px 12px;
  text-align: center;
  vertical-align: middle;
}

.excel-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
}

.option-header {
  background: #e8f4fd !important;
  font-weight: 700;
  text-align: left;
  min-width: 120px;
  max-width: 150px;
}

.criteria-header {
  background: #f0f8ff !important;
  position: relative;
  min-width: 100px;
}

.weight-badge {
  display: inline-block;
  background: #4f8cff;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
  font-weight: 500;
}

.score-header {
  background: #fff2e8 !important;
  font-weight: 700;
  color: #d97706;
  min-width: 80px;
}

.option-row:nth-child(even) {
  background: #fafafa;
}

.option-row:hover {
  background: #f0f8ff;
}

.option-cell {
  background: #f8f9fa;
  text-align: left;
  font-weight: 500;
  padding: 12px;
}

.option-name {
  font-weight: 600;
  color: #333;
}

.evaluation-cell {
  padding: 4px;
}

.evaluation-select {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px;
  font-size: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.evaluation-select:focus {
  outline: none;
  border-color: #4f8cff;
  box-shadow: 0 0 0 2px rgba(79, 140, 255, 0.2);
}

.evaluation-select:hover {
  border-color: #999;
}

/* 評価値による色分け */
.eval-1 {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.eval-2 {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #d97706;
}

.eval-3 {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #6b7280;
}

.eval-4 {
  background: #dcfce7;
  border-color: #86efac;
  color: #16a34a;
}

.eval-5 {
  background: #d1fae5;
  border-color: #34d399;
  color: #059669;
}

.score-cell {
  background: #fff7ed;
  padding: 8px;
}

.total-score {
  font-weight: 700;
  font-size: 16px;
  color: #d97706;
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  padding: 4px 8px;
  border-radius: 6px;
  text-align: center;
}

.legend {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.legend h4 {
  margin: 0 0 0.5rem 0;
  font-size: 14px;
  color: #333;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;
}

.legend-value {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  text-align: center;
  line-height: 24px;
  font-weight: 600;
  border: 1px solid;
}

.value-1 {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.value-2 {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #d97706;
}

.value-3 {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #6b7280;
}

.value-4 {
  background: #dcfce7;
  border-color: #86efac;
  color: #16a34a;
}

.value-5 {
  background: #d1fae5;
  border-color: #34d399;
  color: #059669;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .table-container {
    border-radius: 4px;
  }
  
  .excel-table {
    font-size: 12px;
  }
  
  .excel-table th,
  .excel-table td {
    padding: 6px 8px;
  }
  
  .legend-items {
    justify-content: center;
  }
  
  .legend-item {
    font-size: 11px;
  }
  
  .legend-value {
    width: 20px;
    height: 20px;
    line-height: 20px;
  }
}
</style>
