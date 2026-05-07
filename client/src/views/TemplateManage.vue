<template>
  <div class="template-manage">
    <div class="page-header">
      <div class="page-title">模板管理 · 智能导入</div>
    </div>

    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- ===== 智能导入 Tab ===== -->
      <el-tab-pane label="智能导入" name="import">
        <el-steps :active="currentStep" finish-status="success" align-center style="margin-bottom: 24px">
          <el-step title="上传文件" />
          <el-step title="列映射" />
          <el-step title="数据预览" />
          <el-step title="提交下单" />
        </el-steps>

        <!-- Step 1: 上传文件 -->
        <div v-if="currentStep === 0" class="step-content">
          <div class="upload-area">
            <el-upload
              ref="uploadRef"
              drag
              :auto-upload="false"
              :limit="1"
              accept=".xlsx,.xls"
              :on-change="handleFileChange"
              :on-exceed="() => ElMessage.warning('只能上传一个文件')"
              :on-remove="handleFileRemove"
              :before-upload="() => false"
              class="excel-uploader"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">支持 .xlsx / .xls 格式的 Excel 文件</div>
              </template>
            </el-upload>
          </div>

          <div v-if="fileInfo" class="file-info-card">
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item label="文件名">{{ fileInfo.name }}</el-descriptions-item>
              <el-descriptions-item label="大小">{{ fileInfo.size }}</el-descriptions-item>
              <el-descriptions-item label="数据行数">{{ fileInfo.rows }} 行</el-descriptions-item>
              <el-descriptions-item label="列数">{{ fileInfo.cols }} 列</el-descriptions-item>
              <el-descriptions-item label="Sheet">{{ fileInfo.sheet }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="step-actions">
            <el-button type="primary" :disabled="!fileInfo" @click="goToStep(1)">下一步：列映射</el-button>
          </div>
        </div>

        <!-- Step 2: 列映射 -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="mapping-header">
            <div class="mapping-tip">
              <el-tag type="info" size="small">自动匹配</el-tag>
              <span v-if="matchedTemplateName">已匹配模板：<strong>{{ matchedTemplateName }}</strong></span>
              <span v-else style="color: #999">未找到匹配模板，请手动设置列映射</span>
            </div>
            <el-button size="small" @click="saveTemplateDialogVisible = true">
              保存为模板
            </el-button>
          </div>

          <div class="mapping-table-wrapper">
            <el-table :data="mappingRows" border stripe size="small" style="width: 100%">
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="excelHeader" label="Excel 列名" min-width="150" />
              <el-table-column label="示例数据" min-width="200">
                <template #default="{ row }">
                  <span class="sample-data">{{ row.sampleData }}</span>
                </template>
              </el-table-column>
              <el-table-column label="映射到字段" min-width="200">
                <template #default="{ row }">
                  <el-select v-model="row.mappedField" placeholder="不映射" clearable style="width: 100%">
                    <el-option
                      v-for="field in orderFields"
                      :key="field.key"
                      :label="field.label"
                      :value="field.key"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.mappedField" type="success" size="small">已映射</el-tag>
                  <el-tag v-else type="info" size="small">未映射</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="step-actions">
            <el-button @click="goToStep(0)">上一步</el-button>
            <el-button type="primary" :disabled="!hasRequiredMapping" @click="goToStep(2)">下一步：数据预览</el-button>
          </div>
        </div>

        <!-- Step 3: 数据预览 -->
        <div v-if="currentStep === 2" class="step-content">
          <!-- 错误汇总 -->
          <div v-if="errorSummary.length > 0" class="error-summary-card">
            <div class="error-summary-header">
              <el-icon color="#f56c6c"><WarningFilled /></el-icon>
              <span>发现 {{ errorSummary.length }} 个错误（涉及 {{ errorRowCount }} 行），请修正后再提交</span>
            </div>
            <div class="error-category-tabs">
              <el-tag :type="requiredErrors.length ? 'danger' : 'info'" size="small" :effect="requiredErrors.length ? 'dark' : 'plain'" class="error-tag-btn" @click="errorFilter = errorFilter === 'required' ? '' : 'required'">
                必填缺失 {{ requiredErrors.length ? `(${requiredErrors.length})` : '' }}
              </el-tag>
              <el-tag :type="formatErrors.length ? 'warning' : 'info'" size="small" :effect="formatErrors.length ? 'dark' : 'plain'" class="error-tag-btn" @click="errorFilter = errorFilter === 'format' ? '' : 'format'">
                格式错误 {{ formatErrors.length ? `(${formatErrors.length})` : '' }}
              </el-tag>
              <el-tag :type="dupErrors.length ? 'warning' : 'info'" size="small" :effect="dupErrors.length ? 'dark' : 'plain'" class="error-tag-btn" @click="errorFilter = errorFilter === 'duplicate' ? '' : 'duplicate'">
                重复编码 {{ dupErrors.length ? `(${dupErrors.length})` : '' }}
              </el-tag>
            </div>
            <div class="error-summary-list">
              <div v-for="(err, i) in filteredErrorSummary.slice(0, 30)" :key="i" class="error-item" :class="'error-type-' + err.type">
                <el-tag size="small" :type="err.type === 'required' ? 'danger' : err.type === 'format' ? 'warning' : 'warning'" effect="plain" class="error-type-tag">
                  {{ err.type === 'required' ? '必填' : err.type === 'format' ? '格式' : '重复' }}
                </el-tag>
                第 {{ err.row }} 行，{{ err.field }}：{{ err.message }}
              </div>
              <div v-if="filteredErrorSummary.length > 30" class="error-more">
                ...还有 {{ filteredErrorSummary.length - 30 }} 个错误
              </div>
            </div>
          </div>

          <div v-else class="success-summary-card">
            <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
            <span>数据校验通过，共 {{ previewData.length }} 条记录，可以提交下单</span>
          </div>

          <!-- 操作栏 -->
          <div class="preview-toolbar">
            <div>
              <el-button size="small" @click="addEmptyRow">新增空行</el-button>
              <el-button size="small" type="success" @click="handleExportPreview">导出预览数据</el-button>
              <el-button size="small" type="danger" :disabled="!selectedRows.length" @click="deleteSelectedRows">
                删除选中 ({{ selectedRows.length }})
              </el-button>
            </div>
            <span style="color: #999; font-size: 13px">共 {{ previewData.length }} 条记录</span>
          </div>

          <!-- 预览表格 -->
          <div class="preview-table-wrapper">
            <el-table
              ref="previewTableRef"
              :data="pagedPreviewData"
              border
              stripe
              style="width: 100%"
              size="small"
              :row-class-name="previewRowClass"
              @selection-change="handleSelectionChange"
              max-height="500"
            >
              <el-table-column type="selection" width="40" align="center" />
              <el-table-column type="index" label="#" width="50" align="center" />
              <el-table-column v-for="col in previewColumns" :key="col.key" :prop="col.key" :min-width="col.width">
                <template #header>
                  <span v-if="isRequiredField(col.key)" style="color: #f56c6c; margin-right: 2px">*</span>
                  <span>{{ col.label }}</span>
                </template>
                <template #default="{ row, $index }">
                  <div :class="['editable-cell', { 'has-error': getCellError(row._rowIdx, col.key), 'is-empty': isEmptyCell(row, col.key) && isRequiredField(col.key) }]" @click="startEdit(row, (pagination.page - 1) * pagination.size + $index, col.key)">
                    <div v-if="editingCell.rowIdx === (pagination.page - 1) * pagination.size + $index && editingCell.field === col.key" class="cell-editing" @click.stop>
                      <el-input
                        v-model="editingCell.value"
                        size="small"
                        @blur="confirmEdit(row, col.key)"
                        @keyup="handleEditKeyup($event, row, col.key)"
                        :ref="el => { if (editingCell.rowIdx === (pagination.page - 1) * pagination.size + $index && editingCell.field === col.key) editInputRef = el }"
                      />
                    </div>
                    <div v-else class="cell-display">
                      {{ row[col.key] || '' }}
                      <el-tooltip v-if="getCellError(row._rowIdx, col.key)" :content="getCellError(row._rowIdx, col.key)" placement="top">
                        <el-icon class="cell-error-icon"><Warning /></el-icon>
                      </el-tooltip>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button type="danger" link size="small" @click="deleteRow(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div style="display: flex; justify-content: flex-end; margin-top: 12px">
              <el-pagination
                v-model:current-page="pagination.page"
                v-model:page-size="pagination.size"
                :page-sizes="[20, 50, 100]"
                :total="previewData.length"
                layout="total, sizes, prev, pager, next, jumper"
                background
                small
              />
            </div>
          </div>

          <div class="step-actions">
            <el-button @click="goToStep(1)">上一步</el-button>
            <el-button type="primary" :disabled="errorSummary.length > 0" @click="goToStep(3)">提交下单</el-button>
          </div>
        </div>

        <!-- Step 4: 提交下单 -->
        <div v-if="currentStep === 3" class="step-content">
          <div class="submit-card">
            <div class="submit-info">
              <p>即将提交 <strong>{{ previewData.length }}</strong> 条运单数据</p>
            </div>

            <div v-if="submitting" class="submit-progress">
              <el-progress :percentage="submitProgress" :format="() => `${submitProgress}%`" :stroke-width="20" striped striped-flow />
              <p class="progress-text">正在提交... {{ submitCurrent }} / {{ previewData.length }}</p>
            </div>

            <div v-if="submitResult" class="submit-result">
              <el-result
                :icon="submitResult.failed > 0 ? 'warning' : 'success'"
                :title="submitResult.failed > 0 ? '部分提交成功' : '提交成功'"
              >
                <template #sub-title>
                  <p>成功：<strong style="color: #67c23a">{{ submitResult.success }}</strong> 条</p>
                  <p v-if="submitResult.failed > 0">失败：<strong style="color: #f56c6c">{{ submitResult.failed }}</strong> 条</p>
                  <p v-if="submitResult.errors && submitResult.errors.length" style="margin-top: 12px; text-align: left; color: #f56c6c">
                    <span v-for="(e, i) in submitResult.errors.slice(0, 10)" :key="i">{{ e }}<br /></span>
                    <span v-if="submitResult.errors.length > 10">...还有 {{ submitResult.errors.length - 10 }} 条错误</span>
                  </p>
                </template>
                <template #extra>
                  <el-button type="primary" @click="resetAll">继续导入</el-button>
                  <el-button @click="activeTab = 'history'">查看记录</el-button>
                </template>
              </el-result>
            </div>

            <div v-if="!submitting && !submitResult" class="step-actions">
              <el-button @click="goToStep(2)">上一步</el-button>
              <el-button type="primary" @click="handleSubmitOrders">确认提交</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ===== 导入记录 Tab ===== -->
      <el-tab-pane label="导入记录" name="history">
        <div class="search-bar">
          <el-form :model="historySearch" inline>
            <el-form-item label="外部编码">
              <el-input v-model="historySearch.externalCode" placeholder="外部编码" clearable style="width: 160px" />
            </el-form-item>
            <el-form-item label="收件人">
              <el-input v-model="historySearch.receiverName" placeholder="收件人姓名" clearable style="width: 140px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchHistory">搜索</el-button>
              <el-button @click="resetHistorySearch">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-bar">
          <el-table v-loading="historyLoading" :data="historyData" border stripe style="width: 100%" size="small" empty-text="暂无数据">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="externalCode" label="外部编码" min-width="120" show-overflow-tooltip />
            <el-table-column prop="senderName" label="发件人" min-width="80" show-overflow-tooltip />
            <el-table-column prop="senderPhone" label="发件人电话" min-width="110" show-overflow-tooltip />
            <el-table-column prop="receiverName" label="收件人" min-width="80" show-overflow-tooltip />
            <el-table-column prop="receiverPhone" label="收件人电话" min-width="110" show-overflow-tooltip />
            <el-table-column prop="weight" label="重量(kg)" width="90" align="right">
              <template #default="{ row }">{{ Number(row.weight).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="件数" width="60" align="center" />
            <el-table-column prop="tempZone" label="温层" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.tempZone === '冷藏' ? 'primary' : row.tempZone === '冷冻' ? 'info' : 'success'" size="small">{{ row.tempZone }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="提交时间" min-width="140" show-overflow-tooltip />
          </el-table>

          <div style="display: flex; justify-content: flex-end; margin-top: 12px">
            <el-pagination
              v-model:current-page="historyPagination.page"
              v-model:page-size="historyPagination.size"
              :page-sizes="[10, 20, 50]"
              :total="historyTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              small
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 保存模板对话框 -->
    <el-dialog v-model="saveTemplateDialogVisible" title="保存为模板" width="420px" destroy-on-close>
      <el-form :model="newTemplateForm" label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="newTemplateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveTemplateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useTemplateStore } from '@/stores/template'
import { useOrderStore } from '@/stores/order'
import { api } from '@/utils/request'
import { exportToExcel } from '@/utils/excel'
import { ElMessage } from 'element-plus'
import { UploadFilled, WarningFilled, CircleCheckFilled, Warning } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

const templateStore = useTemplateStore()
const orderStore = useOrderStore()

// ===== 订单字段定义 =====
const orderFields = [
  { key: 'externalCode', label: '外部编码', required: false },
  { key: 'senderName', label: '发件人姓名', required: true },
  { key: 'senderPhone', label: '发件人电话', required: true },
  { key: 'senderAddress', label: '发件人地址', required: true },
  { key: 'receiverName', label: '收件人姓名', required: true },
  { key: 'receiverPhone', label: '收件人电话', required: true },
  { key: 'receiverAddress', label: '收件人地址', required: true },
  { key: 'weight', label: '重量(kg)', required: true },
  { key: 'quantity', label: '件数', required: true },
  { key: 'tempZone', label: '温层', required: true },
  { key: 'remark', label: '备注', required: false }
]

// 字段关键词映射（用于自动匹配，兼容中英文5种模板）
const FIELD_KEYWORDS = {
  externalCode: ['外部编码', '外部单号', '外部订单号', '客户单号', '运单号', '单号', '编码', '快递单号', '物流单号', 'ref code', 'ref', 'order no'],
  senderName: ['发件人', '发件人姓名', '寄件人', '寄件人姓名', '寄方姓名', '发货人', 'sender', 'shipper'],
  senderPhone: ['发件人电话', '发件人手机', '寄件人电话', '寄件人手机', '寄方电话', '寄方手机', '发件电话', '发货电话', 'sender tel', 'sender phone'],
  senderAddress: ['发件人地址', '寄件人地址', '寄方地址', '发件地址', '寄件地址', '始发地', '发货地址', 'sender address', 'sender addr'],
  receiverName: ['收件人', '收件人姓名', '收方姓名', '收货人', 'receiver', 'consignee'],
  receiverPhone: ['收件人电话', '收件人手机', '收方电话', '收方手机', '收件电话', '收货电话', 'receiver tel', 'receiver phone'],
  receiverAddress: ['收件人地址', '收方地址', '收件地址', '目的地', '收货地址', 'receiver address', 'receiver addr'],
  weight: ['重量', '重量kg', '重量(kg)', '重量(kg)', 'kg', '千克', '毛重', 'weight'],
  quantity: ['件数', '数量', '包裹数', '箱数', '板数', 'qty', 'quantity', 'count'],
  tempZone: ['温层', '温度', '温区', '温控', '温层要求', '温度要求', 'temp zone', 'temp', 'temperature'],
  remark: ['备注', '说明', '备注信息', '特殊要求', '附言', 'note', 'remark', 'comment']
}

// ===== Tab & Step 状态 =====
const activeTab = ref('import')
const currentStep = ref(0)

function goToStep(step) {
  if (step === 2) {
    applyMapping()
    validateAllData()
  }
  currentStep.value = step
}

// ===== Step 1: 上传文件 =====
const uploadRef = ref(null)
const fileInfo = ref(null)
const rawHeaders = ref([])
const rawData = ref([])

function handleFileChange(file) {
  if (!file || !file.raw) return
  const f = file.raw

  // 文件格式校验
  const ext = f.name.split('.').pop().toLowerCase()
  if (!['xlsx', 'xls'].includes(ext)) {
    ElMessage.error('不支持的文件格式，请上传 .xlsx 或 .xls 格式的 Excel 文件')
    // 清除上传列表中的无效文件
    nextTick(() => { uploadRef.value?.clearFiles() })
    return
  }

  // 空文件校验
  if (f.size === 0) {
    ElMessage.error('文件为空，请上传包含数据的 Excel 文件')
    nextTick(() => { uploadRef.value?.clearFiles() })
    return
  }

  parseExcelFile(f)
}

function handleFileRemove() {
  fileInfo.value = null
  rawHeaders.value = []
  rawData.value = []
}

function parseExcelFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)

      // 校验文件是否真的是 Excel 格式（xlsx: PK头, xls: D0CF头）
      const header = data.slice(0, 4)
      const isXlsx = header[0] === 0x50 && header[1] === 0x4B // PK
      const isXls = header[0] === 0xD0 && header[1] === 0xCF // OLE
      if (!isXlsx && !isXls) {
        ElMessage.error('文件内容与扩展名不符，请确认是有效的 Excel 文件')
        nextTick(() => { uploadRef.value?.clearFiles() })
        return
      }

      const workbook = XLSX.read(data, { type: 'array' })

      // 无有效 Sheet
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        ElMessage.error('文件中未找到任何工作表，请检查文件是否损坏')
        nextTick(() => { uploadRef.value?.clearFiles() })
        return
      }

      // 智能选择工作表：跳过"填写说明"等非数据 sheet
      const sheetName = selectBestSheet(workbook)
      const sheet = workbook.Sheets[sheetName]

      if (!sheet || !sheet['!ref']) {
        ElMessage.error(`工作表 "${sheetName}" 为空，未找到有效数据`)
        nextTick(() => { uploadRef.value?.clearFiles() })
        return
      }

      // 转为二维数组，用于智能检测表头行
      const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

      if (allRows.length === 0) {
        ElMessage.error('工作表中没有数据行')
        nextTick(() => { uploadRef.value?.clearFiles() })
        return
      }

      // 智能检测表头行位置
      const { headerRowIndex, headers } = detectHeaderRow(allRows)

      if (headerRowIndex === -1 || headers.length === 0) {
        ElMessage.error('未识别到有效的表头行，请检查 Excel 文件格式是否正确')
        nextTick(() => { uploadRef.value?.clearFiles() })
        return
      }

      // 表头行之后的数据行
      const dataRows = allRows.slice(headerRowIndex + 1)

      // 将数据行转为对象（用检测到的表头作为 key）
      const jsonData = dataRows.map(row => {
        const obj = {}
        headers.forEach((h, i) => {
          if (h) { // 跳过空表头列
            obj[h] = row[i] ?? ''
          }
        })
        return obj
      }).filter(row => {
        // 过滤完全空白的行
        return Object.values(row).some(v => v !== '' && v !== undefined && v !== null)
      })

      if (jsonData.length === 0) {
        ElMessage.error('文件中只有表头，没有数据行')
        nextTick(() => { uploadRef.value?.clearFiles() })
        return
      }

      // 仅保留有名称的表头
      const validHeaders = headers.filter(h => h !== '')
      rawHeaders.value = validHeaders
      rawData.value = jsonData

      fileInfo.value = {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        rows: jsonData.length,
        cols: validHeaders.length,
        sheet: sheetName
      }

      // 自动匹配列映射
      autoMatchMapping(validHeaders, jsonData)

      ElMessage.success(`文件解析成功：识别到 ${validHeaders.length} 列、${jsonData.length} 行数据`)
    } catch (err) {
      console.error('解析文件失败:', err)
      if (err.message && err.message.includes('unsupported')) {
        ElMessage.error('不支持的文件格式，请确保文件为有效的 .xlsx 或 .xls')
      } else if (err.message && err.message.includes('password')) {
        ElMessage.error('文件已加密，请移除密码保护后重试')
      } else {
        ElMessage.error('文件解析失败：' + (err.message || '未知错误'))
      }
      nextTick(() => { uploadRef.value?.clearFiles() })
    }
  }
  reader.onerror = () => {
    ElMessage.error('文件读取失败，可能是文件已损坏或编码异常')
    nextTick(() => { uploadRef.value?.clearFiles() })
  }
  reader.readAsArrayBuffer(file)
}

