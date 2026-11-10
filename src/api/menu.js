const STORAGE_KEY = 'qiankun_main_menus_v1'

export const CURRENT_USER_PERMISSIONS = ['system:menu:list', 'screen:view', 'sub:view']

const seedMenus = [
  {
    id: 1,
    parentId: 0,
    name: '系统管理',
    type: 'catalog',
    path: '/system',
    component: '',
    microApp: '',
    activeRule: '',
    permission: '',
    icon: 'setting',
    sort: 1,
    status: 1,
    visible: 1,
    layout: 'default',
  },
  {
    id: 2,
    parentId: 1,
    name: '菜单设置',
    type: 'menu',
    path: '/system/menu',
    component: 'system/menu',
    microApp: '',
    activeRule: '',
    permission: 'system:menu:list',
    icon: 'menu',
    sort: 1,
    status: 1,
    visible: 1,
    layout: 'default',
  },
  {
    id: 3,
    parentId: 0,
    name: '大屏展示',
    type: 'menu',
    path: '/screen',
    component: '',
    microApp: 'big-screen',
    activeRule: '/screen',
    permission: 'screen:view',
    icon: 'screen',
    sort: 2,
    status: 1,
    visible: 1,
    layout: 'fullscreen',
  },
  {
    id: 4,
    parentId: 0,
    name: 'Vue 子应用',
    type: 'menu',
    path: '/sub-vue',
    component: '',
    microApp: 'vue-sub-app',
    activeRule: '/sub-vue',
    permission: 'sub:view',
    icon: 'app',
    sort: 3,
    status: 1,
    visible: 1,
    layout: 'default',
  },
]

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function isMenuLike(item) {
  return (
    item &&
    typeof item === 'object' &&
    Number.isFinite(Number(item.id)) &&
    typeof item.name === 'string' &&
    typeof item.path === 'string'
  )
}

function normalizeMenu(item) {
  return {
    ...item,
    id: Number(item.id),
    parentId: Number(item.parentId) || 0,
    sort: Number(item.sort) || 0,
    status: item.status === true || Number(item.status) === 1 ? 1 : 0,
    visible: item.visible === true || Number(item.visible) === 1 ? 1 : 0,
    type: item.type === 'catalog' ? 'catalog' : 'menu',
    layout: item.layout === 'fullscreen' ? 'fullscreen' : 'default',
    component: item.component || '',
    microApp: item.microApp || '',
    activeRule: item.activeRule || '',
    permission: item.permission || '',
    icon: item.icon || 'menu',
  }
}

function resetSeed() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMenus))
  return clone(seedMenus)
}

function readAll() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return resetSeed()
  try {
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return resetSeed()
    const valid = list.filter(isMenuLike).map(normalizeMenu)
    if (!valid.length) return resetSeed()
    if (valid.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid))
    }
    return valid
  } catch {
    return resetSeed()
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function delay(data, ms = 120) {
  return new Promise((resolve) => setTimeout(() => resolve(clone(data)), ms))
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function normalizePath(path) {
  if (!path) return ''
  return path.startsWith('/') ? path : `/${path}`
}

function assertPathUnique(list, path, ignoreId) {
  const exists = list.some((item) => item.id !== ignoreId && item.path === path)
  if (exists) {
    throw new Error(`路由路径 ${path} 已存在`)
  }
}

export function getMenuList() {
  return delay(readAll())
}

export async function createMenu(payload) {
  const list = readAll()
  const path = normalizePath(payload.path)
  assertPathUnique(list, path)
  const menu = {
    id: nextId(list),
    parentId: payload.parentId || 0,
    name: payload.name,
    type: payload.type || 'menu',
    path,
    component: payload.component || '',
    microApp: payload.microApp || '',
    activeRule: payload.microApp ? payload.activeRule || path : '',
    permission: payload.permission || '',
    icon: payload.icon || 'menu',
    sort: Number(payload.sort) || 0,
    status: payload.status ? 1 : 0,
    visible: payload.visible ? 1 : 0,
    layout: payload.layout || 'default',
  }
  list.push(menu)
  writeAll(list)
  await delay(null, 80)
  return clone(menu)
}

export async function updateMenu(id, payload) {
  const list = readAll()
  const index = list.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new Error('菜单不存在')
  }
  const path = normalizePath(payload.path ?? list[index].path)
  assertPathUnique(list, path, id)
  const updated = {
    ...list[index],
    parentId: payload.parentId ?? list[index].parentId,
    name: payload.name ?? list[index].name,
    type: payload.type ?? list[index].type,
    path,
    component: payload.component ?? list[index].component,
    microApp: payload.microApp ?? list[index].microApp,
    activeRule: payload.activeRule ?? list[index].activeRule,
    permission: payload.permission ?? list[index].permission,
    icon: payload.icon ?? list[index].icon,
    sort: payload.sort ?? list[index].sort,
    status: payload.status === undefined ? list[index].status : payload.status ? 1 : 0,
    visible: payload.visible === undefined ? list[index].visible : payload.visible ? 1 : 0,
    layout: payload.layout ?? list[index].layout,
  }
  if (!updated.microApp) {
    updated.activeRule = ''
  }
  list[index] = updated
  writeAll(list)
  await delay(null, 80)
  return clone(updated)
}

export async function deleteMenu(id) {
  const list = readAll()
  if (list.some((item) => item.parentId === id)) {
    throw new Error('存在子菜单，请先删除子菜单')
  }
  const next = list.filter((item) => item.id !== id)
  writeAll(next)
  await delay(null, 80)
  return true
}