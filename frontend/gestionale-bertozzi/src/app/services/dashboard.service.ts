import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
    CommesseSummary,
    OreSummary,
    OrePerGiornoItem,
    OrePerUtenteItem,
} from '../models/dashboard.model';

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private readonly baseUrl = `${environment.baseApiUrl}/dashboard`;

    constructor(private http: HttpClient) {}

    /**
     * Recupera il riepilogo del numero di commesse aperte e chiuse
     */
    getCommesseSummary(): Observable<CommesseSummary> {
        return this.http
            .get<any>(`${this.baseUrl}/commesse-summary`)
            .pipe(map((data) => CommesseSummary.map(data)));
    }

    /**
     * Recupera il riepilogo delle ore caricate su commesse aperte e chiuse,
     * con le medie per le commesse chiuse
     */
    getOreSummary(): Observable<OreSummary> {
        return this.http
            .get<any>(`${this.baseUrl}/ore-summary`)
            .pipe(map((data) => OreSummary.map(data)));
    }

    /**
     * Recupera le ore caricate giorno per giorno negli ultimi N giorni
     * @param giorni - Numero di giorni da considerare (1-365, default 30)
     * @param commessaId - Filtra per commessa (opzionale)
     * @param utenteId - Filtra per utente (opzionale)
     */
    getOrePerGiorno(giorni: number = 30, commessaId?: number | null, utenteId?: string | null): Observable<OrePerGiornoItem[]> {
        let params = new HttpParams().set('giorni', giorni.toString());
        if (commessaId != null) params = params.set('commessaId', commessaId.toString());
        if (utenteId != null) params = params.set('utenteId', utenteId);
        return this.http
            .get<any[]>(`${this.baseUrl}/ore-per-giorno`, { params })
            .pipe(map((data) => OrePerGiornoItem.mapArray(data)));
    }

    /**
     * Recupera le ore caricate per utente su una specifica commessa
     * @param commessaId - ID della commessa
     */
    getOrePerUtente(commessaId: number): Observable<OrePerUtenteItem[]> {
        return this.http
            .get<any[]>(`${this.baseUrl}/ore-per-utente/${commessaId}`)
            .pipe(map((data) => OrePerUtenteItem.mapArray(data)));
    }
}
