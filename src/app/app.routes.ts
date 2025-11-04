import { Routes } from '@angular/router';
import { List } from './features/list/list';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: List,
    title: 'List',
  },
];
