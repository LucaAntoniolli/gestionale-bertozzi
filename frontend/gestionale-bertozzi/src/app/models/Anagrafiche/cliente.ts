import { PersonaleCliente } from './personale-cliente';

export class Cliente {
    id?: number;
    ragioneSociale?: string;
    codiceInterno?: string;
    partitaIva?: string;
    codiceFiscale?: string;
    indirizzo?: string;
    comune?: string;
    cap?: string;
    provincia?: string;
    nazione?: string;
    telefono?: string;
    email?: string;
    modalitaPagamentoId?: number;
    sdi?: string;
    tipo?: string;
    personale?: PersonaleCliente[];

    static map(cliente: any): Cliente {
        let c = Object.assign(new Cliente(), cliente) as Cliente;
        
        // Mappa l'array del personale se presente
        if (cliente.personale && Array.isArray(cliente.personale)) {
            c.personale = PersonaleCliente.mapArray(cliente.personale);
        }
        
        return c;
    }

    static mapArray(arr: any[]): Cliente[] {
        return (arr || []).map(c => Cliente.map(c));
    }
}
