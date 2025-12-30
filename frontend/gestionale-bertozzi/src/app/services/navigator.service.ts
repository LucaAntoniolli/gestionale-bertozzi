import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigatorService {

  constructor(
    private router: Router,
  ) { }

  userProfile() {
    this.router.navigate(['/', 'user', 'user-profile']);
  }

  passwordLost() {
    this.router.navigate(['/', 'auth/', 'password-lost']);
  }

  gestioneUtenti() {
    this.router.navigate(['/admin/gestione-utenti']);
  }

  gestioneTipologieCommessa() {
    this.router.navigate(['/anagrafiche/tipologie-commessa']);
  }

  gestioneStatusCommessa() {
    this.router.navigate(['/anagrafiche/status-commessa']);
  }

  gestioneModalitaPagamento() {
    this.router.navigate(['/anagrafiche/modalita-pagamento']);
  }

  gestioneClienti() {
    this.router.navigate(['/anagrafiche/gestione-clienti']);
  }


}