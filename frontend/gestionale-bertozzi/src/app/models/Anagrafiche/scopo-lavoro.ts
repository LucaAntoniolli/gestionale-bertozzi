export class ScopoLavoro {
    id?: number;
    descrizione?: string;

    static map(item: any): ScopoLavoro {
        return Object.assign(new ScopoLavoro(), item) as ScopoLavoro;
    }

    static mapArray(arr: any[]): ScopoLavoro[] {
        return (arr || []).map(o => ScopoLavoro.map(o));
    }
}
