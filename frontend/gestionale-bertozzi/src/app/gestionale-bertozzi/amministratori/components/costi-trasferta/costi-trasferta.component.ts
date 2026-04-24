import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, forkJoin, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
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
import { CostoTrasferta } from '../../../../models/Amministrazione/costo-trasferta.model';
import { CostoTrasfertaPagedItemDto } from '../../../../models/Amministrazione/costo-trasferta-paged.model';
import { CostoTrasfertaService } from '../../../../services/Amministrazione/costo-trasferta.service';
import { Cliente } from '../../../../models/Anagrafiche/cliente';
import { ClienteService } from '../../../../services/Anagrafiche/cliente.service';
import { CommessaLight } from '../../../../models/GestioneCommesse/commessa-light';
import { CommessaService } from '../../../../services/GestioneCommesse/commessa.service';
import { Utente } from '../../../../models/utente';
import { UtenteService } from '../../../../services/utente.service';

@Component({
    selector: 'app-costi-trasferta',
    templateUrl: './costi-trasferta.component.html',
    styleUrls: ['./costi-trasferta.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        CommonModule,
        DatePickerModule,
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
export class CostiTrasfertaComponent implements OnInit {

    // Dati tabella
    costiTrasfertaList: CostoTrasfertaPagedItemDto[] = [];
    totalRecords: number = 0;
    loading: boolean = false;
    referenceDataLoading: boolean = true;
    totaleCostoTotale: number = 0;

    // Dati di riferimento
    clientiList: Cliente[] = [];
    commesseList: CommessaLight[] = [];
    commesseDialogList: CommessaLight[] = [];
    commesseDialogLoading: boolean = false;
    utentiList: Utente[] = [];

    // Filtri
    filtroClienteId?: number;
    filtroCommessaId?: number;
    filtroUtenteId?: string;
    filtroDataDaFrom?: Date;
    filtroDataDaTo?: Date;

    // Paginazione
    private currentFirst: number = 0;
    private currentRows: number = 20;

    // Dialog
    showDialog: boolean = false;
    isModifying: boolean = false;
    costoTrasfertaForm?: FormGroup;
    selectedCostoTrasferta?: CostoTrasfertaPagedItemDto;

    isMobile$?: Observable<boolean>;

    @ViewChild('dt1') table!: Table;

    constructor(
        private costoTrasfertaService: CostoTrasfertaService,
        private clienteService: ClienteService,
        private commessaService: CommessaService,
        private utenteService: UtenteService,
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
            clienti: this.clienteService.getAll(false),
            commesse: this.commessaService.getAllLight(),
            utenti: this.utenteService.getAll(),
        }).pipe(first()).subscribe({
            next: (data) => {
                this.clientiList = data.clienti;
                this.commesseList = data.commesse;
                this.utentiList = data.utenti.filter(u => u.ruoli?.includes('Amministratore') &&  u.costoKmAuto != null && u.costoKmAuto > 0);
                this.referenceDataLoading = false;
                this.loadData();
                this.cdr.markForCheck();
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
        this.costoTrasfertaService.getPaged(
            pageNumber,
            pageSize,
            this.filtroClienteId,
            this.filtroCommessaId,
            this.filtroUtenteId,
            this.filtroDataDaFrom ? moment(this.filtroDataDaFrom) : undefined,
            this.filtroDataDaTo ? moment(this.filtroDataDaTo) : undefined,
        ).pipe(first()).subscribe({
            next: (response) => {
                this.costiTrasfertaList = response.items;
                this.totalRecords = response.totalCount;
                this.totaleCostoTotale = response.totaleCostoTotale;
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.loading = false;
                this.costiTrasfertaList = [];
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore nel caricamento dei costi trasferta', life: 3000 });
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
        this.selectedCostoTrasferta = undefined;
        this.commesseDialogList = [];
        this.costoTrasfertaForm = this.fb.group({
            clienteId: [null, Validators.required],
            commessaId: [null, Validators.required],
            utenteId: [null, Validators.required],
            localitaPartenza: [''],
            localitaArrivo: [''],
            chilometri: [null],
            costoChilometri: [null],
            costoTelepass: [null],
            costoHotel: [null],
            costoTreno: [null],
            dataDa: [null],
            dataA: [null],
        });
        this.subscribeCalcoloKm();
        this.showDialog = true;
    }

    apriDialogModifica(item: CostoTrasfertaPagedItemDto) {
        this.isModifying = true;
        this.selectedCostoTrasferta = item;
        this.commesseDialogList = [];
        this.costoTrasfertaForm = this.fb.group({
            clienteId: [item.clienteId, Validators.required],
            commessaId: [item.commessaId, Validators.required],
            utenteId: [item.utenteId, Validators.required],
            localitaPartenza: [item.localitaPartenza],
            localitaArrivo: [item.localitaArrivo],
            chilometri: [item.chilometri],
            costoChilometri: [item.costoChilometri],
            costoTelepass: [item.costoTelepass],
            costoHotel: [item.costoHotel],
            costoTreno: [item.costoTreno],
            dataDa: [item.dataDa ? item.dataDa.toDate() : null],
            dataA: [item.dataA ? item.dataA.toDate() : null],
        });
        this.subscribeCalcoloKm();
        if (item.clienteId) {
            this.commesseDialogLoading = true;
            this.commessaService.getAll(item.clienteId).pipe(first()).subscribe({
                next: (commesse) => {
                    this.commesseDialogList = commesse;
                    this.commesseDialogLoading = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.commesseDialogLoading = false;
                    this.commesseDialogList = [];
                }
            });
        }
        this.showDialog = true;
    }

    private ricalcolaCostoKm() {
        const chilometri = this.costoTrasfertaForm?.get('chilometri')?.value;
        const utenteId = this.costoTrasfertaForm?.get('utenteId')?.value;
        if (chilometri != null && utenteId) {
            const utente = this.utentiList.find(u => u.id === utenteId);
            if (utente?.costoKmAuto != null) {
                const costo = Math.round(chilometri * utente.costoKmAuto * 10000) / 10000;
                this.costoTrasfertaForm?.get('costoChilometri')?.setValue(costo, { emitEvent: false });
            }
        }
    }

    private subscribeCalcoloKm() {
        this.costoTrasfertaForm?.get('chilometri')?.valueChanges.subscribe(() => this.ricalcolaCostoKm());
        this.costoTrasfertaForm?.get('utenteId')?.valueChanges.subscribe(() => this.ricalcolaCostoKm());
    }

    onDialogClienteChange(event: any) {
        this.costoTrasfertaForm?.get('commessaId')?.setValue(null);
        const clienteId = event.value;
        if (clienteId) {
            this.commesseDialogLoading = true;
            this.commessaService.getAll(clienteId).pipe(first()).subscribe({
                next: (commesse) => {
                    this.commesseDialogList = commesse;
                    this.commesseDialogLoading = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.commesseDialogLoading = false;
                    this.commesseDialogList = [];
                }
            });
        } else {
            this.commesseDialogList = [];
        }
    }

    salva() {
        if (this.isModifying) {
            this.modifica();
        } else {
            this.crea();
        }
    }

    private buildPayload(): CostoTrasferta {
        const formValue = this.costoTrasfertaForm?.value;
        const payload = new CostoTrasferta();
        Object.assign(payload, formValue);
        if (formValue.dataDa) payload.dataDa = moment(formValue.dataDa);
        else payload.dataDa = undefined;
        if (formValue.dataA) payload.dataA = moment(formValue.dataA);
        else payload.dataA = undefined;
        return payload;
    }

    private crea() {
        const payload = this.buildPayload();
        this.costoTrasfertaService.create(payload).pipe(first()).subscribe({
            next: () => {
                this.showDialog = false;
                this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Costo trasferta creato con successo' });
                this.loadData();
            },
            error: () => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile creare il costo trasferta' });
            }
        });
    }

    private modifica() {
        const payload = this.buildPayload();
        payload.id = this.selectedCostoTrasferta!.id;
        this.costoTrasfertaService.update(this.selectedCostoTrasferta!.id, payload).pipe(first()).subscribe({
            next: () => {
                this.showDialog = false;
                this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Costo trasferta modificato con successo' });
                this.loadData();
            },
            error: () => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile modificare il costo trasferta' });
            }
        });
    }

    elimina(item: CostoTrasfertaPagedItemDto) {
        this.cs.confirm({
            message: 'Sei sicuro di voler eliminare questo costo trasferta?',
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'S\u00ec',
            rejectLabel: 'No',
            accept: () => {
                this.costoTrasfertaService.delete(item.id).pipe(first()).subscribe({
                    next: () => {
                        this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Costo trasferta eliminato con successo' });
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
        this.costoTrasfertaService.getAll(
            this.filtroClienteId,
            this.filtroCommessaId,
            this.filtroUtenteId
        ).pipe(first()).subscribe({
            next: (costi) => {
                import('xlsx').then((xlsx) => {
                    const data = costi.map(c => ({
                        'Cliente': c.commessa?.cliente?.ragioneSociale || '-',
                        'Commessa': c.commessa ? `${c.commessa.commessaCodiceInterno} - ${c.commessa.descrizione}` : '-',
                        'Utente': c.utente?.nominativo || '-',
                        'Partenza': c.localitaPartenza || '-',
                        'Arrivo': c.localitaArrivo || '-',
                        'Data Da': c.dataDa ? new Date(c.dataDa.toDate()).toLocaleDateString('it-IT') : '-',
                        'Data A': c.dataA ? new Date(c.dataA.toDate()).toLocaleDateString('it-IT') : '-',
                        'Km': c.chilometri !== null && c.chilometri !== undefined ? c.chilometri : 0,
                        'Costo Km (€)': c.costoChilometri !== null && c.costoChilometri !== undefined ? c.costoChilometri : 0,
                        'Telepass (€)': c.costoTelepass !== null && c.costoTelepass !== undefined ? c.costoTelepass : 0,
                        'Hotel (€)': c.costoHotel !== null && c.costoHotel !== undefined ? c.costoHotel : 0,
                        'Treno (€)': c.costoTreno !== null && c.costoTreno !== undefined ? c.costoTreno : 0,
                    }));
                    const ws = xlsx.utils.json_to_sheet(data);
                    const wb = xlsx.utils.book_new();
                    xlsx.utils.book_append_sheet(wb, ws, 'Costi Trasferta');
                    const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
                    import('file-saver').then(module => {
                        const FileSaver = module.default;
                        const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
                        FileSaver.saveAs(dataBlob, 'costi-trasferta.xlsx');
                    });
                });
            },
            error: () => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore nell\'esportazione dei dati', life: 3000 });
            }
        });
    }
}

export default [
    { path: '', component: CostiTrasfertaComponent }
] satisfies Routes;

