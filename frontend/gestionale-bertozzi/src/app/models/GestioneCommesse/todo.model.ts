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
    descrizioneAttivitaSvolta?: string;
    completato: boolean = false;
    dataCreazione?: Date;
    dataModifica?: Date;
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
            t.dataCreazione = new Date(todo.dataCreazione);
        }
        if (todo.dataModifica) {
            t.dataModifica = new Date(todo.dataModifica);
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
