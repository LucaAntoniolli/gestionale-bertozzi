import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, forkJoin, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TemplatePianoSviluppo } from '../../../models/TemplatePianiSviluppo/template-piano-sviluppo';
import { TemplateAttivita } from '../../../models/TemplatePianiSviluppo/template-attivita';
import { TipologiaCommessa } from '../../../models/Anagrafiche/tipologia-commessa';
import { TemplatePianoSviluppoService } from '../../../services/TemplatePianiSviluppo/template-piano-sviluppo.service';
import { TemplateAttivitaService } from '../../../services/TemplatePianiSviluppo/template-attivita.service';
import { TipologiaCommessaService } from '../../../services/Anagrafiche/tipologia-commessa.service';
import { TitoloPaginaComponent } from '../../shared/components/titolo-pagina/titolo-pagina.component';
import { PermissionsService } from '../../../auth/permissions.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-template-piani-sviluppo',
  templateUrl: './template-piani-sviluppo.component.html',
  styleUrls: ['./template-piani-sviluppo.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TitoloPaginaComponent,
    ButtonModule,
    DialogModule,
    ToolbarModule,
    TableModule,
    InputText,
    InputIconModule,
    IconFieldModule,
    MessageModule,
    SelectModule,
  ]
})
export class TemplatePianiSviluppoComponent implements OnInit {

  pianiSviluppo: TemplatePianoSviluppo[] = [];
  tipologieCommessa: TipologiaCommessa[] = [];
  selectedTipologiaCommessa?: TipologiaCommessa;
  expandedRowKeys: { [key: string]: boolean } = {};
  loading: boolean = false;
  canAddPianoSviluppo: boolean = true;

  // Forms
  pianoForm?: FormGroup;
  attivitaForm?: FormGroup;

  // Dialog visibility
  showDialogPiano: boolean = false;
  showDialogAttivita: boolean = false;

  // Dialog mode
  isModificaPiano: boolean = false;
  isModificaAttivita: boolean = false;

  // Selected items
  selectedPiano?: TemplatePianoSviluppo;
  selectedAttivita?: TemplateAttivita;
  pianoForAttivita?: TemplatePianoSviluppo;

  // Tipo info da registrare
  tipiInfoDaRegistrare: string[] = [
    'Percentuale completamento',
    'Flag completamento',
    'Lettera',
    'Data'
  ];

  isMobile$?: Observable<boolean>;  

  //Getter per gestione permessi - ora centralizzati nel service
  get canDeletePianoSviluppo(): boolean { return this.permissionsService.createEntityHelper('pianosviluppo').canDelete(); }
  get canCreatePianoSviluppo(): boolean { return this.permissionsService.createEntityHelper('pianosviluppo').canCreate(); }
  get canEditPianoSviluppo(): boolean { return this.permissionsService.createEntityHelper('pianosviluppo').canUpdate(); }
  get canDeleteAttivita(): boolean { return this.permissionsService.createEntityHelper('attivita').canDelete(); }
  get canCreateAttivita(): boolean { return this.permissionsService.createEntityHelper('attivita').canCreate(); }
  get canEditAttivita(): boolean { return this.permissionsService.createEntityHelper('attivita').canUpdate(); }

  constructor(
    private pianoService: TemplatePianoSviluppoService,
    private attivitaService: TemplateAttivitaService,
    private tipologiaService: TipologiaCommessaService,
    private fb: FormBuilder,
    private conf: ConfirmationService,
    private ms: MessageService,
    private cdr: ChangeDetectorRef,
    private permissionsService: PermissionsService,
    private bo: BreakpointObserver,
  ) { }

  ngOnInit() {
    this.isMobile$ = this.bo
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .pipe(map((result) => result.matches));
      
    this.loadTipologie();
  }

  private loadTipologie() {
    this.tipologiaService.getAll()
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.tipologieCommessa = result;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Errore nel caricamento delle tipologie',
            life: 3000,
          });
        },
      });
  }

  onTipologiaChange() {
    if (this.selectedTipologiaCommessa) {
      this.loadPianiSviluppo();
    } else {
      this.pianiSviluppo = [];
    }
  }

  private loadPianiSviluppo() {
    if (!this.selectedTipologiaCommessa?.id) return;

    this.loading = true;

    this.pianoService.getByTipologiaCommessa(this.selectedTipologiaCommessa.id, true)
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.loading = false;
          this.pianiSviluppo = result;
          this.canAddPianoSviluppo = this.pianiSviluppo.length === 0;
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
    if (!this.selectedTipologiaCommessa) {
      this.ms.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Seleziona prima una tipologia di commessa',
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

  mostraFormModificaPiano(piano: TemplatePianoSviluppo) {
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
    const formValue = this.pianoForm.value;

    if (this.isModificaPiano && this.selectedPiano?.id) {
      const pianoAggiornato = { ...this.selectedPiano } as TemplatePianoSviluppo;
      pianoAggiornato.descrizione = formValue.descrizione;
      pianoAggiornato.ordine = formValue.ordine;

      this.pianoService.update(this.selectedPiano.id, pianoAggiornato)
        .subscribe({
          next: () => {
            this.showDialogPiano = false;
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
    } else {
      const nuovoPiano = new TemplatePianoSviluppo();
      nuovoPiano.descrizione = formValue.descrizione;
      nuovoPiano.ordine = formValue.ordine;
      nuovoPiano.tipologiaCommessaId = this.selectedTipologiaCommessa!.id!;

      this.pianoService.create(nuovoPiano)
        .subscribe({
          next: () => {
            this.showDialogPiano = false;
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
  }

  eliminaPiano(event: Event, piano: TemplatePianoSviluppo) {
    this.conf.confirm({
      target: event.target as EventTarget,
      message: 'Sei sicuro di voler eliminare questo piano di sviluppo?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sì',
      rejectLabel: 'No',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
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

  mostraFormCreazioneAttivita(piano: TemplatePianoSviluppo) {
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

  mostraFormModificaAttivita(attivita: TemplateAttivita) {
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
    const formValue = this.attivitaForm.value;

    if (this.isModificaAttivita && this.selectedAttivita?.id) {
      const attivitaAggiornata = { ...this.selectedAttivita } as TemplateAttivita;
      Object.assign(attivitaAggiornata, formValue);

      this.attivitaService.update(this.selectedAttivita.id, attivitaAggiornata)
        .subscribe({
          next: () => {
            this.showDialogAttivita = false;
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
    } else {
      const nuovaAttivita = new TemplateAttivita();
      Object.assign(nuovaAttivita, formValue);
      nuovaAttivita.pianoSviluppoId = this.pianoForAttivita!.id!;

      this.attivitaService.create(nuovaAttivita)
        .subscribe({
          next: () => {
            this.showDialogAttivita = false;
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
  }

  eliminaAttivita(event: Event, attivita: TemplateAttivita) {
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

  // ==================== EXPORT ====================

  exportExcel() {
    import('xlsx').then((xlsx) => {
      const data = this.pianiSviluppo.map(piano => ({
        'Descrizione Piano': piano.descrizione,
        'Numero Attività': piano.attivita?.length || 0,
      }));
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      this.saveAsExcelFile(excelBuffer, 'template-piani-sviluppo');
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    import('file-saver').then((module) => {
      if (module && module.default) {
        let EXCEL_TYPE =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        let EXCEL_EXTENSION = '.xlsx';
        const data: Blob = new Blob([buffer], {
          type: EXCEL_TYPE,
        });
        module.default.saveAs(
          data,
          fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
        );
      }
    });
  }

}