export class FornitorePagedItemDto {
    id!: number;
    ragioneSociale!: string;
    partitaIva?: string;
    tipo?: string;
    sigla?: string;
    comune?: string;
    provincia?: string;
    telefono?: string;
    email?: string;
    modalitaPagamentoId?: number;
    modalitaPagamentoDescrizione?: string;
    dataCreazione!: Date;

    static map(item: any): FornitorePagedItemDto {
        const o = Object.assign(new FornitorePagedItemDto(), item) as FornitorePagedItemDto;
        if (item.dataCreazione) o.dataCreazione = new Date(item.dataCreazione);
        return o;
    }

    static mapArray(arr: any[]): FornitorePagedItemDto[] {
        return (arr || []).map(o => FornitorePagedItemDto.map(o));
    }
}

export class FornitorePagedResponseDto {
    totalCount: number = 0;
    items: FornitorePagedItemDto[] = [];

    static map(data: any): FornitorePagedResponseDto {
        const r = new FornitorePagedResponseDto();
        r.totalCount = data.totalCount ?? 0;
        r.items = FornitorePagedItemDto.mapArray(data.items || []);
        return r;
    }
}
