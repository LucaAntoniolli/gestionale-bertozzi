import { Attivita } from './attivita';

export class PianoSviluppo {
    id?: number;
    commessaId?: number;
    descrizione?: string;
    ordine?: number;
    dataCreazione?: Date;
    dataModifica?: Date;
    utenteCreazione?: string;
    utenteModifica?: string;
    attivita?: Attivita[];

    static map(piano: any): PianoSviluppo {
        let p = Object.assign(new PianoSviluppo(), piano) as PianoSviluppo;
        
        // Mappa l'array delle attività se presente
        if (piano.attivita && Array.isArray(piano.attivita)) {
            p.attivita = Attivita.mapArray(piano.attivita);
        }
        
        return p;
    }

    static mapArray(arr: any[]): PianoSviluppo[] {
        return (arr || []).map(p => PianoSviluppo.map(p));
    }
}
