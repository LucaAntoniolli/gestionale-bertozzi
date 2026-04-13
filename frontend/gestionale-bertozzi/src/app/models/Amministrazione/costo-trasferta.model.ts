import moment from 'moment';
import { Utente } from '../utente';

export class CostoTrasferta {
    id?: number;
    clienteId?: number;
    commessaId?: number;
    utenteId?: string;
    localitaPartenza?: string;
    localitaArrivo?: string;
    chilometri?: number;
    costoChilometri?: number;
    costoTelepass?: number;
    costoHotel?: number;
    costoTreno?: number;
    dataDa?: moment.Moment;
    dataA?: moment.Moment;
    dataCreazione?: Date;
    dataModifica?: Date;
    utenteCreazione?: string;
    utenteModifica?: string;

    // Navigation properties
    utente?: Utente;
    commessa?: any;
    cliente?: any;

    static map(item: any): CostoTrasferta {
        const o = Object.assign(new CostoTrasferta(), item) as CostoTrasferta;
        if (item.dataDa) o.dataDa = moment(item.dataDa);
        if (item.dataA) o.dataA = moment(item.dataA);
        if (item.dataCreazione) o.dataCreazione = new Date(item.dataCreazione);
        if (item.dataModifica) o.dataModifica = new Date(item.dataModifica);
        return o;
    }

    static mapArray(arr: any[]): CostoTrasferta[] {
        return (arr || []).map(o => CostoTrasferta.map(o));
    }
}
