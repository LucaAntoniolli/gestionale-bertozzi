import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { TooltipModule } from 'primeng/tooltip';
import { Notifica, TipoNotifica } from '../../models/Notifiche/notifica';
import { NotificheService } from '../../services/Notifiche/notifiche.service';

@Component({
    selector: 'app-notifiche',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        DrawerModule,
        OverlayBadgeModule,
        TooltipModule,
    ],
    templateUrl: './app.notifiche.component.html',
})
export class AppNotifiche implements OnInit, OnDestroy {

    private notificheService = inject(NotificheService);
    private router = inject(Router);

    readonly nonLette = this.notificheService.nonLette;
    readonly notifiche = this.notificheService.notifiche;
    readonly caricamento = this.notificheService.caricamento;

    readonly pannelloAperto = signal(false);

    ngOnInit(): void {
        // Il componente vive solo dentro il layout autenticato: il polling parte qui
        // e si spegne da sé al logout, quando il layout viene distrutto.
        this.notificheService.avviaPolling();
    }

    ngOnDestroy(): void {
        this.notificheService.fermaPolling();
    }

    apriPannello(): void {
        this.pannelloAperto.set(true);
        this.notificheService.carica();
    }

    /** Per l'utente la lettura equivale a togliere la notifica dall'elenco. */
    segnaLetta(notifica: Notifica, event?: Event): void {
        event?.stopPropagation();
        if (!notifica.id) return;
        this.notificheService.segnaLetta(notifica.id).subscribe({ error: () => { } });
    }

    segnaTutteLette(): void {
        this.notificheService.segnaTutteLette().subscribe({ error: () => { } });
    }

    apriNotifica(notifica: Notifica): void {
        const rotta = this.rottaInterna(notifica.link);

        if (rotta) {
            this.pannelloAperto.set(false);
            this.router.navigateByUrl(rotta);
        }

        this.segnaLetta(notifica);
    }

    /**
     * Accetta solo percorsi interni all'applicativo. Il campo arriva dal database e oggi
     * lo scrive il backend, ma la validazione impedisce che diventi un open redirect
     * il giorno in cui venisse popolato da un input utente.
     */
    private rottaInterna(link?: string): string | null {
        if (!link) return null;

        const pulito = link.trim();
        if (!pulito.startsWith('/')) return null;   // niente URL assoluti né schemi
        if (pulito.startsWith('//')) return null;   // protocol-relative: punta a un altro host

        return pulito;
    }

    iconaPerTipo(tipo?: TipoNotifica): string {
        switch (tipo) {
            case TipoNotifica.Successo: return 'pi pi-check-circle';
            case TipoNotifica.Avviso: return 'pi pi-exclamation-triangle';
            case TipoNotifica.Errore: return 'pi pi-times-circle';
            default: return 'pi pi-info-circle';
        }
    }

    classePerTipo(tipo?: TipoNotifica): string {
        switch (tipo) {
            case TipoNotifica.Successo: return 'text-green-600';
            case TipoNotifica.Avviso: return 'text-orange-500';
            case TipoNotifica.Errore: return 'text-red-500';
            default: return 'text-primary';
        }
    }

    haLink(notifica: Notifica): boolean {
        return this.rottaInterna(notifica.link) !== null;
    }

    /** Data relativa in italiano, senza dipendenze aggiuntive. */
    tempoRelativo(data?: Date): string {
        if (!data) return '';

        // Negativo = passato, che è il caso normale: Intl rende "2 ore fa" da solo.
        const secondi = Math.round((data.getTime() - Date.now()) / 1000);
        const assoluti = Math.abs(secondi);
        const formatter = new Intl.RelativeTimeFormat('it', { numeric: 'auto' });

        const scala: [Intl.RelativeTimeFormatUnit, number][] = [
            ['year', 31536000],
            ['month', 2592000],
            ['week', 604800],
            ['day', 86400],
            ['hour', 3600],
            ['minute', 60],
        ];

        for (const [unita, dimensione] of scala) {
            if (assoluti >= dimensione) {
                return formatter.format(Math.round(secondi / dimensione), unita);
            }
        }

        return formatter.format(secondi, 'second');
    }
}
