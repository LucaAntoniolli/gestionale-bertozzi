export class ModalitaPagamento{
    id?: number;
    descrizione: string = '';

    static map(modalitaPagamento: any): ModalitaPagamento {
        let m = Object.assign(new ModalitaPagamento(), modalitaPagamento) as ModalitaPagamento;
        return m;
    }
}