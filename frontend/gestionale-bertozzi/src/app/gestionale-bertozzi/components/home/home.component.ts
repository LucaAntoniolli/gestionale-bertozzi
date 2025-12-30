import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { NavigatorService } from '../../../services/navigator.service';
import { AuthService } from '../../../auth/auth.service';
import { JwtDecoderService } from '../../../auth/jwt-decoder.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        CardModule,
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

    navigateToGestioneTipologieCommessa() {
        this.navigator.gestioneTipologieCommessa();
    }

    navigateToGestioneStatusCommessa() {
        this.navigator.gestioneStatusCommessa();
    }

    navigateToGestioneModalitaPagamento() {
        this.navigator.gestioneModalitaPagamento();
    }

    navigateToGestioneClienti() {
        this.navigator.gestioneClienti();
    }
}
