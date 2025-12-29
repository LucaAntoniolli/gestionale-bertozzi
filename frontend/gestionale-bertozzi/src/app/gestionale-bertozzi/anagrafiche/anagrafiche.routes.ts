import { accessoGuard } from "../../services/Guards/accesso.guard";
import { AdminGuard } from "../../services/Guards/admin.guard";
import { AnagraficheComponent } from "./anagrafiche.component";
import { TipologieCommessaComponent } from "./components/tipologie-commessa/tipologie-commessa.component";

export default [
    {
        path: '', component: AnagraficheComponent,
        children: [
            { path: 'tipologie-commessa', component: TipologieCommessaComponent },
        ]
    },
]