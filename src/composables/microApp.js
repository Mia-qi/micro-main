import { loadMicroApp } from 'qiankun'
import { microAppConfigs } from '../config/microApps'

let instance = null
let currentName = ''
let mountToken = 0

export async function mountMicroApp(menu) {
  const config = microAppConfigs[menu.microApp]
  if (!config) {
    throw new Error(`未找到微应用「${menu.microApp}」的入口配置`)
  }
  if (currentName === menu.microApp && instance) return
  await unmountMicroApp()
  const token = mountToken
  const app = loadMicroApp(
    {
      name: config.name,
      entry: config.entry,
      container: '#sub-container',
      props: {
        menuPath: menu.path,
        from: 'main-app',
      },
    },
    {
      sandbox: { strictStyleIsolation: true },
      singular: true,
    },
  )
  instance = app
  currentName = menu.microApp
  try {
    await app.mountPromise
  } catch (error) {
    if (token === mountToken) {
      instance = null
      currentName = ''
    }
    throw error
  }
}

export async function unmountMicroApp() {
  mountToken += 1
  const app = instance
  instance = null
  currentName = ''
  if (app) {
    try {
      await app.unmount()
    } catch {
      /* ignore */
    }
  }
}