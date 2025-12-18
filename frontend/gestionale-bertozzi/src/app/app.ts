import { Component, OnInit, signal, inject, isDevMode } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { filter, interval, startWith } from 'rxjs';
import { UpdateService } from './services/update.service';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,

    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [
    MessageService,
    ConfirmationService,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('Service Pilot');

  constructor(
    private updateService: UpdateService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService, 
  ) {}
  

  ngOnInit(): void {
    if (!isDevMode()) {
      this.initializeUpdateChecks();
    }
  }

  private initializeUpdateChecks(): void {
    // Sottoscrivi agli aggiornamenti disponibili
    this.updateService.isUpdateAvailable$.subscribe(available => {
      if (available) {
        this.showUpdateAvailablePrompt();
      }
    });

    // Gestisce gli errori non recuperabili del service worker
    if (this.updateService['swUpdate']) {
      this.updateService['swUpdate'].unrecoverable.subscribe(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore App',
          detail: 'Un errore critico è stato rilevato. L\'applicazione verrà ricaricata.',
          life: 5000
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      });
    }
  }

  private showUpdateAvailablePrompt(): void {
    this.confirmationService.confirm({
      message: 'È disponibile una nuova versione dell\'applicazione. Vuoi aggiornare ora?',
      header: 'Aggiornamento Disponibile',
      icon: 'pi pi-refresh',
      acceptLabel: 'Aggiorna Ora',
      rejectLabel: 'Dopo',
      accept: () => {
        this.applyUpdate();
      },
      reject: () => {
        // Mostra notifica per ricordare l'aggiornamento
        this.messageService.add({
          severity: 'info',
          summary: 'Aggiornamento Rimandato',
          detail: 'Puoi aggiornare l\'app ricaricando la pagina quando preferisci.',
          life: 4000
        });
      }
    });
  }

  private applyUpdate(): void {
    // Mostra messaggio di caricamento
    this.messageService.add({
      severity: 'info',
      summary: 'Aggiornamento in corso',
      detail: 'Applicazione dell\'aggiornamento...',
      life: 2000
    });

    // Applica l'aggiornamento utilizzando l'Observable del servizio
    this.updateService.applyUpdate().subscribe({
      next: () => {
        console.log('Update applied successfully');
      },
      error: (error) => {
        console.error('Error applying update:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Errore Aggiornamento',
          detail: 'Errore durante l\'applicazione dell\'aggiornamento. Riprova più tardi.',
          life: 5000
        });
      }
    });
  }
}
