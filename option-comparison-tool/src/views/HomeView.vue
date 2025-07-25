<template>
  <div id="app">
    <header>
      <h1>比較くん</h1>
      <p class="subtitle">複数の選択肢を多観点で評価し、最適な選択を支援します</p>
    </header>
    
    <main>
      <!-- 管理セクション -->
      <div class="management-sections">
        <!-- 選択肢管理 -->
        <section class="management-section">
          <h2>📝 選択肢管理</h2>
          <p class="section-description">比較したい選択肢を追加し、ドラッグ&ドロップで順序を調整できます</p>
          
          <div class="add-form">
            <input 
              v-model="newOptionName" 
              placeholder="新しい選択肢名を入力" 
              @keyup.enter="addOption"
              class="form-input"
            />
            <button @click="addOption" :disabled="!newOptionName.trim()" class="btn btn-primary">
              追加
            </button>
          </div>
          
          <div class="items-list" v-if="store.options.length > 0">
            <draggable 
              v-model="store.options" 
              @end="onOptionSort"
              item-key="id"
              class="draggable-list"
              :animation="200"
              ghost-class="ghost-item"
              chosen-class="chosen-item"
              role="list"
              aria-label="選択肢リスト（ドラッグで並び替え可能）"
            >
              <template #item="{ element: option }">
                <div class="item-card draggable-item" role="listitem" :aria-label="`選択肢: ${option.name}`">
                  <div v-if="editingOption === option.id" class="edit-form">
                    <input 
                      v-model="editOptionName" 
                      @keyup.enter="saveOptionEdit(option.id)"
                      @keyup.esc="cancelOptionEdit"
                      class="edit-input"
                      ref="editOptionInput"
                    />
                    <div class="edit-buttons">
                      <button @click="saveOptionEdit(option.id)" class="btn btn-sm btn-success">保存</button>
                      <button @click="cancelOptionEdit" class="btn btn-sm btn-secondary">キャンセル</button>
                    </div>
                  </div>
                  <div v-else class="item-display">
                    <span class="item-name">{{ option.name }}</span>
                    <div class="item-actions">
                      <button @click="startEditOption(option)" class="btn btn-sm btn-outline">編集</button>
                      <button @click="removeOption(option.id)" class="btn btn-sm btn-danger">削除</button>
                    </div>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
          
          <div v-else class="empty-message">
            選択肢を追加してください
            <div class="help-text">💡 追加後はドラッグ&ドロップで順序を変更できます</div>
          </div>
        </section>

        <!-- 観点・重み管理 -->
        <section class="management-section">
          <h2>⚖️ 観点・重み管理</h2>
          <p class="section-description">評価観点と重み（1-10）を設定し、ドラッグ&ドロップで順序を調整できます</p>
          
          <div class="add-form">
            <input 
              v-model="newCriteriaName" 
              placeholder="新しい観点名を入力" 
              @keyup.enter="addCriteria"
              class="form-input"
            />
            <input 
              v-model.number="newCriteriaWeight" 
              type="number" 
              min="1" 
              max="10" 
              placeholder="重み(1-10)"
              @keyup.enter="addCriteria"
              class="weight-input"
            />
            <button @click="addCriteria" :disabled="!newCriteriaName.trim()" class="btn btn-primary">
              追加
            </button>
          </div>
          
          <div class="items-list" v-if="store.criteria.length > 0">
            <draggable 
              v-model="store.criteria" 
              @end="onCriteriaSort"
              item-key="id"
              class="draggable-list"
              :animation="200"
              ghost-class="ghost-item"
              chosen-class="chosen-item"
              role="list"
              aria-label="観点リスト（ドラッグで並び替え可能）"
            >
              <template #item="{ element: criteria }">
                <div class="item-card criteria-card draggable-item" role="listitem" :aria-label="`観点: ${criteria.name} (重み: ${criteria.weight})`">
                  <div v-if="editingCriteria === criteria.id" class="edit-form">
                    <input 
                      v-model="editCriteriaName" 
                      @keyup.enter="saveCriteriaEdit(criteria.id)"
                      @keyup.esc="cancelCriteriaEdit"
                      class="edit-input"
                    />
                    <input 
                      v-model.number="editCriteriaWeight" 
                      type="number" 
                      min="1" 
                      max="10"
                      @keyup.enter="saveCriteriaEdit(criteria.id)"
                      @keyup.esc="cancelCriteriaEdit"
                      class="weight-input"
                    />
                    <div class="edit-buttons">
                      <button @click="saveCriteriaEdit(criteria.id)" class="btn btn-sm btn-success">保存</button>
                      <button @click="cancelCriteriaEdit" class="btn btn-sm btn-secondary">キャンセル</button>
                    </div>
                  </div>
                  <div v-else class="item-display">
                    <div class="criteria-info">
                      <span class="item-name">{{ criteria.name }}</span>
                      <span class="weight-badge">重み: {{ criteria.weight }}</span>
                    </div>
                    <div class="item-actions">
                      <button @click="startEditCriteria(criteria)" class="btn btn-sm btn-outline">編集</button>
                      <button @click="removeCriteria(criteria.id)" class="btn btn-sm btn-danger">削除</button>
                    </div>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
          
          <div v-else class="empty-message">
            観点を追加してください
            <div class="help-text">💡 追加後はドラッグ&ドロップで順序を変更できます</div>
          </div>
        </section>
      </div>

      <!-- データ管理 -->
      <section class="data-section">
        <h2>
          💾 データ管理
          <button 
            @click="showFormatModal = true" 
            class="info-btn"
            title="データフォーマット仕様を表示"
          >
            ℹ️
          </button>
        </h2>
        <div class="data-controls">
          <button @click="exportData" class="btn btn-outline">
            📤 エクスポート
          </button>
          <button @click="triggerImport" class="btn btn-outline">
            📥 インポート
          </button>
          <input 
            ref="fileInput" 
            type="file" 
            accept="application/json" 
            style="display:none" 
            @change="importData" 
          />
          <button @click="loadSampleData" class="btn btn-info">
            🎯 サンプルデータ読込
          </button>
          <button @click="clearAllData" class="btn btn-warning">
            🗑️ 全データクリア
          </button>
        </div>
      </section>

      <!-- 評価表 -->
      <section class="evaluation-section">
        <h2>📊 評価表</h2>
        <EvaluationTable />
      </section>

      <!-- 可視化・結果 -->
      <section class="visualization-section">
        <h2>📈 可視化・結果</h2>
        <div class="charts-grid">
          <WeightRadarChart />
          <ScoreStackedChart />
        </div>
        <ResultsRanking />
      </section>
    </main>

    <!-- データフォーマット仕様モーダル -->
    <div v-if="showFormatModal" class="modal-overlay" @click="showFormatModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📋 データフォーマット仕様</h3>
          <button @click="showFormatModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">
            AIやプログラムが直接データを作成する際は、以下のJSON形式に従ってください。
            重み分布はパイチャートで視覚化されます。
          </p>
          
          <h4>基本構造</h4>
          <pre class="code-block"><code>{
  "id": "プロジェクトID（文字列）",
  "name": "プロジェクト名（文字列）",
  "createdAt": "作成日時（ISO 8601形式）",
  "updatedAt": "更新日時（ISO 8601形式）",
  "options": [選択肢の配列],
  "criteria": [観点の配列],
  "evaluations": {評価データのオブジェクト}
}</code></pre>

          <h4>選択肢（options）</h4>
          <pre class="code-block"><code>[
  {
    "id": "選択肢ID（ユニークな文字列）",
    "name": "選択肢名（文字列）"
  }
]</code></pre>

          <h4>観点（criteria）</h4>
          <pre class="code-block"><code>[
  {
    "id": "観点ID（ユニークな文字列）",
    "name": "観点名（文字列）",
    "weight": 重み（1-10の数値）
  }
]</code></pre>

          <h4>評価データ（evaluations）</h4>
          <pre class="code-block"><code>{
  "選択肢ID": {
    "観点ID": 評価値（1-5の数値）
  }
}</code></pre>

          <h4>完全な例</h4>
          <pre class="code-block"><code>{
  "id": "project_001",
  "name": "スマートフォン比較",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "options": [
    {"id": "option_1", "name": "iPhone 15"},
    {"id": "option_2", "name": "Galaxy S24"}
  ],
  "criteria": [
    {"id": "criteria_1", "name": "価格", "weight": 8},
    {"id": "criteria_2", "name": "性能", "weight": 9}
  ],
  "evaluations": {
    "option_1": {
      "criteria_1": 3,
      "criteria_2": 5
    },
    "option_2": {
      "criteria_1": 4,
      "criteria_2": 4
    }
  }
}</code></pre>

          <h4>重要な注意点</h4>
          <ul class="note-list">
            <li><strong>評価値：</strong> 1（非常に低い）～ 5（非常に高い）の整数</li>
            <li><strong>重み：</strong> 1～10の整数（重要度を表す）</li>
            <li><strong>ID：</strong> 英数字とアンダースコアのみ使用推奨</li>
            <li><strong>日時：</strong> ISO 8601形式（YYYY-MM-DDTHH:mm:ss.sssZ）</li>
            <li><strong>チャート表示：</strong> 観点の重み分布はパイチャートで表示されます</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useComparisonStore } from '@/stores/comparison'
