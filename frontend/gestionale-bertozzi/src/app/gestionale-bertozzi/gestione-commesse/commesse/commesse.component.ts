import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, map, Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TitoloPaginaComponent } from '../../shared/components/titolo-pagina/titolo-pagina.component';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { InputNumberModule } from 'primeng/inputnumber';
import { Commessa } from '../../../models/GestioneCommesse/commessa';
import { CommessaService } from '../../../services/GestioneCommesse/commessa.service';
import { ClienteService } from '../../../services/Anagrafiche/cliente.service';
import { StatusCommessaService } from '../../../services/Anagrafiche/status-commessa.service';
import { TipologiaCommessaService } from '../../../services/Anagrafiche/tipologia-commessa.service';
import { PersonaleClienteService } from '../../../services/Anagrafiche/personale-cliente.service';
import { Cliente } from '../../../models/Anagrafiche/cliente';
import { StatusCommessa } from '../../../models/Anagrafiche/status-commessa';
import { TipologiaCommessa } from '../../../models/Anagrafiche/tipologia-commessa';
import { PersonaleCliente } from '../../../models/Anagrafiche/personale-cliente';
import { Utente } from '../../../models/utente';
import { UtenteService } from '../../../services/utente.service';
import moment from 'moment';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'app-commesse',
    templateUrl: './commesse.component.html',
    styleUrls: ['./commesse.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TitoloPaginaComponent,
        ButtonModule,
        DialogModule,
        TableModule,
        ToolbarModule,
        InputText,
        InputNumberModule,
        IconFieldModule,
        InputIconModule,
        MessageModule,
        SelectModule,
        DatePickerModule,
    ]
})
export class CommesseComponent implements OnInit {

    commesseList?: Commessa[];
    loading: boolean = true;
    nuovaCommessaForm?: FormGroup;
    showDialogCreazioneCommessa: boolean = false;

    // Dati per i dropdown
    clientiList: Cliente[] = [];
    statusList: StatusCommessa[] = [];
    tipologieList: TipologiaCommessa[] = [];
    personaleClienteList: PersonaleCliente[] = [];
    personaleClienteFiltrato: PersonaleCliente[] = [];
    utentiList: Utente[] = [];

    isMobile$?: Observable<boolean>;

    @ViewChild('dt1') table!: Table;

