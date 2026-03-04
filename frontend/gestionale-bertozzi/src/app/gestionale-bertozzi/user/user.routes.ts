import { UserComponent } from './user.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { accessoGuard } from '../../services/Guards/accesso.guard';
import { hasAnyRoleGuard } from '../../services/Guards/role.guard';

export default [
    {
        path: '', component: UserComponent,
        children: [
            { path: 'user-profile', component: UserProfileComponent, canActivate: [accessoGuard, hasAnyRoleGuard(['Amministratore', 'Backoffice'])]},
        ]
    },
]