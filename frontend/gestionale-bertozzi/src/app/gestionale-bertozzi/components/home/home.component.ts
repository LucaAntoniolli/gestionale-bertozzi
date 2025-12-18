import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TitoloPaginaComponent } from '../../shared/components/titolo-pagina/titolo-pagina.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { NavigatorService } from '../../../services/navigator.service';
import { AuthService } from '../../../auth/auth.service';
import { first } from 'rxjs/internal/operators/first';
import { JwtDecoderService } from '../../../auth/jwt-decoder.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    standalone: true,
    imports: [
        CommonModule,
        TitoloPaginaComponent,
        ButtonModule,
        CardModule
    ],
})
export class HomeComponent {
    
    ruoliUtente: String[] = [];
    isAdmin: boolean = false;

    constructor(
        private auth: AuthService,
        private cdr: ChangeDetectorRef,
        private jwtDecoder: JwtDecoderService,
        private navigator: NavigatorService,) {
        this.isAdmin = this.auth.isUserAdmin();
    }


    navigateToGestioneUtenti() {
        this.navigator.gestioneUtenti();
    }

    navigateToGestioneAttivita() {
        this.navigator.gestioneAttivita();
    }

    navigateToDashboardAttivita() {
        this.navigator.dashboardAttivita();
    }
}
