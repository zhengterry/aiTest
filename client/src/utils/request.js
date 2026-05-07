import { getToken } from './auth'

// 优先使用环境变量，开发时走 Vite 代理
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(url, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || '请求失败')
  }

  return data
}

export const api = {
  login(username, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  },

  getBooks(params = {}) {
    const query = new URLSearchParams()
    if (params.title) query.set('title', params.title)
    if (params.author) query.set('author', params.author)
    if (params.category) query.set('category', params.category)
    const qs = query.toString()
    return request(`/books${qs ? '?' + qs : ''}`)
  },

  addBook(book) {
    return request('/books', {
      method: 'POST',
      body: JSON.stringify(book)
    })
  },

  updateBook(id, book) {
    return request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(book)
    })
  },

  deleteBook(id) {
    return request(`/books/${id}`, {
      method: 'DELETE'
    })
  },

  importBooks(books) {
    return request('/books/import', {
      method: 'POST',
      body: JSON.stringify({ books })
    })
  },

  getOrders(params = {}) {
    const query = new URLSearchParams()
    if (params.senderName) query.set('senderName', params.senderName)
    if (params.receiverName) query.set('receiverName', params.receiverName)
    if (params.tempZone) query.set('tempZone', params.tempZone)
    const qs = query.toString()
    return request(`/orders${qs ? '?' + qs : ''}`)
  },

  addOrder(order) {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    })
  },

  updateOrder(id, order) {
    return request(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order)
    })
  },

  deleteOrder(id) {
    return request(`/orders/${id}`, {
      method: 'DELETE'
    })
  },

  importOrders(orders) {
    return request('/orders/import', {
      method: 'POST',
      body: JSON.stringify({ orders })
    })
  },

  checkDuplicateCodes(codes) {
    return request('/orders/check-codes', {
      method: 'POST',
      body: JSON.stringify({ codes })
    })
  },

  getTemplates() {
    return request('/templates')
  },

  addTemplate(template) {
    return request('/templates', {
      method: 'POST',
      body: JSON.stringify(template)
    })
  },

  updateTemplate(id, template) {
    return request(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template)
    })
  },

  deleteTemplate(id) {
    return request(`/templates/${id}`, {
      method: 'DELETE'
    })
  },

  matchTemplate(headers, mappedFields) {
    return request('/templates/match', {
      method: 'POST',
      body: JSON.stringify({ headers, mappedFields })
    })
  }
}
