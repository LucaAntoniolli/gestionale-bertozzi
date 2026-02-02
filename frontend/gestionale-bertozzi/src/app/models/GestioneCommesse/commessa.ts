import moment from 'moment';
import { Cliente } from '../Anagrafiche/cliente';
import { PersonaleCliente } from '../Anagrafiche/personale-cliente';
import { TipologiaCommessa } from '../Anagrafiche/tipologia-commessa';
import { StatusCommessa } from '../Anagrafiche/status-commessa';
import { PianoSviluppo } from './piano-sviluppo';

export class Commessa {
    id?: number;
    clienteId?: number;
    luogoCommessa?: string;
    progressivoCommessa?: number;
    protocollo?: string;
    pmEdileId?: string;
    referenteClienteId?: number;
    pmAmministrativoId?: string;
    tipologiaCommessaId?: number;
    descrizione?: string;
    costoAtteso?: number;
    statusCommessaId?: number;
    dataInizioPrevista?: moment.Moment;
    dataConclusionePrevista?: moment.Moment;
    utenteCreazione?: string;
    utenteModifica?: string;
    
    // Navigation properties
    cliente?: Cliente;
    referenteCliente?: PersonaleCliente;
    tipologiaCommessa?: TipologiaCommessa;
    statusCommessa?: StatusCommessa;
    pianiSviluppo?: PianoSviluppo[];

    static map(commessa: any): Commessa {
        let c = Object.assign(new Commessa(), commessa) as Commessa;
        
        // Converti le stringhe di data in oggetti moment
        if (commessa.dataInizioPrevista) {
            c.dataInizioPrevista = moment(commessa.dataInizioPrevista);
        }
        if (commessa.dataConclusionePrevista) {
            c.dataConclusionePrevista = moment(commessa.dataConclusionePrevista);
        }
        
        // Mappa le proprietà di navigazione se presenti
        if (commessa.cliente) {
            c.cliente = Cliente.map(commessa.cliente);
        }
        if (commessa.referenteCliente) {
            c.referenteCliente = PersonaleCliente.map(commessa.referenteCliente);
        }
        if (commessa.tipologiaCommessa) {
            c.tipologiaCommessa = TipologiaCommessa.map(commessa.tipologiaCommessa);
        }
        if (commessa.statusCommessa) {
            c.statusCommessa = StatusCommessa.map(commessa.statusCommessa);
        }
        if (commessa.pianiSviluppo && Array.isArray(commessa.pianiSviluppo)) {
            c.pianiSviluppo = PianoSviluppo.mapArray(commessa.pianiSviluppo);
        }
        
        return c;
    }

    static mapArray(arr: any[]): Commessa[] {
        return (arr || []).map(c => Commessa.map(c));
    }
}
