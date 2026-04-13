export class ScopoLavoroPagedItemDto {
    id!: number;
    descrizione!: string;

    static map(item: any): ScopoLavoroPagedItemDto {
        return Object.assign(new ScopoLavoroPagedItemDto(), item) as ScopoLavoroPagedItemDto;
    }

    static mapArray(arr: any[]): ScopoLavoroPagedItemDto[] {
        return (arr || []).map(o => ScopoLavoroPagedItemDto.map(o));
    }
}

export class ScopoLavoroPagedResponseDto {
    totalCount: number = 0;
    items: ScopoLavoroPagedItemDto[] = [];

    static map(data: any): ScopoLavoroPagedResponseDto {
        const r = new ScopoLavoroPagedResponseDto();
        r.totalCount = data.totalCount ?? 0;
        r.items = ScopoLavoroPagedItemDto.mapArray(data.items || []);
        return r;
    }
}
