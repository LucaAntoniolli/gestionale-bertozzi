import moment from 'moment';

export class CostoTrasfertaPagedItemDto {
    id!: number;
    clienteId!: number;
    clienteRagioneSociale?: string;
    commessaId!: number;
    commessaDescrizione?: string;
    commessaCodiceInterno?: string;
    utenteId!: string;
    utenteNominativo?: string;
    localitaPartenza?: string;
    localitaArrivo?: string;
    chilometri?: number;
    costoChilometri?: number;
    costoTelepass?: number;
    costoHotel?: number;
    costoTreno?: number;
    dataDa?: moment.Moment;
    dataA?: moment.Moment;
    dataCreazione!: Date;

    static map(item: any): CostoTrasfertaPagedItemDto {
        const o = Object.assign(new CostoTrasfertaPagedItemDto(), item) as CostoTrasfertaPagedItemDto;
        if (item.dataDa) o.dataDa = moment(item.dataDa);
        if (item.dataA) o.dataA = moment(item.dataA);
        if (item.dataCreazione) o.dataCreazione = new Date(item.dataCreazione);
        return o;
    }

    static mapArray(arr: any[]): CostoTrasfertaPagedItemDto[] {
        return (arr || []).map(o => CostoTrasfertaPagedItemDto.map(o));
    }
}

export class CostoTrasfertaPagedResponseDto {
    totalCount: number = 0;
    items: CostoTrasfertaPagedItemDto[] = [];
    totaleCostoTotale: number = 0;

    static map(data: any): CostoTrasfertaPagedResponseDto {
        const r = new CostoTrasfertaPagedResponseDto();
        r.totalCount = data.totalCount ?? 0;
        r.totaleCostoTotale = data.totaleCostoTotale ?? 0;
        r.items = CostoTrasfertaPagedItemDto.mapArray(data.items || []);
        return r;
    }
}
