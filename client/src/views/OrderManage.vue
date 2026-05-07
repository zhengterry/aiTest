<template>
  <div class="order-manage">
    <div class="page-header">
      <div class="page-title">物流订单管理</div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="发件人">
          <el-input v-model="searchForm.senderName" placeholder="发件人姓名" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="收件人">
          <el-input v-model="searchForm.receiverName" placeholder="收件人姓名" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="温层">
          <el-select v-model="searchForm.tempZone" placeholder="请选择" clearable style="width: 120px">
            <el-option label="常温" value="常温" />
            <el-option label="冷藏" value="冷藏" />
            <el-option label="冷冻" value="冷冻" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <div class="table-bar">
      <div class="table-toolbar">
        <div style="margin-left: auto; display: flex; gap: 8px;">
          <el-button type="primary" @click="handleAdd">新增</el-button>
          <el-button type="success" @click="handleExport">导出</el-button>
          <el-button type="warning" @click="triggerImport">导入</el-button>
          <input ref="fileInputRef" type="file" accept=".xlsx,.xls" style="display: none" @change="handleImport" />
        </div>
      </div>

      <el-table v-loading="orderStore.loading" :data="pagedOrders" border stripe style="width: 100%" empty-text="暂无数据" :row-class-name="tableRowClass">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="externalCode" label="外部编码" min-width="130" show-overflow-tooltip />
        <el-table-column prop="senderName" label="发件人" min-width="90" show-overflow-tooltip />
        <el-table-column prop="senderPhone" label="发件人电话" min-width="120" show-overflow-tooltip />
        <el-table-column prop="senderAddress" label="发件人地址" min-width="160" show-overflow-tooltip />
        <el-table-column prop="receiverName" label="收件人" min-width="90" show-overflow-tooltip />
        <el-table-column prop="receiverPhone" label="收件人电话" min-width="120" show-overflow-tooltip />
        <el-table-column prop="receiverAddress" label="收件人地址" min-width="160" show-overflow-tooltip />
        <el-table-column prop="weight" label="重量(kg)" width="100" align="right">
          <template #default="{ row }">{{ Number(row.weight).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="件数" width="70" align="center" />
        <el-table-column prop="tempZone" label="温层" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="tempTagType(row.tempZone)" size="small">{{ row.tempZone }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="display: flex; justify-content: flex-end; margin-top: 16px">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50]"
          :total="orderStore.orders.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增订单' : '编辑订单'" width="700px" destroy-on-close>
      <el-form ref="orderFormRef" :model="orderForm" :rules="orderRules" label-width="100px">
        <el-form-item label="外部编码" prop="externalCode">
          <el-input v-model="orderForm.externalCode" placeholder="选填，用于去重" />
        </el-form-item>
        <el-divider content-position="left">发件人信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="senderName">
              <el-input v-model="orderForm.senderName" placeholder="请输入发件人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话" prop="senderPhone">
              <el-input v-model="orderForm.senderPhone" placeholder="请输入发件人电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址" prop="senderAddress">
          <el-input v-model="orderForm.senderAddress" placeholder="请输入发件人完整地址" />
        </el-form-item>
        <el-divider content-position="left">收件人信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="receiverName">
              <el-input v-model="orderForm.receiverName" placeholder="请输入收件人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话" prop="receiverPhone">
              <el-input v-model="orderForm.receiverPhone" placeholder="请输入收件人电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址" prop="receiverAddress">
          <el-input v-model="orderForm.receiverAddress" placeholder="请输入收件人完整地址" />
        </el-form-item>
        <el-divider content-position="left">货物信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="重量(kg)" prop="weight">
              <el-input-number v-model="orderForm.weight" :min="0.01" :precision="2" :step="0.5" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="件数" prop="quantity">
              <el-input-number v-model="orderForm.quantity" :min="1" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="温层" prop="tempZone">
              <el-select v-model="orderForm.tempZone" placeholder="请选择" style="width: 100%">
                <el-option label="常温" value="常温" />
                <el-option label="冷藏" value="冷藏" />
                <el-option label="冷冻" value="冷冻" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="orderForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useOrderStore } from '@/stores/order'
import { exportToExcel, importFromExcel } from '@/utils/excel'
import { ElMessage, ElMessageBox } from 'element-plus'

const orderStore = useOrderStore()

const searchForm = reactive({ senderName: '', receiverName: '', tempZone: '' })

function handleSearch() {
  pagination.page = 1
  orderStore.fetchOrders(searchForm)
}
function handleReset() {
  searchForm.senderName = ''
  searchForm.receiverName = ''
  searchForm.tempZone = ''
  pagination.page = 1
  orderStore.fetchOrders()
}

