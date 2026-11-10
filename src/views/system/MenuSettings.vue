<template>
  <div class="menu-settings">
    <div class="page-header">
      <div>
        <h1 class="page-title">菜单设置</h1>
        <p class="page-sub">维护系统菜单树，配置路由、权限、可见性与布局</p>
      </div>
      <div class="header-actions">
        <button class="btn" @click="refreshMenus" :disabled="state.loading">
          {{ state.loading ? '刷新中...' : '刷新' }}
        </button>
        <button class="btn primary" @click="openCreate(0)">新增根菜单</button>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input v-model="keyword" type="text" placeholder="搜索菜单名称 / 路由 / 权限标识" />
      </div>
      <div class="toolbar-right">
        <button class="btn ghost" @click="expandAll">展开全部</button>
        <button class="btn ghost" @click="collapseAll">收起全部</button>
        <span class="count-tip">共 {{ allMenus.length }} 个菜单</span>
      </div>
    </div>

    <div class="table-card">
      <table class="menu-table">
        <thead>
          <tr>
            <th class="col-name">菜单名称</th>
            <th class="col-path">路由路径</th>
            <th class="col-component">组件 / 微应用</th>
            <th class="col-perm">权限标识</th>
            <th class="col-sort">排序</th>
            <th class="col-switch">状态</th>
            <th class="col-switch">可见</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="{ 'is-disabled': row.status !== 1, 'is-hidden': row.visible !== 1 }"
          >
            <td class="col-name">
              <div class="name-cell" :style="{ paddingLeft: `${row.depth * 20}px` }">
                <button v-if="row.children && row.children.length" class="expand-btn" @click="toggleExpand(row)">
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    :class="{ open: isExpanded(row) }"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
                <span v-else class="expand-placeholder"></span>
                <AppIcon :name="row.icon" :size="16" class="row-icon" />
                <span class="name-text">{{ row.name }}</span>
                <span class="tag type-tag">{{ row.type === 'catalog' ? '目录' : '菜单' }}</span>
                <span v-if="row.layout === 'fullscreen'" class="tag fullscreen-tag">全屏</span>
              </div>
            </td>
            <td class="col-path">
              <code>{{ row.path }}</code>
            </td>
            <td class="col-component">
              <span v-if="row.microApp" class="tag micro-tag">微应用 · {{ row.microApp }}</span>
              <span v-else-if="row.component" class="component-text">{{ row.component }}</span>
              <span v-else class="empty-text">—</span>
            </td>
            <td class="col-perm">
              <span v-if="row.permission" class="perm-text">{{ row.permission }}</span>
              <span v-else class="empty-text">—</span>
            </td>
            <td class="col-sort">{{ row.sort }}</td>
            <td class="col-switch">
              <label class="switch">
                <input type="checkbox" :checked="row.status === 1" @change="toggleStatus(row, $event.target.checked)" />
                <span class="slider"></span>
              </label>
            </td>
            <td class="col-switch">
              <label class="switch">
                <input
                  type="checkbox"
                  :checked="row.visible === 1"
                  @change="toggleVisible(row, $event.target.checked)"
                />
                <span class="slider"></span>
              </label>
            </td>
            <td class="col-actions">
              <button v-if="row.type === 'catalog'" class="link-btn" @click="openCreate(row.id)">新增子菜单</button>
              <button class="link-btn" @click="openEdit(row)">编辑</button>
              <button class="link-btn danger" @click="askDelete(row)">删除</button>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="8" class="empty-row">
              {{ keyword ? '没有匹配的菜单' : '暂无菜单，点击右上角新增根菜单' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="dialogVisible" class="modal-mask" @click.self="closeDialog">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editingId ? '编辑菜单' : '新增菜单' }}</h3>
            <button class="modal-close" @click="closeDialog">×</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-item full">
                <label>上级菜单</label>
                <select v-model.number="form.parentId">
                  <option :value="0">顶级菜单</option>
                  <option v-for="opt in parentOptions" :key="opt.id" :value="opt.id">
                    {{ indentLabel(opt) }}{{ opt.name }}
                  </option>
                </select>
              </div>

              <div class="form-item full">
                <label>菜单类型</label>
                <div class="radio-group">
                  <label class="radio" :class="{ active: form.type === 'catalog' }">
                    <input v-model="form.type" type="radio" value="catalog" @change="onTypeChange" />
                    目录
                  </label>
                  <label class="radio" :class="{ active: form.type === 'menu' }">
                    <input v-model="form.type" type="radio" value="menu" @change="onTypeChange" />
                    菜单
                  </label>
                </div>
              </div>

              <div class="form-item">
                <label>菜单名称 <span class="required">*</span></label>
                <input v-model="form.name" type="text" placeholder="例如：大屏展示" />
              </div>

              <div class="form-item">
                <label>路由路径 <span class="required">*</span></label>
                <input v-model="form.path" type="text" placeholder="例如：/screen" />
              </div>

              <template v-if="form.type === 'menu'">
                <div class="form-item">
                  <label>微应用标识</label>
                  <select v-model="form.microApp" @change="onMicroAppChange">
                    <option value="">非微应用（主应用内部页面）</option>
                    <option v-for="opt in microAppOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}（{{ opt.value }}）
                    </option>
                  </select>
                </div>

                <div v-if="form.microApp" class="form-item">
                  <label>微应用激活规则 <span class="required">*</span></label>
                  <input v-model="form.activeRule" type="text" placeholder="例如：/screen" />
                </div>

                <div v-if="!form.microApp" class="form-item">
                  <label>组件路径 <span class="required">*</span></label>
                  <input v-model="form.component" type="text" placeholder="例如：system/menu" />
                </div>

                <div class="form-item">
                  <label>布局类型</label>
                  <select v-model="form.layout">
                    <option value="default">默认布局（显示侧边栏）</option>
                    <option value="fullscreen">全屏布局（隐藏侧边栏）</option>
                  </select>
                </div>
              </template>

              <div class="form-item">
                <label>权限标识</label>
                <input v-model="form.permission" type="text" placeholder="留空表示所有用户可见，例如：screen:view" />
              </div>

              <div class="form-item">
                <label>菜单图标</label>
                <div class="icon-select">
                  <span class="icon-preview"><AppIcon :name="form.icon" :size="18" /></span>
                  <select v-model="form.icon">
                    <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-item">
                <label>排序</label>
                <input v-model.number="form.sort" type="number" min="0" max="9999" />
              </div>

              <div class="form-item switch-item">
                <label>状态</label>
                <label class="switch inline">
                  <input v-model="form.status" type="checkbox" />
                  <span class="slider"></span>
                  <span class="switch-text">{{ form.status ? '启用' : '禁用' }}</span>
                </label>
              </div>

              <div class="form-item switch-item">
                <label>可见性</label>
                <label class="switch inline">
                  <input v-model="form.visible" type="checkbox" />
                  <span class="slider"></span>
                  <span class="switch-text">{{ form.visible ? '显示' : '隐藏' }}</span>
                </label>
              </div>

              <div v-if="form.microApp" class="form-item full">
                <div class="entry-hint">
                  微应用入口：<code>{{ microEntry }}</code> （在主应用 <code>src/config/microApps.js</code> 中配置）
                </div>
              </div>
            </div>

            <p v-if="formError" class="form-error">{{ formError }}</p>
          </div>

          <div class="modal-footer">
            <button class="btn" @click="closeDialog">取消</button>
            <button class="btn primary" :disabled="submitting" @click="submit">
              {{ submitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="confirmState.visible" class="modal-mask" @click.self="cancelDelete">
        <div class="modal confirm-modal">
          <div class="modal-header">
            <h3>删除菜单</h3>
            <button class="modal-close" @click="cancelDelete">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">确定删除菜单「{{ confirmState.menu?.name }}」吗？删除后不可恢复。</p>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="cancelDelete">取消</button>
            <button class="btn danger" :disabled="confirmState.loading" @click="confirmDelete">
              {{ confirmState.loading ? '删除中...' : '确定删除' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="toast.visible" class="toast" :class="toast.type">{{ toast.text }}</div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import { createMenu, deleteMenu, updateMenu } from '../../api/menu'
import { microAppConfigs, microAppOptions } from '../../config/microApps'
import { useMenuStore } from '../../store/menu'
import { collectDescendantIds, collectIdsWithChildren, filterTreeByKeyword, flattenTree } from '../../utils/tree'

const { state, allMenus, allTree, loadMenus } = useMenuStore()

const keyword = ref('')
const expandedIds = ref(new Set())

const iconOptions = [
  { value: 'menu', label: '菜单' },
  { value: 'setting', label: '设置' },
  { value: 'screen', label: '大屏' },
  { value: 'app', label: '应用' },
  { value: 'home', label: '首页' },
  { value: 'user', label: '用户' },
  { value: 'dashboard', label: '仪表盘' }
]

watch(
  allTree,
  (tree) => {
    expandedIds.value = new Set(collectIdsWithChildren(tree))
  },
  { immediate: true }
)

const filteredTree = computed(() => filterTreeByKeyword(allTree.value, keyword.value))

const rows = computed(() => {
  const result = []
  const walk = (nodes, depth) => {
    nodes.forEach((menu) => {
      result.push({ ...menu, depth })
      const open = keyword.value ? true : expandedIds.value.has(menu.id)
      if (menu.children && menu.children.length && open) {
        walk(menu.children, depth + 1)
      }
    })
  }
  walk(filteredTree.value, 0)
  return result
})

const isExpanded = (menu) => keyword.value || expandedIds.value.has(menu.id)

function toggleExpand(menu) {
  const next = new Set(expandedIds.value)
  if (next.has(menu.id)) {
    next.delete(menu.id)
  } else {
    next.add(menu.id)
  }
  expandedIds.value = next
}

function expandAll() {
  expandedIds.value = new Set(collectIdsWithChildren(allTree.value))
}

function collapseAll() {
  expandedIds.value = new Set()
}

const dialogVisible = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formError = ref('')

const form = reactive({
  parentId: 0,
  type: 'menu',
  name: '',
  path: '',
  component: '',
  microApp: '',
  activeRule: '',
  permission: '',
  icon: 'menu',
  sort: 0,
  status: true,
  visible: true,
  layout: 'default'
})

const parentOptions = computed(() => {
  const exclude = new Set()
  if (editingId.value) {
    exclude.add(editingId.value)
    collectDescendantIds(allMenus.value, editingId.value).forEach((id) => exclude.add(id))
  }
  return flattenTree(allTree.value).filter((item) => item.type === 'catalog' && !exclude.has(item.id))
})

const microEntry = computed(() => microAppConfigs[form.microApp]?.entry || '未配置')

function indentLabel(opt) {
  return `${'　'.repeat(opt.depth)}`
}

function resetForm(parentId) {
  form.parentId = parentId
  form.type = 'menu'
  form.name = ''
  form.path = ''
  form.component = ''
  form.microApp = ''
  form.activeRule = ''
  form.permission = ''
  form.icon = 'menu'
  form.sort = 0
  form.status = true
  form.visible = true
  form.layout = 'default'
  formError.value = ''
}

function openCreate(parentId) {
  editingId.value = null
  resetForm(parentId)
  dialogVisible.value = true
}

function openEdit(menu) {
  editingId.value = menu.id
  form.parentId = menu.parentId
  form.type = menu.type
  form.name = menu.name
  form.path = menu.path
  form.component = menu.component || ''
  form.microApp = menu.microApp || ''
  form.activeRule = menu.activeRule || ''
  form.permission = menu.permission || ''
  form.icon = menu.icon || 'menu'
  form.sort = menu.sort
  form.status = menu.status === 1
  form.visible = menu.visible === 1
  form.layout = menu.layout || 'default'
  formError.value = ''
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

function onTypeChange() {
  if (form.type === 'catalog') {
    form.microApp = ''
    form.component = ''
    form.activeRule = ''
    form.layout = 'default'
  }
}

function onMicroAppChange() {
  if (form.microApp) {
    form.component = ''
    if (!form.activeRule) {
      form.activeRule = form.path
    }
  }
}

function validate() {
  const name = form.name.trim()
  const path = form.path.trim()
  if (!name) return '请输入菜单名称'
  if (!path) return '请输入路由路径'
  if (!path.startsWith('/')) return '路由路径必须以 / 开头'
  const duplicate = allMenus.value.find((item) => item.id !== editingId.value && item.path === path)
  if (duplicate) return `路由路径 ${path} 已被「${duplicate.name}」占用`
  if (form.type === 'catalog' && form.microApp) return '目录类型不能配置微应用'
  if (form.type === 'menu' && !form.microApp && !form.component.trim()) {
    return '主应用内部页面必须填写组件路径'
  }
  if (form.type === 'menu' && form.microApp && !form.activeRule.trim()) {
    return '微应用菜单必须填写激活规则'
  }
  if (editingId.value) {
    const origin = allMenus.value.find((item) => item.id === editingId.value)
    const hasChildren = allMenus.value.some((item) => item.parentId === editingId.value)
    if (origin && origin.type === 'catalog' && hasChildren && form.type === 'menu') {
      return '该目录下存在子菜单，不能改为菜单类型'
    }
  }
  return ''
}

async function submit() {
  formError.value = validate()
  if (formError.value) return
  submitting.value = true
  const id = editingId.value
  const payload = {
    parentId: form.parentId,
    type: form.type,
    name: form.name.trim(),
    path: form.path.trim(),
    component: form.type === 'menu' ? form.component.trim() : '',
    microApp: form.type === 'menu' ? form.microApp : '',
    activeRule: form.type === 'menu' ? form.activeRule.trim() : '',
    permission: form.permission.trim(),
    icon: form.icon,
    sort: Number(form.sort) || 0,
    status: form.status,
    visible: form.visible,
    layout: form.type === 'menu' ? form.layout : 'default'
  }
  try {
    if (id) {
      await updateMenu(id, payload)
    } else {
      await createMenu(payload)
    }
    await loadMenus(true)
    dialogVisible.value = false
    showToast('success', id ? '菜单已更新' : '菜单已新增')
  } catch (error) {
    formError.value = error?.message || '保存失败'
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(menu, checked) {
  try {
    await updateMenu(menu.id, { status: checked })
    await loadMenus(true)
    showToast('success', `${menu.name} 已${checked ? '启用' : '禁用'}`)
  } catch (error) {
    await loadMenus(true)
    showToast('error', error?.message || '操作失败')
  }
}

async function toggleVisible(menu, checked) {
  try {
    await updateMenu(menu.id, { visible: checked })
    await loadMenus(true)
    showToast('success', `${menu.name} 已${checked ? '显示' : '隐藏'}`)
  } catch (error) {
    await loadMenus(true)
    showToast('error', error?.message || '操作失败')
  }
}

const confirmState = reactive({ visible: false, menu: null, loading: false })

function askDelete(menu) {
  if (menu.children && menu.children.length) {
    showToast('error', '请先删除子菜单')
    return
  }
  confirmState.menu = menu
  confirmState.visible = true
}

function cancelDelete() {
  confirmState.visible = false
  confirmState.menu = null
}

async function confirmDelete() {
  if (!confirmState.menu) return
  confirmState.loading = true
  try {
    await deleteMenu(confirmState.menu.id)
    await loadMenus(true)
    showToast('success', '菜单已删除')
    cancelDelete()
  } catch (error) {
    showToast('error', error?.message || '删除失败')
  } finally {
    confirmState.loading = false
  }
}

const toast = reactive({ visible: false, type: 'success', text: '' })
let toastTimer = null

function showToast(type, text) {
  toast.type = type
  toast.text = text
  toast.visible = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.visible = false
  }, 2500)
}

async function refreshMenus() {
  await loadMenus(true)
  showToast('success', '菜单数据已刷新')
}

onMounted(() => {
  loadMenus()
})
</script>

<style scoped>
.menu-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2d3d;
}

.page-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: #7b8a9c;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  border-color: #1677ff;
  background: #1677ff;
  color: #ffffff;
}

.btn.primary:hover {
  background: #0f6ae0;
}

.btn.ghost {
  border-color: transparent;
  background: #eef2f7;
  color: #51637a;
  padding: 6px 12px;
}

.btn.ghost:hover {
  background: #e2e9f3;
  color: #1677ff;
}

.btn.danger {
  border-color: #f0b4ad;
  background: #e74c3c;
  color: #ffffff;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.06);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 320px;
  padding: 0 12px;
  height: 34px;
  border: 1px solid #dde4ee;
  border-radius: 8px;
  background: #f7f9fc;
  color: #8a97a8;
}

.search-box:focus-within {
  border-color: #1677ff;
  background: #ffffff;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #1f2d3d;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.count-tip {
  font-size: 12px;
  color: #8a97a8;
}

.table-card {
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.06);
  overflow: auto;
}

.menu-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

.menu-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 14px;
  background: #f7f9fc;
  color: #5b6b7f;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #e8edf4;
}

.menu-table td {
  padding: 11px 14px;
  border-bottom: 1px solid #f0f3f8;
  font-size: 13px;
  color: #34495e;
  vertical-align: middle;
}

.menu-table tbody tr:hover {
  background: #fafcff;
}

.menu-table tbody tr.is-disabled .name-text,
.menu-table tbody tr.is-hidden .name-text {
  color: #9aa7b6;
}

.col-name {
  width: 26%;
}

.col-path {
  width: 16%;
}

.col-component {
  width: 20%;
}

.col-perm {
  width: 16%;
}

.col-sort {
  width: 6%;
  text-align: center;
}

.col-switch {
  width: 7%;
  text-align: center;
}

.col-actions {
  width: 22%;
  white-space: nowrap;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 7px;
}

.expand-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: #eef2f7;
  color: #6b7c90;
  cursor: pointer;
}