import EvaluationTable from '@/components/EvaluationTable.vue'
import WeightRadarChart from '@/components/WeightRadarChart.vue'
import ScoreStackedChart from '@/components/ScoreStackedChart.vue'
import ResultsRanking from '@/components/ResultsRanking.vue'
import draggable from 'vuedraggable'

const store = useComparisonStore()

// Form data
const newOptionName = ref('')
const newCriteriaName = ref('')
const newCriteriaWeight = ref(5)
const fileInput = ref<HTMLInputElement>()

// Modal state
const showFormatModal = ref(false)

// Edit states
const editingOption = ref<string | null>(null)
const editingCriteria = ref<string | null>(null)
const editOptionName = ref('')
const editCriteriaName = ref('')
const editCriteriaWeight = ref(5)
const editOptionInput = ref<HTMLInputElement>()

// Sorting functions
function onOptionSort() {
  store.saveToLocalStorage()
}

function onCriteriaSort() {
  store.saveToLocalStorage()
}

// Option management methods
function addOption() {
  if (newOptionName.value.trim()) {
    store.addOption(newOptionName.value.trim())
    newOptionName.value = ''
    store.saveToLocalStorage()
  }
}

function removeOption(id: string) {
  if (confirm('この選択肢を削除しますか？評価データも一緒に削除されます。')) {
    store.removeOption(id)
    store.saveToLocalStorage()
  }
}

