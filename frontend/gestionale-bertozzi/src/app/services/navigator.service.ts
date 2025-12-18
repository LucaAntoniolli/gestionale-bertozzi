import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigatorService {

  constructor(
    private router: Router,
  ) { }

  userProfile(){
    this.router.navigate(['/', 'user', 'user-profile']);
  }

  passwordLost() {
    this.router.navigate(['/', 'auth/', 'password-lost']);
  }

  gestioneUtenti() {
    this.router.navigate(['/framework/admin/gestione-utenti']);
  }

  gestioneAttivita() {
    this.router.navigate(['/framework/attivita/gestione-attivita']);
  }

  dettaglioAttivita(id: number) {
    this.router.navigate([`/framework/attivita/dettaglio-attivita/${id}`]);
  }

  dashboardAttivita() {
    this.router.navigate(['/framework/dashboards/dashboard-attivita']);
  }
}