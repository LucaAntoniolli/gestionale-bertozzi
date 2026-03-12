import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, forkJoin, map, Observable } from 'rxjs';
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
import { PanelModule } from 'primeng/panel';
import { KnobModule } from 'primeng/knob';
import { AvatarModule } from 'primeng/avatar';
import { OreSpeseCommessa } from '../../../models/GestioneCommesse/ore-spese-commessa.model';
import { OreSpeseCommessaService } from '../../../services/GestioneCommesse/ore-spese-commessa.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DrawerModule } from 'primeng/drawer';
import { DashboardService } from '../../../services/dashboard.service';
import { OrePerUtenteItem } from '../../../models/dashboard.model';

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
    PanelModule,
    KnobModule,
    AvatarModule,
    DrawerModule
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
  private oreSpeseCommessaService = inject(OreSpeseCommessaService);
  private dashboardService = inject(DashboardService);
  private fb = inject(FormBuilder);
  private conf = inject(ConfirmationService);
  private ms = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private permissionsService = inject(PermissionsService);
  private bo = inject(BreakpointObserver);

  commessaId?: number;
  commessa?: Commessa;
  pianiSviluppo: PianoSviluppo[] = [];
  utentiList: Utente[] = [];
  utentiOreSpeseList: Utente[] = [];
  personaleClienteList: PersonaleCliente[] = [];
  oreSpeseList: OreSpeseCommessa[] = [];
  expandedRowKeys: { [key: string]: boolean } = {};
  loading: boolean = false;
  percentualeAttivitaCompletate: number = 0;
  numeroAttivitaPerTipo: { [key: string]: number } = {};
  numeroTotaleAttivita: number = 0;
  totaleOreSpese: number = 0;
  totaleSpese: number = 0;
  totaleChilometri: number = 0;

  // Forms
  pianoForm?: FormGroup;
  attivitaForm?: FormGroup;
  aggiornamentoValoreForm?: FormGroup;
  oreSpeseForm?: FormGroup;

  // Drawer ore per utente
  showDrawerOrePerUtente: boolean = false;
  orePerUtenteList: OrePerUtenteItem[] = [];
  loadingOrePerUtente: boolean = false;

  // Dialog visibility
  showDialogPiano: boolean = false;
  showDialogAttivita: boolean = false;
  showDialogAggiornamentoValore: boolean = false;
  showDialogOreSpese: boolean = false;

  // Dialog mode
  isModificaPiano: boolean = false;
  isModificaAttivita: boolean = false;
  isModificaOreSpese: boolean = false;

  // Selected items
  selectedPiano?: PianoSviluppo;
  selectedAttivita?: Attivita;
  selectedOreSpese?: OreSpeseCommessa;
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
  get canEditAvanzamentoAttivita(): boolean { return this.permissionsService.createEntityHelper('avanzamento-attivita').canUpdate(); }
  get canCreateOreSpeseCommessa(): boolean { return this.permissionsService.createEntityHelper('orespesecommessa').canCreate(); }
  get canEditOreSpeseCommessa(): boolean { return this.permissionsService.createEntityHelper('orespesecommessa').canUpdate(); }
  get canDeleteOreSpeseCommessa(): boolean { return this.permissionsService.createEntityHelper('orespesecommessa').canDelete(); }

  isMobile$?: Observable<boolean>;
  
  ngOnInit() {
    // Recupera l'ID della commessa dalla route
    this.route.params.subscribe(params => {
      this.commessaId = +params['id'];
      if (this.commessaId) {
        this.loadData();
      }
    });

    this.isMobile$ = this.bo
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .pipe(map((result) => result.matches));
  }

  private loadData() {
    this.loading = true;

    forkJoin({
      commessa: this.commessaService.getById(this.commessaId!),
      utenti: this.utenteService.getAll(),
      personale: this.personaleService.getAll(),
      oreSpese: this.oreSpeseCommessaService.getAll(this.commessaId)
    }).pipe(first()).subscribe({
      next: (data) => {
        this.commessa = data.commessa;
        this.utentiList = data.utenti.filter(u => !u.isEsterno);
        this.utentiOreSpeseList = data.utenti;
        this.personaleClienteList = data.personale;
        this.oreSpeseList = data.oreSpese;
        this.pianiSviluppo = this.commessa.pianiSviluppo || [];
        this.calcolaTotaliOreSpese();
        this.calcolaNumeroAttivitaCompletate();
        this.calcolaPercentualeCompletamento();
        this.calcolaNumeroAttivitaTotaliePerTipo();
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

  private loadOreSpeseCommessa() {
    if (!this.commessaId) return;

    this.oreSpeseCommessaService.getAll(this.commessaId)
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.oreSpeseList = result;
          this.calcolaTotaliOreSpese();
          this.cdr.detectChanges();
        },
        error: () => {
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Errore nel caricamento delle ore e spese',
            life: 3000,
          });
        },
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
          this.calcolaNumeroAttivitaCompletate();
          this.calcolaPercentualeCompletamento();
          this.calcolaNumeroAttivitaTotaliePerTipo();
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

    this.isModificaPiano = false;
    this.selectedPiano = undefined;

    this.pianoForm = this.fb.group({
      descrizione: ['', [Validators.required, Validators.minLength(3)]],
      ordine: [0, [Validators.required, Validators.min(0)]],
    });

    this.showDialogPiano = true;
  }

  mostraFormModificaPiano(piano: PianoSviluppo) {
    this.isModificaPiano = true;
    this.selectedPiano = piano;

    this.pianoForm = this.fb.group({
      descrizione: [piano.descrizione, [Validators.required, Validators.minLength(3)]],
      ordine: [piano.ordine, [Validators.required, Validators.min(0)]],
    });

    this.showDialogPiano = true;
  }

  salvaPiano() {
    if (!this.pianoForm?.valid) return;

    let formValue = this.pianoForm.value;
    const operation$ = this.isModificaPiano && this.selectedPiano?.id
      ? (() => {
          const pianoAggiornato = { ...this.selectedPiano! } as PianoSviluppo;
          pianoAggiornato.descrizione = formValue.descrizione;
          pianoAggiornato.ordine = formValue.ordine;
          return this.pianoService.update(this.selectedPiano!.id!, pianoAggiornato);
        })()
      : (() => {
          const nuovoPiano = new PianoSviluppo();
          nuovoPiano.descrizione = formValue.descrizione;
          nuovoPiano.ordine = formValue.ordine;
          nuovoPiano.commessaId = this.commessaId!;
          return this.pianoService.create(nuovoPiano);
        })();

    operation$
      .subscribe({
        next: () => {
          this.showDialogPiano = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: this.isModificaPiano
              ? 'Piano di sviluppo modificato con successo'
              : 'Piano di sviluppo creato con successo',
          });
          this.loadPianiSviluppo();
        },
        error: (err: any) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: this.isModificaPiano
              ? 'Impossibile modificare il piano di sviluppo'
              : 'Impossibile creare il piano di sviluppo',
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
    this.isModificaAttivita = false;
    this.selectedAttivita = undefined;
    this.pianoForAttivita = piano;

    this.attivitaForm = this.fb.group({
      descrizione: ['', [Validators.required, Validators.minLength(3)]],
      tipoInfoDaRegistrare: ['', [Validators.required]],
      ordine: [0, [Validators.required, Validators.min(0)]],
    });

    this.showDialogAttivita = true;
  }

  mostraFormModificaAttivita(attivita: Attivita) {
    this.isModificaAttivita = true;
    this.selectedAttivita = attivita;

    this.attivitaForm = this.fb.group({
      descrizione: [attivita.descrizione, [Validators.required, Validators.minLength(3)]],
      tipoInfoDaRegistrare: [attivita.tipoInfoDaRegistrare, [Validators.required]],
      ordine: [attivita.ordine, [Validators.required, Validators.min(0)]],
    });

    this.showDialogAttivita = true;
  }

  salvaAttivita() {
    if (!this.attivitaForm?.valid) return;

    let formValue = this.attivitaForm.value;
    const operation$ = this.isModificaAttivita && this.selectedAttivita?.id
      ? (() => {
          const attivitaAggiornata = { ...this.selectedAttivita! } as Attivita;
          Object.assign(attivitaAggiornata, formValue);
          return this.attivitaService.update(this.selectedAttivita!.id!, attivitaAggiornata);
        })()
      : (() => {
          const nuovaAttivita = new Attivita();
          Object.assign(nuovaAttivita, formValue);
          nuovaAttivita.pianoSviluppoId = this.pianoForAttivita!.id!;
          return this.attivitaService.create(nuovaAttivita);
        })();

    operation$
      .subscribe({
        next: () => {
          this.showDialogAttivita = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: this.isModificaAttivita
              ? 'Attività modificata con successo'
              : 'Attività creata con successo',
          });
          this.loadPianiSviluppo();
        },
        error: (err: any) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: this.isModificaAttivita
              ? 'Impossibile modificare l\'attività'
              : 'Impossibile creare l\'attività',
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

  // ORE E SPESE //

  apriDrawerOrePerUtente() {
    if (!this.commessaId) return;
    this.showDrawerOrePerUtente = true;
    this.loadingOrePerUtente = true;
    this.dashboardService.getOrePerUtente(this.commessaId).pipe(first()).subscribe({
      next: (data) => {
        this.orePerUtenteList = data;
        this.loadingOrePerUtente = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingOrePerUtente = false;
        this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore nel caricamento delle ore per dipendente', life: 3000 });
      }
    });
  }

  caricaOreSuCommessa() {
    this.isModificaOreSpese = false;
    this.selectedOreSpese = undefined;

    this.oreSpeseForm = this.fb.group({
      pianoSviluppoId: [null, [Validators.required]],
      utenteId: [null, [Validators.required]],
      data: [null, [Validators.required]],
      ore: [0, [Validators.required, Validators.min(0)]],
      spese: [null, [Validators.min(0)]],
      chilometri: [null, [Validators.min(0)]],
      note: ['']
    });

    this.showDialogOreSpese = true;
  }

  mostraFormModificaOreSpese(oreSpese: OreSpeseCommessa) {
    this.isModificaOreSpese = true;
    this.selectedOreSpese = oreSpese;

    this.oreSpeseForm = this.fb.group({
      pianoSviluppoId: [oreSpese.pianoSviluppoId, [Validators.required]],
      utenteId: [oreSpese.utenteId, [Validators.required]],
      data: [oreSpese.data ? oreSpese.data.toDate() : null, [Validators.required]],
      ore: [oreSpese.ore ?? 0, [Validators.required, Validators.min(0)]],
      spese: [oreSpese.spese, [Validators.min(0)]],
      chilometri: [oreSpese.chilometri, [Validators.min(0)]],
      note: [oreSpese.note || '']
    });

    this.showDialogOreSpese = true;
  }

  salvaOreSpese() {
    if (!this.oreSpeseForm?.valid || !this.commessaId) return;

    const formValue = this.oreSpeseForm.value;
    const operation$ = this.isModificaOreSpese && this.selectedOreSpese?.id
      ? (() => {
          const oreSpeseAggiornata = { ...this.selectedOreSpese } as OreSpeseCommessa;
          oreSpeseAggiornata.commessaId = this.commessaId!;
          oreSpeseAggiornata.pianoSviluppoId = formValue.pianoSviluppoId;
          oreSpeseAggiornata.utenteId = formValue.utenteId;
          oreSpeseAggiornata.data = formValue.data ? moment(formValue.data).startOf('day') : undefined;
          oreSpeseAggiornata.ore = formValue.ore;
          oreSpeseAggiornata.spese = formValue.spese;
          oreSpeseAggiornata.chilometri = formValue.chilometri;
          oreSpeseAggiornata.note = formValue.note;
          return this.oreSpeseCommessaService.update(this.selectedOreSpese!.id!, oreSpeseAggiornata);
        })()
      : (() => {
          const nuovaOreSpese = new OreSpeseCommessa();
          nuovaOreSpese.commessaId = this.commessaId!;
          nuovaOreSpese.pianoSviluppoId = formValue.pianoSviluppoId;
          nuovaOreSpese.utenteId = formValue.utenteId;
          nuovaOreSpese.data = formValue.data ? moment(formValue.data).startOf('day') : undefined;
          nuovaOreSpese.ore = formValue.ore;
          nuovaOreSpese.spese = formValue.spese;
          nuovaOreSpese.chilometri = formValue.chilometri;
          nuovaOreSpese.note = formValue.note;
          return this.oreSpeseCommessaService.create(nuovaOreSpese);
        })();

    operation$
      .subscribe({
        next: () => {
          this.showDialogOreSpese = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: this.isModificaOreSpese
              ? 'Ore e spese modificate con successo'
              : 'Ore e spese caricate con successo',
          });
          this.loadOreSpeseCommessa();
        },
        error: (err: any) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: this.isModificaOreSpese
              ? 'Impossibile modificare ore e spese'
              : 'Impossibile caricare ore e spese',
          });
        },
      });
  }

  eliminaOreSpese(event: Event, oreSpese: OreSpeseCommessa) {
    this.conf.confirm({
      target: event.target as EventTarget,
      message: 'Sei sicuro di voler eliminare questa riga ore/spese?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sì',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-primary',
      accept: () => {
        this.oreSpeseCommessaService.delete(oreSpese.id!)
          .subscribe({
            next: () => {
              this.ms.add({
                severity: 'success',
                summary: 'Conferma',
                detail: 'Riga ore/spese eliminata con successo',
              });
              this.loadOreSpeseCommessa();
            },
            error: (err: any) => {
              console.debug(err);
              this.ms.add({
                severity: 'error',
                summary: 'Errore',
                detail: 'Impossibile eliminare la riga ore/spese',
              });
            },
          });
      },
    });
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

  getNomePianoSviluppo(pianoSviluppoId?: number): string {
    if (!pianoSviluppoId) return '';
    const piano = this.pianiSviluppo.find(p => p.id === pianoSviluppoId);
    return piano?.descrizione || '';
  }

  calcolaNumeroAttivitaCompletate(): void {
    let countTotale = 0;
    let countCompletate = 0;  
    this.pianiSviluppo.forEach(piano => {
      piano.attivita?.forEach(attivita => {
          countTotale++;
        if (attivita.tipoInfoDaRegistrare === 'Flag completamento' && attivita.completata) {
          countCompletate++;
        }
      });
    });

    this.percentualeAttivitaCompletate = countTotale > 0 ? Number(((countCompletate / countTotale) * 100).toFixed(1)) : 0;
  } 

  calcolaPercentualeCompletamento(): void {
    let countAttConPercentuale = 0;
    let percentualeTotale = 0;
    this.pianiSviluppo.forEach(piano => {
      piano.attivita?.forEach(attivita => {
        if(attivita.tipoInfoDaRegistrare === 'Percentuale completamento' && attivita.percentualeAvanzamento) {
          countAttConPercentuale++;
          percentualeTotale += attivita.percentualeAvanzamento;
        }
      });
    });
  }

  calcolaNumeroAttivitaTotaliePerTipo(): void{  
    this.numeroAttivitaPerTipo = {};
    this.numeroTotaleAttivita = 0;

    this.pianiSviluppo.forEach(piano => {
      piano.attivita?.forEach(attivita => {
        this.numeroTotaleAttivita++;
        if(attivita.tipoInfoDaRegistrare) {
          this.numeroAttivitaPerTipo[attivita.tipoInfoDaRegistrare] = (this.numeroAttivitaPerTipo[attivita.tipoInfoDaRegistrare] || 0) + 1;
        }
      });
    });
  }

  calcolaTotaliOreSpese(): void {
    this.totaleOreSpese = this.oreSpeseList.reduce((sum, item) => sum + (item.ore ?? 0), 0);
    this.totaleSpese = this.oreSpeseList.reduce((sum, item) => sum + (item.spese ?? 0), 0);
    this.totaleChilometri = this.oreSpeseList.reduce((sum, item) => sum + (item.chilometri ?? 0), 0);
  }
}