function startEditOption(option: any) {
  editingOption.value = option.id
  editOptionName.value = option.name
  nextTick(() => {
    editOptionInput.value?.focus()
  })
}

function saveOptionEdit(id: string) {
  if (editOptionName.value.trim()) {
    store.updateOption(id, editOptionName.value.trim())
    store.saveToLocalStorage()
  }
  cancelOptionEdit()
}

function cancelOptionEdit() {
  editingOption.value = null
  editOptionName.value = ''
}

// Criteria management methods
function addCriteria() {
  if (newCriteriaName.value.trim()) {
    store.addCriteria(newCriteriaName.value.trim(), newCriteriaWeight.value)
    newCriteriaName.value = ''
    newCriteriaWeight.value = 5
    store.saveToLocalStorage()
  }
}

function removeCriteria(id: string) {
  if (confirm('この観点を削除しますか？評価データも一緒に削除されます。')) {
    store.removeCriteria(id)
    store.saveToLocalStorage()
  }
}

function startEditCriteria(criteria: any) {
  editingCriteria.value = criteria.id
  editCriteriaName.value = criteria.name
  editCriteriaWeight.value = criteria.weight
}

function saveCriteriaEdit(id: string) {
  if (editCriteriaName.value.trim()) {
    store.updateCriteria(id, editCriteriaName.value.trim(), editCriteriaWeight.value)
    store.saveToLocalStorage()
  }
  cancelCriteriaEdit()
}

function cancelCriteriaEdit() {
  editingCriteria.value = null
  editCriteriaName.value = ''
  editCriteriaWeight.value = 5
}

// Data management methods
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
      alert('データを正常に読み込みました。')
    } catch (error) {
      alert('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。')
    }
  }
  reader.readAsText(file)
}

function clearAllData() {
  if (confirm('すべてのデータを削除しますか？この操作は元に戻せません。')) {
    store.options.length = 0
    store.criteria.length = 0
    store.evaluations = {}
    store.saveToLocalStorage()
  }
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

// Handle ESC key for modal
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    showFormatModal.value = false
  }
}

