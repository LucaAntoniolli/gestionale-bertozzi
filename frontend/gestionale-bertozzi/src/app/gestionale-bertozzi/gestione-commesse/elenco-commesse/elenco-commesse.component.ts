import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { first, forkJoin, map, Observable } from 'rxjs';
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
import { NavigatorService } from '../../../services/navigator.service';
import { PermissionsService } from '../../../auth/permissions.service';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
    selector: 'app-elenco-commesse',
    templateUrl: './elenco-commesse.component.html',
    styleUrls: ['./elenco-commesse.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        CommonModule,
        ConfirmDialogModule,
        DatePickerModule,
        DialogModule,
        FormsModule,
        IconFieldModule,
        InputIconModule,
        InputNumberModule,
        InputText,
        MessageModule,
        ReactiveFormsModule,
        SelectButtonModule,
        SelectModule,
        TableModule,
        TitoloPaginaComponent,
        ToolbarModule,
    ]
})
export class ElencoCommesseComponent implements OnInit {

    commesseList: Commessa[] = [];
    loading: boolean = true;
    nuovaCommessaForm?: FormGroup;
    showDialogCreazioneCommessa: boolean = false;
    commessaInModifica?: Commessa;
    isModifying: boolean = false;

    // Dati per i dropdown
    clientiList: Cliente[] = [];
    statusList: StatusCommessa[] = [];
    tipologieList: TipologiaCommessa[] = [];
    personaleClienteList: PersonaleCliente[] = [];
    personaleClienteFiltrato: PersonaleCliente[] = [];
    utentiList: Utente[] = [];
    utentiPmEdile: Utente[] = [];
    utentiPmAmministrativo: Utente[] = [];

    isMobile$?: Observable<boolean>;

    @ViewChild('dt1') table!: Table;

    soloChiuse: boolean = false;
    commessaStateOptions = [
        { label: 'Solo chiuse', value: true },
        { label: 'Solo aperte', value: false },
    ];

    //Getter per gestione permessi - ora centralizzati nel service
    get canDeleteCommessa(): boolean { return this.permissionsService.createEntityHelper('commessa').canDelete();}
    get canCreateCommessa(): boolean { return this.permissionsService.createEntityHelper('commessa').canCreate(); }
    get canEditCommessa(): boolean { return this.permissionsService.createEntityHelper('commessa').canUpdate(); }
    
    constructor(
        private permissionsService: PermissionsService,
        private commessaService: CommessaService,
        private clienteService: ClienteService,
        private navigator: NavigatorService,
        private statusService: StatusCommessaService,
        private tipologiaService: TipologiaCommessaService,
        private personaleService: PersonaleClienteService,
        private utenteService: UtenteService,
        private fb: FormBuilder,
        private ms: MessageService,
        private cs: ConfirmationService,
        private bo: BreakpointObserver,
        private cdr: ChangeDetectorRef,
    ) {
     }

    ngOnInit() {
        this.isMobile$ = this.bo
            .observe([Breakpoints.Handset, Breakpoints.Tablet])
            .pipe(map((result) => result.matches));

        this.loadReferenceData();
    }

