import { accessoGuard } from "../../services/Guards/accesso.guard";
import { AdminGuard } from "../../services/Guards/admin.guard";
import { BackofficeGuard } from "../../services/Guards/backoffice.guard";
import { DettaglioCommessaComponent } from "./dettaglio-commessa/dettaglio-commessa.component";
import { ElencoCommesseComponent } from "./elenco-commesse/elenco-commesse.component";
import { GestioneCommesseComponent } from "./gestione-commesse.component";
import { TemplatePianiSviluppoComponent } from "./template-piani-sviluppo/template-piani-sviluppo.component";

export default [
    {
        path: '', component: GestioneCommesseComponent, canActivate: [accessoGuard],
        children: [
            { path: 'template-piani-sviluppo', component: TemplatePianiSviluppoComponent, canActivate: [accessoGuard, AdminGuard, BackofficeGuard] },
            { path: 'elenco-commesse', component: ElencoCommesseComponent, canActivate: [accessoGuard] },
            { path: 'dettaglio-commessa/:id', component: DettaglioCommessaComponent, canActivate: [accessoGuard] },
            
        ]
    },
]