import { Routes } from '@angular/router';
import { AppLayout } from './layout/component/app.layout';
import { NotfoundComponent } from './gestionale-bertozzi/components/notfound/notfound.component';
import { accessoGuard } from './services/Guards/accesso.guard';
import { HomeComponent } from './gestionale-bertozzi/components/home/home.component';

export const routes: Routes = [
    {
        path: '', component: AppLayout, canActivate: [accessoGuard],
        children: [
            { path: '', component: HomeComponent },
            { path: 'user', loadChildren: () => import('./gestionale-bertozzi/user/user.routes') },
            { path: 'framework', loadChildren: () => import('./gestionale-bertozzi/gestionale-bertozzi.routes') }, 
        ]
    },
    { path: 'auth', loadChildren: () => import('./auth/auth.routes') },
    { path: 'notfound', component: NotfoundComponent },
    { path: '**', redirectTo: '/notfound' },
];