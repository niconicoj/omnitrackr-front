const ProgramListView = () => import('@/views/ProgramListView.vue')
const ProgramView = () => import('@/views/ProgramView.vue')
const WorkoutView = () => import('@/views/WorkoutView.vue')
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'programList',
      component: ProgramListView,
    },
    {
      path: '/:uuid',
      name: 'program',
      component: ProgramView,
    },
    {
      path: '/:uuid/workout',
      name: 'workout',
      component: WorkoutView,
    },
  ],
})

export default router
