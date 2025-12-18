import { UserComponent } from './user.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

export default [
    {
        path: '', component: UserComponent,
        children: [
            { path: 'user-profile', component: UserProfileComponent },
        ]
    },
]