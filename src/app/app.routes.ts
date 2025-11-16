import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'cases',
        loadComponent: () => import('./features/cases-new/cases-list.component').then(m => m.CasesListComponent)
      },
      {
        path: 'ai-assistant',
        loadComponent: () => import('./features/ai-assistant/ai-assistant.component').then(m => m.AIAssistantComponent)
      },
      {
        path: 'ai-case-analysis',
        loadComponent: () => import('./features/ai-case-analysis/ai-case-analysis.component').then(m => m.AiCaseAnalysisComponent)
      },
      {
        path: 'legal-chat',
        loadComponent: () => import('./features/legal-chat/legal-chat.component').then(m => m.LegalChatComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/clients-list.component').then(m => m.ClientsListComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./features/documents/documents-list.component').then(m => m.DocumentsListComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'ai-model-settings',
        loadComponent: () => import('./features/ai-model-settings/ai-model-settings.component').then(m => m.AIModelSettingsComponent)
      },
      {
        path: 'nationalities',
        loadComponent: () => import('./features/nationalities/nationalities.component').then(m => m.NationalitiesComponent)
      },
      {
        path: 'rbac',
        loadComponent: () => import('./features/rbac/rbac.component').then(m => m.RbacComponent)
      },
      {
        path: 'case-assignments',
        loadComponent: () => import('./features/case-assignments/case-assignments.component').then(m => m.CaseAssignmentsComponent)
      },
      {
        path: 'courts',
        loadComponent: () => import('./features/courts/courts.component').then(m => m.CourtsComponent)
      },
      {
        path: 'court-types',
        loadComponent: () => import('./features/court-types/court-types.component').then(m => m.CourtTypesComponent)
      },
      {
        path: 'sessions',
        loadComponent: () => import('./features/sessions/sessions-list.component').then(m => m.SessionsListComponent)
      },
      {
        path: 'clients-new',
        children: [
          {
            path: '',
            redirectTo: '/clients',
            pathMatch: 'full'
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
