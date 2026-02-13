import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { InputText } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { Commessa } from '../../../models/GestioneCommesse/commessa';
import { PianoSviluppo } from '../../../models/GestioneCommesse/piano-sviluppo';
import { Attivita } from '../../../models/GestioneCommesse/attivita';
import { Utente } from '../../../models/utente';
import { PersonaleCliente } from '../../../models/Anagrafiche/personale-cliente';
import { CommessaService } from '../../../services/GestioneCommesse/commessa.service';
import { PianoSviluppoService } from '../../../services/GestioneCommesse/piano-sviluppo.service';
import { AttivitaService } from '../../../services/GestioneCommesse/attivita.service';
import { UtenteService } from '../../../services/utente.service';
import { PersonaleClienteService } from '../../../services/Anagrafiche/personale-cliente.service';
import moment from 'moment';
import { NavigatorService } from '../../../services/navigator.service';
import { PermissionsService } from '../../../auth/permissions.service';

@Component({
  selector: 'app-dettaglio-commessa',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    ToolbarModule,
    TableModule,
    InputText,
    InputNumberModule,
    MessageModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule,
    ProgressBarModule,
  ],
  templateUrl: './dettaglio-commessa.component.html',
  styleUrl: './dettaglio-commessa.component.css'
})
export class DettaglioCommessaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private commessaService = inject(CommessaService);
  private navigator = inject(NavigatorService);
  private pianoService = inject(PianoSviluppoService);
  private attivitaService = inject(AttivitaService);
  private utenteService = inject(UtenteService);
  private personaleService = inject(PersonaleClienteService);
  private fb = inject(FormBuilder);
  private conf = inject(ConfirmationService);
  private ms = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private permissionsService = inject(PermissionsService);

  commessaId?: number;
  commessa?: Commessa;
  pianiSviluppo: PianoSviluppo[] = [];
  utentiList: Utente[] = [];
  personaleClienteList: PersonaleCliente[] = [];
  expandedRowKeys: { [key: string]: boolean } = {};
  loading: boolean = false;

  // Forms
  nuovoPianoForm?: FormGroup;
  modificaPianoForm?: FormGroup;
  nuovaAttivitaForm?: FormGroup;
  modificaAttivitaForm?: FormGroup;
  aggiornamentoValoreForm?: FormGroup;

  // Dialog visibility
  showDialogCreazionePiano: boolean = false;
  showDialogModificaPiano: boolean = false;
  showDialogCreazioneAttivita: boolean = false;
  showDialogModificaAttivita: boolean = false;
  showDialogAggiornamentoValore: boolean = false;

  // Selected items
  selectedPiano?: PianoSviluppo;
  selectedAttivita?: Attivita;
  pianoForAttivita?: PianoSviluppo;

  // Tipo info da registrare
  tipiInfoDaRegistrare: string[] = [
    'Percentuale completamento',
    'Flag completamento',
    'Lettera',
    'Data'
  ];

  //Getter per gestione permessi - ora centralizzati nel service
  get canDeletePianoSviluppo(): boolean { return this.permissionsService.createEntityHelper('pianosviluppo').canDelete(); }
  get canCreatePianoSviluppo(): boolean { return this.permissionsService.createEntityHelper('pianosviluppo').canCreate(); }
  get canEditPianoSviluppo(): boolean { return this.permissionsService.createEntityHelper('pianosviluppo').canUpdate(); }
  get canDeleteAttivita(): boolean { return this.permissionsService.createEntityHelper('attivita').canDelete(); }
  get canCreateAttivita(): boolean { return this.permissionsService.createEntityHelper('attivita').canCreate(); }
  get canEditAttivita(): boolean { return this.permissionsService.createEntityHelper('attivita').canUpdate(); }

  ngOnInit() {
    // Recupera l'ID della commessa dalla route
    this.route.params.subscribe(params => {
      this.commessaId = +params['id'];
      if (this.commessaId) {
        this.loadData();
      }
    });
  }

  private loadData() {
    this.loading = true;

    forkJoin({
      commessa: this.commessaService.getById(this.commessaId!),
      utenti: this.utenteService.getAll(),
      personale: this.personaleService.getAll()
    }).pipe(first()).subscribe({
      next: (data) => {
        this.commessa = data.commessa;
        this.utentiList = data.utenti.filter(u => !u.isEsterno);
        this.personaleClienteList = data.personale;
        this.pianiSviluppo = this.commessa.pianiSviluppo || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Errore nel caricamento dei dati', err);
        this.ms.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore nel caricamento dei dati della commessa',
          life: 3000,
        });
      }
    });
  }

  private loadPianiSviluppo() {
    if (!this.commessaId) return;

    this.loading = true;

    this.pianoService.getByCommessa(this.commessaId, true)
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.loading = false;
          this.pianiSviluppo = result;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.loading = false;
          if (err.status == 404) {
            this.pianiSviluppo = [];
          }
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Errore nel caricamento dei piani di sviluppo',
            life: 3000,
          });
        },
      });
  }

  // ==================== EXPAND/COLLAPSE ROWS ====================

  expandAll() {
    this.expandedRowKeys = {};
    this.pianiSviluppo.forEach(piano => {
      if (piano.id && piano.attivita && piano.attivita.length > 0) {
        this.expandedRowKeys[piano.id.toString()] = true;
      }
    });
  }

  collapseAll() {
    this.expandedRowKeys = {};
  }

  // ==================== PIANO CRUD ====================

  mostraFormCreazionePiano() {
    if (!this.commessaId) {
      this.ms.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'ID commessa non valido',
        life: 3000,
      });
      return;
    }

    this.nuovoPianoForm = this.fb.group({
      descrizione: ['', [Validators.required, Validators.minLength(3)]],
      ordine: [0, [Validators.required, Validators.min(0)]],
    });

    this.showDialogCreazionePiano = true;
  }

  mostraFormModificaPiano(piano: PianoSviluppo) {
    this.selectedPiano = piano;

    this.modificaPianoForm = this.fb.group({
      descrizione: [piano.descrizione, [Validators.required, Validators.minLength(3)]],
      ordine: [piano.ordine, [Validators.required, Validators.min(0)]],
    });

    this.showDialogModificaPiano = true;
  }

  creaPiano() {
    if (!this.nuovoPianoForm?.valid) return;

    let formValue = this.nuovoPianoForm.value;
    const nuovoPiano = new PianoSviluppo();
    nuovoPiano.descrizione = formValue.descrizione;
    nuovoPiano.ordine = formValue.ordine;
    nuovoPiano.commessaId = this.commessaId!;

    this.pianoService.create(nuovoPiano)
      .subscribe({
        next: () => {
          this.showDialogCreazionePiano = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: 'Piano di sviluppo creato con successo',
          });
          this.loadPianiSviluppo();
        },
        error: (err: any) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile creare il piano di sviluppo',
          });
        },
      });
  }

  modificaPiano() {
    if (!this.modificaPianoForm?.valid) return;

    let formValue = this.modificaPianoForm.value;
    const pianoAggiornato = { ...this.selectedPiano! } as PianoSviluppo;
    pianoAggiornato.descrizione = formValue.descrizione;
    pianoAggiornato.ordine = formValue.ordine;

    this.pianoService.update(this.selectedPiano!.id!, pianoAggiornato)
      .subscribe({
        next: () => {
          this.showDialogModificaPiano = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: 'Piano di sviluppo modificato con successo',
          });
          this.loadPianiSviluppo();
        },
        error: (err: any) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile modificare il piano di sviluppo',
          });
        },
      });
  }

  eliminaPiano(event: Event, piano: PianoSviluppo) {
    this.conf.confirm({
      target: event.target as EventTarget,
      message: 'Sei sicuro di voler eliminare questo piano di sviluppo?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sì',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-primary',
      accept: () => {
        this.pianoService.delete(piano.id!)
          .subscribe({
            next: () => {
              this.ms.add({
                severity: 'success',
                summary: 'Conferma',
                detail: 'Piano di sviluppo eliminato con successo',
              });
              this.loadPianiSviluppo();
            },
            error: (err: any) => {
              console.debug(err);
              this.ms.add({
                severity: 'error',
                summary: 'Errore',
                detail: 'Impossibile eliminare il piano di sviluppo',
              });
            },
          });
      },
    });
  }

  // ==================== ATTIVITA CRUD ====================

  mostraFormCreazioneAttivita(piano: PianoSviluppo) {
    this.pianoForAttivita = piano;

    this.nuovaAttivitaForm = this.fb.group({
      descrizione: ['', [Validators.required, Validators.minLength(3)]],
      tipoInfoDaRegistrare: ['', [Validators.required]],
      ordine: [0, [Validators.required, Validators.min(0)]],
    });

    this.showDialogCreazioneAttivita = true;
  }

  mostraFormModificaAttivita(attivita: Attivita) {
    this.selectedAttivita = attivita;

    this.modificaAttivitaForm = this.fb.group({
      descrizione: [attivita.descrizione, [Validators.required, Validators.minLength(3)]],
      tipoInfoDaRegistrare: [attivita.tipoInfoDaRegistrare, [Validators.required]],
      ordine: [attivita.ordine, [Validators.required, Validators.min(0)]],
    });

    this.showDialogModificaAttivita = true;
  }

  creaAttivita() {
    if (!this.nuovaAttivitaForm?.valid) return;

    let formValue = this.nuovaAttivitaForm.value;
    const nuovaAttivita = new Attivita();
    Object.assign(nuovaAttivita, formValue);
    nuovaAttivita.pianoSviluppoId = this.pianoForAttivita!.id!;

    this.attivitaService.create(nuovaAttivita)
      .subscribe({
        next: () => {
          this.showDialogCreazioneAttivita = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: 'Attività creata con successo',
          });
          this.loadPianiSviluppo();
        },
        error: (err: any) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile creare l\'attività',
          });
        },
      });
  }

  modificaAttivita() {
    if (!this.modificaAttivitaForm?.valid) return;

    let formValue = this.modificaAttivitaForm.value;
    const attivitaAggiornata = { ...this.selectedAttivita! } as Attivita;
    Object.assign(attivitaAggiornata, formValue);

    this.attivitaService.update(this.selectedAttivita!.id!, attivitaAggiornata)
      .subscribe({
        next: () => {
          this.showDialogModificaAttivita = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: 'Attività modificata con successo',
          });
          this.loadPianiSviluppo();
        },
        error: (err: any) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile modificare l\'attività',
          });
        },
      });
  }

  eliminaAttivita(event: Event, attivita: Attivita) {
    this.conf.confirm({
      target: event.target as EventTarget,
      message: 'Sei sicuro di voler eliminare questa attività?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sì',
      rejectLabel: 'No',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-primary',
      accept: () => {
        this.attivitaService.delete(attivita.id!)
          .subscribe({
            next: () => {
              this.ms.add({
                severity: 'success',
                summary: 'Conferma',
                detail: 'Attività eliminata con successo',
              });
              this.loadPianiSviluppo();
            },
            error: (err: any) => {
              console.debug(err);
              this.ms.add({
                severity: 'error',
                summary: 'Errore',
                detail: 'Impossibile eliminare l\'attività',
              });
            },
          });
      },
    });
  }

  // ==================== AGGIORNAMENTO VALORE ATTIVITA ====================

  mostraFormAggiornamentoValore(attivita: Attivita) {
    this.selectedAttivita = attivita;

    // Crea il form in base al tipo di info da registrare
    if (attivita.tipoInfoDaRegistrare === 'Percentuale completamento') {
      this.aggiornamentoValoreForm = this.fb.group({
        percentualeAvanzamento: [attivita.percentualeAvanzamento || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      });
    } else if (attivita.tipoInfoDaRegistrare === 'Flag completamento') {
      this.aggiornamentoValoreForm = this.fb.group({
        completata: [attivita.completata || false],
      });
    } else if (attivita.tipoInfoDaRegistrare === 'Data') {
      this.aggiornamentoValoreForm = this.fb.group({
        dataRiferimento: [attivita.dataRiferimento ? new Date(attivita.dataRiferimento as any) : null, [Validators.required]],
      });
    } else if (attivita.tipoInfoDaRegistrare === 'Lettera') {
      this.aggiornamentoValoreForm = this.fb.group({
        lettera: [attivita.lettera || '', [Validators.required]],
      });
    }

    this.showDialogAggiornamentoValore = true;
    this.cdr.detectChanges();
  }

  aggiornaValore() {
    if (!this.aggiornamentoValoreForm?.valid || !this.selectedAttivita) return;

    let formValue = this.aggiornamentoValoreForm.value;
    const attivitaAggiornata = { ...this.selectedAttivita } as Attivita;

    // Aggiorna il campo specifico in base al tipo
    if (this.selectedAttivita.tipoInfoDaRegistrare === 'Percentuale completamento') {
      attivitaAggiornata.percentualeAvanzamento = formValue.percentualeAvanzamento;
    } else if (this.selectedAttivita.tipoInfoDaRegistrare === 'Flag completamento') {
      attivitaAggiornata.completata = formValue.completata;
    } else if (this.selectedAttivita.tipoInfoDaRegistrare === 'Data') {
      attivitaAggiornata.dataRiferimento = formValue.dataRiferimento ? moment(formValue.dataRiferimento).startOf('day') : undefined;
    } else if (this.selectedAttivita.tipoInfoDaRegistrare === 'Lettera') {
      attivitaAggiornata.lettera = formValue.lettera;
    }

    this.attivitaService.update(this.selectedAttivita.id!, attivitaAggiornata)
      .subscribe({
        next: () => {
          this.showDialogAggiornamentoValore = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: 'Valore attività aggiornato con successo',
          });
          this.loadPianiSviluppo();
        },
        error: (err: any) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile aggiornare il valore dell\'attività',
          });
        },
      });
  }

  tornaAllElencoCommesse() {
    this.navigator.elencoCommesse();
  }

  // ==================== UTILITY ====================

  getNomeUtente(utenteId?: string): string {
    if (!utenteId) return '';
    const utente = this.utentiList.find(u => u.id === utenteId);
    return utente?.nominativo || '';
  }

  getNomePersonale(personaleId?: number): string {
    if (!personaleId) return '';
    const personale = this.personaleClienteList.find(p => p.id === personaleId);
    return personale ? `${personale.nome} ${personale.cognome}` : '';
  }
}
