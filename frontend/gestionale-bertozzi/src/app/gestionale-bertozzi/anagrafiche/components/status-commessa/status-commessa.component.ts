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
import { StatusCommessa } from '../../../../models/Anagrafiche/status-commessa';
import { StatusCommessaService } from '../../../../services/Anagrafiche/status-commessa.service';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
    selector: 'app-status-commessa',
    templateUrl: './status-commessa.component.html',
    styleUrls: ['./status-commessa.component.css'],
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
        InputNumberModule,
        IconFieldModule,
        InputIconModule,
        MessageModule,
    ]
})
export class StatusCommessaComponent implements OnInit {

    statusList?: StatusCommessa[];
    loading: boolean = true;
    nuovoStatusForm?: FormGroup;
    modificaStatusForm?: FormGroup;
    showDialogCreazioneStatus: boolean = false;
    showDialogModificaStatus: boolean = false;
    status?: StatusCommessa;
    errori?: string;

    isMobile$?: Observable<boolean>;

    @ViewChild('filter') filter!: ElementRef;

    constructor(
        private statusService: StatusCommessaService,
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
        this.statusService.getAll().pipe(first())
            .subscribe({
                next: (statusList: StatusCommessa[]) => {
                    this.loading = false;
                    this.statusList = statusList;
                    this.cdr.detectChanges();
                },
                error: (err: any) => {
                    if (err.status == 404) {
                        this.loading = false;
                        this.statusList = [];
                        this.ms.add({
                            severity: 'info',
                            summary: 'Nessun dato presente',
                            detail: 'Nessuno status trovato',
                            life: 3000,
                        });
                    }
                },
            });
    }

    mostraFormCreazioneStatus() {
        this.nuovoStatusForm = this.fb.group({
            descrizione: ['', [Validators.required]],
            ordine: [1, [Validators.required, Validators.min(1)]],
        });

        this.showDialogCreazioneStatus = true;
    }

    mostraFormModificaStatus(event: Event, status: StatusCommessa) {
        this.status = status;

        this.modificaStatusForm = this.fb.group({
            descrizione: [status.descrizione, [Validators.required]],
            ordine: [status.ordine, [Validators.required, Validators.min(1)]],
        });
        this.showDialogModificaStatus = true;
    }

    creaStatus() {
        let formValue = this.nuovoStatusForm?.value;
        const nuovoStatus = new StatusCommessa();
        nuovoStatus.descrizione = formValue?.descrizione;
        nuovoStatus.ordine = formValue?.ordine;

        this.statusService.create(nuovoStatus)
            .subscribe({
                next: () => {
                    this.showDialogCreazioneStatus = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Status creato con successo',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Impossibile creare lo status',
                    });
                },
            });
    }

    modificaStatus() {
        let formValue = this.modificaStatusForm?.value;
        const statusAggiornato = { ...this.status! } as StatusCommessa;
        statusAggiornato.descrizione = formValue?.descrizione;
        statusAggiornato.ordine = formValue?.ordine;

        this.statusService.update(this.status!.id!, statusAggiornato)
            .subscribe({
                next: () => {
                    this.showDialogModificaStatus = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Status modificato con successo',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Impossibile modificare lo status',
                    });
                },
            });
    }

    eliminaStatus(event: Event, status: StatusCommessa) {
        this.conf.confirm({
            target: event.target as EventTarget,
            message: "Sei sicuro di voler eliminare questo status?",
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'No',
            acceptLabel: 'Sì',
            acceptIcon: 'pi pi-check',
            rejectIcon: 'pi pi-times',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.statusService.delete(status.id!).subscribe({
                    next: () => {
                        this.ms.add({
                            severity: 'success',
                            summary: 'Status eliminato',
                            detail: "Lo status è stato eliminato con successo",
                        });
                        this.loadData();
                    },
                    error: (err: any) => {
                        this.ms.add({
                            severity: 'error',
                            summary: 'Errore',
                            detail: 'Impossibile eliminare lo status',
                        });
                    },
                });
            },
            reject: () => {
                this.ms.add({
                    severity: 'info',
                    summary: 'Operazione annullata',
                    detail: "Lo status non è stato eliminato",
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
            const statusForExcel = this.statusList?.map(status => ({
                id: status.id,
                ordine: status.ordine,
                descrizione: status.descrizione,
            }));

            if (statusForExcel) {
                const worksheet = xlsx.utils.json_to_sheet(statusForExcel);
                const workbook = {
                    Sheets: { data: worksheet },
                    SheetNames: ['data'],
                };
                const excelBuffer: any = xlsx.write(workbook, {
                    bookType: 'xlsx',
                    type: 'array',
                });
                this.saveAsExcelFile(excelBuffer, 'status_commessa');
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
