import { Ruolo } from "./ruolo";

export class Utente {
    id?: string;
    nominativo?: string;
    userName?: string;
    email?: string;
    ruoli?: string[];
    isEsterno: boolean = false;
    societa?: string;
    costoOrario?: number;

    static map(utente: any): Utente {
        let u = Object.assign(new Utente(), utente) as Utente;
        return u;
    }

    static mapArray(arr: any[]): Utente[] {
        return (arr || []).map(u => Utente.map(u));
    }
}
