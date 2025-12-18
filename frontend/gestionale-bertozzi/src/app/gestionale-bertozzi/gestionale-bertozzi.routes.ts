
import { AppInfoComponent } from './components/app-info/app-info.component';
import { accessoGuard } from '../services/Guards/accesso.guard';
import { AdminGuard } from '../services/Guards/admin.guard';
import { ServicePilotComponent } from './gestionale-bertozzi.component';

export default [
    {
        path: '', component: ServicePilotComponent,
        children: [
            { path: 'admin', loadChildren: () => import('./admin/admin.routes'), canActivate: [accessoGuard, AdminGuard] },
            { path: 'app-info', component: AppInfoComponent, canActivate: [accessoGuard] },
        ],
    },
]