/**
 * 智能选择工作表：优先选择名称含"订单/数据/导入"的 sheet，
 * 跳过"填写说明/使用说明"等纯说明 sheet
 */
function selectBestSheet(workbook) {
  const skipPatterns = ['说明', '填写说明', '使用说明', '备注', 'readme', 'instruction', 'note']
  const preferPatterns = ['订单', '导入', '数据', '批量', 'order', 'import', 'data']

  for (const name of workbook.SheetNames) {
    const lower = name.toLowerCase()
    // 如果名称含偏好关键词且不含跳过关键词，优先选
    if (preferPatterns.some(p => lower.includes(p)) && !skipPatterns.some(p => lower.includes(p))) {
      return name
    }
  }

  // 否则选第一个非说明 sheet
  for (const name of workbook.SheetNames) {
    const lower = name.toLowerCase()
    if (!skipPatterns.some(p => lower.includes(p))) {
      return name
    }
  }

  return workbook.SheetNames[0]
}

/**
 * 智能检测表头行：扫描前10行，找到包含最多已知字段关键词的行作为表头行
 * 兼容：标准单行表头、合并说明行后的表头、分组表头下的子表头、英文表头
 */
function detectHeaderRow(allRows) {
  // 收集所有已知关键词（小写）
  const allKeywords = new Set()
  for (const keywords of Object.values(FIELD_KEYWORDS)) {
    keywords.forEach(kw => allKeywords.add(kw.toLowerCase()))
  }

  let bestRow = -1
  let bestScore = 0

  for (let i = 0; i < Math.min(allRows.length, 10); i++) {
    const row = allRows[i]
    if (!row || row.length === 0) continue

    let score = 0
    for (const cell of row) {
      const cellStr = String(cell || '').trim().toLowerCase()
      if (!cellStr) continue
      for (const kw of allKeywords) {
        if (cellStr.includes(kw) || kw.includes(cellStr)) {
          score++
          break // 每个单元格最多贡献1分
        }
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestRow = i
    }
  }

  // 兜底：如果没匹配到，取第一个非空行
  if (bestRow === -1) {
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i]
      if (row && row.some(cell => String(cell || '').trim() !== '')) {
        bestRow = i
        break
      }
    }
  }

  // 提取表头，保留原始位置以便对齐数据列
  const headerRow = allRows[bestRow] || []
  const headers = headerRow.map(cell => String(cell || '').trim())

  return { headerRowIndex: bestRow, headers }
}

