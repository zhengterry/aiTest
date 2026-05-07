<template>
  <div class="login-page">
    <!-- 语言切换 -->
    <div class="lang-switch">
      <span class="lang-item active">文</span>
      <span class="lang-divider">/</span>
      <span class="lang-item">A</span>
    </div>

    <div class="login-content">
      <!-- 左侧品牌区 -->
      <div class="brand-side">
        <div class="brand-info">
          <div class="brand-logo">
            <svg viewBox="0 0 48 48" width="48" height="48">
              <rect x="4" y="4" width="40" height="40" rx="8" fill="#00B894" />
              <path d="M14 24 L22 16 L22 22 L34 22 L34 26 L22 26 L22 32 Z" fill="#fff" transform="rotate(180 24 24)" />
              <path d="M14 24 L22 16 L22 22 L34 22 L34 26 L22 26 L22 32 Z" fill="#fff" opacity="0.5" transform="rotate(180 24 24) scale(0.6) translate(8,8)" />
            </svg>
            <div class="brand-name">
              <span class="brand-cn">中通冷链</span>
              <span class="brand-en">ZTO COLD CHAIN</span>
            </div>
          </div>
          <div class="system-title">仓储管理系统</div>
          <div class="brand-slogan">用冷链为人民服务</div>
        </div>
        <!-- 等距风格插画 -->
        <div class="brand-illustration">
          <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- 云 -->
            <g class="cloud cloud-1">
              <ellipse cx="80" cy="60" rx="40" ry="22" fill="#E0F5EF" />
              <ellipse cx="65" cy="70" rx="25" ry="14" fill="#E0F5EF" />
              <ellipse cx="95" cy="70" rx="28" ry="16" fill="#E0F5EF" />
            </g>
            <g class="cloud cloud-2">
              <ellipse cx="400" cy="45" rx="35" ry="18" fill="#E0F5EF" />
              <ellipse cx="385" cy="55" rx="22" ry="12" fill="#E0F5EF" />
              <ellipse cx="415" cy="55" rx="24" ry="14" fill="#E0F5EF" />
            </g>
            <!-- 服务器 -->
            <g transform="translate(160, 80)">
              <rect x="0" y="0" width="60" height="80" rx="4" fill="#00B894" opacity="0.9" />
              <rect x="8" y="10" width="44" height="6" rx="2" fill="#fff" opacity="0.5" />
              <rect x="8" y="22" width="44" height="6" rx="2" fill="#fff" opacity="0.5" />
              <rect x="8" y="34" width="44" height="6" rx="2" fill="#fff" opacity="0.5" />
              <circle cx="46" cy="13" r="2" fill="#00E6A7" />
              <circle cx="46" cy="25" r="2" fill="#00E6A7" />
              <circle cx="46" cy="37" r="2" fill="#FFD93D" />
              <rect x="8" y="50" width="44" height="6" rx="2" fill="#fff" opacity="0.3" />
              <rect x="8" y="62" width="44" height="6" rx="2" fill="#fff" opacity="0.3" />
            </g>
            <!-- 仓储货架 -->
            <g transform="translate(280, 60)">
              <!-- 货架主体 -->
              <rect x="0" y="40" width="100" height="100" rx="2" fill="#00B894" opacity="0.15" />
              <!-- 货架层 -->
              <rect x="5" y="45" width="90" height="3" fill="#00B894" opacity="0.5" />
              <rect x="5" y="72" width="90" height="3" fill="#00B894" opacity="0.5" />
              <rect x="5" y="99" width="90" height="3" fill="#00B894" opacity="0.5" />
              <rect x="5" y="126" width="90" height="3" fill="#00B894" opacity="0.5" />
              <!-- 货物 -->
              <rect x="10" y="48" width="18" height="22" rx="2" fill="#00B894" opacity="0.4" />
              <rect x="32" y="53" width="14" height="17" rx="2" fill="#00B894" opacity="0.3" />
              <rect x="50" y="48" width="20" height="22" rx="2" fill="#00B894" opacity="0.35" />
              <rect x="12" y="75" width="22" height="22" rx="2" fill="#00B894" opacity="0.35" />
              <rect x="40" y="78" width="16" height="19" rx="2" fill="#00B894" opacity="0.3" />
              <rect x="62" y="75" width="18" height="22" rx="2" fill="#00B894" opacity="0.4" />
              <rect x="10" y="102" width="16" height="22" rx="2" fill="#00B894" opacity="0.3" />
              <rect x="30" y="105" width="20" height="19" rx="2" fill="#00B894" opacity="0.35" />
              <rect x="55" y="102" width="22" height="22" rx="2" fill="#00B894" opacity="0.3" />
              <!-- 支柱 -->
              <rect x="5" y="40" width="3" height="100" fill="#00B894" opacity="0.6" />
              <rect x="92" y="40" width="3" height="100" fill="#00B894" opacity="0.6" />
            </g>
            <!-- 数据连线 -->
            <g class="data-lines">
              <line x1="220" y1="130" x2="280" y2="110" stroke="#00B894" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.6">
                <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2s" repeatCount="indefinite" />
              </line>
              <line x1="220" y1="140" x2="280" y2="150" stroke="#00B894" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.6">
                <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2.5s" repeatCount="indefinite" />
              </line>
              <line x1="190" y1="160" x2="190" y2="220" stroke="#00B894" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4">
                <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.8s" repeatCount="indefinite" />
              </line>
              <line x1="330" y1="160" x2="330" y2="220" stroke="#00B894" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4">
                <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2.2s" repeatCount="indefinite" />
              </line>
            </g>
            <!-- 底部平台 -->
            <g>
              <polygon points="100,260 380,260 340,290 60,290" fill="#00B894" opacity="0.08" />
              <polygon points="100,260 380,260 360,270 80,270" fill="#00B894" opacity="0.12" />
            </g>
            <!-- 数据节点 -->
            <circle cx="190" cy="230" r="4" fill="#00B894" opacity="0.6">
              <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="330" cy="230" r="4" fill="#00B894" opacity="0.6">
              <animate attributeName="r" values="4;6;4" dur="2.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="260" cy="250" r="3" fill="#00B894" opacity="0.4">
              <animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </div>

      <!-- 右侧登录表单区 -->
      <div class="form-side">
        <div class="form-card">
          <div class="form-header">
            <div class="login-title">欢迎登录</div>
            <div class="login-subtitle">万能导入 · 多模板自动导入下单系统</div>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            size="large"
            @keyup.enter="handleLogin"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入手机号"
                :prefix-icon="UserIcon"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="LockIcon"
                show-password
              />
            </el-form-item>
            <div class="form-extra">
              <a class="forgot-link" href="javascript:void(0)">忘记密码？</a>
            </div>
            <el-form-item>
              <el-button
                class="login-btn"
                type="primary"
                :loading="loading"
                @click="handleLogin"
              >
                立即登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const UserIcon = markRaw(User)
