import moment from 'moment';
import { Utente } from '../utente';
import { Commessa } from './commessa';

export class ToDo {
    id?: number;
    assegnatarioPrimarioId?: string;
    assegnatarioSecondarioId?: string;
    commessaId?: number;
    descrizioneTodo?: string;
    dataConsegna?: moment.Moment;
    priorita?: number;
    descrizioneAttivitaSvolta?: string;
    completato: boolean = false;
    dataCreazione?: moment.Moment;
    dataModifica?: moment.Moment;
    utenteCreazione?: string;
    utenteModifica?: string;

    // Navigation properties
    assegnatarioPrimario?: Utente;
    assegnatarioSecondario?: Utente;
    commessa?: Commessa;

    static map(todo: any): ToDo {
        let t = Object.assign(new ToDo(), todo) as ToDo;
        
        // Converti le stringhe di data in oggetti moment
        if (todo.dataConsegna) {
            t.dataConsegna = moment(todo.dataConsegna);
        }
        if (todo.dataCreazione) {
            t.dataCreazione = moment(todo.dataCreazione);
        }
        if (todo.dataModifica) {
            t.dataModifica = moment(todo.dataModifica);
        }
        
        // Mappa le proprietà di navigazione se presenti
        if (todo.assegnatarioPrimario) {
            t.assegnatarioPrimario = Utente.map(todo.assegnatarioPrimario);
        }
        if (todo.assegnatarioSecondario) {
            t.assegnatarioSecondario = Utente.map(todo.assegnatarioSecondario);
        }
        if (todo.commessa) {
            t.commessa = Commessa.map(todo.commessa);
        }
        
        return t;
    }

    static mapArray(arr: any[]): ToDo[] {
        return (arr || []).map(t => ToDo.map(t));
    }
}
