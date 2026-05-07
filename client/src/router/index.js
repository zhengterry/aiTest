import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/order',
    children: [
      {
        path: 'book',
        name: 'BookManage',
        component: () => import('@/views/BookManage.vue'),
        meta: { title: '图书管理' }
      },
      {
        path: 'order',
        name: 'OrderManage',
        component: () => import('@/views/OrderManage.vue'),
        meta: { title: '物流订单' }
      },
      {
        path: 'template',
        name: 'TemplateManage',
        component: () => import('@/views/TemplateManage.vue'),
        meta: { title: '模板管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 万能导入` : '万能导入'
  next()
})

export default router
