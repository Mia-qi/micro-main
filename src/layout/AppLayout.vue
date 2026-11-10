<template>
  <div class="app-shell" :class="{ 'is-fullscreen': isFullscreen }">
    <aside v-if="!isFullscreen" class="sidebar">
      <div class="logo">
        <div class="logo-mark">Q</div>
        <div class="logo-text">
          <span class="logo-title">Qiankun 平台</span>
          <span class="logo-sub">Micro Frontend</span>
        </div>
      </div>
      <div class="menu-scroll">
        <div v-if="state.loading && !state.loaded" class="menu-loading">菜单加载中...</div>
        <div v-else-if="state.error" class="menu-loading">{{ state.error }}</div>
        <div v-else-if="!sidebarTree.length" class="menu-loading">暂无可用菜单</div>
        <SidebarMenu v-else :menus="sidebarTree" :active-path="route.path" @select="handleSelect" />
      </div>
      <div class="sidebar-footer">菜单由主应用统一维护</div>
    </aside>

    <div class="main-area">
      <header v-if="!isFullscreen" class="topbar">
        <div class="breadcrumb">
          <template v-if="breadcrumbs.length">
            <template v-for="(item, index) in breadcrumbs" :key="item.id">
              <span class="crumb" :class="{ current: index === breadcrumbs.length - 1 }">
                {{ item.name }}
              </span>
              <span v-if="index < breadcrumbs.length - 1" class="crumb-sep">/</span>
            </template>
          </template>
          <span v-else class="crumb current">{{ route.path }}</span>
        </div>
        <div class="topbar-right">
          <span class="env-tag">开发环境</span>
          <div class="user-info">
            <span class="avatar">管</span>
            <span class="user-name">管理员</span>
          </div>
        </div>
      </header>

      <main class="content" :class="{ 'has-micro': isMicroMenu }">
        <div v-show="isMicroMenu" class="micro-view">
          <div id="sub-container" class="micro-container"></div>

          <div v-if="microLoading" class="micro-mask">
            <div class="spinner"></div>
            <p>微应用加载中...</p>
          </div>

          <div v-if="microError" class="micro-mask is-error">
            <p class="error-title">微应用加载失败</p>
            <p class="error-desc">{{ microError }}</p>
            <p class="error-entry">入口地址：{{ currentMenu ? entryOf(currentMenu.microApp) : '' }}</p>
            <div class="error-actions">
              <button class="btn primary" @click="retryMicroApp">重新加载</button>
              <button class="btn" @click="backToSystem">返回系统</button>
            </div>
          </div>

          <div v-if="menuUnavailable" class="micro-mask is-error">
            <p class="error-title">菜单不可用</p>
            <p class="error-desc">当前菜单已禁用或隐藏，请联系管理员。</p>
            <button class="btn primary" @click="backToSystem">返回系统</button>
          </div>
        </div>

        <router-view v-show="!isMicroMenu" />
      </main>
    </div>

    <button v-if="isFullscreen" class="floating-back" @click="backToSystem">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m15 6-6 6 6 6" />
      </svg>
      返回系统
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SidebarMenu from './SidebarMenu.vue'
import { microAppConfigs } from '../config/microApps'
import { mountMicroApp, unmountMicroApp } from '../composables/microApp'
import { useMenuStore } from '../store/menu'
import { findMenuChain, resolveMenuByPath } from '../utils/tree'

const route = useRoute()
const router = useRouter()
const { state, allMenus, sidebarTree, loadMenus } = useMenuStore()

const microLoading = ref(false)
const microError = ref('')

const currentMenu = computed(() => resolveMenuByPath(allMenus.value, route.path))
const isMicroMenu = computed(() => Boolean(currentMenu.value && currentMenu.value.microApp))
const isFullscreen = computed(() => isMicroMenu.value && Boolean(currentMenu.value?.layout === 'fullscreen'))
const menuUnavailable = computed(
  () => isMicroMenu.value && currentMenu.value && (currentMenu.value.status !== 1 || currentMenu.value.visible !== 1)
)
const breadcrumbs = computed(() => findMenuChain(allMenus.value, route.path))

