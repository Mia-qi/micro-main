<template>
  <ul class="menu-list" :class="{ 'is-sub': depth > 0 }">
    <li v-for="menu in menus" :key="menu.id" class="menu-node">
      <div
        class="menu-item"
        :class="{
          'is-active': isActive(menu),
          'is-parent-active': hasActiveChild(menu),
          'is-leaf': !hasChildren(menu)
        }"
        :style="{ paddingLeft: `${14 + depth * 14}px` }"
        @click="handleClick(menu)"
      >
        <AppIcon :name="menu.icon" :size="depth > 0 ? 16 : 18" class="menu-icon" />
        <span class="menu-label">{{ menu.name }}</span>
        <span v-if="hasChildren(menu)" class="menu-arrow" :class="{ open: isOpen(menu) }">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      </div>
      <SidebarMenu
        v-if="hasChildren(menu)"
        v-show="isOpen(menu)"
        :menus="menu.children"
        :active-path="activePath"
        :depth="depth + 1"
        @select="$emit('select', $event)"
      />
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'

defineOptions({ name: 'SidebarMenu' })

defineProps({
  menus: { type: Array, default: () => [] },
  activePath: { type: String, default: '' },
  depth: { type: Number, default: 0 }
})

const emit = defineEmits(['select'])
const collapsed = ref(new Set())

const hasChildren = (menu) => Array.isArray(menu.children) && menu.children.length > 0
const isOpen = (menu) => !collapsed.value.has(menu.id)
const isActive = (menu) => menu.path === activePath
const hasActiveChild = (menu) =>
  hasChildren(menu) && menu.children.some((child) => child.path === activePath || hasActiveChild(child))

function handleClick(menu) {
  if (hasChildren(menu)) {
    const next = new Set(collapsed.value)
    if (next.has(menu.id)) {
      next.delete(menu.id)
    } else {
      next.add(menu.id)
    }
    collapsed.value = next
    return
  }
  emit('select', menu)
}
</script>

<style scoped>
.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding-right: 14px;
  color: #bfcbd9;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
  user-select: none;
}

.menu-item:hover {
  background: #0b2545;
  color: #ffffff;
}

.menu-item.is-active {
  background: #1677ff;
  color: #ffffff;
}

.menu-item.is-parent-active {
  color: #ffffff;
}

.menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: #ffffff;
}

.menu-icon {
  opacity: 0.9;
}

.menu-label {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-arrow {
  display: inline-flex;
  transition: transform 0.15s ease;
  opacity: 0.65;
}

.menu-arrow.open {
  transform: rotate(90deg);
}

.menu-list.is-sub .menu-item {
  height: 40px;
  color: #a8b8c8;
  font-size: 13px;
}
</style>
