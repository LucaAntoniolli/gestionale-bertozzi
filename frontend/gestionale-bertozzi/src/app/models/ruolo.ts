export class Ruolo {
    id?: string;
    name?: string;
    normalizedName?: string;

    static map(ruolo: any): Ruolo {
        let u = Object.assign(new Ruolo(), ruolo) as Ruolo;
        return u;
    }

    static mapArray(arr?: any[]): Ruolo[] {
        return (arr ?? []).map(Ruolo.map);
    }
}
