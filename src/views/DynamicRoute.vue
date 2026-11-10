<template>
  <component v-if="resolvedComponent" :is="resolvedComponent" />

  <div v-else-if="state.loading" class="page-fallback">
    <div class="fallback-card">
      <p class="fallback-title">菜单加载中...</p>
      <p class="fallback-desc">正在获取当前用户的菜单配置，请稍候。</p>
    </div>
  </div>

  <div v-else class="page-fallback">
    <div class="fallback-card">
      <p class="fallback-code">404</p>
      <template v-if="currentMenu">
        <p class="fallback-title">页面组件未接入</p>
        <p class="fallback-desc">
          菜单「{{ currentMenu.name }}」已配置，但组件
          <code>{{ currentMenu.component || '（未填写组件路径）' }}</code>
          尚未在主应用中注册。
        </p>
      </template>
      <template v-else>
        <p class="fallback-title">页面不存在</p>
        <p class="fallback-desc">
          当前地址 <code>{{ route.path }}</code> 未匹配到任何菜单。
        </p>
      </template>
      <button class="btn primary" @click="goMenuSettings">返回菜单设置</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MenuSettings from './system/MenuSettings.vue'
import { useMenuStore } from '../store/menu'
import { findMenuByPath } from '../utils/tree'

const route = useRoute()
const router = useRouter()
const { state, allMenus } = useMenuStore()

const componentRegistry = {
  'system/menu': MenuSettings
}

const currentMenu = computed(() => findMenuByPath(allMenus.value, route.path))
const resolvedComponent = computed(() => {
  const menu = currentMenu.value
  if (!menu || menu.microApp || menu.status !== 1 || menu.visible !== 1) return null
  return componentRegistry[menu.component] || null
})

function goMenuSettings() {
  router.push('/system/menu')
}
</script>

<style scoped>
.page-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.fallback-card {
  max-width: 520px;
  padding: 36px 40px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 21, 41, 0.08);
  text-align: center;
}

.fallback-code {
  margin: 0 0 8px;
  font-size: 40px;
  font-weight: 700;
  color: #dbe6f5;
  letter-spacing: 2px;
}

.fallback-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.fallback-desc {
  margin: 0 0 22px;
  font-size: 13px;
  line-height: 1.7;
  color: #5b6b7f;
}

.fallback-desc code {
  padding: 1px 6px;
  border-radius: 4px;
  background: #f0f3f8;
  color: #1677ff;
}

.btn {
  padding: 8px 18px;
  border: 1px solid #d5dce6;
  border-radius: 6px;
  background: #ffffff;
  font-size: 13px;
  cursor: pointer;
}

.btn.primary {
  border-color: #1677ff;
  background: #1677ff;
  color: #ffffff;
}
</style>
