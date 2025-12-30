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
import { MessageModule } from 'primeng/message';
import { TitoloPaginaComponent } from '../../../shared/components/titolo-pagina/titolo-pagina.component';
import { InputText } from 'primeng/inputtext';
import { ModalitaPagamento } from '../../../../models/Anagrafiche/modalita-pagamento';
import { ModalitaPagamentoService } from '../../../../services/Anagrafiche/modalita-pagamento.service';

@Component({
    selector: 'app-modalita-pagamento',
    templateUrl: './modalita-pagamento.component.html',
    styleUrls: ['./modalita-pagamento.component.css'],
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
export class ModalitaPagamentoComponent implements OnInit {

    modalitaList?: ModalitaPagamento[];
    loading: boolean = true;
    nuovaModalitaForm?: FormGroup;
    modificaModalitaForm?: FormGroup;
    showDialogCreazioneModalita: boolean = false;
    showDialogModificaModalita: boolean = false;
    modalita?: ModalitaPagamento;
    errori?: string;

    isMobile$?: Observable<boolean>;

    @ViewChild('filter') filter!: ElementRef;

    constructor(
        private modalitaService: ModalitaPagamentoService,
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
        this.modalitaService.getAll().pipe(first())
            .subscribe({
                next: (modalitaList: ModalitaPagamento[]) => {
                    this.loading = false;
                    this.modalitaList = modalitaList;
                    this.cdr.detectChanges();
                },
                error: (err: any) => {
                    if (err.status == 404) {
                        this.loading = false;
                        this.modalitaList = [];
                        this.ms.add({
                            severity: 'info',
                            summary: 'Nessun dato presente',
                            detail: 'Nessuna modalità di pagamento trovata',
                            life: 3000,
                        });
                    }
                },
            });
    }

    mostraFormCreazioneModalita() {
        this.nuovaModalitaForm = this.fb.group({
            descrizione: ['', [Validators.required]],
        });

        this.showDialogCreazioneModalita = true;
    }

    mostraFormModificaModalita(event: Event, modalita: ModalitaPagamento) {
        this.modalita = modalita;

        this.modificaModalitaForm = this.fb.group({
            descrizione: [modalita.descrizione, [Validators.required]],
        });
        this.showDialogModificaModalita = true;
    }

    creaModalita() {
        let formValue = this.nuovaModalitaForm?.value;
        const nuovaModalita = new ModalitaPagamento();
        nuovaModalita.descrizione = formValue?.descrizione;

        this.modalitaService.create(nuovaModalita)
            .subscribe({
                next: () => {
                    this.showDialogCreazioneModalita = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Modalità di pagamento creata con successo',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Impossibile creare la modalità di pagamento',
                    });
                },
            });
    }

    modificaModalita() {
        let formValue = this.modificaModalitaForm?.value;
        const modalitaAggiornata = { ...this.modalita! } as ModalitaPagamento;
        modalitaAggiornata.descrizione = formValue?.descrizione;

        this.modalitaService.update(this.modalita!.id!, modalitaAggiornata)
            .subscribe({
                next: () => {
                    this.showDialogModificaModalita = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Modalità di pagamento modificata con successo',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Impossibile modificare la modalità di pagamento',
                    });
                },
            });
    }

    eliminaModalita(event: Event, modalita: ModalitaPagamento) {
        this.conf.confirm({
            target: event.target as EventTarget,
            message: "Sei sicuro di voler eliminare questa modalità di pagamento?",
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'No',
            acceptLabel: 'Sì',
            acceptIcon: 'pi pi-check',
            rejectIcon: 'pi pi-times',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.modalitaService.delete(modalita.id!).subscribe({
                    next: () => {
                        this.ms.add({
                            severity: 'success',
                            summary: 'Modalità eliminata',
                            detail: "La modalità di pagamento è stata eliminata con successo",
                        });
                        this.loadData();
                    },
                    error: (err: any) => {
                        this.ms.add({
                            severity: 'error',
                            summary: 'Errore',
                            detail: 'Impossibile eliminare la modalità di pagamento',
                        });
                    },
                });
            },
            reject: () => {
                this.ms.add({
                    severity: 'info',
                    summary: 'Operazione annullata',
                    detail: "La modalità di pagamento non è stata eliminata",
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
            const modalitaForExcel = this.modalitaList?.map(modalita => ({
                id: modalita.id,
                descrizione: modalita.descrizione,
            }));

            if (modalitaForExcel) {
                const worksheet = xlsx.utils.json_to_sheet(modalitaForExcel);
                const workbook = {
                    Sheets: { data: worksheet },
                    SheetNames: ['data'],
                };
                const excelBuffer: any = xlsx.write(workbook, {
                    bookType: 'xlsx',
                    type: 'array',
                });
                this.saveAsExcelFile(excelBuffer, 'modalita_pagamento');
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
