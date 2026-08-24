import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import * as FileSaver from 'file-saver';
import moment from 'moment';

import { OreSpeseDialogComponent, OreSpeseDialogEditData } from '../../shared/components/ore-spese-dialog/ore-spese-dialog.component';

import { ToDo, TipoPlanning } from '../../../models/GestioneCommesse/todo.model';
import { TodoService } from '../../../services/GestioneCommesse/todo.service';
import { Commessa } from '../../../models/GestioneCommesse/commessa';
import { CommessaService } from '../../../services/GestioneCommesse/commessa.service';
import { Utente } from '../../../models/utente';
import { UtenteService } from '../../../services/utente.service';
import { PermissionsService } from '../../../auth/permissions.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
    selector: 'app-planning',
    templateUrl: './planning.component.html',
    styleUrls: ['./planning.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        CheckboxModule,
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
        OreSpeseDialogComponent,
        ReactiveFormsModule,
        SelectModule,
        SelectButtonModule,
        TableModule,
        TagModule,
        TextareaModule,
        TitoloPaginaComponent,
        ToolbarModule,
        TooltipModule,
    ]
})
export class PlanningComponent implements OnInit {

    todoList: ToDo[] = [];
    loading: boolean = true;
    nuovoTodoForm?: FormGroup;
    showDialogCreazioneTodo: boolean = false;
    todoInModifica?: ToDo;
    isModifying: boolean = false;

    // Dati per i dropdown
    commesseList: Commessa[] = [];
    utentiPm: Utente[] = [];
    utentiPmEdileList: Utente[] = [];
    utentiList: Utente[] = [];
    utenteLoggato: Utente | null = null;

    prioritaOptions: number[] = [1, 2, 3, 4, 5];

    vistaOptions = [
        { label: 'Non completati e recenti', value: 'nonCompletati' },
        { label: 'Scadute', value: 'scadute' },
        { label: 'Completate', value: 'completate' },
        { label: 'Tutti', value: 'tutti' },
    ];
    vistaSelezionata: string = 'nonCompletati';

    // Numero di attività scadute e non completate, usato per l'alert sopra la tabella
    todoScadutiCount: number = 0;

    // Filtro per commessa
    commessaSelezionata?: number;

    // Dialog caricamento ore e spese da un ToDo
    showDialogOreSpese: boolean = false;
    editDataOreSpese?: OreSpeseDialogEditData;

    isMobile$?: Observable<boolean>;

    @ViewChild('dt1') table!: Table;
    @ViewChild('descrizioneTodoInput') descrizioneTodoInput?: ElementRef;

    // Getter per gestione permessi       
    get canDeleteTodo(): boolean { return this.permissionsService.createEntityHelper('todo').canDelete(); }  
    get canCreateTodo(): boolean { return this.permissionsService.createEntityHelper('todo').canCreate(); }
    get canEditTodo(): boolean { return this.permissionsService.createEntityHelper('todo').canUpdate(); }
    get canCreateOreSpese(): boolean { return this.permissionsService.createEntityHelper('orespesecommessa').canCreate(); }
    get isUtenteBase(): boolean { return this.authService.isUserUtenteBase(); }
    // L'utente base non può cambiare l'assegnatario primario in creazione (può solo inserire per sè stesso)
    get canEditAssegnatarioPrimario(): boolean {
        if (!this.isModifying && this.authService.isUserUtenteBase()) {
            return false;
        }
        return this.canEditToDoFields;
    }

    //L'utente admin o backoffice può modificare sempre i todo, l'utente base può modificare solo se è il creatore del todo
    get canEditToDoFields(): boolean {
        if (!this.isModifying) {
            return true;
        }

        if (this.authService.isUserAdmin() || this.authService.isUserBackoffice()) {
            return true;
        }
        else {
            if (this.todoInModifica?.utenteCreazione === this.utenteLoggato?.email) {
                return true;
            }
        }
        return false;
    }
    //L'utente admin o backoffice può eliminare sempre i todo, l'utente base può eliminare solo se è il creatore del todo
    canDeleteTodoRow(todo: ToDo): boolean {
        if (!this.canDeleteTodo) {
            return false;
        }

        if (this.authService.isUserAdmin() || this.authService.isUserBackoffice()) {
            return true;
        }

        if (this.authService.isUserUtenteBase()) {
            const creator = todo.utenteCreazione?.trim().toLowerCase();
            const loggedUserEmail = this.utenteLoggato?.email?.trim().toLowerCase();
            return !!creator && !!loggedUserEmail && creator === loggedUserEmail;
        }

        return false;
    }

    
    