// Initialize
onMounted(() => {
  const loaded = store.loadFromLocalStorage()
  // If no saved data exists, load sample data
  if (!loaded || (store.options.length === 0 && store.criteria.length === 0)) {
    loadSampleData()
  }
  
  // Add ESC key listener for modal
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // Cleanup event listener
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: #333;
  font-family: 'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif;
}

header {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
  padding: 2rem 1rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 auto;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  max-width: 1200px;
}

.subtitle {
  font-size: 1.1rem;
  margin: 0.5rem auto 0 0;
  opacity: 0.9;
  font-weight: 300;
  max-width: 1200px;
}

main {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Management sections layout */
.management-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.management-section {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e1e8ed;
}

.management-section h2 {
  font-size: 1.3rem;
  margin: 0 0 0.5rem 0;
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-description {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
}

/* Form styles */
.add-form {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.form-input {
  flex: 1;
  min-width: 200px;
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.weight-input {
  width: 120px;
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  text-align: center;
  transition: all 0.2s ease;
}

.weight-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Button styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.btn-outline {
  background: transparent;
  border: 2px solid #3b82f6;
  color: #3b82f6;
}

.btn-outline:hover {
  background: #3b82f6;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-info {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
}

.btn-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Items list */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.draggable-item {
  display: flex;
  align-items: center;
  cursor: grab;
  position: relative;
  transition: all 0.2s ease;
}

.draggable-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);
}

.draggable-item:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.ghost-item {
  opacity: 0.5;
  background: #f3f4f6 !important;
  border: 2px dashed #9ca3af !important;
}

.chosen-item {
  background: #f0f8ff !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2) !important;
}

.item-card {
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  padding: 1rem;
  background: #f8fafc;
  transition: all 0.2s ease;
  flex: 1;
  position: relative;
}

.item-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.1);
}

.item-card::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(to bottom, #d1d5db 0%, #d1d5db 20%, transparent 20%, transparent 40%, #d1d5db 40%, #d1d5db 60%, transparent 60%, transparent 80%, #d1d5db 80%, #d1d5db 100%);
  opacity: 0.4;
  transition: opacity 0.2s ease;
}

.draggable-item:hover .item-card::before {
  opacity: 0.8;
}

.criteria-card {
  background: #f8fafc;
}

.item-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-left: 16px;
}

.item-name {
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
  flex: 1;
}

.criteria-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.weight-badge {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
  flex-shrink: 0;
  align-items: center;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-form > div:first-child {
  display: flex;
  gap: 0.5rem;
}

.edit-input {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  font-size: 0.875rem;
}

.edit-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.empty-message {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 2rem;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
}

.help-text {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.5rem;
  font-style: normal;
}

/* Section styles */
.data-section,
.evaluation-section,
.visualization-section {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e1e8ed;
}

.data-section h2,
.evaluation-section h2,
.visualization-section h2 {
  font-size: 1.3rem;
  margin: 0 0 1.5rem 0;
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.data-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

/* レスポンシブ対応 */
@media (max-width: 1024px) {
  .management-sections {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  header {
    padding: 1.5rem 0;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  main {
    padding: 0 0.75rem;
    gap: 1.5rem;
  }
  
  .management-section,
  .data-section,
  .evaluation-section,
  .visualization-section {
    padding: 1rem;
  }
  
  .add-form {
    flex-direction: column;
  }
  
  .form-input {
    min-width: auto;
  }
  
  .data-controls {
    flex-direction: column;
  }
  
  .item-display {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding-left: 16px;
  }
  
  .item-actions {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .management-section h2,
  .data-section h2,
  .evaluation-section h2,
  .visualization-section h2 {
    font-size: 1.1rem;
  }
  
  .btn {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }
  
  .btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}

/* Info button styles */
.info-btn {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  margin-left: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
}

.info-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  transform: scale(1.1);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-description {
  color: #6b7280;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.modal-body h4 {
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem 0;
  border-left: 4px solid #3b82f6;
  padding-left: 0.75rem;
}

.modal-body h4:first-of-type {
  margin-top: 0;
}

.code-block {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin: 0.75rem 0 1.5rem 0;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.code-block code {
  color: #333;
  white-space: pre;
}

.note-list {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem 1rem 1rem 2rem;
  margin: 1rem 0;
}

.note-list li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.note-list li:last-child {
  margin-bottom: 0;
}

.note-list strong {
  color: #0f172a;
}

/* Modal responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .code-block {
    font-size: 0.8rem;
    padding: 0.75rem;
  }
  
  .modal-header h3 {
    font-size: 1.3rem;
  }
}
</style>
