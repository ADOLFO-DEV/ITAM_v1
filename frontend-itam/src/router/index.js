import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import Dashboard from '../views/Dashboard.vue';
import Slots from '../views/Slots.vue';
import LoginView from '../views/LoginView.vue';
import Users from '../views/Users.vue';
import GlobalAuditLogsView from '../views/GlobalAuditLogsView.vue';
import HeadcountSyncView from '../views/HeadcountSyncView.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Iniciar Sesión', requiresAuth: false }
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'slots',
        name: 'Slots',
        component: Slots,
        meta: { title: 'Gestión de Activos' }
      },
      {
        path: 'users',
        name: 'Users',
        component: Users,
        meta: { title: 'Gestión de Usuarios' }
      },
      {
        path: 'audit-logs',
        name: 'AuditLogs',
        component: GlobalAuditLogsView,
        meta: { title: 'Historial de Auditoría' }
      },
      {
        path: 'sync-headcount',
        name: 'SyncHeadcount',
        component: HeadcountSyncView,
        meta: { title: 'Sincronizar Headcount' }
      },
      {
        path: 'sync-adendum',
        name: 'SyncAdendum',
        component: () => import('../views/AdendumSyncView.vue'),
        meta: { title: 'Sincronizar Adendum' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('itam_token');
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next({ name: 'Login' });
    } else {
      next();
    }
  } else {
    // If logged in and trying to access login page, redirect to Dashboard
    if (to.name === 'Login' && token) {
      next({ name: 'Dashboard' });
    } else {
      next();
    }
  }
});

export default router;
