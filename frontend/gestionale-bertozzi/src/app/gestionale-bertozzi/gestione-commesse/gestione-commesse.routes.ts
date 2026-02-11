import { accessoGuard } from "../../services/Guards/accesso.guard";
import { AdminGuard } from "../../services/Guards/admin.guard";
import { DettaglioCommessaComponent } from "./dettaglio-commessa/dettaglio-commessa.component";
import { ElencoCommesseComponent } from "./elenco-commesse/elenco-commesse.component";
import { GestioneCommesseComponent } from "./gestione-commesse.component";
import { TemplatePianiSviluppoComponent } from "./template-piani-sviluppo/template-piani-sviluppo.component";

export default [
    {
        path: '', component: GestioneCommesseComponent, canActivate: [accessoGuard, AdminGuard],
        children: [
            { path: 'template-piani-sviluppo', component: TemplatePianiSviluppoComponent, canActivate: [accessoGuard, AdminGuard] },
            { path: 'elenco-commesse', component: ElencoCommesseComponent, canActivate: [accessoGuard, AdminGuard] },
            { path: 'dettaglio-commessa/:id', component: DettaglioCommessaComponent, canActivate: [accessoGuard, AdminGuard] },
            
        ]
    },
]