    /** Carica i dati delle tabelle di riferimento (clienti, status, tipologie, personale) */
    private loadReferenceData() {
        forkJoin({
            clienti: this.clienteService.getAll(),
            status: this.statusService.getAll(),
            tipologie: this.tipologiaService.getAll(),
            personale: this.personaleService.getAll(),
            utenti: this.utenteService.getAll()
        }).pipe(first()).subscribe({
            next: (data) => {
                this.clientiList = data.clienti;
                this.statusList = data.status;
                this.tipologieList = data.tipologie;
                this.personaleClienteList = data.personale;
                this.utentiList = data.utenti;
                this.utentiPmEdile = this.utentiList.filter(u => u.ruoloAziendale === 'PM Edile');
                this.utentiPmAmministrativo = this.utentiList.filter(u => u.ruoloAziendale === 'PM Amministrativo');
                
                // Carica le commesse solo dopo che i dati di riferimento sono disponibili
                this.loadData();
            },
            error: (err: any) => {
                this.loading = false;
                console.error('Errore nel caricamento dei dati di riferimento', err);
                this.ms.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: 'Errore nel caricamento dei dati di riferimento',
                    life: 3000,
                });
            }
        });
    }

    /** Carica le commesse dal server */
    loadData(event?: any) {
        this.loading = true;
        if (event && event.value !== undefined) {
            this.soloChiuse = event.value;
        }
        this.commessaService.getAll(undefined, this.soloChiuse).pipe(first())
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
        this.commessaInModifica = undefined;
        this.isModifying = false;
        
        this.nuovaCommessaForm = this.fb.group({
            clienteId: ['', [Validators.required]],
            luogoCommessa: ['', [Validators.required]],
            protocollo: [''],
            pmEdileId: ['', [Validators.required]],
            referentiCliente: ['', [Validators.required, Validators.maxLength(255)]],
            pmAmministrativoId: ['', [Validators.required]],
            tipologiaCommessaId: ['', [Validators.required]],
            descrizione: ['', [Validators.required]],
            commessaCodiceInterno: ['', [Validators.required, Validators.maxLength(50)]],
            costoAtteso: [0, [Validators.required, Validators.min(0)]],
            orePreviste: [0, [Validators.required, Validators.min(0)]],
            statusCommessaId: ['', [Validators.required]],
            dataInizioPrevista: [''],
            dataConclusionePrevista: [''],
        });

        this.showDialogCreazioneCommessa = true;
    }

    /** Mostra il dialog per la modifica di una commessa esistente */
    modificaCommessa(commessa: Commessa) {
        this.commessaInModifica = commessa;
        this.isModifying = true;

        // Filtra il personale cliente PRIMA di creare il form
        if (commessa.clienteId) {
            this.personaleClienteFiltrato = this.personaleClienteList.filter(
                p => p.clienteId === commessa.clienteId
            );
        }

        this.nuovaCommessaForm = this.fb.group({
            clienteId: [commessa.clienteId, [Validators.required]],
            luogoCommessa: [commessa.luogoCommessa, [Validators.required]],
            protocollo: [commessa.protocollo || ''],
            pmEdileId: [commessa.pmEdileId, [Validators.required]],
            referentiCliente: [commessa.referentiCliente, [Validators.required, Validators.maxLength(255)]],
            pmAmministrativoId: [commessa.pmAmministrativoId, [Validators.required]],
            tipologiaCommessaId: [commessa.tipologiaCommessaId, [Validators.required]],
            descrizione: [commessa.descrizione, [Validators.required]],
            commessaCodiceInterno: [commessa.commessaCodiceInterno, [Validators.required, Validators.maxLength(50)]],
            costoAtteso: [commessa.costoAtteso, [Validators.required, Validators.min(0)]],
            orePreviste: [commessa.orePreviste, [Validators.required, Validators.min(0)]],
            statusCommessaId: [commessa.statusCommessaId, [Validators.required]],
            dataInizioPrevista: [commessa.dataInizioPrevista ? new Date(commessa.dataInizioPrevista as any) : ''],
            dataConclusionePrevista: [commessa.dataConclusionePrevista ? new Date(commessa.dataConclusionePrevista as any) : ''],
        });

        this.showDialogCreazioneCommessa = true;
    }

    /** Crea o modifica una commessa a seconda se è in modalità creazione o modifica */
    salvaCommessa() {
        if (!this.nuovaCommessaForm?.valid) {
            this.ms.add({
                severity: 'warn',
                summary: 'Validazione',
                detail: 'Compila tutti i campi obbligatori',
            });
            return;
        }

        let formValue = this.nuovaCommessaForm.value;
        const commessa = new Commessa();
        
        if (this.isModifying && this.commessaInModifica?.id) {
            commessa.id = this.commessaInModifica.id;
        }

        commessa.clienteId = formValue.clienteId;
        commessa.luogoCommessa = formValue.luogoCommessa;
        commessa.protocollo = formValue.protocollo || null;
        commessa.pmEdileId = formValue.pmEdileId;
        commessa.referentiCliente = formValue.referentiCliente;
        commessa.pmAmministrativoId = formValue.pmAmministrativoId;
        commessa.tipologiaCommessaId = formValue.tipologiaCommessaId;
        commessa.descrizione = formValue.descrizione;
        commessa.commessaCodiceInterno = formValue.commessaCodiceInterno;
        commessa.costoAtteso = formValue.costoAtteso;
        commessa.orePreviste = formValue.orePreviste;
        commessa.statusCommessaId = formValue.statusCommessaId;
        
        if (formValue.dataInizioPrevista) {
            commessa.dataInizioPrevista = moment(formValue.dataInizioPrevista).startOf('day');
        }
        if (formValue.dataConclusionePrevista) {
            commessa.dataConclusionePrevista = moment(formValue.dataConclusionePrevista).startOf('day');
        }

        const operation$ = this.isModifying && this.commessaInModifica?.id
            ? this.commessaService.update(this.commessaInModifica.id, commessa)
            : this.commessaService.create(commessa);

        operation$.subscribe({
            next: () => {
                this.showDialogCreazioneCommessa = false;
                this.ms.add({
                    severity: 'success',
                    summary: 'Conferma',
                    detail: this.isModifying ? 'Commessa modificata con successo' : 'Commessa creata con successo',
                });
                this.loadData();
            },
            error: (err: any) => {
                console.debug(err);
                this.ms.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: err.error?.error || 'Impossibile salvare la commessa',
                });
            },
        });
    }

    /** Elimina una commessa con conferma */
    eliminaCommessa(commessa: Commessa) {
        this.cs.confirm({
            message: `Sei sicuro di voler eliminare la commessa "${commessa.protocollo || commessa.descrizione}"?`,
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (commessa.id) {
                    this.commessaService.delete(commessa.id).subscribe({
                        next: () => {
                            this.ms.add({
                                severity: 'success',
                                summary: 'Conferma',
                                detail: 'Commessa eliminata con successo',
                            });
                            this.loadData();
                        },
                        error: (err: any) => {
                            console.debug(err);
                            this.ms.add({
                                severity: 'error',
                                summary: 'Errore',
                                detail: err.error?.error || 'Impossibile eliminare la commessa',
                            });
                        },
                    });
                }
            },
        });
    }

    dettaglioCommessa(id: number) {
        this.navigator.dettaglioCommessa(id);
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

    /** Ottiene il nome del referente cliente per display */
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
