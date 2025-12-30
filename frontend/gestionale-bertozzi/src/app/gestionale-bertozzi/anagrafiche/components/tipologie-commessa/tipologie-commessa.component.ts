import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, map, Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Table, TableModule } from 'primeng/table';
import { DataView, DataViewModule } from 'primeng/dataview';
import * as FileSaver from 'file-saver';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TitoloPaginaComponent } from '../../../shared/components/titolo-pagina/titolo-pagina.component';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TipologiaCommessa } from '../../../../models/Anagrafiche/tipologia-commessa';
import { TipologiaCommessaService } from '../../../../services/Anagrafiche/tipologia-commessa.service';

@Component({
  selector: 'app-tipologie-commessa',
  templateUrl: './tipologie-commessa.component.html',
  styleUrls: ['./tipologie-commessa.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,

    TitoloPaginaComponent,

    ButtonModule,
    DataViewModule,
    DialogModule,
    TableModule,
    ToolbarModule,
    InputText,
    IconFieldModule,
    InputIconModule,
    MessageModule,
  ]
})
export class TipologieCommessaComponent implements OnInit {

  tipologie?: TipologiaCommessa[];
  loading: boolean = true;
  nuovaTipologiaForm?: FormGroup;
  modificaTipologiaForm?: FormGroup;
  showDialogCreazioneTipologia: boolean = false;
  showDialogModificaTipologia: boolean = false;
  tipologia?: TipologiaCommessa;
  errori?: string;

  isMobile$?: Observable<boolean>;

  @ViewChild('filter') filter!: ElementRef;

  constructor(
    private tipologiaService: TipologiaCommessaService,
    private fb: FormBuilder,
    private conf: ConfirmationService,
    private ms: MessageService,
    private bo: BreakpointObserver,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.isMobile$ = this.bo
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .pipe(map((result) => result.matches));

    this.loadData();
  }

  private loadData() {
    this.tipologiaService.getAll().pipe(first())
      .subscribe({
        next: (tip: TipologiaCommessa[]) => {
          this.loading = false;
          this.tipologie = tip;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          if (err.status == 404) {
            this.loading = false;
            this.tipologie = [];
            this.ms.add({
              severity: 'info',
              summary: 'Nessun dato presente',
              detail: 'Nessuna tipologia trovata',
              life: 3000,
            });
          }
        },
      });
  }

  mostraFormCreazioneTipologia() {
    this.nuovaTipologiaForm = this.fb.group({
      descrizione: ['', [Validators.required]],
    });

    this.showDialogCreazioneTipologia = true;
  }

  mostraFormModificaTipologia(event: Event, tipologia: TipologiaCommessa) {
    this.tipologia = tipologia;

    this.modificaTipologiaForm = this.fb.group({
      descrizione: [tipologia.descrizione, [Validators.required]],
    });
    this.showDialogModificaTipologia = true;
  }

  creaTipologia() {
    let formValue = this.nuovaTipologiaForm?.value;
    const nuovaTipologia = new TipologiaCommessa();
    nuovaTipologia.descrizione = formValue?.descrizione;

    this.tipologiaService.create(nuovaTipologia)
      .subscribe({
        next: () => {
          this.showDialogCreazioneTipologia = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: 'Tipologia creata con successo',
          });
          this.loadData();
        },
        error: (err: any) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile creare la tipologia',
          });
        },
      });
  }

  modificaTipologia() {
    let formValue = this.modificaTipologiaForm?.value;
    const tipologiaAggiornata = { ...this.tipologia! } as TipologiaCommessa;
    tipologiaAggiornata.descrizione = formValue?.descrizione;

    this.tipologiaService.update(this.tipologia!.id!, tipologiaAggiornata)
      .subscribe({
        next: () => {
          this.showDialogModificaTipologia = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: 'Tipologia modificata con successo',
          });
          this.loadData();
        },
        error: (err: any) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile modificare la tipologia',
          });
        },
      });
  }

  eliminaTipologia(event: Event, tipologia: TipologiaCommessa) {
    this.conf.confirm({
      target: event.target as EventTarget,
      message: "Sei sicuro di voler eliminare questa tipologia?",
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'No',
      acceptLabel: 'Sì',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.tipologiaService.delete(tipologia.id!).subscribe({
          next: () => {
            this.ms.add({
              severity: 'success',
              summary: 'Tipologia eliminata',
              detail: "La tipologia è stata eliminata con successo",
            });
            this.loadData();
          },
          error: (err: any) => {
            this.ms.add({
              severity: 'error',
              summary: 'Errore',
              detail: 'Impossibile eliminare la tipologia',
            });
          },
        });
      },
      reject: () => {
        this.ms.add({
          severity: 'info',
          summary: 'Operazione annullata',
          detail: "La tipologia non è stata eliminata",
          life: 3000,
        });
      },
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal(
      (event.target as HTMLInputElement).value,
      'contains'
    );
  }

  clear(table: Table) {
    table.clear();
    this.filter.nativeElement.value = '';
  }

  onFilter(dv: DataView, event: Event) {
    dv.filter((event.target as HTMLInputElement).value);
  }

  exportExcel() {
    import('xlsx').then((xlsx) => {
      const tipologieForExcel = this.tipologie?.map(tipologia => ({
        id: tipologia.id,
        descrizione: tipologia.descrizione,
      }));

      if (tipologieForExcel) {
        const worksheet = xlsx.utils.json_to_sheet(tipologieForExcel);
        const workbook = {
          Sheets: { data: worksheet },
          SheetNames: ['data'],
        };
        const excelBuffer: any = xlsx.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        });
        this.saveAsExcelFile(excelBuffer, 'tipologie_commessa');
      }
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE,
    });
    FileSaver.saveAs(
      data,
      fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
    );
  }
}