// ===== Step 2: 列映射 =====
const mappingRows = ref([])
const matchedTemplateName = ref('')

function autoMatchMapping(headers, data) {
  mappingRows.value = headers.map((h, i) => {
    const sampleValues = data.slice(0, 3).map(row => row[h]).filter(v => v !== '').join('、')
    return {
      excelHeader: h,
      sampleData: sampleValues || '(空)',
      mappedField: ''
    }
  })

  // 尝试从已保存的模板匹配
  tryMatchTemplate(headers)

  // 关键词自动匹配
  for (const row of mappingRows.value) {
    if (row.mappedField) continue
    row.mappedField = findBestFieldMatch(row.excelHeader)
  }
}

function findBestFieldMatch(header) {
  const h = header.trim().toLowerCase()
  if (!h) return ''

  // 优先精确匹配
  for (const [fieldKey, keywords] of Object.entries(FIELD_KEYWORDS)) {
    for (const kw of keywords) {
      if (h === kw.toLowerCase()) return fieldKey
    }
  }

  // 其次模糊匹配（大小写不敏感）
  let bestField = ''
  let bestScore = 0
  for (const [fieldKey, keywords] of Object.entries(FIELD_KEYWORDS)) {
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase()
      if (h.includes(kwLower) || kwLower.includes(h)) {
        const score = Math.min(h.length, kwLower.length) / Math.max(h.length, kwLower.length)
        if (score > bestScore) {
          bestScore = score
          bestField = fieldKey
        }
      }
    }
  }

  return bestScore >= 0.4 ? bestField : ''
}

