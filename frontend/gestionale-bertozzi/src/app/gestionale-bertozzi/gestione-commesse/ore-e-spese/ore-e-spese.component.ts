import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { first, forkJoin, map, Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';

import { TitoloPaginaComponent } from '../../shared/components/titolo-pagina/titolo-pagina.component';
import { OreSpeseDialogComponent, OreSpeseDialogEditData } from '../../shared/components/ore-spese-dialog/ore-spese-dialog.component';
import { OreSpesePagedItemDto } from '../../../models/GestioneCommesse/ore-spese-paged.model';
import { OreSpeseCommessaService } from '../../../services/GestioneCommesse/ore-spese-commessa.service';
import { Commessa } from '../../../models/GestioneCommesse/commessa';
import { CommessaLight } from '../../../models/GestioneCommesse/commessa-light';
import { CommessaService } from '../../../services/GestioneCommesse/commessa.service';
import { Utente } from '../../../models/utente';
import { UtenteService } from '../../../services/utente.service';
import { PermissionsService } from '../../../auth/permissions.service';
import { AuthService } from '../../../auth/auth.service';
import { DashboardService } from '../../../services/dashboard.service';
import { OrePerGiornoItem } from '../../../models/dashboard.model';

@Component({
    selector: 'app-ore-e-spese',
    templateUrl: './ore-e-spese.component.html',
    styleUrls: ['./ore-e-spese.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        CardModule,
        ChartModule,
        CommonModule,
        ConfirmDialogModule,
        DatePickerModule,
        DividerModule,
        FormsModule,
        IconFieldModule,
        InputIconModule,
        MessageModule,
        OreSpeseDialogComponent,
        SelectModule,
        SkeletonModule,
        TableModule,
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
    commesseList: CommessaLight[] = [];
    utentiList: Utente[] = [];
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
    editDataDialog?: OreSpeseDialogEditData;

    // Grafico ore per giorno
    loadingChart: boolean = false;
    chartData: any;
    chartOptions: any;
    giorniOptions = [
        { label: 'Ultimi 7 giorni', value: 7 },
        { label: 'Ultimi 30 giorni', value: 30 },
        { label: 'Ultimi 60 giorni', value: 60 },
        { label: 'Ultimi 90 giorni', value: 90 },
    ];
    giorniSelezionati: number = 30;

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
        private utenteService: UtenteService,
        private dashboardService: DashboardService,
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

                // Utente Base: pre-seleziona se stesso per filtri tabella e grafico
                // IMPORTANTE: deve essere fatto PRIMA di referenceDataLoading = false
                if (this.isUtenteBase && this.utenteLoggato?.id) {
                    this.filtroUtenteId = this.utenteLoggato.id;
                }

                this.referenceDataLoading = false;

                this.loadData();
                this.loadOrePerGiorno();
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
        this.loadOrePerGiorno();
    }

    // ─── Dialog creazione ──────────────────────────────────────────────────────

    apriDialogCrea() {
        this.isModifying = false;
        this.editDataDialog = undefined;
        this.showDialog = true;
    }

    apriDialogModifica(item: OreSpesePagedItemDto) {
        this.isModifying = true;
        this.editDataDialog = {
            id: item.id,
            commessaId: item.commessaId,
            utenteId: item.utenteId,
            data: item.data ? item.data.toDate() : null,
            ore: item.ore,
            spese: item.spese,
            chilometri: item.chilometri,
            note: item.note,
        };
        this.showDialog = true;
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

    // ─── Grafico ore per giorno ────────────────────────────────────────────────

    loadOrePerGiorno() {
        this.loadingChart = true;
        this.dashboardService
            .getOrePerGiorno(
                this.giorniSelezionati,
                this.filtroCommessaId,
                this.filtroUtenteId,
            )
            .pipe(first())
            .subscribe({
                next: (data) => {
                    this.buildChartData(data);
                    this.loadingChart = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.loadingChart = false;
                    this.cdr.detectChanges();
                },
            });
    }

    private buildChartData(items: OrePerGiornoItem[]) {
        const style = getComputedStyle(document.documentElement);
        const textColor = style.getPropertyValue('--p-text-color');
        const textMuted = style.getPropertyValue('--p-text-muted-color');
        const borderColor = style.getPropertyValue('--p-content-border-color');
        const primaryBg = style.getPropertyValue('--p-primary-400');
        const primaryBorder = style.getPropertyValue('--p-primary-500');

        this.chartData = {
            labels: items.map((i) => this.formatDateLabel(i.data)),
            datasets: [
                {
                    label: 'Ore caricate',
                    data: items.map((i) => i.totaleOre),
                    backgroundColor: primaryBg || '#6366f1',
                    borderColor: primaryBorder || '#4f46e5',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        };

        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => ` ${ctx.parsed.y} h`,
                    },
                },
            },
            scales: {
                x: {
                    ticks: { color: textMuted, maxRotation: 45 },
                    grid: { color: borderColor },
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textMuted,
                        callback: (value: number) => `${value} h`,
                    },
                    grid: { color: borderColor },
                },
            },
        };
    }

    private formatDateLabel(dateStr: string): string {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}`;
    }

    getCommessaLabel(commessaId?: number): string {
        if (!commessaId) return '-';
        const c = this.commesseList.find(x => x.id === commessaId);
        return c ? `${c.commessaCodiceInterno} - ${c.descrizione}` : String(commessaId);
    }
}
