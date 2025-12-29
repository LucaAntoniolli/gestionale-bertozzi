export class StatusCommessa {
    id?: number;
    descrizione: string = '';

    static map(tipologia: any): StatusCommessa {
        let t = Object.assign(new StatusCommessa(), tipologia) as StatusCommessa;
        return t;
    }
}
