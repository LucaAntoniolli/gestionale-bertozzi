export class CommesseSummary {
    totaleAperte: number = 0;
    totaleChiuse: number = 0;

    static map(data: any): CommesseSummary {
        return Object.assign(new CommesseSummary(), data) as CommesseSummary;
    }
}

export class OreSummary {
    totaleOreCommesseAperte: number = 0;
    totaleOreCommesseChiuse: number = 0;
    mediaOreCommesseChiuse: number = 0;
    mediaChilometriCommesseChiuse: number = 0;
    mediaSpeseCommesseChiuse: number = 0;

    static map(data: any): OreSummary {
        return Object.assign(new OreSummary(), data) as OreSummary;
    }
}

export class OrePerGiornoItem {
    data: string = '';
    totaleOre: number = 0;

    static map(item: any): OrePerGiornoItem {
        return Object.assign(new OrePerGiornoItem(), item) as OrePerGiornoItem;
    }

    static mapArray(arr: any[]): OrePerGiornoItem[] {
        return (arr || []).map((i) => OrePerGiornoItem.map(i));
    }
}

export class OrePerUtenteItem {
    utenteId: string = '';
    nominativo: string = '';
    totaleOre: number = 0;
    totaleSpese: number = 0;
    totaleChilometri: number = 0;

    static map(item: any): OrePerUtenteItem {
        return Object.assign(new OrePerUtenteItem(), item) as OrePerUtenteItem;
    }

    static mapArray(arr: any[]): OrePerUtenteItem[] {
        return (arr || []).map((i) => OrePerUtenteItem.map(i));
    }
}
