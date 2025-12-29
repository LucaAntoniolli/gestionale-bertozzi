import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../auth/auth.service';
import { first } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule, ProgressSpinnerModule],
    templateUrl: './app.menu.component.html'
})
export class AppMenu {
    model: MenuItem[] = [];
    ruoloUtente: string = "";
    loading: boolean = false;

    constructor(private auth: AuthService, private cdr: ChangeDetectorRef) { }


    ngOnInit() {
        this.loading = true;
        this.auth.getRoles().pipe(first()).subscribe({
             next: (ruoli) => { 
                this.ruoloUtente = ruoli[0]; 
                this.createMenuForUser(); 
                this.loading = false; 
                this.cdr.detectChanges(); 
            } 
        });
    }

    createMenuForUser() {
        this.model = [];

        if (this.ruoloUtente == "Amministratore") {
            this.model.push(
                {
                    label: 'AMMINISTRAZIONE',
                    items: [
                        { label: 'Gestione utenti', icon: 'pi pi-fw pi-user', routerLink: ['/admin/gestione-utenti'] },
                        {
                            label: 'Gestione anagrafiche',
                            icon: 'pi pi-fw pi-database',
                            items: [
                                { label: 'Tipologie commessa', icon: 'pi pi-fw pi-list', routerLink: ['/anagrafiche/tipologie-commessa'] },
                                { label: 'Status commessa', icon: 'pi pi-fw pi-list', routerLink: ['/anagrafiche/status-commessa'] },
                                { label: 'Modalità pagamento', icon: 'pi pi-fw pi-list', routerLink: ['/anagrafiche/modalita-pagamento'] },
                                { label: 'Clienti', icon: 'pi pi-fw pi-list', routerLink: ['/anagrafiche/clienti'] },
                                { label: 'Personale clienti', icon: 'pi pi-fw pi-users', routerLink: ['/anagrafiche/personale-clienti'] },
                            ]
                        }
                    ]
                },
            );
        }
        this.cdr.detectChanges();
    }
}
