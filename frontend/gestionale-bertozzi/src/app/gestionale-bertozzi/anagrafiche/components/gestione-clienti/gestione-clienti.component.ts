import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TitoloPaginaComponent } from '../../../shared/components/titolo-pagina/titolo-pagina.component';
import { Cliente } from '../../../../models/Anagrafiche/cliente';
import { PersonaleCliente } from '../../../../models/Anagrafiche/personale-cliente';
import { ModalitaPagamento } from '../../../../models/Anagrafiche/modalita-pagamento';
import { ClienteService } from '../../../../services/Anagrafiche/cliente.service';
import { PersonaleClienteService } from '../../../../services/Anagrafiche/personale-cliente.service';
import { ModalitaPagamentoService } from '../../../../services/Anagrafiche/modalita-pagamento.service';
import * as FileSaver from 'file-saver';
import { SelectModule } from 'primeng/select';
import { IconField, IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
    selector: 'app-gestione-clienti',
    templateUrl: './gestione-clienti.component.html',
    styleUrls: ['./gestione-clienti.component.css'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TitoloPaginaComponent,
        ButtonModule,
        DialogModule,
        ToolbarModule,
        TableModule,
        InputText,
        InputIconModule,
        IconFieldModule,
        MessageModule,
        SelectModule,
    ]
})
export class GestioneClientiComponent implements OnInit {

    clienti: Cliente[] = [];
    modalitaPagamento: ModalitaPagamento[] = [];
    expandedRowKeys: { [key: string]: boolean } = {};
    loading: boolean = true;

    // Forms
    nuovoClienteForm?: FormGroup;
    modificaClienteForm?: FormGroup;
    nuovoPersonaleForm?: FormGroup;
    modificaPersonaleForm?: FormGroup;

    // Dialog visibility
    showDialogCreazioneCliente: boolean = false;
    showDialogModificaCliente: boolean = false;
    showDialogCreazionePersonale: boolean = false;
    showDialogModificaPersonale: boolean = false;

    // Selected items
    selectedCliente?: Cliente;
    selectedTipo?: string;
    selectedPersonale?: PersonaleCliente;
    clienteForPersonale?: Cliente; // Cliente a cui aggiungere personale

    //Tipo cliente
    tipoCliente: string[] = ['Privato', 'Azienda', 'Pubblica Amministrazione'];

    //Filtro tabella
    @ViewChild('filter') filter!: ElementRef;

