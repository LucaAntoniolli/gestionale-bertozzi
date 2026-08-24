export enum TipoNotifica {
    Info = 0,
    Successo = 1,
    Avviso = 2,
    Errore = 3,
}

export enum CategoriaNotifica {
    Sistema = 0,
    Commessa = 1,
    Attivita = 2,
    ToDo = 3,
    Collaudo = 4,
}

export class Notifica {
    id?: number;
    titolo?: string;
    descrizione?: string;
    link?: string;
    tipo?: TipoNotifica;
    categoria?: CategoriaNotifica;
    dataCreazione?: Date;
    utenteOrigine?: string;

    static map(item: any): Notifica {
        const n = Object.assign(new Notifica(), item) as Notifica;
        // L'API serializza la data in UTC con la "Z": il costruttore Date la converte
        // nel fuso locale del browser, che è quello che serve per le date relative.
        n.dataCreazione = item?.dataCreazione ? new Date(item.dataCreazione) : undefined;
        return n;
    }

    static mapArray(arr: any[]): Notifica[] {
        return (arr || []).map(o => Notifica.map(o));
    }
}

export class ConteggioNotifiche {
    nonLette: number = 0;

    static map(item: any): ConteggioNotifiche {
        return Object.assign(new ConteggioNotifiche(), item) as ConteggioNotifiche;
    }
}
