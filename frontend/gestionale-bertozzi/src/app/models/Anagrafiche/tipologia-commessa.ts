export class TipologiaCommessa {
    id?: number;
    descrizione: string = '';

    static map(tipologia: any): TipologiaCommessa {
        let t = Object.assign(new TipologiaCommessa(), tipologia) as TipologiaCommessa;
        return t;
    }
}