async function tryMatchTemplate(headers) {
  try {
    // 先通过关键词映射得到每个 header 对应的字段 key
    const mappedFields = {}
    for (const h of headers) {
      const field = findBestFieldMatch(h)
      if (field) mappedFields[h] = field
    }

    const match = await templateStore.matchTemplate(headers, mappedFields)
    if (match && match.columnMappings) {
      matchedTemplateName.value = match.name
      const mappings = match.columnMappings
      for (const row of mappingRows.value) {
        if (mappings[row.excelHeader]) {
          row.mappedField = mappings[row.excelHeader]
        }
      }
      ElMessage.success(`已自动匹配模板：${match.name}`)
    } else {
      matchedTemplateName.value = ''
    }
  } catch {
    matchedTemplateName.value = ''
  }
}

const hasRequiredMapping = computed(() => {
  const mappedFields = new Set(mappingRows.value.filter(r => r.mappedField).map(r => r.mappedField))
  return orderFields.filter(f => f.required).every(f => mappedFields.has(f.key))
})

// 保存模板
const saveTemplateDialogVisible = ref(false)
const newTemplateForm = reactive({ name: '' })

async function handleSaveTemplate() {
  if (!newTemplateForm.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  const columnMappings = {}
  for (const row of mappingRows.value) {
    if (row.mappedField) {
      columnMappings[row.excelHeader] = row.mappedField
    }
  }
  try {
    await templateStore.addTemplate({
      name: newTemplateForm.name,
      headers: rawHeaders.value,
      columnMappings
    })
    ElMessage.success('模板保存成功')
    saveTemplateDialogVisible.value = false
    newTemplateForm.name = ''
  } catch (err) {
    ElMessage.error('保存失败：' + err.message)
  }
}

// ===== Step 3: 数据预览 =====
const previewData = ref([])
const previewErrors = ref({})  // { rowIdx: { field: 'error msg' } }
const existingCodes = ref([])

const previewColumns = [
  { key: 'externalCode', label: '外部编码', width: 100 },
  { key: 'senderName', label: '发件人', width: 80 },
  { key: 'senderPhone', label: '发件人电话', width: 100 },
  { key: 'senderAddress', label: '发件人地址', width: 130 },
  { key: 'receiverName', label: '收件人', width: 80 },
  { key: 'receiverPhone', label: '收件人电话', width: 100 },
  { key: 'receiverAddress', label: '收件人地址', width: 130 },
  { key: 'weight', label: '重量(kg)', width: 80 },
  { key: 'quantity', label: '件数', width: 60 },
  { key: 'tempZone', label: '温层', width: 60 },
  { key: 'remark', label: '备注', width: 100 }
]

const pagination = reactive({ page: 1, size: 20 })

const pagedPreviewData = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  return previewData.value.slice(start, start + pagination.size).map((row, i) => ({
    ...row,
    _rowIdx: start + i
  }))
})

