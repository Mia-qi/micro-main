export function buildTree(list, parentId = 0) {
  return list
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.sort - b.sort || a.id - b.id)
    .map((item) => ({
      ...item,
      children: buildTree(list, item.id),
    }))
}

export function flattenTree(tree, depth = 0, result = []) {
  tree.forEach((item) => {
    result.push({ ...item, depth })
    if (item.children && item.children.length) {
      flattenTree(item.children, depth + 1, result)
    }
  })
  return result
}

export function findMenuByPath(menus, path) {
  return menus.find((item) => item.path === path) || null
}

export function resolveMenuByPath(menus, path) {
  const exact = findMenuByPath(menus, path)
  if (exact) return exact
  const matched = menus
    .filter((item) => item.activeRule && path.startsWith(item.activeRule))
    .sort((a, b) => b.activeRule.length - a.activeRule.length)
  return matched[0] || null
}

export function findMenuChain(menus, path) {
  const target = resolveMenuByPath(menus, path)
  if (!target) return []
  const chain = []
  let current = target
  const guard = new Set()
  while (current && !guard.has(current.id)) {
    guard.add(current.id)
    chain.unshift(current)
    current = current.parentId ? menus.find((item) => item.id === current.parentId) : null
  }
  return chain
}

export function getVisibleMenus(menus, permissions) {
  const byId = new Map(menus.map((item) => [item.id, item]))
  const eligible = new Set()
  menus.forEach((item) => {
    const allowed = !item.permission || permissions.includes(item.permission)
    if (item.status === 1 && item.visible === 1 && allowed) {
      eligible.add(item.id)
    }
  })
  return menus.filter((item) => {
    if (!eligible.has(item.id)) return false
    let parentId = item.parentId
    while (parentId) {
      const parent = byId.get(parentId)
      if (!parent || !eligible.has(parent.id)) return false
      parentId = parent.parentId
    }
    return true
  })
}

export function collectIdsWithChildren(tree, result = []) {
  tree.forEach((item) => {
    if (item.children && item.children.length) {
      result.push(item.id)
      collectIdsWithChildren(item.children, result)
    }
  })
  return result
}

export function collectDescendantIds(menus, id) {
  const result = []
  const walk = (parentId) => {
    menus
      .filter((item) => item.parentId === parentId)
      .forEach((item) => {
        result.push(item.id)
        walk(item.id)
      })
  }
  walk(id)
  return result
}

export function filterTreeByKeyword(tree, keyword) {
  if (!keyword) return tree
  const kw = keyword.toLowerCase()
  const walk = (nodes) =>
    nodes
      .map((node) => {
        const children = walk(node.children || [])
        const matched =
          node.name.toLowerCase().includes(kw) ||
          (node.path || '').toLowerCase().includes(kw) ||
          (node.permission || '').toLowerCase().includes(kw)
        if (matched || children.length) {
          return { ...node, children }
        }
        return null
      })
      .filter(Boolean)
  return walk(tree)
}