.expand-btn svg {
  transition: transform 0.15s ease;
}

.expand-btn svg.open {
  transform: rotate(90deg);
}

.expand-placeholder {
  width: 18px;
  flex-shrink: 0;
}

.row-icon {
  color: #51637a;
}

.name-text {
  font-weight: 500;
  color: #1f2d3d;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
}

.type-tag {
  background: #eef2f7;
  color: #64748b;
}

.fullscreen-tag {
  background: #f0ecff;
  color: #6f42c1;
}

.micro-tag {
  background: #e8f3ff;
  color: #1677ff;
}

.component-text {
  color: #51637a;
}

.perm-text {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  color: #8a6d3b;
}

.menu-table code {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  color: #1677ff;
}

.empty-text {
  color: #b7c2cf;
}

.link-btn {
  padding: 0;
  margin-right: 12px;
  border: none;
  background: none;
  color: #1677ff;
  font-size: 13px;
  cursor: pointer;
}

.link-btn:hover {
  text-decoration: underline;
}

.link-btn.danger {
  color: #e74c3c;
  margin-right: 0;
}

.empty-row {
  padding: 40px 0;
  text-align: center;
  color: #9aa7b6;
}

.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 36px;
  height: 20px;
  cursor: pointer;
}

.switch input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: #cfd8e3;
  transition: background 0.2s ease;
}

.slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.switch input:checked + .slider {
  background: #1677ff;
}

.switch input:checked + .slider::after {
  transform: translateX(16px);
}

.switch.inline {
  width: auto;
  height: auto;
  gap: 8px;
  padding-left: 36px;
}

.switch.inline .slider {
  width: 36px;
  height: 20px;
  right: auto;
}

.switch-text {
  font-size: 13px;
  color: #51637a;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}

.modal {
  width: 720px;
  max-width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
  overflow: hidden;
}

.confirm-modal {
  width: 420px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #eef2f7;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.modal-close {
  border: none;
  background: none;
  font-size: 22px;
  line-height: 1;
  color: #9aa7b6;
  cursor: pointer;
}

.modal-close:hover {
  color: #51637a;
}

.modal-body {
  padding: 20px 22px;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-item.full {
  grid-column: 1 / -1;
}

.form-item label {
  font-size: 13px;
  color: #51637a;
}

.required {
  color: #e74c3c;
}

.form-item input[type='text'],
.form-item input[type='number'],
.form-item select {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #dde4ee;
  border-radius: 7px;
  background: #ffffff;
  font-size: 13px;
  color: #1f2d3d;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.form-item input:focus,
.form-item select:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.12);
}

.radio-group {
  display: flex;
  gap: 12px;
}

.radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1px solid #dde4ee;
  border-radius: 7px;
  font-size: 13px;
  color: #51637a;
  cursor: pointer;
}

.radio.active {
  border-color: #1677ff;
  background: #eef4ff;
  color: #1677ff;
}

.radio input {
  accent-color: #1677ff;
}

.icon-select {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #dde4ee;
  border-radius: 7px;
  color: #1677ff;
  flex-shrink: 0;
}

.switch-item {
  justify-content: flex-start;
}

.switch-item > label:first-child {
  margin-bottom: 6px;
}

.entry-hint {
  padding: 10px 12px;
  border-radius: 7px;
  background: #f7f9fc;
  font-size: 12px;
  color: #7b8a9c;
}

.entry-hint code {
  color: #1677ff;
  font-family: Consolas, Monaco, monospace;
}

.form-error {
  margin: 16px 0 0;
  padding: 9px 12px;
  border-radius: 7px;
  background: #fdecea;
  color: #c0392b;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid #eef2f7;
}

.confirm-text {
  margin: 0;
  font-size: 14px;
  color: #34495e;
  line-height: 1.7;
}

.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
}

.toast.success {
  background: #27ae60;
}

.toast.error {
  background: #e74c3c;
}
</style>