function applyMapping() {
  const fieldMap = {}
  for (const row of mappingRows.value) {
    if (row.mappedField) {
      fieldMap[row.excelHeader] = row.mappedField
    }
  }

  previewData.value = rawData.value.map((rawRow, idx) => {
    const mapped = { _rowIdx: idx }
    for (const [excelCol, fieldKey] of Object.entries(fieldMap)) {
      mapped[fieldKey] = rawRow[excelCol] ?? ''
    }
    // 确保所有字段都有默认值
    for (const f of orderFields) {
      if (mapped[f.key] === undefined || mapped[f.key] === null) {
        mapped[f.key] = f.key === 'weight' ? 0 : f.key === 'quantity' ? 0 : ''
      }
    }
    return mapped
  })
}

async function validateAllData() {
  previewErrors.value = {}
  const errors = {}

  // 检查数据库中已存在的外部编码
  const codesToCheck = previewData.value
    .map(r => r.externalCode)
    .filter(c => c && String(c).trim() !== '')

  let existing = []
  if (codesToCheck.length > 0) {
    try {
      const res = await api.checkDuplicateCodes(codesToCheck)
      existing = res.data || []
      existingCodes.value = existing
    } catch { existing = [] }
  }

  // 批次内编码重复检测
  const codeCountMap = {}
  for (let i = 0; i < previewData.value.length; i++) {
    const code = previewData.value[i].externalCode
    if (code && String(code).trim() !== '') {
      const normalizedCode = String(code).trim()
      if (!codeCountMap[normalizedCode]) codeCountMap[normalizedCode] = []
      codeCountMap[normalizedCode].push(i)
    }
  }

  for (let i = 0; i < previewData.value.length; i++) {
    const row = previewData.value[i]
    const rowErrors = {}

    // ===== 必填校验 =====
    // 发件人信息
    if (!row.senderName || !String(row.senderName).trim()) rowErrors.senderName = '发件人姓名不能为空'
    if (!row.senderPhone || !String(row.senderPhone).trim()) rowErrors.senderPhone = '发件人电话不能为空'
    if (!row.senderAddress || !String(row.senderAddress).trim()) rowErrors.senderAddress = '发件人地址不能为空'
    // 收件人信息
    if (!row.receiverName || !String(row.receiverName).trim()) rowErrors.receiverName = '收件人姓名不能为空'
    if (!row.receiverPhone || !String(row.receiverPhone).trim()) rowErrors.receiverPhone = '收件人电话不能为空'
    if (!row.receiverAddress || !String(row.receiverAddress).trim()) rowErrors.receiverAddress = '收件人地址不能为空'
    // 货物信息
    if (!row.weight || String(row.weight).trim() === '') rowErrors.weight = '重量不能为空'
    if (!row.quantity || String(row.quantity).trim() === '') rowErrors.quantity = '件数不能为空'
    if (!row.tempZone || !String(row.tempZone).trim()) rowErrors.tempZone = '温层不能为空'

    // ===== 格式校验（仅当字段有值时校验） =====
    // 电话格式校验（手机号1开头11位）
    const phoneReg = /^1[3-9]\d{9}$/
    if (row.senderPhone && String(row.senderPhone).trim() && !rowErrors.senderPhone) {
      const phone = String(row.senderPhone).replace(/[-\s]/g, '')
      if (!phoneReg.test(phone)) rowErrors.senderPhone = '发件人电话格式错误，需为11位手机号'
    }
    if (row.receiverPhone && String(row.receiverPhone).trim() && !rowErrors.receiverPhone) {
      const phone = String(row.receiverPhone).replace(/[-\s]/g, '')
      if (!phoneReg.test(phone)) rowErrors.receiverPhone = '收件人电话格式错误，需为11位手机号'
    }

    // 重量必须为正数
    if (row.weight && String(row.weight).trim() && !rowErrors.weight) {
      const w = Number(row.weight)
      if (isNaN(w)) rowErrors.weight = '重量必须为数字'
      else if (w <= 0) rowErrors.weight = '重量必须为正数'
    }

    // 件数必须为正整数
    if (row.quantity && String(row.quantity).trim() && !rowErrors.quantity) {
      const q = Number(row.quantity)
      if (isNaN(q)) rowErrors.quantity = '件数必须为数字'
      else if (q <= 0) rowErrors.quantity = '件数必须为正整数'
      else if (!Number.isInteger(q)) rowErrors.quantity = '件数必须为整数，不能有小数'
    }

    // 温层可选值范围
    if (row.tempZone && String(row.tempZone).trim() && !rowErrors.tempZone) {
      const tz = String(row.tempZone).trim()
      if (!['常温', '冷藏', '冷冻'].includes(tz)) {
        rowErrors.tempZone = `温层值"${tz}"无效，只能为常温、冷藏、冷冻`
      }
    }

    // ===== 重复检测 =====
    if (row.externalCode && String(row.externalCode).trim()) {
      const code = String(row.externalCode).trim()
      if (existing.includes(code)) {
        rowErrors.externalCode = '该外部编码已存在于系统中'
      }
      if (codeCountMap[code] && codeCountMap[code].length > 1) {
        const dupRows = codeCountMap[code].filter(r => r !== i).map(r => r + 1)
        rowErrors.externalCode = `与本批次第 ${dupRows.join('、')} 行重复`
      }
    }

    if (Object.keys(rowErrors).length > 0) {
      errors[i] = rowErrors
    }
  }

  previewErrors.value = errors
}

