import { Fornitore } from '../Anagrafiche/fornitore';
import { ScopoLavoro } from '../Anagrafiche/scopo-lavoro';

export class Collaudo {
    id?: number;
    fornitoreId?: number;
    scopoLavoroId?: number;
    commessaId?: number;
    contratto?: string;
    importo?: number;
    pagato?: boolean;
    dataCreazione?: Date;
    dataModifica?: Date;
    utenteCreazione?: string;
    utenteModifica?: string;

    // Navigation properties
    fornitore?: Fornitore;
    scopoLavoro?: ScopoLavoro;
    commessa?: any;

    static map(item: any): Collaudo {
        const o = Object.assign(new Collaudo(), item) as Collaudo;
        if (item.dataCreazione) o.dataCreazione = new Date(item.dataCreazione);
        if (item.dataModifica) o.dataModifica = new Date(item.dataModifica);
        return o;
    }

    static mapArray(arr: any[]): Collaudo[] {
        return (arr || []).map(o => Collaudo.map(o));
    }
}