const pagination = reactive({ page: 1, size: 10 })
const pagedOrders = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  return orderStore.orders.slice(start, start + pagination.size)
})

const dialogVisible = ref(false)
const dialogType = ref('add')
const orderFormRef = ref(null)
const editingId = ref(null)
const submitLoading = ref(false)

const orderForm = reactive({
  externalCode: '',
  senderName: '', senderPhone: '', senderAddress: '',
  receiverName: '', receiverPhone: '', receiverAddress: '',
  weight: 1, quantity: 1, tempZone: '常温', remark: ''
})

const orderRules = {
  senderName: [{ required: true, message: '请输入发件人姓名', trigger: 'blur' }],
  senderPhone: [{ required: true, message: '请输入发件人电话', trigger: 'blur' }],
  senderAddress: [{ required: true, message: '请输入发件人地址', trigger: 'blur' }],
  receiverName: [{ required: true, message: '请输入收件人姓名', trigger: 'blur' }],
  receiverPhone: [{ required: true, message: '请输入收件人电话', trigger: 'blur' }],
  receiverAddress: [{ required: true, message: '请输入收件人地址', trigger: 'blur' }],
  weight: [{ required: true, message: '请输入重量', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入件数', trigger: 'blur' }],
  tempZone: [{ required: true, message: '请选择温层', trigger: 'change' }]
}

function resetOrderForm() {
  Object.assign(orderForm, {
    externalCode: '',
    senderName: '', senderPhone: '', senderAddress: '',
    receiverName: '', receiverPhone: '', receiverAddress: '',
    weight: 1, quantity: 1, tempZone: '常温', remark: ''
  })
}

function handleAdd() {
  dialogType.value = 'add'
  resetOrderForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  editingId.value = row.id
  Object.assign(orderForm, {
    externalCode: row.externalCode || '',
    senderName: row.senderName, senderPhone: row.senderPhone, senderAddress: row.senderAddress,
    receiverName: row.receiverName, receiverPhone: row.receiverPhone, receiverAddress: row.receiverAddress,
    weight: row.weight, quantity: row.quantity, tempZone: row.tempZone, remark: row.remark || ''
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await orderFormRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (dialogType.value === 'add') {
      await orderStore.addOrder({ ...orderForm })
      ElMessage.success('新增成功')
    } else {
      await orderStore.updateOrder(editingId.value, { ...orderForm })
      ElMessage.success('编辑成功')
    }
    dialogVisible.value = false
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除该订单吗？`, '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    await orderStore.deleteOrder(row.id)
    ElMessage.success('删除成功')
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.message || '删除失败')
  }
}

function tempTagType(zone) {
  if (zone === '冷藏') return 'primary'
  if (zone === '冷冻') return 'info'
  return 'success'
}

function tableRowClass({ row }) {
  if (row.tempZone === '冷藏') return 'row-cold'
  if (row.tempZone === '冷冻') return 'row-frozen'
  return ''
}

const excelColumns = [
  { prop: 'externalCode', label: '外部编码' },
  { prop: 'senderName', label: '发件人姓名' },
  { prop: 'senderPhone', label: '发件人电话' },
  { prop: 'senderAddress', label: '发件人地址' },
  { prop: 'receiverName', label: '收件人姓名' },
  { prop: 'receiverPhone', label: '收件人电话' },
  { prop: 'receiverAddress', label: '收件人地址' },
  { prop: 'weight', label: '重量(kg)' },
  { prop: 'quantity', label: '件数' },
  { prop: 'tempZone', label: '温层' },
  { prop: 'remark', label: '备注' }
]

function handleExport() {
  if (orderStore.orders.length === 0) { ElMessage.warning('没有可导出的数据'); return }
  exportToExcel(orderStore.orders, excelColumns, '物流订单')
  ElMessage.success('导出成功')
}

const fileInputRef = ref(null)
function triggerImport() { fileInputRef.value.click() }

async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const data = await importFromExcel(file, excelColumns)
    if (data.length === 0) { ElMessage.warning('未解析到有效数据'); return }
    await orderStore.batchAdd(data)
    ElMessage.success(`成功导入 ${data.length} 条数据`)
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    e.target.value = ''
  }
}

onMounted(() => { orderStore.fetchOrders() })
</script>

<style scoped>
.order-manage .el-divider--horizontal {
  margin: 12px 0;
}
:deep(.row-cold) {
  --el-table-tr-bg-color: #f0f9ff;
}
:deep(.row-frozen) {
  --el-table-tr-bg-color: #f0f5ff;
}
</style>
