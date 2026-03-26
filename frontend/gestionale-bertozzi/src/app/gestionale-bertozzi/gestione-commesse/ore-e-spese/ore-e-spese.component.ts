import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { first, forkJoin, map, Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import moment from 'moment';

import { TitoloPaginaComponent } from '../../shared/components/titolo-pagina/titolo-pagina.component';
import { OreSpesePagedItemDto } from '../../../models/GestioneCommesse/ore-spese-paged.model';
import { OreSpeseCommessa } from '../../../models/GestioneCommesse/ore-spese-commessa.model';
import { OreSpeseCommessaService } from '../../../services/GestioneCommesse/ore-spese-commessa.service';
import { Commessa } from '../../../models/GestioneCommesse/commessa';
import { CommessaService } from '../../../services/GestioneCommesse/commessa.service';
import { PianoSviluppo } from '../../../models/GestioneCommesse/piano-sviluppo';
import { PianoSviluppoService } from '../../../services/GestioneCommesse/piano-sviluppo.service';
import { Utente } from '../../../models/utente';
import { UtenteService } from '../../../services/utente.service';
import { PermissionsService } from '../../../auth/permissions.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
    selector: 'app-ore-e-spese',
    templateUrl: './ore-e-spese.component.html',
    styleUrls: ['./ore-e-spese.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        CommonModule,
        ConfirmDialogModule,
        DatePickerModule,
        DialogModule,
        FormsModule,
        IconFieldModule,
        InputIconModule,
        InputNumberModule,
        InputText,
        MessageModule,
        ReactiveFormsModule,
        SelectModule,
        TableModule,
        TagModule,
        TextareaModule,
        TitoloPaginaComponent,
        ToolbarModule,
    ]
})
export class OreESpeseComponent implements OnInit {

    // Dati tabella
    oreSpeseList: OreSpesePagedItemDto[] = [];
    totalRecords: number = 0;
    loading: boolean = false;
    referenceDataLoading: boolean = true;
    totaleOre: number = 0;
    totaleSpese: number = 0;
    totaleChilometri: number = 0;

    // Dati di riferimento
    commesseList: Commessa[] = [];
    utentiList: Utente[] = [];
    pianiSviluppoForm: PianoSviluppo[] = [];
    loadingPiani: boolean = false;
    utenteLoggato: Utente | null = null;

    // Filtri
    filtroCommessaId?: number;
    filtroUtenteId?: string;
    filtroDataFrom?: Date;
    filtroDataTo?: Date;

    // Paginazione
    private currentFirst: number = 0;
    private currentRows: number = 20;

    // Dialog
    showDialog: boolean = false;
    isModifying: boolean = false;
    oreSpeseInModifica?: OreSpesePagedItemDto;
    oreSpeseForm?: FormGroup;

    isMobile$?: Observable<boolean>;

    @ViewChild('dt1') table!: Table;

    // Permessi
    get canCreate(): boolean { return this.permissionsService.createEntityHelper('orespesecommessa').canCreate(); }
    get canEdit(): boolean { return this.permissionsService.createEntityHelper('orespesecommessa').canUpdate(); }
    get canDelete(): boolean { return this.permissionsService.createEntityHelper('orespesecommessa').canDelete(); }
    get isUtenteBase(): boolean { return this.authService.isUserUtenteBase(); }

