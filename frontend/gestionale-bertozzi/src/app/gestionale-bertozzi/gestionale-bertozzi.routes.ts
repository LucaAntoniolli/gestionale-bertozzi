
import { AppInfoComponent } from './components/app-info/app-info.component';
import { accessoGuard } from '../services/Guards/accesso.guard';
import { ServicePilotComponent } from './gestionale-bertozzi.component';
import { HomeComponent } from './components/home/home.component';
import { hasAnyRoleGuard } from '../services/Guards/role.guard';

export default [
    {
        path: '', component: ServicePilotComponent,
        children: [
            { path : '',  component: HomeComponent },
            { path: 'admin', loadChildren: () => import('./admin/admin.routes'), canActivate: [accessoGuard, hasAnyRoleGuard(['Amministratore','Backoffice'])] },
            { path: 'anagrafiche', loadChildren: () => import('./anagrafiche/anagrafiche.routes'), canActivate: [accessoGuard, hasAnyRoleGuard(['Amministratore','Backoffice'])] },
            { path: 'gestione-commesse', loadChildren: () => import('./gestione-commesse/gestione-commesse.routes'), canActivate: [accessoGuard] },
            { path: 'amministratori', loadChildren: () => import('./amministratori/amministratori.routes'), canActivate: [accessoGuard, hasAnyRoleGuard(['Amministratore','Backoffice'])] },
            { path: 'app-info', component: AppInfoComponent, canActivate: [accessoGuard] },
        ],
    },
]