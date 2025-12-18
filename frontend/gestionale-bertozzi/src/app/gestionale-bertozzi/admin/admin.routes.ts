import { accessoGuard } from "../../services/Guards/accesso.guard";
import { AdminGuard } from "../../services/Guards/admin.guard";
import { AdminComponent } from "./admin.component";
import { GestioneUtentiComponent } from "./components/gestione-utenti/gestione-utenti.component";

export default [
    {
        path: '', component: AdminComponent,
        children: [
            { path: 'gestione-utenti', component: GestioneUtentiComponent, canActivate: [accessoGuard, AdminGuard] },
        ]
    },
]