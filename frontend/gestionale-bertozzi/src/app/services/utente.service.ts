import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../environments/environment";
import { Utente } from "../models/utente";

@Injectable({
    providedIn: 'root'
})

export class UtenteService {

    private baseApiUrl: string;

    constructor(private http: HttpClient) {
        this.baseApiUrl = environment.baseApiUrl;
    }

    /**
     * Recupera tutti gli utenti dal backend
     * @returns Observable array di utenti
     */
    getAll(onlyPmEdile: boolean = false, onlyPmAmministrativo: boolean = false): Observable<Utente[]> {
        let params = new HttpParams();
        if (onlyPmEdile) {
            params = params.set('onlyPmEdile', onlyPmEdile.toString());
        }
        if (onlyPmAmministrativo) {
            params = params.set('onlyPmAmministrativo', onlyPmAmministrativo.toString());
        }
        return this.http.get<any[]>(`${this.baseApiUrl}/auth/get-users`, { params })
            .pipe(map(data => Utente.mapArray(data)));
    }

    /**
     * Estrae le iniziali dal nominativo completo
     * @param nominativo Il nome completo dell'utente (es. "Mario Rossi")
     * @returns Le iniziali (es. "MR")
     */
    getInitials(nominativo?: string): string {
        if (!nominativo) return '??';

        const names = nominativo.trim().split(' ');
        if (names.length === 1) {
            // Se c'è solo un nome, prende le prime due lettere
            return names[0].substring(0, 2).toUpperCase();
        }

        // Prende la prima lettera del primo nome e del cognome
        const firstName = names[0];
        const lastName = names[names.length - 1]; // Ultimo elemento in caso di più nomi

        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
}