const errorFilter = ref('')

const errorSummary = computed(() => {
  const summary = []
  // 必填字段列表
  const requiredKeys = new Set(orderFields.filter(f => f.required).map(f => f.key))
  // 格式校验字段
  const formatKeys = new Set(['senderPhone', 'receiverPhone', 'weight', 'quantity', 'tempZone'])

  for (const [rowIdx, fieldErrors] of Object.entries(previewErrors.value)) {
    for (const [field, msg] of Object.entries(fieldErrors)) {
      const fieldLabel = orderFields.find(f => f.key === field)?.label || field
      let type = 'duplicate' // 默认重复类
      if (requiredKeys.has(field) && msg.includes('不能为空')) {
        type = 'required'
      } else if (formatKeys.has(field) || field === 'externalCode') {
        type = 'format'
      }
      summary.push({ row: Number(rowIdx) + 1, field: fieldLabel, message: msg, type })
    }
  }
  return summary
})

const requiredErrors = computed(() => errorSummary.value.filter(e => e.type === 'required'))
const formatErrors = computed(() => errorSummary.value.filter(e => e.type === 'format'))
const dupErrors = computed(() => errorSummary.value.filter(e => e.type === 'duplicate'))
const errorRowCount = computed(() => new Set(errorSummary.value.map(e => e.row)).size)

const filteredErrorSummary = computed(() => {
  if (!errorFilter.value) return errorSummary.value
  return errorSummary.value.filter(e => e.type === errorFilter.value)
})

function getCellError(rowIdx, field) {
  return previewErrors.value[rowIdx]?.[field] || ''
}

/**
 * 即时校验单行数据（编辑后立即调用，快速反馈）
 */
function validateRow(rowIdx) {
  const row = previewData.value[rowIdx]
  if (!row) return

  const rowErrors = {}

  // ===== 必填校验 =====
  if (!row.senderName || !String(row.senderName).trim()) rowErrors.senderName = '发件人姓名不能为空'
  if (!row.senderPhone || !String(row.senderPhone).trim()) rowErrors.senderPhone = '发件人电话不能为空'
  if (!row.senderAddress || !String(row.senderAddress).trim()) rowErrors.senderAddress = '发件人地址不能为空'
  if (!row.receiverName || !String(row.receiverName).trim()) rowErrors.receiverName = '收件人姓名不能为空'
  if (!row.receiverPhone || !String(row.receiverPhone).trim()) rowErrors.receiverPhone = '收件人电话不能为空'
  if (!row.receiverAddress || !String(row.receiverAddress).trim()) rowErrors.receiverAddress = '收件人地址不能为空'
  if (!row.weight || String(row.weight).trim() === '') rowErrors.weight = '重量不能为空'
  if (!row.quantity || String(row.quantity).trim() === '') rowErrors.quantity = '件数不能为空'
  if (!row.tempZone || !String(row.tempZone).trim()) rowErrors.tempZone = '温层不能为空'

  // ===== 格式校验 =====
  const phoneReg = /^1[3-9]\d{9}$/
  if (row.senderPhone && String(row.senderPhone).trim() && !rowErrors.senderPhone) {
    const phone = String(row.senderPhone).replace(/[-\s]/g, '')
    if (!phoneReg.test(phone)) rowErrors.senderPhone = '发件人电话格式错误，需为11位手机号'
  }
  if (row.receiverPhone && String(row.receiverPhone).trim() && !rowErrors.receiverPhone) {
    const phone = String(row.receiverPhone).replace(/[-\s]/g, '')
    if (!phoneReg.test(phone)) rowErrors.receiverPhone = '收件人电话格式错误，需为11位手机号'
  }
  if (row.weight && String(row.weight).trim() && !rowErrors.weight) {
    const w = Number(row.weight)
    if (isNaN(w)) rowErrors.weight = '重量必须为数字'
    else if (w <= 0) rowErrors.weight = '重量必须为正数'
  }
  if (row.quantity && String(row.quantity).trim() && !rowErrors.quantity) {
    const q = Number(row.quantity)
    if (isNaN(q)) rowErrors.quantity = '件数必须为数字'
    else if (q <= 0) rowErrors.quantity = '件数必须为正整数'
    else if (!Number.isInteger(q)) rowErrors.quantity = '件数必须为整数，不能有小数'
  }
  if (row.tempZone && String(row.tempZone).trim() && !rowErrors.tempZone) {
    const tz = String(row.tempZone).trim()
    if (!['常温', '冷藏', '冷冻'].includes(tz)) {
      rowErrors.tempZone = `温层值"${tz}"无效，只能为常温、冷藏、冷冻`
    }
  }

  // 更新该行的错误（保留其他行不变）
  const newErrors = { ...previewErrors.value }
  if (Object.keys(rowErrors).length > 0) {
    newErrors[rowIdx] = rowErrors
  } else {
    delete newErrors[rowIdx]
  }
  previewErrors.value = newErrors
}

