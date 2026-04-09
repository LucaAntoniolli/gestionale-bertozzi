import { accessoGuard } from "../../services/Guards/accesso.guard";
import { hasAnyRoleGuard } from "../../services/Guards/role.guard";
import { AdminComponent } from "./admin.component";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { GestioneUtentiComponent } from "./components/gestione-utenti/gestione-utenti.component";

export default [
    {
        path: '', component: AdminComponent,
        children: [
            { path: 'dashboard', component: DashboardComponent, canActivate: [accessoGuard, hasAnyRoleGuard(['Amministratore','Backoffice'])] },
            { path: 'gestione-utenti', component: GestioneUtentiComponent, canActivate: [accessoGuard, hasAnyRoleGuard(['Amministratore','Backoffice'])] },
        ]
    },
]