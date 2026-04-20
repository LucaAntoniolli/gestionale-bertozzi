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
import { ScopoLavoro } from '../../../../models/Anagrafiche/scopo-lavoro';
import { ScopoLavoroService } from '../../../../services/Anagrafiche/scopo-lavoro.service';

@Component({
    selector: 'app-scopi-lavoro',
    templateUrl: './scopi-lavoro.component.html',
    styleUrls: ['./scopi-lavoro.component.css'],
    standalone: true,
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
export class ScopiLavoroComponent implements OnInit {

    scopiList?: ScopoLavoro[];
    loading: boolean = true;
    nuovoScopoForm?: FormGroup;
    modificaScopoForm?: FormGroup;
    showDialogCreazione: boolean = false;
    showDialogModifica: boolean = false;
    scopo?: ScopoLavoro;

    isMobile$?: Observable<boolean>;

    @ViewChild('filter') filter!: ElementRef;

    constructor(
        private scopoLavoroService: ScopoLavoroService,
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
        this.scopoLavoroService.getAll().pipe(first())
            .subscribe({
                next: (list: ScopoLavoro[]) => {
                    this.loading = false;
                    this.scopiList = list;
                    this.cdr.markForCheck();
                },
                error: (err: any) => {
                    if (err.status == 404) {
                        this.loading = false;
                        this.scopiList = [];
                        this.ms.add({
                            severity: 'info',
                            summary: 'Nessun dato presente',
                            detail: 'Nessuno scopo lavoro trovato',
                            life: 3000,
                        });
                    }
                },
            });
    }

    mostraFormCreazione() {
        this.nuovoScopoForm = this.fb.group({
            descrizione: ['', [Validators.required]],
        });
        this.showDialogCreazione = true;
    }

    mostraFormModifica(event: Event, scopo: ScopoLavoro) {
        this.scopo = scopo;
        this.modificaScopoForm = this.fb.group({
            descrizione: [scopo.descrizione, [Validators.required]],
        });
        this.showDialogModifica = true;
    }

    creaScopo() {
        const formValue = this.nuovoScopoForm?.value;
        const nuovoScopo = new ScopoLavoro();
        nuovoScopo.descrizione = formValue?.descrizione;

        this.scopoLavoroService.create(nuovoScopo)
            .subscribe({
                next: () => {
                    this.showDialogCreazione = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Scopo lavoro creato con successo',
                    });
                    this.loadData();
                },
                error: () => {
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Impossibile creare lo scopo lavoro',
                    });
                },
            });
    }

    modificaScopo() {
        const formValue = this.modificaScopoForm?.value;
        const scopoAggiornato = { ...this.scopo! } as ScopoLavoro;
        scopoAggiornato.descrizione = formValue?.descrizione;

        this.scopoLavoroService.update(this.scopo!.id!, scopoAggiornato)
            .subscribe({
                next: () => {
                    this.showDialogModifica = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Scopo lavoro modificato con successo',
                    });
                    this.loadData();
                },
                error: () => {
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Impossibile modificare lo scopo lavoro',
                    });
                },
            });
    }

    eliminaScopo(event: Event, scopo: ScopoLavoro) {
        this.conf.confirm({
            target: event.target as EventTarget,
            message: 'Sei sicuro di voler eliminare questo scopo lavoro?',
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'No',
            acceptLabel: 'Sì',
            acceptIcon: 'pi pi-check',
            rejectIcon: 'pi pi-times',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-primary',
            accept: () => {
                this.scopoLavoroService.delete(scopo.id!).subscribe({
                    next: () => {
                        this.ms.add({
                            severity: 'success',
                            summary: 'Scopo lavoro eliminato',
                            detail: 'Lo scopo lavoro è stato eliminato con successo',
                        });
                        this.loadData();
                    },
                    error: () => {
                        this.ms.add({
                            severity: 'error',
                            summary: 'Errore',
                            detail: 'Impossibile eliminare lo scopo lavoro',
                        });
                    },
                });
            },
            reject: () => {
                this.ms.add({
                    severity: 'info',
                    summary: 'Operazione annullata',
                    detail: 'Lo scopo lavoro non è stato eliminato',
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
            const dataForExcel = this.scopiList?.map(s => ({
                id: s.id,
                descrizione: s.descrizione,
            }));

            if (dataForExcel) {
                const worksheet = xlsx.utils.json_to_sheet(dataForExcel);
                const workbook = {
                    Sheets: { data: worksheet },
                    SheetNames: ['data'],
                };
                const excelBuffer: any = xlsx.write(workbook, {
                    bookType: 'xlsx',
                    type: 'array',
                });
                this.saveAsExcelFile(excelBuffer, 'scopi_lavoro');
            }
        });
    }

    saveAsExcelFile(buffer: any, fileName: string): void {
        const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const EXCEL_EXTENSION = '.xlsx';
        const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
        FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
    }
}
