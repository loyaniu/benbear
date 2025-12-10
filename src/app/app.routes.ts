import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
    canActivate: [guestGuard],
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.tabsRoutes),
    canActivate: [authGuard],
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./pages/accounts/accounts.page').then((m) => m.AccountsPage),
    canActivate: [authGuard],
  },
  {
    path: 'accounts/new',
    loadComponent: () =>
      import('./pages/account-form/account-form.page').then(
        (m) => m.AccountFormPage,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'accounts/edit/:id',
    loadComponent: () =>
      import('./pages/account-form/account-form.page').then(
        (m) => m.AccountFormPage,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories/categories.page').then(
        (m) => m.CategoriesPage,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'categories/new',
    loadComponent: () =>
      import('./pages/category-form/category-form.page').then(
        (m) => m.CategoryFormPage,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'categories/edit/:id',
    loadComponent: () =>
      import('./pages/category-form/category-form.page').then(
        (m) => m.CategoryFormPage,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'transactions/edit/:id',
    loadComponent: () =>
      import('./pages/add-transaction/add-transaction.page').then(
        (m) => m.AddTransactionPage,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.page').then((m) => m.SettingsPage),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
