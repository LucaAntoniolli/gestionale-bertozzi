import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Routes } from '@angular/router';
import { TitoloPaginaComponent } from '../../../shared/components/titolo-pagina/titolo-pagina.component';
import { Onere } from '../../../../models/Amministrazione/onere.model';
import { OnerePagedItemDto } from '../../../../models/Amministrazione/onere-paged.model';
import { OnereService } from '../../../../services/Amministrazione/onere.service';
import { CommessaLight } from '../../../../models/GestioneCommesse/commessa-light';
import { CommessaService } from '../../../../services/GestioneCommesse/commessa.service';

@Component({
    selector: 'app-oneri',
    templateUrl: './oneri.component.html',
    styleUrls: ['./oneri.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        CommonModule,
        DialogModule,
        FormsModule,
        InputNumberModule,
        InputText,
        MessageModule,
        ReactiveFormsModule,
        SelectModule,
        TableModule,
        TitoloPaginaComponent,
        ToolbarModule,
    ]
})
export class OneriComponent implements OnInit {

    // Dati tabella
    oneriList: OnerePagedItemDto[] = [];
    totalRecords: number = 0;
    loading: boolean = false;
    referenceDataLoading: boolean = true;
    totaleImportoOneri: number = 0;

    // Dati di riferimento
    commesseList: CommessaLight[] = [];

    // Filtri
    filtroCommessaId?: number;

    // Paginazione
    private currentFirst: number = 0;
    private currentRows: number = 20;

    // Dialog
    showDialog: boolean = false;
    isModifying: boolean = false;
    onereForm?: FormGroup;
    selectedOnere?: OnerePagedItemDto;

    isMobile$?: Observable<boolean>;

    @ViewChild('dt1') table!: Table;

    constructor(
        private onereService: OnereService,
        private commessaService: CommessaService,
        private fb: FormBuilder,
        private ms: MessageService,
        private cs: ConfirmationService,
        private bo: BreakpointObserver,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.isMobile$ = this.bo
            .observe([Breakpoints.Handset, Breakpoints.Tablet])
            .pipe(map((result) => result.matches));
        this.loadReferenceData();
    }

    private loadReferenceData() {
        this.referenceDataLoading = true;
        this.commessaService.getAllLight().pipe(first()).subscribe({
            next: (commesse) => {
                this.commesseList = commesse;
                this.referenceDataLoading = false;
                this.loadData();
                this.cdr.detectChanges();
            },
            error: () => {
                this.referenceDataLoading = false;
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore nel caricamento delle commesse', life: 3000 });
            }
        });
    }

    loadData(event?: TableLazyLoadEvent) {
        if (event) {
            this.currentFirst = event.first ?? 0;
            this.currentRows = event.rows ?? 20;
        }

        const pageNumber = Math.floor(this.currentFirst / this.currentRows) + 1;
        const pageSize = this.currentRows;

        this.loading = true;
        this.onereService.getPaged(
            pageNumber,
            pageSize,
            this.filtroCommessaId,
        ).pipe(first()).subscribe({
            next: (response) => {
                this.oneriList = response.items;
                this.totalRecords = response.totalCount;
                this.totaleImportoOneri = response.totaleImportoOneri;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.oneriList = [];
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore nel caricamento degli oneri', life: 3000 });
            }
        });
    }

    onFiltroChange() {
        this.currentFirst = 0;
        if (this.table) this.table.first = 0;
        this.loadData();
    }

    // ─── Dialog ───────────────────────────────────────────────────────────────

    apriDialogCrea() {
        this.isModifying = false;
        this.selectedOnere = undefined;
        this.onereForm = this.fb.group({
            commessaId: [null, Validators.required],
            pratica: ['', Validators.required],
            importoOneri: [null, Validators.required],
        });
        this.showDialog = true;
    }

    apriDialogModifica(item: OnerePagedItemDto) {
        this.isModifying = true;
        this.selectedOnere = item;
        this.onereForm = this.fb.group({
            commessaId: [item.commessaId, Validators.required],
            pratica: [item.pratica, Validators.required],
            importoOneri: [item.importoOneri, Validators.required],
        });
        this.showDialog = true;
    }

    salva() {
        if (this.isModifying) {
            this.modifica();
        } else {
            this.crea();
        }
    }

    private crea() {
        const formValue = this.onereForm?.value;
        const nuovoOnere = new Onere();
        Object.assign(nuovoOnere, formValue);

        this.onereService.create(nuovoOnere).pipe(first()).subscribe({
            next: () => {
                this.showDialog = false;
                this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Onere creato con successo' });
                this.loadData();
            },
            error: () => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile creare l\'onere' });
            }
        });
    }

    private modifica() {
        const formValue = this.onereForm?.value;
        const onereAggiornato = new Onere();
        onereAggiornato.id = this.selectedOnere!.id;
        Object.assign(onereAggiornato, formValue);

        this.onereService.update(this.selectedOnere!.id, onereAggiornato).pipe(first()).subscribe({
            next: () => {
                this.showDialog = false;
                this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Onere modificato con successo' });
                this.loadData();
            },
            error: () => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile modificare l\'onere' });
            }
        });
    }

    elimina(item: OnerePagedItemDto) {
        this.cs.confirm({
            message: 'Sei sicuro di voler eliminare questo onere?',
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'S\u00ec',
            rejectLabel: 'No',
            accept: () => {
                this.onereService.delete(item.id).pipe(first()).subscribe({
                    next: () => {
                        this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Onere eliminato con successo' });
                        this.loadData();
                    },
                    error: () => {
                        this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore durante l\'eliminazione' });
                    }
                });
            }
        });
    }
}

export default [
    { path: '', component: OneriComponent }
] satisfies Routes;