const LockIcon = markRaw(Lock)

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({ username: '', password: '' })

const rules = {
  username: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  const result = await userStore.login(form.username, form.password)
  loading.value = false

  if (result.success) {
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } else {
    ElMessage.error(result.message)
  }
}
</script>

<style scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f4f0 50%, #f0f5ff 100%);
  background-image:
    linear-gradient(135deg, #f5f7fa 0%, #e8f4f0 50%, #f0f5ff 100%),
    linear-gradient(rgba(0, 184, 148, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 184, 148, 0.03) 1px, transparent 1px);
  background-size: 100% 100%, 40px 40px, 40px 40px;
  position: relative;
  overflow: hidden;
}

/* 语言切换 */
.lang-switch {
  position: absolute;
  top: 24px;
  right: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  z-index: 10;
}
.lang-item {
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
  padding: 2px 4px;
}
.lang-item.active {
  color: #00B894;
  font-weight: 600;
}
.lang-item:hover {
  color: #00B894;
}
.lang-divider {
  color: #ddd;
  margin: 0 2px;
}

/* 主内容区 */
.login-content {
  display: flex;
  flex-direction: row;
  width: 960px;
  max-width: 95vw;
  min-height: 540px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
}

/* 左侧品牌区 */
.brand-side {
  flex: 1 1 55%;
  background: linear-gradient(160deg, #00B894 0%, #00a884 100%);
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.brand-side::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 30px 30px;
}

.brand-info {
  position: relative;
  z-index: 1;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.brand-name {
  display: flex;
  flex-direction: column;
}

.brand-cn {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2px;
}

.brand-en {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1px;
  margin-top: 2px;
}

.system-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.brand-slogan {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 2px;
}

.brand-illustration {
  position: relative;
  z-index: 1;
  max-width: 400px;
  margin: 0 auto;
}

.brand-illustration svg {
  width: 100%;
  height: auto;
}

.cloud-1 {
  animation: float 6s ease-in-out infinite;
}

.cloud-2 {
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* 右侧登录表单区 */
.form-side {
  flex: 1 1 45%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}

.form-card {
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
}

.form-header {
  margin-bottom: 32px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 13px;
  color: #999;
}

/* 表单样式 */
.login-form {
  width: 100%;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 4px 12px;
  box-shadow: 0 0 0 1px #e4e7ed;
  transition: box-shadow 0.3s;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #00B894 !important;
}

.login-form :deep(.el-input__prefix .el-icon) {
  color: #999;
  font-size: 18px;
}

.login-form :deep(.el-input__wrapper.is-focus .el-input__prefix .el-icon) {
  color: #00B894;
}

/* 辅助链接 */
.form-extra {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.forgot-link {
  font-size: 13px;
  color: #00B894;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.3s;
}

.forgot-link:hover {
  opacity: 0.8;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  background: #00B894;
  border-color: #00B894;
  transition: background 0.3s;
}

.login-btn:hover {
  background: #00a884 !important;
  border-color: #00a884 !important;
}

.login-btn:active {
  background: #009874 !important;
  border-color: #009874 !important;
}

/* Element Plus 主色覆盖 */
:deep(.el-button--primary) {
  --el-button-bg-color: #00B894;
  --el-button-border-color: #00B894;
  --el-button-hover-bg-color: #00a884;
  --el-button-hover-border-color: #00a884;
  --el-button-active-bg-color: #009874;
  --el-button-active-border-color: #009874;
}

/* 响应式 */
@media (max-width: 768px) {
  .login-content {
    flex-direction: column;
    min-height: auto;
  }

  .brand-side {
    flex: none;
    padding: 32px 24px;
  }

  .brand-illustration {
    display: none;
  }

  .system-title {
    font-size: 22px;
  }

  .form-side {
    padding: 32px 24px;
  }

  .lang-switch {
    top: 12px;
    right: 16px;
  }
}
</style>
