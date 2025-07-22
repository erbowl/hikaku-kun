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

export const useComparisonStore = defineStore('comparison', () => {
  // Constants for localStorage keys
  const STORAGE_KEY = 'comparison-tool-data'
  const LAST_URL_KEY = 'comparison-tool-last-url'
  
  // State
  const projectName = ref('新しいプロジェクト')
  const options = ref<Option[]>([])
  const criteria = ref<Criteria[]>([])
  const evaluations = ref<Record<string, Record<string, number>>>({})

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
    const id = generateId()
    options.value.push({ id, name })
    if (!evaluations.value[id]) {
      evaluations.value[id] = {}
    }
    // Initialize evaluations for all existing criteria with default value 3 (普通)
    criteria.value.forEach(criterium => {
      evaluations.value[id][criterium.id] = 3
    })
  }

  function removeOption(id: string) {
    const index = options.value.findIndex(option => option.id === id)
    if (index !== -1) {
      options.value.splice(index, 1)
      delete evaluations.value[id]
    }
  }

  function updateOption(id: string, name: string) {
    const option = options.value.find(option => option.id === id)
    if (option) {
      option.name = name
    }
  }

  function reorderOptions(fromIndex: number, toIndex: number) {
    const item = options.value.splice(fromIndex, 1)[0]
    options.value.splice(toIndex, 0, item)
  }

  function addCriteria(name: string, weight: number = 5) {
    const id = generateId()
    criteria.value.push({ id, name, weight })
    
    // Initialize evaluations for all options
    options.value.forEach(option => {
      if (!evaluations.value[option.id]) {
        evaluations.value[option.id] = {}
      }
      evaluations.value[option.id][id] = 3
    })
  }

  function removeCriteria(id: string) {
    const index = criteria.value.findIndex(criterium => criterium.id === id)
    if (index !== -1) {
      criteria.value.splice(index, 1)
      // Remove evaluations for this criteria
      Object.keys(evaluations.value).forEach(optionId => {
        delete evaluations.value[optionId][id]
      })
    }
  }

  function updateCriteria(id: string, name: string, weight: number) {
    const criterium = criteria.value.find(criterium => criterium.id === id)
    if (criterium) {
      criterium.name = name
      criterium.weight = weight
    }
  }

  function reorderCriteria(fromIndex: number, toIndex: number) {
    const item = criteria.value.splice(fromIndex, 1)[0]
    criteria.value.splice(toIndex, 0, item)
  }

  function setEvaluation(optionId: string, criteriaId: string, value: number) {
    if (!evaluations.value[optionId]) {
      evaluations.value[optionId] = {}
    }
    evaluations.value[optionId][criteriaId] = value
  }

  function loadProject(data: ProjectData) {
    projectName.value = data.name
    options.value = [...data.options]
    criteria.value = [...data.criteria]
    evaluations.value = { ...data.evaluations }
  }

  function exportProject(): ProjectData {
    return {
      id: generateId(),
      name: projectName.value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      options: [...options.value],
      criteria: [...criteria.value],
      evaluations: { ...evaluations.value }
    }
  }

  function saveToLocalStorage() {
    const data = exportProject()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved) as ProjectData
        loadProject(data)
        return true
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
