import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/utils/request'

export const useTemplateStore = defineStore('template', () => {
  const templates = ref([])
  const loading = ref(false)

  function mapTemplate(t) {
    const { column_mappings, created_at, updated_at, ...rest } = t
    return {
      ...rest,
      columnMappings: column_mappings || t.columnMappings,
      createdAt: created_at || t.createdAt,
      updatedAt: updated_at || t.updatedAt
    }
  }

  async function fetchTemplates() {
    loading.value = true
    try {
      const res = await api.getTemplates()
      templates.value = res.data.map(mapTemplate)
    } catch (err) {
      console.error('获取模板列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  async function addTemplate(template) {
    const res = await api.addTemplate(template)
    templates.value.unshift(mapTemplate(res.data))
    return res.data
  }

  async function updateTemplate(id, data) {
    const res = await api.updateTemplate(id, data)
    const idx = templates.value.findIndex(t => t.id === id)
    if (idx !== -1) templates.value[idx] = mapTemplate(res.data)
    return res.data
  }

  async function deleteTemplate(id) {
    await api.deleteTemplate(id)
    const idx = templates.value.findIndex(t => t.id === id)
    if (idx !== -1) templates.value.splice(idx, 1)
  }

  async function matchTemplate(headers, mappedFields) {
    const res = await api.matchTemplate(headers, mappedFields)
    return res.data
  }

  return { templates, loading, fetchTemplates, addTemplate, updateTemplate, deleteTemplate, matchTemplate }
})