function isRequiredField(key) {
  return orderFields.some(f => f.key === key && f.required)
}

function isEmptyCell(row, key) {
  const val = row[key]
  return val === '' || val === undefined || val === null || (typeof val === 'string' && !val.trim())
}

function previewRowClass({ row }) {
  return previewErrors.value[row._rowIdx] ? 'row-has-error' : ''
}

// 行内编辑
const editingCell = reactive({ rowIdx: -1, field: '', value: '' })
const editInputRef = ref(null)
const selectedRows = ref([])

function startEdit(row, rowIdx, field) {
  // 已在编辑同一单元格，不重复触发
  if (editingCell.rowIdx === rowIdx && editingCell.field === field) return
  // 先保存之前正在编辑的单元格
  if (editingCell.rowIdx >= 0 && editingCell.field) {
    doConfirmEdit()
  }
  editingCell.rowIdx = rowIdx
  editingCell.field = field
  editingCell.value = row[field] ?? ''
  nextTick(() => {
    editInputRef?.value?.focus?.()
  })
}

function doConfirmEdit() {
  if (editingCell.rowIdx < 0 || !editingCell.field) return
  const rowIdx = editingCell.rowIdx
  const field = editingCell.field
  previewData.value[rowIdx][field] = editingCell.value
  // 即时校验当前行
  validateRow(rowIdx)
  editingCell.rowIdx = -1
  editingCell.field = ''
}

function confirmEdit(row, field) {
  doConfirmEdit()
}

function cancelEdit() {
  editingCell.rowIdx = -1
  editingCell.field = ''
}

function handleEditKeyup(e, row, field) {
  if (e.key === 'Escape') {
    cancelEdit()
    e.preventDefault()
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    // 回车：移到下一行同列
    moveToCell(1, 0)
    return
  }
  if (e.key === 'Tab') {
    e.preventDefault()
    if (e.shiftKey) {
      // Shift+Tab：移到前一列同行
      moveToCell(0, -1)
    } else {
      // Tab：移到下一列同行
      moveToCell(0, 1)
    }
    return
  }
}

/**
 * 移动到相对偏移的单元格
 * @param rowDelta 行偏移 (1=下一行, -1=上一行)
 * @param colDelta 列偏移 (1=下一列, -1=上一列)
 */
