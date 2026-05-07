import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/utils/request'

export const useOrderStore = defineStore('order', () => {
  const orders = ref([])
  const loading = ref(false)

  function mapOrder(o) {
    const { external_code, sender_name, sender_phone, sender_address,
            receiver_name, receiver_phone, receiver_address,
            temp_zone, created_at, ...rest } = o
    return {
      ...rest,
      externalCode: external_code || rest.externalCode,
      senderName: sender_name || rest.senderName,
      senderPhone: sender_phone || rest.senderPhone,
      senderAddress: sender_address || rest.senderAddress,
      receiverName: receiver_name || rest.receiverName,
      receiverPhone: receiver_phone || rest.receiverPhone,
      receiverAddress: receiver_address || rest.receiverAddress,
      tempZone: temp_zone || rest.tempZone,
      createdAt: created_at || rest.createdAt
    }
  }

  async function fetchOrders(params = {}) {
    loading.value = true
    try {
      const res = await api.getOrders(params)
      orders.value = res.data.map(mapOrder)
    } catch (err) {
      console.error('获取订单列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  async function addOrder(order) {
    const res = await api.addOrder(order)
    orders.value.unshift(mapOrder(res.data))
  }

  async function updateOrder(id, data) {
    const res = await api.updateOrder(id, data)
    const idx = orders.value.findIndex(o => o.id === id)
    if (idx !== -1) {
      orders.value[idx] = mapOrder(res.data)
    }
  }

  async function deleteOrder(id) {
    await api.deleteOrder(id)
    const idx = orders.value.findIndex(o => o.id === id)
    if (idx !== -1) orders.value.splice(idx, 1)
  }

  async function batchAdd(list) {
    await api.importOrders(list)
    await fetchOrders()
  }

  return { orders, loading, fetchOrders, addOrder, updateOrder, deleteOrder, batchAdd }
})
