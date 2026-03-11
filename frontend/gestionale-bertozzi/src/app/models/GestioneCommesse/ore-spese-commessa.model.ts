import moment from 'moment';
import { Utente } from '../utente';
import { PianoSviluppo } from './piano-sviluppo';

export class OreSpeseCommessa {
    id?: number;
    commessaId?: number;
    pianoSviluppoId?: number;
    utenteId?: string;
    data?: moment.Moment;
    ore?: number;
    spese?: number;
    chilometri?: number;
    note?: string;
    dataCreazione?: Date;
    dataModifica?: Date;
    utenteCreazione?: string;
    utenteModifica?: string;

    // Navigation properties
    utente?: Utente;
    pianoSviluppo?: PianoSviluppo;

    static map(oreSpeseCommessa: any): OreSpeseCommessa {
        let o = Object.assign(new OreSpeseCommessa(), oreSpeseCommessa) as OreSpeseCommessa;

        // Converti le stringhe di data in oggetti moment/Date
        if (oreSpeseCommessa.data) {
            o.data = moment(oreSpeseCommessa.data);
        }
        if (oreSpeseCommessa.dataCreazione) {
            o.dataCreazione = new Date(oreSpeseCommessa.dataCreazione);
        }
        if (oreSpeseCommessa.dataModifica) {
            o.dataModifica = new Date(oreSpeseCommessa.dataModifica);
        }

        // Mappa le proprietà di navigazione se presenti
        if (oreSpeseCommessa.utente) {
            o.utente = Utente.map(oreSpeseCommessa.utente);
        }
        if (oreSpeseCommessa.pianoSviluppo) {
            o.pianoSviluppo = PianoSviluppo.map(oreSpeseCommessa.pianoSviluppo);
        }

        return o;
    }

    static mapArray(arr: any[]): OreSpeseCommessa[] {
        return (arr || []).map(o => OreSpeseCommessa.map(o));
    }
}
