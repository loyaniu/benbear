import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const tabsRoutes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('../pages/statistics/statistics.page').then(
            (m) => m.StatisticsPage,
          ),
      },
      {
        path: 'add',
        loadComponent: () =>
          import('../pages/add-transaction/add-transaction.page').then(
            (m) => m.AddTransactionPage,
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('../pages/transactions/transactions.page').then(
            (m) => m.TransactionsPage,
          ),
      },
      {
        path: 'more',
        loadComponent: () =>
          import('../pages/more/more.page').then((m) => m.MorePage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
