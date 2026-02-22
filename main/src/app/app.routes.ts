import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import {authGuard} from "./services/auth.guard";
import {alreadyAuthGuard} from "./services/already-auth.guard";

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'factures',
        loadChildren: () =>
          import('./pages/factures/factures.routes').then((m) => m.FacturesRoutes),
      },
      {
        path: 'clients',
        loadChildren: () =>
          import('./pages/clients/cleints.routes').then((m) => m.CleintsRoutes),
      },
      {
        path: 'articles',
        loadChildren: () =>
          import('./pages/articles/articles.routes').then((m) => m.ArticlesRoutes),
      },
      {
        path: 'devis',
        loadChildren: () =>
          import('./pages/devis/devis.routes').then((m) => m.DevisRoutes),
      },
      {
        path: 'bl',
        loadChildren: () =>
          import('./pages/bl/bl.routers').then((m) => m.BlRouters),
      },
      {
        path: 'profil',
        loadChildren: () =>
          import('./pages/profil/profil.routes').then((m) => m.ProfilRoutes),
      },
      {
        path: 'traceability',
        loadChildren: () =>
          import('./pages/traceability/traceability.routes').then((m) => m.TraceabilityRoutes),
      }
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        canActivate: [alreadyAuthGuard],
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
