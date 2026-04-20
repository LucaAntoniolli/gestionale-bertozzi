import moment from "moment";

export class Onere {
    id?: number;
    commessaId?: number;
    data?: moment.Moment;
    pratica?: string;
    importoOneri?: number;
    dataCreazione?: Date;
    dataModifica?: Date;
    utenteCreazione?: string;
    utenteModifica?: string;

    // Navigation properties
    commessa?: any;

    static map(item: any): Onere {
        const o = Object.assign(new Onere(), item) as Onere;
        if (item.data) o.data = moment(item.data);
        if (item.dataCreazione) o.dataCreazione = new Date(item.dataCreazione);
        if (item.dataModifica) o.dataModifica = new Date(item.dataModifica);
        return o;
    }

    static mapArray(arr: any[]): Onere[] {
        return (arr || []).map(o => Onere.map(o));
    }
}
