import { accessoGuard } from "../../services/Guards/accesso.guard";
import { hasAnyRoleGuard } from "../../services/Guards/role.guard";
import { DettaglioCommessaComponent } from "./dettaglio-commessa/dettaglio-commessa.component";
import { ElencoCommesseComponent } from "./elenco-commesse/elenco-commesse.component";
import { GestioneCommesseComponent } from "./gestione-commesse.component";
import { TemplatePianiSviluppoComponent } from "./template-piani-sviluppo/template-piani-sviluppo.component";

export default [
    {
        path: '', component: GestioneCommesseComponent, canActivate: [accessoGuard],
        children: [
            { path: 'template-piani-sviluppo', component: TemplatePianiSviluppoComponent, canActivate: [accessoGuard, hasAnyRoleGuard(['Amministratore', 'Backoffice'])] },
            { path: 'elenco-commesse', component: ElencoCommesseComponent, canActivate: [accessoGuard] },
            { path: 'dettaglio-commessa/:id', component: DettaglioCommessaComponent, canActivate: [accessoGuard] },
            
        ]
    },
]