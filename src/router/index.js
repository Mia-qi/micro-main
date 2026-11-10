import { createRouter, createWebHistory } from 'vue-router'
import DynamicRoute from '../views/DynamicRoute.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/system/menu',
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'dynamic',
      component: DynamicRoute,
    },
  ],
})

export default router