    constructor(
        private clienteService: ClienteService,
        private personaleService: PersonaleClienteService,
        private modalitaPagamentoService: ModalitaPagamentoService,
        private fb: FormBuilder,
        private conf: ConfirmationService,
        private ms: MessageService,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit() {
        this.loadData();
    }

    private loadData() {
        this.loading = true;
        forkJoin({
            clienti: this.clienteService.getAll(true),
            modalitaPagamento: this.modalitaPagamentoService.getAll()
        }).pipe(first())
            .subscribe({
                next: (result) => {
                    this.loading = false;
                    this.clienti = result.clienti;
                    this.modalitaPagamento = result.modalitaPagamento;
                    this.cdr.detectChanges();
                },
                error: (err: any) => {
                    this.loading = false;
                    if (err.status == 404) {
                        this.clienti = [];
                        this.modalitaPagamento = [];
                    }
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Errore nel caricamento dei dati',
                        life: 3000,
                    });
                },
            });
    }

    // ==================== CLIENTE CRUD ====================

    mostraFormCreazioneCliente() {
        this.nuovoClienteForm = this.fb.group({
            ragioneSociale: ['', [Validators.required, Validators.minLength(10)]],
            codiceInterno: [''],
            modalitaPagamentoId: [null],
            partitaIva: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
            codiceFiscale: [''],
            indirizzo: [''],
            comune: [''],
            cap: [''],
            provincia: [''],
            nazione: [''],
            telefono: [''],
            email: ['', [Validators.email]],
            sdi: [''],
            tipo: ['', [Validators.required]],
        });

        this.showDialogCreazioneCliente = true;
    }

    mostraFormModificaCliente(cliente: Cliente) {
        this.selectedCliente = cliente;

        this.modificaClienteForm = this.fb.group({
            ragioneSociale: [cliente.ragioneSociale, [Validators.required, Validators.minLength(2)]],
            codiceInterno: [cliente.codiceInterno],
            modalitaPagamentoId: [cliente.modalitaPagamentoId],
            partitaIva: [cliente.partitaIva, [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
            codiceFiscale: [cliente.codiceFiscale],
            indirizzo: [cliente.indirizzo],
            comune: [cliente.comune],
            cap: [cliente.cap],
            provincia: [cliente.provincia],
            nazione: [cliente.nazione],
            telefono: [cliente.telefono],
            email: [cliente.email, [Validators.email]],
            sdi: [cliente.sdi],
            tipo: [cliente.tipo, [Validators.required]],
        });

        this.showDialogModificaCliente = true;
    }

    creaCliente() {
        let formValue = this.nuovoClienteForm?.value;
        const nuovoCliente = new Cliente();
        Object.assign(nuovoCliente, formValue);

        this.clienteService.create(nuovoCliente)
            .subscribe({
                next: () => {
                    this.showDialogCreazioneCliente = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Cliente creato con successo',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Impossibile creare il cliente',
                    });
                },
            });
    }

    modificaCliente() {
        let formValue = this.modificaClienteForm?.value;
        const clienteAggiornato = { ...this.selectedCliente! } as Cliente;
        Object.assign(clienteAggiornato, formValue);

        this.clienteService.update(this.selectedCliente!.id!, clienteAggiornato)
            .subscribe({
                next: () => {
                    this.showDialogModificaCliente = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Cliente modificato con successo',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Impossibile modificare il cliente',
                    });
                },
            });
    }

    eliminaCliente(event: Event, cliente: Cliente) {
        this.conf.confirm({
            target: event.target as EventTarget,
            message: "Sei sicuro di voler eliminare questo cliente e tutto il suo personale?",
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'No',
            acceptLabel: 'Sì',
            acceptIcon: 'pi pi-check',
            rejectIcon: 'pi pi-times',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.clienteService.delete(cliente.id!).subscribe({
                    next: () => {
                        this.ms.add({
                            severity: 'success',
                            summary: 'Cliente eliminato',
                            detail: "Il cliente è stato eliminato con successo",
                        });
                        this.loadData();
                    },
                    error: (err: any) => {
                        this.ms.add({
                            severity: 'error',
                            summary: 'Errore',
                            detail: 'Impossibile eliminare il cliente',
                        });
                    },
                });
            },
            reject: () => {
                this.ms.add({
                    severity: 'info',
                    summary: 'Operazione annullata',
                    detail: "Il cliente non è stato eliminato",
                    life: 3000,
                });
            },
        });
    }

    // ==================== PERSONALE CRUD ====================

    mostraFormCreazionePersonale(cliente: Cliente) {
        this.clienteForPersonale = cliente;

        this.nuovoPersonaleForm = this.fb.group({
            nome: ['', [Validators.required, Validators.minLength(2)]],
            cognome: ['', [Validators.required, Validators.minLength(2)]],
            mansione: ['', [Validators.required]],
            email: ['', [Validators.email]],
            telefono: [''],
        });

        this.showDialogCreazionePersonale = true;
    }

    mostraFormModificaPersonale(personale: PersonaleCliente) {
        this.selectedPersonale = personale;

        this.modificaPersonaleForm = this.fb.group({
            nome: [personale.nome, [Validators.required, Validators.minLength(2)]],
            cognome: [personale.cognome, [Validators.required, Validators.minLength(2)]],
            mansione: [personale.mansione, [Validators.required]],
            email: [personale.email, [Validators.email]],
            telefono: [personale.telefono],
        });

        this.showDialogModificaPersonale = true;
    }

    creaPersonale() {
        let formValue = this.nuovoPersonaleForm?.value;
        const nuovoPersonale = new PersonaleCliente();
        Object.assign(nuovoPersonale, formValue);
        nuovoPersonale.clienteId = this.clienteForPersonale!.id;

        this.personaleService.create(nuovoPersonale)
            .subscribe({
                next: () => {
                    this.showDialogCreazionePersonale = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Personale creato con successo',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Impossibile creare il personale',
                    });
                },
            });
    }

    modificaPersonale() {
        let formValue = this.modificaPersonaleForm?.value;
        const personaleAggiornato = { ...this.selectedPersonale! } as PersonaleCliente;
        Object.assign(personaleAggiornato, formValue);

        this.personaleService.update(this.selectedPersonale!.id!, personaleAggiornato)
            .subscribe({
                next: () => {
                    this.showDialogModificaPersonale = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Personale modificato con successo',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Impossibile modificare il personale',
                    });
                },
            });
    }

    eliminaPersonale(event: Event, personale: PersonaleCliente) {
        this.conf.confirm({
            target: event.target as EventTarget,
            message: "Sei sicuro di voler eliminare questo membro del personale?",
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'No',
            acceptLabel: 'Sì',
            acceptIcon: 'pi pi-check',
            rejectIcon: 'pi pi-times',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.personaleService.delete(personale.id!).subscribe({
                    next: () => {
                        this.ms.add({
                            severity: 'success',
                            summary: 'Personale eliminato',
                            detail: "Il personale è stato eliminato con successo",
                        });
                        this.loadData();
                    },
                    error: (err: any) => {
                        this.ms.add({
                            severity: 'error',
                            summary: 'Errore',
                            detail: 'Impossibile eliminare il personale',
                        });
                    },
                });
            },
            reject: () => {
                this.ms.add({
                    severity: 'info',
                    summary: 'Operazione annullata',
                    detail: "Il personale non è stato eliminato",
                    life: 3000,
                });
            },
        });
    }

    // ==================== UTILITY ====================

    exportExcel() {
        import('xlsx').then((xlsx) => {
            const clientiForExcel: any[] = [];

            this.clienti.forEach(cliente => {
                clientiForExcel.push({
                    Tipo: 'Cliente',
                    'Ragione Sociale': cliente.ragioneSociale,
                    'Codice Interno': cliente.codiceInterno,
                    'Tipo Cliente': cliente.tipo,
                    'P.IVA': cliente.partitaIva,
                    'Codice Fiscale': cliente.codiceFiscale,
                    Indirizzo: cliente.indirizzo,
                    Comune: cliente.comune,
                    CAP: cliente.cap,
                    Provincia: cliente.provincia,
                    Nazione: cliente.nazione,
                    Telefono: cliente.telefono,
                    Email: cliente.email,
                    SDI: cliente.sdi,
                });

                cliente.personale?.forEach(personale => {
                    clientiForExcel.push({
                        Tipo: 'Personale',
                        'Cliente': cliente.ragioneSociale,
                        Nome: personale.nome,
                        Cognome: personale.cognome,
                        Mansione: personale.mansione,
                        Email: personale.email,
                        Telefono: personale.telefono,
                    });
                });
            });

            if (clientiForExcel.length > 0) {
                const worksheet = xlsx.utils.json_to_sheet(clientiForExcel);
                const workbook = {
                    Sheets: { data: worksheet },
                    SheetNames: ['data'],
                };
                const excelBuffer: any = xlsx.write(workbook, {
                    bookType: 'xlsx',
                    type: 'array',
                });
                this.saveAsExcelFile(excelBuffer, 'clienti_personale');
            }
        });
    }

    saveAsExcelFile(buffer: any, fileName: string): void {
        let EXCEL_TYPE =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        let EXCEL_EXTENSION = '.xlsx';
        const data: Blob = new Blob([buffer], {
            type: EXCEL_TYPE,
        });
        FileSaver.saveAs(
            data,
            fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
        );
    }
}
