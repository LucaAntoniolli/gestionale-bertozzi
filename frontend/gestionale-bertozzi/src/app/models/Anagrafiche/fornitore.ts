import { ModalitaPagamento } from './modalita-pagamento';

export class Fornitore {
    id?: number;
    ragioneSociale?: string;
    partitaIva?: string;
    codiceFiscale?: string;
    indirizzo?: string;
    comune?: string;
    cap?: string;
    provincia?: string;
    nazione?: string;
    telefono?: string;
    email?: string;
    modalitaPagamentoId?: number;
    sdi?: string;
    tipo?: string;
    sigla?: string;
    dataCreazione?: Date;
    dataModifica?: Date;
    utenteCreazione?: string;
    utenteModifica?: string;

    // Navigation properties
    modalitaPagamento?: ModalitaPagamento;

    static map(item: any): Fornitore {
        const o = Object.assign(new Fornitore(), item) as Fornitore;
        if (item.dataCreazione) o.dataCreazione = new Date(item.dataCreazione);
        if (item.dataModifica) o.dataModifica = new Date(item.dataModifica);
        return o;
    }

    static mapArray(arr: any[]): Fornitore[] {
        return (arr || []).map(o => Fornitore.map(o));
    }
}
