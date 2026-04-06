import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { NavigatorService } from '../../../services/navigator.service';
import { AuthService } from '../../../auth/auth.service';
import { PermissionsService } from '../../../auth/permissions.service';
import { DividerModule } from 'primeng/divider';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        CardModule,
        DividerModule
    ],
})
export class HomeComponent {

    constructor(
        private auth: AuthService,
        private navigator: NavigatorService,
        private permissionsService: PermissionsService,
    ) {}

    //Getter per gestione permessi 
    get canReadUser(): boolean { return this.permissionsService.createEntityHelper('user').canRead(); }
    get canReadCliente(): boolean { return this.permissionsService.createEntityHelper('cliente').canRead(); }
    get canReadStatusCommessa(): boolean { return this.permissionsService.createEntityHelper('statuscommessa').canRead(); }
    get canReadTipologiaCommessa(): boolean { return this.permissionsService.createEntityHelper('tipologiacommessa').canRead(); }
    get canReadModalitaPagamento(): boolean { return this.permissionsService.createEntityHelper('modalitapagamento').canRead(); }
    get canReadTempleatePianoSviluppo(): boolean { return this.permissionsService.createEntityHelper('templatepianosviluppo').canRead(); }
    get canReadCommessa(): boolean { return this.permissionsService.createEntityHelper('commessa').canRead(); }

    // Getters per visibilità sezioni
    get hasBasicInfoPermissions(): boolean { 
        return this.canReadUser || this.canReadTipologiaCommessa || this.canReadStatusCommessa || this.canReadModalitaPagamento;
    }

    get hasClientAndCommessaPermissions(): boolean { 
        return this.canReadCliente || this.canReadTempleatePianoSviluppo || this.canReadCommessa;
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

    navigateToGestioneTemplatePianoSviluppo() {
        this.navigator.gestioneTemplatePianoSviluppo();
    }

    navigateToGestioneCommesse() {
        this.navigator.elencoCommesse();
    }

    navigateToDashboard() {
        this.navigator.dashboard();
    }

    navigateToPlanning() {
        this.navigator.planning();
    }

    navigateToOreESpese() {
        this.navigator.oreESpese();
    }
}