    constructor(
        private authService: AuthService,
        private permissionsService: PermissionsService,
        private todoService: TodoService,
        private commessaService: CommessaService,
        private utenteService: UtenteService,
        private fb: FormBuilder,
        private ms: MessageService,
        private cs: ConfirmationService,
        private bo: BreakpointObserver,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit() {
        this.isMobile$ = this.bo
            .observe([Breakpoints.Handset, Breakpoints.Tablet])
            .pipe(map((result) => result.matches));

        this.loadReferenceData();
    }

    /** Carica i dati delle tabelle di riferimento (commesse e utenti) */
    private loadReferenceData() {
        forkJoin({
            commesse: this.commessaService.getAllLight(),
            utentiPm: this.utenteService.getAll(false, false, true),
            utentiPmEdile: this.utenteService.getAll(true, false),
            utenti: this.utenteService.getAll(),
            utente: this.authService.getUser(),
        }).pipe(first()).subscribe({
            next: (data) => {
                this.commesseList = data.commesse;
                this.utentiPm = data.utentiPm;
                this.utentiPmEdileList = data.utentiPmEdile;
                this.utentiList = data.utenti;
                this.utenteLoggato = data.utente;
                this.loadData();
                this.cdr.detectChanges();
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

    /** Carica i ToDo dal server, opzionalmente filtrati per commessa */
    loadData() {
        this.loading = true;
        const completato = this.vistaSelezionata === 'nonCompletati' ? false : true;
        const soloCompletati = this.vistaSelezionata === 'completate';
        const soloScadute = this.vistaSelezionata === 'scadute';

        const lista$ = soloScadute
            ? this.todoService.getScadute(this.commessaSelezionata, TipoPlanning.Edile)
            : this.todoService.getAll(this.commessaSelezionata, undefined, undefined, completato, TipoPlanning.Edile, soloCompletati);

        // Nella vista "Scadute" la lista coincide con le attività scadute:
        // il contatore si ricava dal risultato senza una seconda chiamata
        if (!soloScadute) {
            this.aggiornaContatoreScaduti();
        }

        lista$.pipe(first())
            .subscribe({
                next: (todoList: ToDo[]) => {
                    this.loading = false;
                    this.todoList = todoList;
                    if (soloScadute) {
                        this.todoScadutiCount = this.contaScadutiPerAlert(todoList);
                    }
                    this.cdr.detectChanges();
                },
                error: (err: any) => {
                    this.loading = false;
                    if (err.status == 404) {
                        this.todoList = [];
                        if (soloScadute) {
                            this.todoScadutiCount = 0;
                        }
                        this.ms.add({
                            severity: 'info',
                            summary: 'Nessun dato presente',
                            detail: 'Nessun ToDo trovato',
                            life: 3000,
                        });
                    } else {
                        this.ms.add({
                            severity: 'error',
                            summary: 'Errore',
                            detail: 'Errore nel caricamento dei ToDo',
                            life: 3000,
                        });
                    }
                    this.cdr.detectChanges();
                },
            });
    }

    /**
     * Conta le attività scadute da segnalare nell'alert.
     * L'utente base viene avvisato solo delle attività a lui assegnate come assegnatario
     * primario o secondario, non di quelle che ha semplicemente creato per altri.
     */
    private contaScadutiPerAlert(scaduti: ToDo[]): number {
        if (!this.isUtenteBase) {
            return scaduti.length;
        }

        const utenteId = this.utenteLoggato?.id;
        if (!utenteId) {
            return 0;
        }

        return scaduti.filter(t =>
            t.assegnatarioPrimarioId === utenteId || t.assegnatarioSecondarioId === utenteId
        ).length;
    }

    /** Aggiorna il contatore delle attività scadute mostrato nell'alert */
    private aggiornaContatoreScaduti() {
        this.todoService.getScadute(this.commessaSelezionata, TipoPlanning.Edile).pipe(first())
            .subscribe({
                next: (scaduti: ToDo[]) => {
                    this.todoScadutiCount = this.contaScadutiPerAlert(scaduti);
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.todoScadutiCount = 0;
                    this.cdr.detectChanges();
                },
            });
    }

    /** Testo dell'alert delle attività scadute */
    get messaggioScaduti(): string {
        return this.todoScadutiCount === 1
            ? 'Attenzione: è presente 1 attività scaduta e non ancora completata.'
            : `Attenzione: sono presenti ${this.todoScadutiCount} attività scadute e non ancora completate.`;
    }

    /** Passa alla vista dedicata alle attività scadute */
    mostraVistaScaduti() {
        this.vistaSelezionata = 'scadute';
        this.loadData();
    }

    /** Mostra il dialog per la creazione di un nuovo ToDo */
    mostraFormCreazioneTodo() {
        this.todoInModifica = undefined;
        this.isModifying = false;

        this.nuovoTodoForm = undefined;
        
        this.nuovoTodoForm = this.fb.group({
            commessaId: [this.commessaSelezionata || '', [Validators.required]],
            assegnatarioPrimarioId: [this.authService.isUserUtenteBase() ? (this.utenteLoggato?.id || '') : '', [Validators.required]],
            assegnatarioSecondarioId: [''],
            descrizioneTodo: ['', [Validators.required]],
            dataConsegna: [''],
            priorita: 0,
            descrizioneAttivitaSvolta: [''],
            completato: [false],
        });

        this.showDialogCreazioneTodo = true;
    }

    /** Mostra il dialog per la modifica di un ToDo esistente */
    modificaTodo(todo: ToDo) {
        this.todoInModifica = todo;
        this.isModifying = true;

        this.nuovoTodoForm = this.fb.group({
            commessaId: [todo.commessaId, [Validators.required]],
            assegnatarioPrimarioId: [todo.assegnatarioPrimarioId, [Validators.required]],
            assegnatarioSecondarioId: [todo.assegnatarioSecondarioId || ''],
            descrizioneTodo: [todo.descrizioneTodo, [Validators.required]],
            dataConsegna: [todo.dataConsegna ? new Date(todo.dataConsegna as any) : ''],
            priorita: [todo.priorita || 0],
            descrizioneAttivitaSvolta: [todo.descrizioneAttivitaSvolta || ''],
            completato: [todo.completato],
        });

        if(!this.canEditToDoFields) {
            this.nuovoTodoForm.get('descrizioneTodo')?.disable();
            this.nuovoTodoForm.get('assegnatarioPrimarioId')?.disable();
            this.nuovoTodoForm.get('assegnatarioSecondarioId')?.disable();
            this.nuovoTodoForm.get('dataConsegna')?.disable();
            this.nuovoTodoForm.get('priorita')?.disable();
        }

        this.showDialogCreazioneTodo = true;
    }

    /** Salva il nuovo ToDo e riapre il form precompilato per l'inserimento seriale */
    salvaTodoESuccessivo() {
        if (!this.nuovoTodoForm?.valid) {
            this.ms.add({
                severity: 'warn',
                summary: 'Validazione',
                detail: 'Compila tutti i campi obbligatori',
            });
            return;
        }

        const formValue = this.nuovoTodoForm.getRawValue();

        const todo = new ToDo();
        todo.tipoPlanning = TipoPlanning.Edile;
        todo.commessaId = formValue.commessaId;
        todo.assegnatarioPrimarioId = formValue.assegnatarioPrimarioId;
        todo.assegnatarioSecondarioId = formValue.assegnatarioSecondarioId || null;
        todo.descrizioneTodo = formValue.descrizioneTodo;
        todo.descrizioneAttivitaSvolta = formValue.descrizioneAttivitaSvolta || null;
        todo.completato = formValue.completato || false;
        todo.priorita = formValue.priorita || 0;

        if (formValue.dataConsegna) {
            todo.dataConsegna = moment(formValue.dataConsegna).startOf('day');
        }

        this.todoService.create(todo).subscribe({
            next: () => {
                this.ms.add({
                    severity: 'success',
                    summary: 'Conferma',
                    detail: 'ToDo creato con successo',
                });
                this.loadData();

                // Pulisce solo la descrizione mantenendo tutti gli altri valori precompilati
                this.nuovoTodoForm?.patchValue({ descrizioneTodo: '' });
                this.nuovoTodoForm?.get('descrizioneTodo')?.markAsUntouched();
                this.nuovoTodoForm?.get('descrizioneTodo')?.markAsPristine();

                setTimeout(() => {
                    this.descrizioneTodoInput?.nativeElement?.focus();
                }, 0);
            },
            error: (err: any) => {
                console.debug(err);
                this.ms.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: err.error || 'Errore durante il salvataggio',
                });
            },
        });
    }

    /** Crea o modifica un ToDo a seconda se è in modalità creazione o modifica */
    salvaTodo() {
        if (!this.nuovoTodoForm?.valid) {
            this.ms.add({
                severity: 'warn',
                summary: 'Validazione',
                detail: 'Compila tutti i campi obbligatori',
            });
            return;
        }

        let formValue = this.nuovoTodoForm.getRawValue();

        if (this.isModifying && !this.canEditToDoFields && this.todoInModifica) {
            formValue = {
                ...formValue,
                descrizioneTodo: this.todoInModifica.descrizioneTodo,
                assegnatarioPrimarioId: this.todoInModifica.assegnatarioPrimarioId,
                assegnatarioSecondarioId: this.todoInModifica.assegnatarioSecondarioId,
                dataConsegna: this.todoInModifica.dataConsegna ? this.todoInModifica.dataConsegna.toDate() : null,
                priorita: this.todoInModifica.priorita,
            };
        }

        const todo = new ToDo();
        todo.tipoPlanning = TipoPlanning.Edile;

        if (this.isModifying && this.todoInModifica?.id) {
            todo.id = this.todoInModifica.id;
        }

        todo.commessaId = formValue.commessaId;
        todo.assegnatarioPrimarioId = formValue.assegnatarioPrimarioId;
        todo.assegnatarioSecondarioId = formValue.assegnatarioSecondarioId || null;
        todo.descrizioneTodo = formValue.descrizioneTodo;
        todo.descrizioneAttivitaSvolta = formValue.descrizioneAttivitaSvolta || null;
        todo.completato = formValue.completato || false;
        todo.priorita = formValue.priorita || 0;
        
        if (formValue.dataConsegna) {
            todo.dataConsegna = moment(formValue.dataConsegna).startOf('day');
        }

        const operation$ = this.isModifying && this.todoInModifica?.id
            ? this.todoService.update(this.todoInModifica.id, todo)
            : this.todoService.create(todo);

        operation$.subscribe({
            next: () => {
                this.showDialogCreazioneTodo = false;
                this.ms.add({
                    severity: 'success',
                    summary: 'Conferma',
                    detail: this.isModifying ? 'ToDo modificato con successo' : 'ToDo creato con successo',
                });
                this.loadData();
            },
            error: (err: any) => {
                console.debug(err);
                this.ms.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: err.error || 'Errore durante il salvataggio',
                });
            },
        });
    }

    /** Elimina un ToDo */
    eliminaTodo(todo: ToDo) {
        if (!this.canDeleteTodoRow(todo)) {
            return;
        }

        this.cs.confirm({
            message: `Sei sicuro di voler eliminare questo ToDo?`,
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sì',
            rejectLabel: 'No',
            accept: () => {
                if (todo.id) {
                    this.todoService.delete(todo.id).subscribe({
                        next: () => {
                            this.ms.add({
                                severity: 'success',
                                summary: 'Conferma',
                                detail: 'ToDo eliminato con successo',
                            });
                            this.loadData();
                        },
                        error: (err: any) => {
                            console.debug(err);
                            this.ms.add({
                                severity: 'error',
                                summary: 'Errore',
                                detail: 'Errore durante l\'eliminazione del ToDo',
                            });
                        },
                    });
                }
            },
        });
    }

    /** Marca un ToDo come completato */
    completaTodo(todo: ToDo) {
        if (todo.id) {
            this.todoService.markAsComplete(todo.id).subscribe({
                next: () => {
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'ToDo completato',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Errore durante il completamento del ToDo',
                    });
                },
            });
        }
    }

    /** Riapre un ToDo (marca come non completato) */
    riapriTodo(todo: ToDo) {
        if (todo.id) {
            this.todoService.markAsIncomplete(todo.id).subscribe({
                next: () => {
                    this.ms.add({
                        severity: 'success',
                        summary: 'Conferma',
                        detail: 'ToDo riaperto',
                    });
                    this.loadData();
                },
                error: (err: any) => {
                    console.debug(err);
                    this.ms.add({
                        severity: 'error',
                        summary: 'Errore',
                        detail: 'Errore durante la riapertura del ToDo',
                    });
                },
            });
        }
    }

    /** Ottiene la descrizione della commessa */
    getDescrizioneCommessa(commessaId?: number): string {
        if (!commessaId) return '';
        const commessa = this.commesseList.find(c => c.id === commessaId);
        return commessa?.descrizione || '';
    }

    /** Ottiene il codice interno della commessa */
    getCodiceInternoCommessa(commessaId?: number): string {
        if (!commessaId) return '';
        const commessa = this.commesseList.find(c => c.id === commessaId);
        return commessa?.commessaCodiceInterno || '';
    }

    /** Ottiene il nominativo dell'utente */
    getNominativoUtente(utenteId?: string): string {
        if (!utenteId) return '';
        const utente = this.utentiList.find(u => u.id === utenteId);
        return utente?.nominativo || '';
    }

    /** Ottiene la severità del tag in base allo stato */
    getSeverityCompletato(completato: boolean): 'success' | 'danger' {
        return completato ? 'success' : 'danger';
    }

    /** Ottiene il testo del tag in base allo stato */
    getTestoCompletato(completato: boolean): string {
        return completato ? 'Completato' : 'Da completare';
    }

    /** Gestisce il cambio della commessa selezionata */
    onCommessaChange() {
        setTimeout(() => this.loadData(), 0);
    }

    /** Apre il dialog di caricamento ore e spese precompilato sulla commessa del ToDo */
    caricaOreDaTodo(todo: ToDo) {
        this.editDataOreSpese = { commessaId: todo.commessaId };
        this.showDialogOreSpese = true;
    }

    /** Esporta in Excel i ToDo attualmente visualizzati */
    exportExcel() {
        import('xlsx').then((xlsx) => {
            const todoForExcel = this.todoList.map(todo => ({
                'Codice interno': this.getCodiceInternoCommessa(todo.commessaId),
                'Commessa': this.getDescrizioneCommessa(todo.commessaId),
                'Data creazione': todo.dataCreazione ? todo.dataCreazione.format('DD/MM/YYYY') : '',
                'Data consegna': todo.dataConsegna ? todo.dataConsegna.format('DD/MM/YYYY') : '',
                'Descrizione ToDo': todo.descrizioneTodo ?? '',
                'Stato': this.getTestoCompletato(todo.completato),
                'Data completamento': todo.dataCompletamento ? todo.dataCompletamento.format('DD/MM/YYYY') : '',
                'Priorità': todo.priorita ?? '',
                'Assegnatario primario': this.getNominativoUtente(todo.assegnatarioPrimarioId),
                'Assegnatario secondario': this.getNominativoUtente(todo.assegnatarioSecondarioId),
                'Descrizione attività svolta': todo.descrizioneAttivitaSvolta ?? '',
            }));

            const worksheet = xlsx.utils.json_to_sheet(todoForExcel);
            const workbook = {
                Sheets: { data: worksheet },
                SheetNames: ['data'],
            };
            const excelBuffer: any = xlsx.write(workbook, {
                bookType: 'xlsx',
                type: 'array',
            });
            this.saveAsExcelFile(excelBuffer, 'planning_edile');
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
