import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, forkJoin, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TitoloPaginaComponent } from '../../../shared/components/titolo-pagina/titolo-pagina.component';
import { Collaudo } from '../../../../models/Amministrazione/collaudo.model';
import { CollaudoPagedItemDto } from '../../../../models/Amministrazione/collaudo-paged.model';
import { CollaudoService } from '../../../../services/Amministrazione/collaudo.service';
import { Fornitore } from '../../../../models/Anagrafiche/fornitore';
import { FornitoreService } from '../../../../services/Anagrafiche/fornitore.service';
import { ScopoLavoro } from '../../../../models/Anagrafiche/scopo-lavoro';
import { ScopoLavoroService } from '../../../../services/Anagrafiche/scopo-lavoro.service';
import { CommessaLight } from '../../../../models/GestioneCommesse/commessa-light';
import { CommessaService } from '../../../../services/GestioneCommesse/commessa.service';
import { Routes } from '@angular/router';

@Component({
    selector: 'app-collaudi',
    templateUrl: './collaudi.component.html',
    styleUrls: ['./collaudi.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        CheckboxModule,
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
export class CollaudiComponent implements OnInit {

    // Dati tabella
    collaudiList: CollaudoPagedItemDto[] = [];
    totalRecords: number = 0;
    loading: boolean = false;
    referenceDataLoading: boolean = true;
    totaleImporto: number = 0;

    // Dati di riferimento
    fornitoriList: Fornitore[] = [];
    scopiLavoroList: ScopoLavoro[] = [];
    commesseList: CommessaLight[] = [];

    // Filtri
    filtroFornitoreId?: number;
    filtroScopoLavoroId?: number;
    filtroCommessaId?: number;
    filtroPagato?: boolean;

    // Opzioni filtro pagato
    opzioniPagato = [
        { label: 'Tutti', value: undefined },
        { label: 'Sì', value: true },
        { label: 'No', value: false },
    ];

    // Paginazione
    private currentFirst: number = 0;
    private currentRows: number = 20;

    // Dialog
    showDialog: boolean = false;
    isModifying: boolean = false;
    collaudoForm?: FormGroup;
    selectedCollaudo?: CollaudoPagedItemDto;

    isMobile$?: Observable<boolean>;

    @ViewChild('dt1') table!: Table;

    constructor(
        private collaudoService: CollaudoService,
        private fornitoreService: FornitoreService,
        private scopoLavoroService: ScopoLavoroService,
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
        forkJoin({
            fornitori: this.fornitoreService.getAll(),
            scopiLavoro: this.scopoLavoroService.getAll(),
            commesse: this.commessaService.getAllLight(),
        }).pipe(first()).subscribe({
            next: (data) => {
                this.fornitoriList = data.fornitori;
                this.scopiLavoroList = data.scopiLavoro;
                this.commesseList = data.commesse;
                this.referenceDataLoading = false;
                this.loadData();
                this.cdr.detectChanges();
            },
            error: () => {
                this.referenceDataLoading = false;
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore nel caricamento dei dati di riferimento', life: 3000 });
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
        this.collaudoService.getPaged(
            pageNumber,
            pageSize,
            this.filtroFornitoreId,
            this.filtroScopoLavoroId,
            this.filtroCommessaId,
            this.filtroPagato,
        ).pipe(first()).subscribe({
            next: (response) => {
                this.collaudiList = response.items;
                this.totalRecords = response.totalCount;
                this.totaleImporto = response.totaleImporto;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.collaudiList = [];
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore nel caricamento dei collaudi', life: 3000 });
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
        this.selectedCollaudo = undefined;
        this.collaudoForm = this.fb.group({
            fornitoreId: [null, Validators.required],
            scopoLavoroId: [null, Validators.required],
            commessaId: [null, Validators.required],
            contratto: [''],
            importo: [null, Validators.required],
            pagato: [false],
        });
        this.showDialog = true;
    }

    apriDialogModifica(item: CollaudoPagedItemDto) {
        this.isModifying = true;
        this.selectedCollaudo = item;
        this.collaudoForm = this.fb.group({
            fornitoreId: [item.fornitoreId, Validators.required],
            scopoLavoroId: [item.scopoLavoroId, Validators.required],
            commessaId: [item.commessaId, Validators.required],
            contratto: [item.contratto],
            importo: [item.importo, Validators.required],
            pagato: [item.pagato],
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
        const formValue = this.collaudoForm?.value;
        const nuovoCollaudo = new Collaudo();
        Object.assign(nuovoCollaudo, formValue);

        this.collaudoService.create(nuovoCollaudo).pipe(first()).subscribe({
            next: () => {
                this.showDialog = false;
                this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Collaudo creato con successo' });
                this.loadData();
            },
            error: () => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile creare il collaudo' });
            }
        });
    }

    private modifica() {
        const formValue = this.collaudoForm?.value;
        const collaudoAggiornato = new Collaudo();
        collaudoAggiornato.id = this.selectedCollaudo!.id;
        Object.assign(collaudoAggiornato, formValue);

        this.collaudoService.update(this.selectedCollaudo!.id, collaudoAggiornato).pipe(first()).subscribe({
            next: () => {
                this.showDialog = false;
                this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Collaudo modificato con successo' });
                this.loadData();
            },
            error: () => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile modificare il collaudo' });
            }
        });
    }

    elimina(item: CollaudoPagedItemDto) {
        this.cs.confirm({
            message: 'Sei sicuro di voler eliminare questo collaudo?',
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sì',
            rejectLabel: 'No',
            accept: () => {
                this.collaudoService.delete(item.id).pipe(first()).subscribe({
                    next: () => {
                        this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Collaudo eliminato con successo' });
                        this.loadData();
                    },
                    error: () => {
                        this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore durante l\'eliminazione' });
                    }
                });
            }
        });
    }

    // ─── Export Excel ─────────────────────────────────────────────────────────

    exportExcel() {
        this.collaudoService.getAll(
            this.filtroFornitoreId,
            this.filtroScopoLavoroId,
            this.filtroCommessaId,
            this.filtroPagato
        ).pipe(first()).subscribe({
            next: (collaudi) => {
                import('xlsx').then((xlsx) => {
                    const data = collaudi.map(c => ({
                        'Fornitore': c.fornitore?.ragioneSociale || '-',
                        'Scopo Lavoro': c.scopoLavoro?.descrizione || '-',
                        'Commessa': c.commessa ? `${c.commessa.commessaCodiceInterno} - ${c.commessa.descrizione}` : '-',
                        'Contratto': c.contratto || '-',
                        'Importo (€)': c.importo !== null && c.importo !== undefined ? c.importo : 0,
                        'Pagato': c.pagato ? 'Sì' : 'No',
                    }));
                    const ws = xlsx.utils.json_to_sheet(data);
                    const wb = xlsx.utils.book_new();
                    xlsx.utils.book_append_sheet(wb, ws, 'Collaudi');
                    const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
                    import('file-saver').then(module => {
                        const FileSaver = module.default;
                        const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
                        FileSaver.saveAs(dataBlob, 'collaudi.xlsx');
                    });
                });
            },
            error: () => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore nell\'esportazione dei dati', life: 3000 });
            }
        });
    }

    getCommessaLabel(commessaId?: number): string {
        if (!commessaId) return '-';
        const c = this.commesseList.find(x => x.id === commessaId);
        return c ? `${c.commessaCodiceInterno} - ${c.descrizione}` : String(commessaId);
    }
}

export default [
    { path: '', component: CollaudiComponent }
] satisfies Routes;

