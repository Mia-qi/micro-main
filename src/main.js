import { createApp } from 'vue'
import App from './App.vue'
import { registerMicroApps, start } from 'qiankun'

const app = createApp(App)
app.mount('#app')

// 1. 注册微应用
registerMicroApps([
  {
    name: 'vue-sub-app',          // 子应用名称
    entry: '//localhost:5174',    // 对应子应用的端口
    container: '#sub-container',  // 主应用中的挂载节点 ID
    activeRule: '/sub-vue',       // 当浏览器 URL 变为 /sub-vue 时激活子应用
    props: {
      message: '来自主应用的问候' // 传数据给子应用
    }
  }
])

// 2. 启动 qiankun
start({
  prefetch: true,
  sandbox: {
    strictStyleIsolation: true // 开启严格样式隔离
  }
})