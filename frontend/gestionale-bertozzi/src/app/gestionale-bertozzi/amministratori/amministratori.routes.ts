import { accessoGuard } from '../../services/Guards/accesso.guard';
import { hasAnyRoleGuard } from '../../services/Guards/role.guard';
import { AmministratoriComponent } from './amministratori.component';

export default [
    {
        path: '', component: AmministratoriComponent,
        children: [
            { path: 'costi-trasferta', loadChildren: () => import('./components/costi-trasferta/costi-trasferta.component'), canActivate: [accessoGuard, hasAnyRoleGuard(['Amministratore','Backoffice'])] },
            { path: 'oneri', loadChildren: () => import('./components/oneri/oneri.component'), canActivate: [accessoGuard, hasAnyRoleGuard(['Amministratore','Backoffice'])] },
            { path: 'collaudi', loadChildren: () => import('./components/collaudi/collaudi.component'), canActivate: [accessoGuard] },
        ],
    },
]