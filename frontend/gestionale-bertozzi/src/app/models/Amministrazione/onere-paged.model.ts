import moment from "moment";

export class OnerePagedItemDto {
    id!: number;
    commessaId!: number;
    commessaDescrizione?: string;
    commessaCodiceInterno?: string;
    data?: moment.Moment;
    pratica!: string;
    importoOneri!: number;
    dataCreazione!: Date;

    static map(item: any): OnerePagedItemDto {
        const o = Object.assign(new OnerePagedItemDto(), item) as OnerePagedItemDto;
        if (item.data) o.data = moment(item.data);
        if (item.dataCreazione) o.dataCreazione = new Date(item.dataCreazione);
        return o;
    }

    static mapArray(arr: any[]): OnerePagedItemDto[] {
        return (arr || []).map(o => OnerePagedItemDto.map(o));
    }
}

export class OnerePagedResponseDto {
    totalCount: number = 0;
    items: OnerePagedItemDto[] = [];
    totaleImportoOneri: number = 0;

    static map(data: any): OnerePagedResponseDto {
        const r = new OnerePagedResponseDto();
        r.totalCount = data.totalCount ?? 0;
        r.totaleImportoOneri = data.totaleImportoOneri ?? 0;
        r.items = OnerePagedItemDto.mapArray(data.items || []);
        return r;
    }
}
