<template>
  <div class="layout-container">
    <div class="layout-header">
      <div class="header-left">
        <span class="header-icon"></span>
        <span>物流下单系统-导入</span>
      </div>
    </div>
    <div class="layout-body">
      <div class="layout-aside">
        <el-menu :default-active="route.path" router>
          <el-menu-item index="/order">
            <el-icon><Van /></el-icon>
            <span>物流订单</span>
          </el-menu-item>
          <el-menu-item index="/template">
            <el-icon><Document /></el-icon>
            <span>模板管理</span>
          </el-menu-item>
        </el-menu>
      </div>
      <div class="layout-main">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { Van, Document } from '@element-plus/icons-vue'

const route = useRoute()
</script>
