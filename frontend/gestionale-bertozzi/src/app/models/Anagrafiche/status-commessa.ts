export class StatusCommessa {
    id: number = 0;
    ordine: number = 1;
    descrizione: string = '';

    static map(tipologia: any): StatusCommessa {
        let t = Object.assign(new StatusCommessa(), tipologia) as StatusCommessa;
        return t;
    }
}
