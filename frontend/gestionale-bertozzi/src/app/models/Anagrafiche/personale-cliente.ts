export class PersonaleCliente {
    id?: number;
    clienteId?: number;
    nome?: string;
    cognome?: string;
    mansione?: string;
    email?: string;
    telefono?: string;

    static map(personaleCliente: any): PersonaleCliente {
        let pc = Object.assign(new PersonaleCliente(), personaleCliente) as PersonaleCliente;
        
        return pc;
    }

    static mapArray(arr: any[]): PersonaleCliente[] {
        return (arr || []).map(pc => PersonaleCliente.map(pc));
    }

    // Metodo helper per ottenere il nome completo
    get nomeCompleto(): string {
        if (this.nome && this.cognome) {
            return `${this.nome} ${this.cognome}`;
        }
        return this.nome || this.cognome || '';
    }
}