import { computed, reactive } from 'vue'
import { CURRENT_USER_PERMISSIONS, getMenuList } from '../api/menu'
import { buildTree, getVisibleMenus } from '../utils/tree'

const state = reactive({
  menus: [],
  loading: false,
  loaded: false,
  error: '',
})

export async function loadMenus(force = false) {
  if (state.loading) return
  if (state.loaded && !force) return
  state.loading = true
  state.error = ''
  try {
    state.menus = await getMenuList()
    state.loaded = true
  } catch (error) {
    state.error = error?.message || '菜单加载失败'
  } finally {
    state.loading = false
  }
}

export function useMenuStore() {
  const allMenus = computed(() => state.menus)
  const allTree = computed(() => buildTree(state.menus))
  const sidebarTree = computed(() =>
    buildTree(getVisibleMenus(state.menus, CURRENT_USER_PERMISSIONS)),
  )
  return { state, allMenus, allTree, sidebarTree, loadMenus }
}