    constructor(
        private commessaService: CommessaService,
        private clienteService: ClienteService,
        private statusService: StatusCommessaService,
        private tipologiaService: TipologiaCommessaService,
        private personaleService: PersonaleClienteService,
        private utenteService: UtenteService,
        private fb: FormBuilder,
        private ms: MessageService,
        private bo: BreakpointObserver,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit() {
        this.isMobile$ = this.bo
            .observe([Breakpoints.Handset, Breakpoints.Tablet])
            .pipe(map((result) => result.matches));

        this.loadReferenceData();
        this.loadData();
    }

    /** Carica i dati delle tabelle di riferimento (clienti, status, tipologie, personale) */
    private loadReferenceData() {
        this.clienteService.getAll().pipe(first()).subscribe({
            next: (data: Cliente[]) => {
                this.clientiList = data;
            },
            error: (err: any) => {
                console.error('Errore nel caricamento dei clienti', err);
            }
        });

        this.statusService.getAll().pipe(first()).subscribe({
            next: (data: StatusCommessa[]) => {
                this.statusList = data;
            },
            error: (err: any) => {
                console.error('Errore nel caricamento degli status', err);
            }
        });

        this.tipologiaService.getAll().pipe(first()).subscribe({
            next: (data: TipologiaCommessa[]) => {
                this.tipologieList = data;
            },
            error: (err: any) => {
                console.error('Errore nel caricamento delle tipologie', err);
            }
        });

        this.personaleService.getAll().pipe(first()).subscribe({
            next: (data: PersonaleCliente[]) => {
                this.personaleClienteList = data;
            },
            error: (err: any) => {
                console.error('Errore nel caricamento del personale cliente', err);
            }
        });

        this.utenteService.getAll().pipe(first()).subscribe({
            next: (data: Utente[]) => {
                // Filtra solo gli utenti interni
                this.utentiList = data.filter(u => !u.isEsterno);
            },
            error: (err: any) => {
                console.error('Errore nel caricamento degli utenti', err);
            }
        });
    }

    /** Carica le commesse dal server */
    private loadData() {
        this.loading = true;
        this.commessaService.getAll().pipe(first())
            .subscribe({
                next: (commesseList: Commessa[]) => {
                    this.loading = false;
                    this.commesseList = commesseList;
                    this.cdr.detectChanges();
                },
                error: (err: any) => {
                    this.loading = false;
                    if (err.status == 404) {
                        this.commesseList = [];
                        this.ms.add({
                            severity: 'info',
                            summary: 'Nessun dato presente',
                            detail: 'Nessuna commessa trovata',
                            life: 3000,
                        });
                    } else {
                        this.ms.add({
                            severity: 'error',
                            summary: 'Errore',
                            detail: 'Errore nel caricamento delle commesse',
                            life: 3000,
                        });
                    }
                    this.cdr.detectChanges();
                },
            });
    }

    /** Mostra il dialog per la creazione di una nuova commessa */
    mostraFormCreazioneCommessa() {
        this.nuovaCommessaForm = this.fb.group({
            clienteId: ['', [Validators.required]],
            luogoCommessa: ['', [Validators.required]],
            protocollo: [''],
            pmEdileId: ['', [Validators.required]],
            referenteClienteId: ['', [Validators.required]],
            pmAmministrativoId: ['', [Validators.required]],
            tipologiaCommessaId: ['', [Validators.required]],
            descrizione: ['', [Validators.required]],
            costoAtteso: [0, [Validators.required, Validators.min(0)]],
            statusCommessaId: ['', [Validators.required]],
            dataInizioPrevista: [''],
            dataConclusionePrevista: [''],
        });

        // Sottoscrivi ai cambiamenti del campo clienteId per filtrare il personale cliente
        this.nuovaCommessaForm.get('clienteId')?.valueChanges.subscribe((clienteId: number) => {
            this.onClienteChange(clienteId);
        });

        this.showDialogCreazioneCommessa = true;
    }

    /** Filtra il personale cliente in base al cliente selezionato */
    onClienteChange(clienteId: number) {
        if (clienteId) {
            this.personaleClienteFiltrato = this.personaleClienteList.filter(
                p => p.clienteId === clienteId
            );
        } else {
            this.personaleClienteFiltrato = [];
        }
        // Reset del campo referente cliente
        this.nuovaCommessaForm?.get('referenteClienteId')?.setValue('');
    }

    /** Crea una nuova commessa */
    creaCommessa() {
        if (!this.nuovaCommessaForm?.valid) {
            this.ms.add({
                severity: 'warn',
                summary: 'Validazione',
                detail: 'Compila tutti i campi obbligatori',
            });
            return;
        }

        let formValue = this.nuovaCommessaForm.value;
        const nuovaCommessa = new Commessa();
        
        nuovaCommessa.clienteId = formValue.clienteId;
        nuovaCommessa.luogoCommessa = formValue.luogoCommessa;
        nuovaCommessa.protocollo = formValue.protocollo || null;
        nuovaCommessa.pmEdileId = formValue.pmEdileId;
        nuovaCommessa.referenteClienteId = formValue.referenteClienteId;
        nuovaCommessa.pmAmministrativoId = formValue.pmAmministrativoId;
        nuovaCommessa.tipologiaCommessaId = formValue.tipologiaCommessaId;
        nuovaCommessa.descrizione = formValue.descrizione;
        nuovaCommessa.costoAtteso = formValue.costoAtteso;
        nuovaCommessa.statusCommessaId = formValue.statusCommessaId;
        
        if (formValue.dataInizioPrevista) {
            nuovaCommessa.dataInizioPrevista = moment(formValue.dataInizioPrevista);
        }
        if (formValue.dataConclusionePrevista) {
            nuovaCommessa.dataConclusionePrevista = moment(formValue.dataConclusionePrevista);
        }

        this.commessaService.create(nuovaCommessa)
            .subscribe({
                next: () => {
                    this.showDialogCreazioneCommessa = false;
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'Commessa creata con successo',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: err.error?.error || 'Impossibile creare la commessa',
                    });
                },
            });
    }

    /** Ottiene il nome del cliente per display */
    getNomeCliente(clienteId?: number): string {
        if (!clienteId) return '';
        const cliente = this.clientiList.find(c => c.id === clienteId);
        return cliente?.ragioneSociale || '';
    }

    /** Ottiene la descrizione dello status */
    getDescrizioneStatus(statusId?: number): string {
        if (!statusId) return '';
        const status = this.statusList.find(s => s.id === statusId);
        return status?.descrizione || '';
    }

    /** Ottiene la descrizione della tipologia */
    getDescrizioneTipologia(tipologiaId?: number): string {
        if (!tipologiaId) return '';
        const tipologia = this.tipologieList.find(t => t.id === tipologiaId);
        return tipologia?.descrizione || '';
    }

    /** Ottiene il nome del referente cliente */
    getNomePersonale(personaleId?: number): string {
        if (!personaleId) return '';
        const personale = this.personaleClienteList.find(p => p.id === personaleId);
        return personale?.nome + ' ' + personale?.cognome || '';
    }

    /** Ottiene il nome dell'utente per display */
    getNomeUtente(utenteId?: string): string {
        if (!utenteId) return '';
        const utente = this.utentiList.find(u => u.id === utenteId);
        return utente?.nominativo || '';
    }

}