const entryOf = (name) => microAppConfigs[name]?.entry || '未配置'

onMounted(() => {
  loadMenus()
})

watch(
  () => [
    currentMenu.value?.id,
    currentMenu.value?.microApp,
    currentMenu.value?.path,
    currentMenu.value?.status,
    currentMenu.value?.visible
  ],
  async () => {
    const menu = currentMenu.value
    microError.value = ''
    if (!menu || !menu.microApp || menu.status !== 1 || menu.visible !== 1) {
      await unmountMicroApp()
      return
    }
    await nextTick()
    microLoading.value = true
    try {
      await mountMicroApp(menu)
    } catch (error) {
      microError.value = error?.message || '无法加载微应用资源'
    } finally {
      microLoading.value = false
    }
  },
  { immediate: true }
)

function handleSelect(menu) {
  if (menu.path && menu.path !== route.path) {
    router.push(menu.path)
  }
}

function retryMicroApp() {
  const menu = currentMenu.value
  if (!menu) return
  microError.value = ''
  microLoading.value = true
  mountMicroApp(menu)
    .catch((error) => {
      microError.value = error?.message || '无法加载微应用资源'
    })
    .finally(() => {
      microLoading.value = false
    })
}

function backToSystem() {
  router.push('/system/menu')
}
</script>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
}

.sidebar {
  display: flex;
  flex-direction: column;
  width: 236px;
  flex-shrink: 0;
  background: #001529;
  color: #ffffff;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #1677ff, #49a0ff);
  font-weight: 700;
  font-size: 18px;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.logo-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.logo-sub {
  font-size: 11px;
  color: #7d8fa4;
  letter-spacing: 1px;
}

.menu-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.menu-loading {
  padding: 18px;
  font-size: 13px;
  color: #7d8fa4;
}

.sidebar-footer {
  padding: 12px 18px;
  font-size: 11px;
  color: #5c7088;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.main-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  flex-shrink: 0;
  z-index: 10;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #5b6b7f;
}

.crumb.current {
  color: #1f2d3d;
  font-weight: 600;
}

.crumb-sep {
  color: #b7c2cf;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.env-tag {
  padding: 3px 8px;
  border-radius: 10px;
  background: #eef4ff;
  color: #1677ff;
  font-size: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1677ff;
  color: #ffffff;
  font-size: 13px;
}

.user-name {
  font-size: 14px;
  color: #1f2d3d;
}

.content {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow: auto;
}

.content.has-micro {
  padding: 0;
  overflow: hidden;
}

.micro-view {
  position: relative;
  width: 100%;
  height: 100%;
}

.micro-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.micro-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.92);
  z-index: 2;
  text-align: center;
  padding: 24px;
}

.micro-mask.is-error .error-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #c0392b;
}

.micro-mask .error-desc,
.micro-mask .error-entry {
  margin: 0;
  font-size: 13px;
  color: #5b6b7f;
  word-break: break-all;
}

.micro-mask .error-entry {
  color: #8a97a8;
}

.error-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.spinner {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid #dbe6f5;
  border-top-color: #1677ff;
  animation: spin 0.8s linear infinite;
}

.micro-mask p {
  margin: 0;
  font-size: 13px;
  color: #5b6b7f;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn {
  padding: 7px 16px;
  border: 1px solid #d5dce6;
  border-radius: 6px;
  background: #ffffff;
  color: #1f2d3d;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.btn.primary {
  border-color: #1677ff;
  background: #1677ff;
  color: #ffffff;
}

.btn.primary:hover {
  background: #0f6ae0;
}

.floating-back {
  position: fixed;
  left: 18px;
  top: 18px;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  border-radius: 18px;
  background: rgba(0, 21, 41, 0.72);
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background 0.15s ease;
}

.floating-back:hover {
  background: rgba(0, 21, 41, 0.9);
}

.is-fullscreen .main-area {
  width: 100%;
}
</style>
