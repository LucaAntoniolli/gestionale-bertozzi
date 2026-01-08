import { TemplateAttivita } from './template-attivita';

export class TemplatePianoSviluppo {
    id?: number;
    tipologiaCommessaId: number = 0;
    descrizione: string = '';
    attivita?: TemplateAttivita[];
    ordine: number = 0;


    static map(piano: any): TemplatePianoSviluppo {
        let t = Object.assign(new TemplatePianoSviluppo(), piano) as TemplatePianoSviluppo;

        if (piano.attivita && Array.isArray(piano.attivita)) {
            t.attivita = piano.attivita.map((a: any) => TemplateAttivita.map(a));
        }
        return t;
    }

    static mapArray(arr: any[]): TemplatePianoSviluppo[] {
        console.log("Mapping array of TemplatePianoSviluppo:", arr);
        return (arr || []).map(c => TemplatePianoSviluppo.map(c));
    }
}
