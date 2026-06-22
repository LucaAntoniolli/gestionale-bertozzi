import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TitoloPaginaComponent } from '../../shared/components/titolo-pagina/titolo-pagina.component';

@Component({
    selector: 'app-planning-amministrativo',
    templateUrl: './planning-amministrativo.component.html',
    styleUrls: ['./planning-amministrativo.component.css'],
    standalone: true,
    imports: [CardModule, TitoloPaginaComponent],
})
export class PlanningAmministrativoComponent {}
