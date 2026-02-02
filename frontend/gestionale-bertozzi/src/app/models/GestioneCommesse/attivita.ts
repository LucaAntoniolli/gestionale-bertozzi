import moment from 'moment';

export class Attivita {
    id?: number;
    pianoSviluppoId?: number;
    descrizione?: string;
    percentualeAvanzamento?: number;
    completata?: boolean;
    dataRiferimento?: moment.Moment;
    ordine?: number;
    utenteCreazione?: string;
    utenteModifica?: string;

    static map(attivita: any): Attivita {
        let a = Object.assign(new Attivita(), attivita) as Attivita;
        
        // Converti le stringhe di data in oggetti moment
        if (attivita.dataRiferimento) {
            a.dataRiferimento = moment(attivita.dataRiferimento);
        }
        
        return a;
    }

    static mapArray(arr: any[]): Attivita[] {
        return (arr || []).map(a => Attivita.map(a));
    }
}
