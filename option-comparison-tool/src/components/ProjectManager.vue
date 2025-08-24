<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content project-manager-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">プロジェクト管理</h2>
        <button
          @click="$emit('close')"
          class="close-button"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- New Project -->
      <div class="new-project-section">
        <h3 class="section-title">新しいプロジェクト</h3>
        <div class="new-project-form">
          <input
            v-model="newProjectName"
            @keyup.enter="createProject"
            type="text"
            placeholder="プロジェクト名"
            class="project-name-input"
          />
          <button
            @click="createProject"
            :disabled="!newProjectName.trim()"
            class="btn btn-primary create-btn"
          >
            作成
          </button>
        </div>
      </div>

      <!-- Project List -->
      <div class="project-list-section">
        <h3 class="section-title">プロジェクト一覧</h3>
        <div class="project-list">
          <div
            v-for="project in projectList"
            :key="project.id"
            class="project-item"
            :class="{ 'active-project': project.id === activeProjectId }"
          >
            <div class="project-content">
              <!-- Edit mode -->
              <div v-if="editingProject === project.id" class="edit-mode">
                <input
                  v-model="editProjectName"
                  @keyup.enter="saveProjectName(project.id)"
                  @keyup.escape="cancelEdit"
                  ref="editInput"
                  type="text"
                  class="edit-input"
                />
                <div class="edit-actions">
                  <button
                    @click="saveProjectName(project.id)"
                    class="btn btn-sm btn-success"
                  >
                    保存
                  </button>
                  <button
                    @click="cancelEdit"
                    class="btn btn-sm btn-secondary"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
              
              <!-- View mode -->
              <div v-else class="view-mode">
                <div class="project-info">
                  <h4 class="project-name">{{ project.name }}</h4>
                  <span v-if="project.id === activeProjectId" class="active-badge">
                    現在のプロジェクト
                  </span>
                </div>
                <p class="project-meta">
                  作成: {{ formatDate(project.createdAt) }} | 
                  更新: {{ formatDate(project.updatedAt) }}
                </p>
                <p class="project-stats">
                  選択肢: {{ project.options.length }}個 | 
                  評価軸: {{ project.criteria.length }}個
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="project-actions">
              <button
                v-if="project.id !== activeProjectId"
                @click="switchToProject(project.id)"
                class="btn btn-sm btn-primary"
              >
                切り替え
              </button>
              
              <button
                @click="startEdit(project)"
                class="btn btn-sm btn-outline action-btn"
                title="名前を編集"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              
              <button
                @click="duplicateProject(project.id)"
                class="btn btn-sm btn-success action-btn"
                title="複製"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
              
              <button
                @click="confirmDelete(project)"
                :disabled="projectList.length <= 1"
                class="btn btn-sm btn-danger action-btn"
                title="削除"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <div v-if="deleteConfirmProject" class="delete-confirmation-overlay">
        <div class="delete-confirmation-modal">
          <h3 class="delete-title">プロジェクト削除の確認</h3>
          <p class="delete-message">
            「{{ deleteConfirmProject.name }}」を削除してもよろしいですか？<br>
            この操作は取り消せません。
          </p>
          <div class="delete-actions">
            <button
              @click="deleteConfirmProject = null"
              class="btn btn-secondary"
            >
              キャンセル
            </button>
            <button
              @click="executeDelete"
              class="btn btn-danger"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { useComparisonStore, type ProjectData } from '../stores/comparison'

// Props & Emits
defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  close: []
}>()

// Store
const store = useComparisonStore()

// Computed properties from store
const projectList = computed(() => store.projectList)
const activeProjectId = computed(() => store.activeProjectId)

// Local state
const newProjectName = ref('')
const editingProject = ref<string | null>(null)
const editProjectName = ref('')
const editInput = ref<HTMLInputElement>()
const deleteConfirmProject = ref<ProjectData | null>(null)

// Methods
function createProject() {
  if (!newProjectName.value.trim()) return
  
  store.createNewProject(newProjectName.value.trim())
  newProjectName.value = ''
}

function switchToProject(projectId: string) {
  store.switchProject(projectId)
}

function duplicateProject(projectId: string) {
  store.duplicateProject(projectId)
}

function startEdit(project: ProjectData) {
  editingProject.value = project.id
  editProjectName.value = project.name
  nextTick(() => {
    const input = editInput.value
    if (input) {
      input.focus()
      input.select()
    }
  })
}

function saveProjectName(projectId: string) {
  if (!editProjectName.value.trim()) {
    cancelEdit()
    return
  }
  
  store.updateProjectName(projectId, editProjectName.value.trim())
  editingProject.value = null
  editProjectName.value = ''
}

function cancelEdit() {
  editingProject.value = null
  editProjectName.value = ''
}

function confirmDelete(project: ProjectData) {
  deleteConfirmProject.value = project
}

function executeDelete() {
  if (deleteConfirmProject.value) {
    store.deleteProject(deleteConfirmProject.value.id)
    deleteConfirmProject.value = null
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
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
  z-index: 9999;
  padding: 1rem;
}

.project-manager-modal {
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

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f3f4f6;
  color: #333;
  transform: translateY(-1px);
}

.close-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.new-project-section {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f8f9fa;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.new-project-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.project-name-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.project-name-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.create-btn {
  white-space: nowrap;
  min-width: 80px;
}

.project-list-section {
  padding: 1.5rem;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  transition: all 0.2s ease;
}

.project-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.1);
}

.project-item.active-project {
  background: #f0f8ff;
  border-color: #3b82f6;
}

.project-content {
  flex: 1;
  margin-right: 1rem;
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-input {
  padding: 0.5rem;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  font-size: 1rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.view-mode {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.project-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.active-badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.project-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.project-stats {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.action-btn {
  padding: 0.5rem;
  min-width: auto;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.delete-confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.delete-confirmation-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.delete-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
}

.delete-message {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Button styles matching HomeView */
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

.btn:focus:not(:disabled) {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
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

.btn-outline:hover:not(:disabled) {
  background: #3b82f6;
  color: white;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .project-manager-modal {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-title {
    font-size: 1.3rem;
  }
  
  .new-project-section,
  .project-list-section {
    padding: 1rem;
  }
  
  .project-item {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .project-content {
    margin-right: 0;
    width: 100%;
  }
  
  .project-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .new-project-form {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .project-name-input {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .btn {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }
  
  .btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
  
  .project-actions {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .action-btn {
    padding: 0.4rem;
  }
}
</style>
