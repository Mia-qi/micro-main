export const microAppConfigs = {
  'big-screen': {
    name: 'big-screen',
    label: '大屏展示',
    entry: '//localhost:5175',
  },
  'vue-sub-app': {
    name: 'vue-sub-app',
    label: 'Vue 子应用',
    entry: '//localhost:5174',
  },
}

export const microAppOptions = Object.entries(microAppConfigs).map(([value, item]) => ({
  value,
  label: item.label,
  entry: item.entry,
}))