export class CollaudoPagedItemDto {
    id!: number;
    fornitoreId!: number;
    fornitoreRagioneSociale?: string;
    scopoLavoroId!: number;
    scopoLavoroDescrizione?: string;
    commessaId!: number;
    commessaDescrizione?: string;
    commessaCodiceInterno?: string;
    contratto?: string;
    importo!: number;
    pagato!: boolean;
    dataCreazione!: Date;

    static map(item: any): CollaudoPagedItemDto {
        const o = Object.assign(new CollaudoPagedItemDto(), item) as CollaudoPagedItemDto;
        if (item.dataCreazione) o.dataCreazione = new Date(item.dataCreazione);
        return o;
    }

    static mapArray(arr: any[]): CollaudoPagedItemDto[] {
        return (arr || []).map(o => CollaudoPagedItemDto.map(o));
    }
}

export class CollaudoPagedResponseDto {
    totalCount: number = 0;
    items: CollaudoPagedItemDto[] = [];
    totaleImporto: number = 0;

    static map(data: any): CollaudoPagedResponseDto {
        const r = new CollaudoPagedResponseDto();
        r.totalCount = data.totalCount ?? 0;
        r.totaleImporto = data.totaleImporto ?? 0;
        r.items = CollaudoPagedItemDto.mapArray(data.items || []);
        return r;
    }
}
