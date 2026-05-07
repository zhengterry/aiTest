import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/utils/request'

export const useBookStore = defineStore('book', () => {
  const books = ref([])
  const loading = ref(false)

  async function fetchBooks(params = {}) {
    loading.value = true
    try {
      const res = await api.getBooks(params)
      books.value = res.data.map(b => {
        const { publish_date, ...rest } = b
        return { ...rest, publishDate: publish_date || rest.publishDate }
      })
    } catch (err) {
      console.error('获取图书列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  function mapBook(b) {
    const { publish_date, ...rest } = b
    return { ...rest, publishDate: publish_date || rest.publishDate }
  }

  async function addBook(book) {
    const res = await api.addBook(book)
    books.value.push(mapBook(res.data))
  }

  async function updateBook(id, data) {
    const res = await api.updateBook(id, data)
    const idx = books.value.findIndex(b => b.id === id)
    if (idx !== -1) {
      books.value[idx] = mapBook(res.data)
    }
  }

  async function deleteBook(id) {
    await api.deleteBook(id)
    const idx = books.value.findIndex(b => b.id === id)
    if (idx !== -1) books.value.splice(idx, 1)
  }

  async function batchAdd(list) {
    await api.importBooks(list)
    await fetchBooks()
  }

  return { books, loading, fetchBooks, addBook, updateBook, deleteBook, batchAdd }
})
