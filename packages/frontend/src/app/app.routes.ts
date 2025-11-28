import { Routes } from '@angular/router';
import { AuthGuard, NoAuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Redirect root to todos (authenticated) or login (not authenticated)
  {
    path: '',
    redirectTo: '/todos',
    pathMatch: 'full'
  },
  
  // Authentication routes (only accessible when not logged in)
  {
    path: 'login',
    canActivate: [NoAuthGuard],
    loadComponent: () => import('./components/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [NoAuthGuard],
    loadComponent: () => import('./components/register.component').then(m => m.RegisterComponent)
  },
  
  // Protected routes (requires authentication)
  {
    path: 'todos',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/todo-list.component').then(m => m.TodoListComponent)
  },
  
  // Catch-all route
  {
    path: '**',
    redirectTo: '/todos'
  }
];
