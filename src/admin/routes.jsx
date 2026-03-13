/**
 * Rotas do Painel Administrativo
 * 
 * Este arquivo centraliza todas as rotas do admin.
 * Para migrar para projeto separado:
 * 1. Copie este arquivo
 * 2. Ajuste os imports das páginas
 * 3. Integre no Router do novo projeto
 */

import { lazy } from 'react';

// Lazy loading para melhor performance
export const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
export const AdminUsers = lazy(() => import('./pages/AdminUsers.jsx'));
export const AdminTrainings = lazy(() => import('./pages/AdminTrainings.jsx'));
export const AdminNotifications = lazy(() => import('../pages/AdminNotifications.jsx')); // Temporário
export const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics.jsx'));
export const AdminSettings = lazy(() => import('./pages/AdminSettings.jsx'));

/**
 * Configuração de rotas do admin
 * Pode ser facilmente exportado e usado em App.jsx ou projeto separado
 */
export const adminRoutes = [
  {
    path: '/admin/dashboard',
    component: AdminDashboard,
    label: 'Dashboard',
  },
  {
    path: '/admin/users',
    component: AdminUsers,
    label: 'Usuários',
  },
  {
    path: '/admin/trainings',
    component: AdminTrainings,
    label: 'Treinos',
  },
  {
    path: '/admin/notifications',
    component: AdminNotifications,
    label: 'Notificações',
  },
  {
    path: '/admin/analytics',
    component: AdminAnalytics,
    label: 'Analytics',
  },
  {
    path: '/admin/settings',
    component: AdminSettings,
    label: 'Configurações',
  },
];
