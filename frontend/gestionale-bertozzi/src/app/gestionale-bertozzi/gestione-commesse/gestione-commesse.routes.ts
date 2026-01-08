import { accessoGuard } from "../../services/Guards/accesso.guard";
import { AdminGuard } from "../../services/Guards/admin.guard";
import { GestioneCommesseComponent } from "./gestione-commesse.component";
import { TemplatePianiSviluppoComponent } from "./template-piani-sviluppo/template-piani-sviluppo.component";

export default [
    {
        path: '', component: GestioneCommesseComponent, canActivate: [accessoGuard, AdminGuard],
        children: [
            { path: 'template-piani-sviluppo', component: TemplatePianiSviluppoComponent, canActivate: [accessoGuard, AdminGuard] },
            
        ]
    },
]