import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as LZString from 'lz-string'

export interface Option {
  id: string
  name: string
}

export interface Criteria {
  id: string
  name: string
  weight: number
}

export interface Evaluation {
  optionId: string
  criteriaId: string
  value: number
}

export interface ProjectData {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  options: Option[]
  criteria: Criteria[]
  evaluations: Record<string, Record<string, number>>
}

export interface ProjectsData {
  activeProjectId: string | null
  projects: Record<string, ProjectData>
}

export const useComparisonStore = defineStore('comparison', () => {
  // Constants for localStorage keys
  const STORAGE_KEY = 'comparison-tool-projects'
  const LAST_URL_KEY = 'comparison-tool-last-url'
  
  // State
  const activeProjectId = ref<string | null>(null)
  const projects = ref<Record<string, ProjectData>>({})
  
  // Current project computed properties
  const currentProject = computed(() => {
    return activeProjectId.value ? projects.value[activeProjectId.value] : null
  })
  
  const projectName = computed(() => {
    return currentProject.value?.name || '新しいプロジェクト'
  })
  
  const options = computed(() => {
    return currentProject.value?.options || []
  })
  
  const criteria = computed(() => {
    return currentProject.value?.criteria || []
  })
  
  const evaluations = computed(() => {
    return currentProject.value?.evaluations || {}
  })
  
  // Project list computed
  const projectList = computed(() => {
    return Object.values(projects.value).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })
  
  // Helper function to ensure current project exists
  function ensureCurrentProject() {
    if (!activeProjectId.value || !projects.value[activeProjectId.value]) {
      createNewProject()
    }
  }
  
  // Update current project's timestamp
  function updateCurrentProjectTimestamp() {
    if (activeProjectId.value && projects.value[activeProjectId.value]) {
      projects.value[activeProjectId.value].updatedAt = new Date().toISOString()
    }
  }

  // Computed
  const results = computed(() => {
    const scores: Record<string, { totalScore: number; breakdown: Record<string, number> }> = {}
    
    options.value.forEach(option => {
      let totalScore = 0
      const breakdown: Record<string, number> = {}
      
      criteria.value.forEach(criterium => {
        const evaluation = evaluations.value[option.id]?.[criterium.id] ?? 3 // Default to 3 (普通) if not set
        const weightedScore = evaluation * criterium.weight
        breakdown[criterium.id] = weightedScore
        totalScore += weightedScore
      })
      
      scores[option.id] = { totalScore, breakdown }
    })
    
    return scores
  })

  const rankedOptions = computed(() => {
    return options.value
      .map(option => ({
        ...option,
        score: Math.round(results.value[option.id]?.totalScore || 0),
        breakdown: results.value[option.id]?.breakdown || {}
      }))
      .sort((a, b) => b.score - a.score)
  })

  // Actions
  function addOption(name: string) {
    ensureCurrentProject()
    const currentProj = projects.value[activeProjectId.value!]
    
    const id = generateId()
    currentProj.options.push({ id, name })
    if (!currentProj.evaluations[id]) {
      currentProj.evaluations[id] = {}
    }
    // Initialize evaluations for all existing criteria with default value 3 (普通)
    currentProj.criteria.forEach(criterium => {
      currentProj.evaluations[id][criterium.id] = 3
    })
    
    updateCurrentProjectTimestamp()
  }

  function removeOption(id: string) {
    ensureCurrentProject()
    const currentProj = projects.value[activeProjectId.value!]
    
    const index = currentProj.options.findIndex(option => option.id === id)
    if (index !== -1) {
      currentProj.options.splice(index, 1)
      delete currentProj.evaluations[id]
    }
    
    updateCurrentProjectTimestamp()
  }

  function updateOption(id: string, name: string) {
    ensureCurrentProject()
    const currentProj = projects.value[activeProjectId.value!]
    
    const option = currentProj.options.find(option => option.id === id)
    if (option) {
      option.name = name
      updateCurrentProjectTimestamp()
    }
  }

  function reorderOptions(fromIndex: number, toIndex: number) {
    ensureCurrentProject()
    const currentProj = projects.value[activeProjectId.value!]
    
    const item = currentProj.options.splice(fromIndex, 1)[0]
    currentProj.options.splice(toIndex, 0, item)
    updateCurrentProjectTimestamp()
  }

  function addCriteria(name: string, weight: number = 5) {
    ensureCurrentProject()
    const currentProj = projects.value[activeProjectId.value!]
    
    const id = generateId()
    currentProj.criteria.push({ id, name, weight })
    
    // Initialize evaluations for all options
    currentProj.options.forEach(option => {
      if (!currentProj.evaluations[option.id]) {
        currentProj.evaluations[option.id] = {}
      }
      currentProj.evaluations[option.id][id] = 3
    })
    updateCurrentProjectTimestamp()
  }

  function removeCriteria(id: string) {
    ensureCurrentProject()
    const currentProj = projects.value[activeProjectId.value!]
    
    const index = currentProj.criteria.findIndex(criterium => criterium.id === id)
    if (index !== -1) {
      currentProj.criteria.splice(index, 1)
      // Remove evaluations for this criteria
      Object.keys(currentProj.evaluations).forEach(optionId => {
        delete currentProj.evaluations[optionId][id]
      })
    }
    
    updateCurrentProjectTimestamp()
  }

  function updateCriteria(id: string, name: string, weight: number) {
    ensureCurrentProject()
    const currentProj = projects.value[activeProjectId.value!]
    
    const criterium = currentProj.criteria.find(criterium => criterium.id === id)
    if (criterium) {
      criterium.name = name
      criterium.weight = weight
      updateCurrentProjectTimestamp()
    }
  }

  function reorderCriteria(fromIndex: number, toIndex: number) {
    ensureCurrentProject()
    const currentProj = projects.value[activeProjectId.value!]
    
    const item = currentProj.criteria.splice(fromIndex, 1)[0]
    currentProj.criteria.splice(toIndex, 0, item)
    updateCurrentProjectTimestamp()
  }

  function setEvaluation(optionId: string, criteriaId: string, value: number) {
    ensureCurrentProject()
    const currentProj = projects.value[activeProjectId.value!]
    
    if (!currentProj.evaluations[optionId]) {
      currentProj.evaluations[optionId] = {}
    }
    currentProj.evaluations[optionId][criteriaId] = value
    updateCurrentProjectTimestamp()
  }

  function loadProject(data: ProjectData) {
    // Create a new project or update existing one
    const projectId = data.id || generateId()
    const now = new Date().toISOString()
    
    projects.value[projectId] = {
      id: projectId,
      name: data.name,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      options: [...data.options],
      criteria: [...data.criteria],
      evaluations: { ...data.evaluations }
    }
    
    activeProjectId.value = projectId
    saveToLocalStorage()
  }

  function exportProject(): ProjectData {
    ensureCurrentProject()
    const currentProj = projects.value[activeProjectId.value!]
    
    return {
      id: currentProj.id,
      name: currentProj.name,
      createdAt: currentProj.createdAt,
      updatedAt: currentProj.updatedAt,
      options: [...currentProj.options],
      criteria: [...currentProj.criteria],
      evaluations: { ...currentProj.evaluations }
    }
  }

  function saveToLocalStorage() {
    const data: ProjectsData = {
      activeProjectId: activeProjectId.value,
      projects: projects.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        // Try new format first
        const data = JSON.parse(saved) as ProjectsData | ProjectData
        
        // Check if it's the new format
        if ('activeProjectId' in data && 'projects' in data) {
          projects.value = data.projects
          activeProjectId.value = data.activeProjectId
          
          // If no active project, create one
          if (!activeProjectId.value || !projects.value[activeProjectId.value]) {
            if (Object.keys(projects.value).length > 0) {
              activeProjectId.value = Object.keys(projects.value)[0]
            } else {
              createNewProject()
            }
          }
          return true
        } else {
          // Old format - migrate to new format
          const oldProject = data as ProjectData
          const projectId = oldProject.id || generateId()
          
          projects.value = {
            [projectId]: {
              ...oldProject,
              id: projectId
            }
          }
          activeProjectId.value = projectId
          saveToLocalStorage() // Save in new format
          return true
        }
      } catch (error) {
        console.error('Failed to load from localStorage:', error)
        return false
      }
    }
    return false
  }

  function generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  // Project management functions
  function createNewProject(name: string = '新しいプロジェクト'): string {
    const projectId = generateId()
    const now = new Date().toISOString()
    
    projects.value[projectId] = {
      id: projectId,
      name: name,
      createdAt: now,
      updatedAt: now,
      options: [],
      criteria: [],
      evaluations: {}
    }
    
    activeProjectId.value = projectId
    saveToLocalStorage()
    return projectId
  }

  function duplicateProject(sourceProjectId: string, newName?: string): string | null {
    const sourceProject = projects.value[sourceProjectId]
    if (!sourceProject) return null
    
    const projectId = generateId()
    const now = new Date().toISOString()
    
    projects.value[projectId] = {
      ...sourceProject,
      id: projectId,
      name: newName || `${sourceProject.name} - コピー`,
      createdAt: now,
      updatedAt: now,
      options: [...sourceProject.options],
      criteria: [...sourceProject.criteria],
      evaluations: { ...sourceProject.evaluations }
    }
    
    activeProjectId.value = projectId
    saveToLocalStorage()
    return projectId
  }

  function switchProject(projectId: string): boolean {
    if (projects.value[projectId]) {
      activeProjectId.value = projectId
      saveToLocalStorage()
      return true
    }
    return false
  }

  function deleteProject(projectId: string): boolean {
    if (!projects.value[projectId]) return false
    
    delete projects.value[projectId]
    
    // If deleting active project, switch to another one or create new
    if (activeProjectId.value === projectId) {
      const remaining = Object.keys(projects.value)
      if (remaining.length > 0) {
        activeProjectId.value = remaining[0]
      } else {
        createNewProject()
      }
    }
    
    saveToLocalStorage()
    return true
  }

  function updateProjectName(projectId: string, name: string): boolean {
    if (projects.value[projectId]) {
      projects.value[projectId].name = name
      projects.value[projectId].updatedAt = new Date().toISOString()
      saveToLocalStorage()
      return true
    }
    return false
  }

  // URL管理機能
  function getCurrentShareHash(): string | null {
    // 現在のデータから共有URLを生成してハッシュ部分を取得
    try {
      const data = exportProject()
      const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data))
      return compressed
    } catch (error) {
      console.error('現在のデータのハッシュ生成に失敗:', error)
      return null
    }
  }

  function getLastLoadedUrl(): string | null {
    return localStorage.getItem(LAST_URL_KEY)
  }

  function setLastLoadedUrl(urlHash: string) {
    localStorage.setItem(LAST_URL_KEY, urlHash)
  }

  function clearLastLoadedUrl() {
    localStorage.removeItem(LAST_URL_KEY)
  }

  // URL共有機能
  function generateShareableUrl(): string {
    const data = exportProject()
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data))
    const baseUrl = window.location.origin + window.location.pathname
    return `${baseUrl}#share=${compressed}`
  }

  function smartLoadData(): { source: 'url' | 'local' | 'sample', loaded: boolean } {
    // まずURLからデータを読み込む試行
    const urlLoaded = loadFromUrl()
    
    if (urlLoaded) {
      return { source: 'url', loaded: true }
    }
    
    // URLからの読み込みが失敗した場合、ローカルストレージから読み込み
    const localLoaded = loadFromLocalStorage()
    if (localLoaded) {
      return { source: 'local', loaded: true }
    }
    
    return { source: 'sample', loaded: false }
  }

  function loadFromUrl(url?: string): boolean {
    try {
      const urlToProcess = url || window.location.href
      const hashMatch = urlToProcess.match(/#share=(.+)/)
      
      if (hashMatch && hashMatch[1]) {
        const currentUrlHash = hashMatch[1]
        const lastLoadedUrl = getLastLoadedUrl()
        
        // 同じURLを再読み込みしている場合で、ローカルにデータがある場合はローカル優先
        if (currentUrlHash === lastLoadedUrl) {
          const hasLocalData = localStorage.getItem(STORAGE_KEY)
          if (hasLocalData) {
            console.log('同じURLの再読み込み: ローカルデータを維持')
            return false // ローカルデータを使用
          }
        }
        
        // 新しいURLまたはローカルデータがない場合はURLから読み込み
        const decompressed = LZString.decompressFromEncodedURIComponent(currentUrlHash)
        
        if (decompressed) {
          const data = JSON.parse(decompressed) as ProjectData
          loadProject(data)
          
          // URLハッシュを記録
          setLastLoadedUrl(currentUrlHash)
          
          // 即座にローカルストレージに保存（編集可能状態にする）
          saveToLocalStorage()
          
          // URLからハッシュを削除
          if (window.history && window.history.replaceState) {
            const newUrl = window.location.origin + window.location.pathname
            window.history.replaceState({}, document.title, newUrl)
          }
          
          console.log('URLからデータを読み込み、ローカル保存完了')
          return true
        }
      }
    } catch (error) {
      console.error('URL からのデータ読み込みに失敗しました:', error)
    }
    return false
  }

  async function copyShareableUrl(): Promise<boolean> {
    try {
      const shareUrl = generateShareableUrl()
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        return true
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      }
    } catch (error) {
      console.error('URL のコピーに失敗しました:', error)
      return false
    }
  }

  return {
    // State
    projectName,
    options,
    criteria,
    evaluations,
    projectList,
    currentProject,
    activeProjectId: computed(() => activeProjectId.value),
    
    // Computed
    results,
    rankedOptions,
    
    // Actions
    addOption,
    removeOption,
    updateOption,
    reorderOptions,
    addCriteria,
    removeCriteria,
    updateCriteria,
    reorderCriteria,
    setEvaluation,
    loadProject,
    exportProject,
    saveToLocalStorage,
    loadFromLocalStorage,
    
    // Project management
    createNewProject,
    duplicateProject,
    switchProject,
    deleteProject,
    updateProjectName,
    
    // URL共有機能
    generateShareableUrl,
    loadFromUrl,
    copyShareableUrl,
    smartLoadData,
    
    // URL管理機能
    getCurrentShareHash,
    getLastLoadedUrl,
    setLastLoadedUrl,
    clearLastLoadedUrl
  }
})
