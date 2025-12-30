import { accessoGuard } from "../../services/Guards/accesso.guard";
import { AdminGuard } from "../../services/Guards/admin.guard";
import { AnagraficheComponent } from "./anagrafiche.component";
import { GestioneClientiComponent } from "./components/gestione-clienti/gestione-clienti.component";
import { ModalitaPagamentoComponent } from "./components/modalita-pagamento/modalita-pagamento.component";
import { StatusCommessaComponent } from "./components/status-commessa/status-commessa.component";
import { TipologieCommessaComponent } from "./components/tipologie-commessa/tipologie-commessa.component";

export default [
    {
        path: '', component: AnagraficheComponent,
        children: [
            { path: 'tipologie-commessa', component: TipologieCommessaComponent },
            { path: 'status-commessa', component: StatusCommessaComponent },
            { path: 'modalita-pagamento', component: ModalitaPagamentoComponent },
            { path: 'gestione-clienti', component: GestioneClientiComponent },
        ]
    },
]