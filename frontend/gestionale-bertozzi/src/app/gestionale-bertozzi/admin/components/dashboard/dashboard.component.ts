import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { TitoloPaginaComponent } from '../../../shared/components/titolo-pagina/titolo-pagina.component';
import { DashboardService } from '../../../../services/dashboard.service';
import { CommessaService } from '../../../../services/GestioneCommesse/commessa.service';
import { CommessaLight } from '../../../../models/GestioneCommesse/commessa-light';
import { CommesseSummary, OreSummary, OrePerGiornoItem, OrePerUtenteItem } from '../../../../models/dashboard.model';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    imports: [
        CommonModule,
        FormsModule,
        TitoloPaginaComponent,
        CardModule,
        ChartModule,
        SelectModule,
        SkeletonModule,
        DividerModule,
        MessageModule,
    ],
})
export class DashboardComponent implements OnInit {
    loadingCommesse = true;
    loadingOre = true;
    loadingChart = true;

    commesseSummary?: CommesseSummary;
    oreSummary?: OreSummary;
    chartData: any;
    chartOptions: any;

    giorniOptions = [
        { label: 'Ultimi 7 giorni', value: 7 },
        { label: 'Ultimi 30 giorni', value: 30 },
        { label: 'Ultimi 60 giorni', value: 60 },
        { label: 'Ultimi 90 giorni', value: 90 },
    ];
    giorniSelezionati: number = 30;

    // Sezione ore per commessa
    commesseList: CommessaLight[] = [];
    commessaSelezionata?: CommessaLight;
    loadingOrePerUtente = false;
    chartOreUtente: any;
    chartKmUtente: any;
    chartSpeseUtente: any;
    chartBarOptions: any;
    chartKmOptions: any;
    chartSpeseOptions: any;

    constructor(
        private dashboardService: DashboardService,
        private commessaService: CommessaService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.loadingCommesse = true;
        this.loadingOre = true;
        this.loadingChart = true;

        forkJoin({
            commesse: this.dashboardService.getCommesseSummary(),
            ore: this.dashboardService.getOreSummary(),
            orePerGiorno: this.dashboardService.getOrePerGiorno(this.giorniSelezionati),
            commesseList: this.commessaService.getAllLight(),
        }).subscribe({
            next: ({ commesse, ore, orePerGiorno, commesseList }) => {
                this.commesseSummary = commesse;
                this.oreSummary = ore;
                this.buildChartData(orePerGiorno);
                this.commesseList = commesseList;
                this.loadingCommesse = false;
                this.loadingOre = false;
                this.loadingChart = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingCommesse = false;
                this.loadingOre = false;
                this.loadingChart = false;
                this.cdr.detectChanges();
            },
        });
    }

    loadOrePerGiorno() {
        this.loadingChart = true;
        this.dashboardService
            .getOrePerGiorno(this.giorniSelezionati)
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
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
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

    onCommessaSelezionata() {
        if (!this.commessaSelezionata?.id) return;
        this.loadingOrePerUtente = true;
        this.chartOreUtente = undefined;
        this.chartKmUtente = undefined;
        this.chartSpeseUtente = undefined;
        this.dashboardService
            .getOrePerUtente(this.commessaSelezionata.id)
            .pipe(first())
            .subscribe({
                next: (data) => {
                    this.buildBarChartsPerUtente(data);
                    this.loadingOrePerUtente = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.loadingOrePerUtente = false;
                    this.cdr.detectChanges();
                },
            });
    }

    private buildBarChartsPerUtente(items: OrePerUtenteItem[]) {
        const style = getComputedStyle(document.documentElement);
        const textColor = style.getPropertyValue('--p-text-color');
        const textMuted = style.getPropertyValue('--p-text-muted-color');
        const borderColor = style.getPropertyValue('--p-content-border-color');

        const labels = items.map((i) => i.nominativo);

        const baseOptions = (unit: string) => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => ` ${ctx.parsed.y} ${unit}`,
                    },
                },
            },
            scales: {
                x: { ticks: { color: textMuted }, grid: { color: borderColor } },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textMuted,
                        callback: (value: number) => `${value} ${unit}`,
                    },
                    grid: { color: borderColor },
                },
            },
        });

        const makeDataset = (data: number[], color: string, borderCol: string, label: string) => ({
            label,
            data,
            backgroundColor: color,
            borderColor: borderCol,
            borderWidth: 1,
            borderRadius: 4,
        });

        this.chartOreUtente = {
            labels,
            datasets: [makeDataset(
                items.map((i) => i.totaleOre),
                style.getPropertyValue('--p-primary-400') || '#6366f1',
                style.getPropertyValue('--p-primary-500') || '#4f46e5',
                'Ore',
            )],
        };
        this.chartBarOptions = baseOptions('h');

        this.chartKmUtente = {
            labels,
            datasets: [makeDataset(
                items.map((i) => i.totaleChilometri),
                style.getPropertyValue('--p-green-400') || '#4ade80',
                style.getPropertyValue('--p-green-500') || '#22c55e',
                'Km',
            )],
        };
        this.chartKmOptions = baseOptions('km');

        this.chartSpeseUtente = {
            labels,
            datasets: [makeDataset(
                items.map((i) => i.totaleSpese),
                style.getPropertyValue('--p-yellow-400') || '#facc15',
                style.getPropertyValue('--p-yellow-500') || '#eab308',
                'Spese',
            )],
        };
        this.chartSpeseOptions = baseOptions('€');
    }

    private formatDateLabel(dateStr: string): string {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}`;
    }
}
