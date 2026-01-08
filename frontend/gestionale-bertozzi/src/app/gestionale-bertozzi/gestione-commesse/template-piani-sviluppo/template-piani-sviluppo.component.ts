import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, forkJoin } from 'rxjs';
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

  // Forms
  nuovoPianoForm?: FormGroup;
  modificaPianoForm?: FormGroup;
  nuovaAttivitaForm?: FormGroup;
  modificaAttivitaForm?: FormGroup;

  // Dialog visibility
  showDialogCreazionePiano: boolean = false;
  showDialogModificaPiano: boolean = false;
  showDialogCreazioneAttivita: boolean = false;
  showDialogModificaAttivita: boolean = false;

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

  constructor(
    private pianoService: TemplatePianoSviluppoService,
    private attivitaService: TemplateAttivitaService,
    private tipologiaService: TipologiaCommessaService,
    private fb: FormBuilder,
    private conf: ConfirmationService,
    private ms: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
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

    this.nuovoPianoForm = this.fb.group({
      descrizione: ['', [Validators.required, Validators.minLength(3)]],
      ordine: [0, [Validators.required, Validators.min(0)]],
    });

    this.showDialogCreazionePiano = true;
  }

  mostraFormModificaPiano(piano: TemplatePianoSviluppo) {
    this.selectedPiano = piano;

    this.modificaPianoForm = this.fb.group({
      descrizione: [piano.descrizione, [Validators.required, Validators.minLength(3)]],
      ordine: [piano.ordine, [Validators.required, Validators.min(0)]],
    });

    this.showDialogModificaPiano = true;
  }

  creaPiano() {
    let formValue = this.nuovoPianoForm?.value;
    const nuovoPiano = new TemplatePianoSviluppo();
    nuovoPiano.descrizione = formValue.descrizione;
    nuovoPiano.ordine = formValue.ordine;
    nuovoPiano.tipologiaCommessaId = this.selectedTipologiaCommessa!.id!;

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
    let formValue = this.modificaPianoForm?.value;
    const pianoAggiornato = { ...this.selectedPiano! } as TemplatePianoSviluppo;
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
          console.log("Error updating piano:", err);  
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile modificare il piano di sviluppo',
          });
        },
      });
  }

  eliminaPiano(event: Event, piano: TemplatePianoSviluppo) {
    this.conf.confirm({
      target: event.target as EventTarget,
      message: 'Sei sicuro di voler eliminare questo piano di sviluppo?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sì',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
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
    this.pianoForAttivita = piano;

    this.nuovaAttivitaForm = this.fb.group({
      descrizione: ['', [Validators.required, Validators.minLength(3)]],
      tipoInfoDaRegistrare: ['', [Validators.required]],
      ordine: [0, [Validators.required, Validators.min(0)]],
    });

    this.showDialogCreazioneAttivita = true;
  }

  mostraFormModificaAttivita(attivita: TemplateAttivita) {
    this.selectedAttivita = attivita;

    this.modificaAttivitaForm = this.fb.group({
      descrizione: [attivita.descrizione, [Validators.required, Validators.minLength(3)]],
      tipoInfoDaRegistrare: [attivita.tipoInfoDaRegistrare, [Validators.required]],
      ordine: [attivita.ordine, [Validators.required, Validators.min(0)]],
    });

    this.showDialogModificaAttivita = true;
  }

  creaAttivita() {
    let formValue = this.nuovaAttivitaForm?.value;
    const nuovaAttivita = new TemplateAttivita();
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
    let formValue = this.modificaAttivitaForm?.value;
    const attivitaAggiornata = { ...this.selectedAttivita! } as TemplateAttivita;
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

  eliminaAttivita(event: Event, attivita: TemplateAttivita) {
    this.conf.confirm({
      target: event.target as EventTarget,
      message: 'Sei sicuro di voler eliminare questa attività?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sì',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
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