function moveToCell(rowDelta, colDelta) {
  if (editingCell.rowIdx < 0) return

  // 先保存当前编辑
  doConfirmEdit()

  const currentRowIdx = editingCell.rowIdx
  const currentField = editingCell.field
  const colKeys = previewColumns.map(c => c.key)
  const colIdx = colKeys.indexOf(currentField)

  let newRowIdx = currentRowIdx + rowDelta
  let newColIdx = colIdx + colDelta

  // 列越界时换行
  if (newColIdx >= colKeys.length) {
    newColIdx = 0
    newRowIdx++
  } else if (newColIdx < 0) {
    newColIdx = colKeys.length - 1
    newRowIdx--
  }

  // 行越界检查
  if (newRowIdx < 0 || newRowIdx >= previewData.value.length) return

  const newField = colKeys[newColIdx]
  const newRow = previewData.value[newRowIdx]

  editingCell.rowIdx = newRowIdx
  editingCell.field = newField
  editingCell.value = newRow[newField] ?? ''
  nextTick(() => {
    editInputRef?.value?.focus?.()
  })
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function addEmptyRow() {
  previewData.value.push({
    _rowIdx: previewData.value.length,
    externalCode: '', senderName: '', senderPhone: '', senderAddress: '',
    receiverName: '', receiverPhone: '', receiverAddress: '',
    weight: 0, quantity: 0, tempZone: '常温', remark: ''
  })
}

function deleteRow(row) {
  const idx = previewData.value.findIndex(r => r._rowIdx === row._rowIdx)
  if (idx !== -1) {
    previewData.value.splice(idx, 1)
    validateAllData()
  }
}

function deleteSelectedRows() {
  const idxSet = new Set(selectedRows.value.map(r => r._rowIdx))
  previewData.value = previewData.value.filter(r => !idxSet.has(r._rowIdx))
  selectedRows.value = []
  validateAllData()
}

function handleExportPreview() {
  const exportData = previewData.value.map(row => {
    const obj = {}
    for (const f of orderFields) {
      obj[f.label] = row[f.key] ?? ''
    }
    return obj
  })
  const columns = orderFields.map(f => ({ prop: f.key, label: f.label }))
  exportToExcel(exportData, columns, '预览数据')
  ElMessage.success('导出成功')
}

// ===== Step 4: 提交下单 =====
const submitting = ref(false)
const submitProgress = ref(0)
const submitCurrent = ref(0)
const submitResult = ref(null)

async function handleSubmitOrders() {
  submitting.value = true
  submitProgress.value = 0
  submitCurrent.value = 0
  submitResult.value = null

  let success = 0
  let failed = 0
  const errors = []
  const batchSize = 50
  const total = previewData.value.length

  for (let i = 0; i < total; i += batchSize) {
    const batch = previewData.value.slice(i, i + batchSize)
    const orders = batch.map(row => ({
      externalCode: row.externalCode || '',
      senderName: row.senderName,
      senderPhone: row.senderPhone,
      senderAddress: row.senderAddress,
      receiverName: row.receiverName,
      receiverPhone: row.receiverPhone,
      receiverAddress: row.receiverAddress,
      weight: Number(row.weight),
      quantity: Number(row.quantity),
      tempZone: row.tempZone,
      remark: row.remark || ''
    }))

    try {
      await api.importOrders(orders)
      success += orders.length
    } catch (err) {
      failed += orders.length
      errors.push(`第 ${i + 1}-${Math.min(i + batchSize, total)} 行提交失败：${err.message}`)
    }

    submitCurrent.value = Math.min(i + batchSize, total)
    submitProgress.value = Math.round((submitCurrent.value / total) * 100)
  }

  submitting.value = false
  submitResult.value = { success, failed, errors }
}

function resetAll() {
  currentStep.value = 0
  fileInfo.value = null
  rawHeaders.value = []
  rawData.value = []
  mappingRows.value = []
  previewData.value = []
  previewErrors.value = {}
  matchedTemplateName.value = ''
  submitting.value = false
  submitProgress.value = 0
  submitCurrent.value = 0
  submitResult.value = null
  existingCodes.value = []
  errorFilter.value = ''
}

// ===== 导入记录 Tab =====
const historySearch = reactive({ externalCode: '', receiverName: '' })
const historyData = ref([])
const historyLoading = ref(false)
const historyTotal = ref(0)
const historyPagination = reactive({ page: 1, size: 10 })

async function fetchHistory() {
  historyLoading.value = true
  try {
    if (historySearch.externalCode || historySearch.receiverName) {
      // 使用现有接口搜索
    }
    await orderStore.fetchOrders({
      senderName: '',
      receiverName: historySearch.receiverName,
      tempZone: ''
    })
    let data = [...orderStore.orders]
    if (historySearch.externalCode) {
      data = data.filter(o => o.externalCode && o.externalCode.includes(historySearch.externalCode))
    }
    historyTotal.value = data.length
    const start = (historyPagination.page - 1) * historyPagination.size
    historyData.value = data.slice(start, start + historyPagination.size)
  } catch (err) {
    ElMessage.error('获取记录失败')
  } finally {
    historyLoading.value = false
  }
}

function resetHistorySearch() {
  historySearch.externalCode = ''
  historySearch.receiverName = ''
  historyPagination.page = 1
  fetchHistory()
}

onMounted(() => {
  templateStore.fetchTemplates()
  fetchHistory()
})
</script>

<style scoped>
.step-content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 上传区域 */
.upload-area {
  max-width: 600px;
  margin: 0 auto;
}

.excel-uploader :deep(.el-upload-dragger) {
  padding: 40px 20px;
}

.file-info-card {
  margin-top: 16px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* 列映射 */
.mapping-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mapping-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.mapping-table-wrapper {
  max-height: 400px;
  overflow-y: auto;
}

.sample-data {
  color: #999;
  font-size: 12px;
}

/* 数据预览 */
.error-summary-card {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.error-summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #f56c6c;
  margin-bottom: 10px;
}

.error-category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.error-tag-btn {
  cursor: pointer;
  transition: transform 0.15s;
}

.error-tag-btn:hover {
  transform: scale(1.05);
}

.error-summary-list {
  max-height: 120px;
  overflow-y: auto;
}

.error-item {
  font-size: 13px;
  color: #606266;
  line-height: 2;
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-type-tag {
  flex-shrink: 0;
  font-size: 11px;
}

.error-item.error-type-required {
  color: #f56c6c;
}

.error-item.error-type-format {
  color: #e6a23c;
}

.error-item.error-type-duplicate {
  color: #e6a23c;
}

.error-more {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
}

.success-summary-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: #67c23a;
  font-weight: 500;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-table-wrapper {
  overflow-x: auto;
}

.editable-cell {
  position: relative;
  min-height: 28px;
  cursor: text;
}

.editable-cell:hover .cell-display {
  background: #ecf5ff;
  outline: 1px solid #b3d8ff;
}

.editable-cell.has-error .cell-display {
  color: #f56c6c;
  background: #fef0f0;
  border-radius: 2px;
}

.editable-cell.has-error:hover .cell-display {
  background: #fef0f0;
  outline: 1px solid #fab6b6;
}

.editable-cell.is-empty .cell-display {
  background: #fff5f5;
  border: 1px dashed #fab6b6;
  border-radius: 2px;
  min-height: 22px;
}

.cell-display {
  padding: 2px 4px;
  cursor: pointer;
  border-radius: 2px;
  min-height: 24px;
  line-height: 24px;
}

.cell-display:hover {
  background: #f5f7fa;
}

.cell-editing {
  padding: 0;
}

.cell-editing :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #409eff inset;
  border-radius: 2px;
}

.cell-editing :deep(.el-input__inner) {
  padding: 0 6px;
  font-size: 13px;
  line-height: 26px;
}

.cell-error-icon {
  color: #f56c6c;
  margin-left: 4px;
  vertical-align: middle;
  cursor: pointer;
}

:deep(.row-has-error) {
  --el-table-tr-bg-color: #fff5f5;
}

:deep(.row-has-error:hover > td.el-table__cell) {
  --el-table-tr-bg-color: #fff0f0 !important;
}

/* 提交 */
.submit-card {
  text-align: center;
  padding: 20px;
}

.submit-info {
  font-size: 16px;
  margin-bottom: 20px;
}

.submit-progress {
  max-width: 500px;
  margin: 0 auto 20px;
}

.progress-text {
  margin-top: 8px;
  color: #999;
  font-size: 14px;
}

.submit-result {
  margin-top: 20px;
}

/* Tab 样式 */
.main-tabs :deep(.el-tabs__content) {
  padding: 0;
}
</style>
