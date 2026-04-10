import moment from 'moment';

export class OreSpesePagedItemDto {
    id!: number;
    commessaId!: number;
    commessaDescrizione?: string;
    commessaCodiceInterno?: string;
    utenteId!: string;
    utenteNominativo?: string;
    data!: moment.Moment;
    ore?: number;
    spese?: number;
    chilometri?: number;
    note?: string;
    dataCreazione!: Date;

    static map(item: any): OreSpesePagedItemDto {
        const o = Object.assign(new OreSpesePagedItemDto(), item) as OreSpesePagedItemDto;
        if (item.data) {
            o.data = moment(item.data);
        }
        if (item.dataCreazione) {
            o.dataCreazione = new Date(item.dataCreazione);
        }
        return o;
    }

    static mapArray(arr: any[]): OreSpesePagedItemDto[] {
        return (arr || []).map(o => OreSpesePagedItemDto.map(o));
    }
}

export class OreSpesePagedResponseDto {
    totalCount: number = 0;
    items: OreSpesePagedItemDto[] = [];
    totaleOre: number = 0;
    totaleSpese: number = 0;
    totaleChilometri: number = 0;

    static map(data: any): OreSpesePagedResponseDto {
        const r = new OreSpesePagedResponseDto();
        r.totalCount = data.totalCount ?? 0;
        r.totaleOre = data.totaleOre ?? 0;
        r.totaleSpese = data.totaleSpese ?? 0;
        r.totaleChilometri = data.totaleChilometri ?? 0;
        r.items = OreSpesePagedItemDto.mapArray(data.items || []);
        return r;
    }
}
