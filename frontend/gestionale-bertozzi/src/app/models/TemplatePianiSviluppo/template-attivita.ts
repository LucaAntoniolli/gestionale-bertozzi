export class TemplateAttivita {
    id?: number;
    pianoSviluppoId: number = 0;
    descrizione: string = '';
    tipoInfoDaRegistrare: string = '';
    ordine: number = 0;
    

    static map(attivita: any): TemplateAttivita {
        let t = Object.assign(new TemplateAttivita(), attivita) as TemplateAttivita;
        return t;
    }

    static mapArray(arr: any[]): TemplateAttivita[] {
        return (arr || []).map(c => TemplateAttivita.map(c));
    }

}