    constructor(
        private authService: AuthService,
        private permissionsService: PermissionsService,
        private oreSpeseService: OreSpeseCommessaService,
        private commessaService: CommessaService,
        private pianoSviluppoService: PianoSviluppoService,
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
            commesse: this.commessaService.getAllLight(),
            utenti: this.utenteService.getAll(),
            utente: this.authService.getUser(),
        }).pipe(first()).subscribe({
            next: (data) => {
                this.commesseList = data.commesse;
                this.utentiList = data.utenti;
                this.utenteLoggato = data.utente;
                this.referenceDataLoading = false;

                // Utente Base: pre-seleziona se stesso e carica subito i dati
                if (this.isUtenteBase && this.utenteLoggato?.id) {
                    this.filtroUtenteId = this.utenteLoggato.id;
                }

                this.loadData();
                this.cdr.detectChanges();
            },
            error: () => {
                this.referenceDataLoading = false;
                this.ms.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: 'Errore nel caricamento dei dati di riferimento',
                    life: 3000,
                });
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
        this.oreSpeseService.getPaged(
            pageNumber,
            pageSize,
            this.filtroCommessaId,
            this.filtroUtenteId,
            this.filtroDataFrom,
            this.filtroDataTo,
        ).pipe(first()).subscribe({
            next: (response) => {
                this.oreSpeseList = response.items;
                this.totalRecords = response.totalCount;
                this.totaleOre = response.totaleOre;
                this.totaleSpese = response.totaleSpese;
                this.totaleChilometri = response.totaleChilometri;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.oreSpeseList = [];
                this.ms.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: 'Errore nel caricamento delle ore e spese',
                    life: 3000,
                });
            }
        });
    }

    onFiltroChange() {
        this.currentFirst = 0;
        if (this.table) {
            this.table.first = 0;
        }
        this.loadData();
    }

    // ─── Dialog creazione ──────────────────────────────────────────────────────

    apriDialogCrea() {
        this.isModifying = false;
        this.oreSpeseInModifica = undefined;
        this.pianiSviluppoForm = [];

        this.oreSpeseForm = this.fb.group({
            commessaId: [null, [Validators.required]],
            pianoSviluppoId: [null, [Validators.required]],
            utenteId: [this.isUtenteBase ? (this.utenteLoggato?.id ?? null) : null, [Validators.required]],
            data: [null, [Validators.required]],
            ore: [null, [Validators.required, Validators.min(0)]],
            spese: [null, [Validators.min(0)]],
            chilometri: [null, [Validators.min(0)]],
            note: [''],
        });

        this.showDialog = true;
    }

    apriDialogModifica(item: OreSpesePagedItemDto) {
        this.isModifying = true;
        this.oreSpeseInModifica = item;
        this.pianiSviluppoForm = [];
        this.loadingPiani = true;

        this.pianoSviluppoService.getAll(item.commessaId).pipe(first()).subscribe({
            next: (piani) => {
                this.pianiSviluppoForm = piani;
                this.loadingPiani = false;

                this.oreSpeseForm = this.fb.group({
                    commessaId: [item.commessaId, [Validators.required]],
                    pianoSviluppoId: [item.pianoSviluppoId, [Validators.required]],
                    utenteId: [item.utenteId, [Validators.required]],
                    data: [item.data ? item.data.toDate() : null, [Validators.required]],
                    ore: [item.ore ?? null, [Validators.required, Validators.min(0)]],
                    spese: [item.spese ?? null, [Validators.min(0)]],
                    chilometri: [item.chilometri ?? null, [Validators.min(0)]],
                    note: [item.note ?? ''],
                });

                this.showDialog = true;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingPiani = false;
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore nel caricamento dei piani di sviluppo', life: 3000 });
            }
        });
    }

    onCommessaDialogChange(commessaId: number) {
        this.oreSpeseForm?.patchValue({ pianoSviluppoId: null });
        this.pianiSviluppoForm = [];
        if (!commessaId) return;

        this.loadingPiani = true;
        this.pianoSviluppoService.getAll(commessaId).pipe(first()).subscribe({
            next: (piani) => {
                this.pianiSviluppoForm = piani;
                this.loadingPiani = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingPiani = false;
            }
        });
    }

    private buildPayload(): OreSpeseCommessa {
        const v = this.oreSpeseForm!.getRawValue();
        const o = new OreSpeseCommessa();
        o.commessaId = v.commessaId;
        o.pianoSviluppoId = v.pianoSviluppoId;
        o.utenteId = v.utenteId;
        o.data = v.data ? moment(v.data).startOf('day') : undefined;
        o.ore = v.ore ?? undefined;
        o.spese = v.spese ?? undefined;
        o.chilometri = v.chilometri ?? undefined;
        o.note = v.note || undefined;
        return o;
    }

    salvaOreSpese() {
        if (!this.oreSpeseForm?.valid) {
            this.ms.add({ severity: 'warn', summary: 'Validazione', detail: 'Compila tutti i campi obbligatori' });
            return;
        }

        const o = this.buildPayload();
        const op$ = this.isModifying && this.oreSpeseInModifica?.id
            ? this.oreSpeseService.update(this.oreSpeseInModifica.id, { ...o, id: this.oreSpeseInModifica.id })
            : this.oreSpeseService.create(o);

        op$.subscribe({
            next: () => {
                this.showDialog = false;
                this.ms.add({
                    severity: 'success',
                    summary: 'Conferma',
                    detail: this.isModifying ? 'Ore e spese modificate con successo' : 'Ore e spese caricate con successo',
                });
                this.loadData();
            },
            error: (err: any) => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: err.error || 'Errore durante il salvataggio' });
            }
        });
    }

    salvaEContinua() {
        if (!this.oreSpeseForm?.valid) {
            this.ms.add({ severity: 'warn', summary: 'Validazione', detail: 'Compila tutti i campi obbligatori' });
            return;
        }

        const o = this.buildPayload();
        this.oreSpeseService.create(o).subscribe({
            next: () => {
                this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Ore e spese caricate con successo' });
                this.loadData();

                // Mantieni tutti i valori tranne la data
                this.oreSpeseForm?.patchValue({ data: null });
                this.oreSpeseForm?.get('data')?.markAsUntouched();
                this.oreSpeseForm?.get('data')?.markAsPristine();
            },
            error: (err: any) => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: err.error || 'Errore durante il salvataggio' });
            }
        });
    }

    eliminaOreSpese(item: OreSpesePagedItemDto) {
        this.cs.confirm({
            message: 'Sei sicuro di voler eliminare questa riga ore/spese?',
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sì',
            rejectLabel: 'No',
            accept: () => {
                this.oreSpeseService.delete(item.id!).subscribe({
                    next: () => {
                        this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Riga eliminata con successo' });
                        this.loadData();
                    },
                    error: () => {
                        this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore durante l\'eliminazione' });
                    }
                });
            }
        });
    }

    getCommessaLabel(commessaId?: number): string {
        if (!commessaId) return '-';
        const c = this.commesseList.find(x => x.id === commessaId);
        return c ? `${c.commessaCodiceInterno} - ${c.descrizione}` : String(commessaId);
    }
}
