import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadMenus } from './store/menu'
import './styles/global.css'

async function bootstrap() {
  await loadMenus()
  const app = createApp(App)
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

bootstrap()