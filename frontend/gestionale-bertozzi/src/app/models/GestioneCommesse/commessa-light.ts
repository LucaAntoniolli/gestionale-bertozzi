export class CommessaLight {
    id?: number;
    descrizione?: string;
    commessaCodiceInterno?: string;

    static map(commessa: any): CommessaLight {
        let c = Object.assign(new CommessaLight(), commessa) as CommessaLight;

        return c;
    }

    static mapArray(arr: any[]): CommessaLight[] {
        return (arr || []).map(c => CommessaLight.map(c));
    }
}
