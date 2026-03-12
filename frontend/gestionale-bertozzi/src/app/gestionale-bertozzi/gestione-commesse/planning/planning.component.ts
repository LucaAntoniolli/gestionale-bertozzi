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
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import moment from 'moment';

import { ToDo } from '../../../models/GestioneCommesse/todo.model';
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
        ReactiveFormsModule,
        SelectModule,
        TableModule,
        TagModule,
        TextareaModule,
        TitoloPaginaComponent,
        ToolbarModule,
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
    utentiPmEdileList: Utente[] = [];
    utentiList: Utente[] = [];
    utenteLoggato: Utente | null = null;

    prioritaOptions: number[] = [1, 2, 3, 4, 5];
    
    // Filtro per commessa
    commessaSelezionata?: number;

    isMobile$?: Observable<boolean>;

    @ViewChild('dt1') table!: Table;

    // Getter per gestione permessi       
    get canDeleteTodo(): boolean { return this.permissionsService.createEntityHelper('todo').canDelete(); }  
    get canCreateTodo(): boolean { return this.permissionsService.createEntityHelper('todo').canCreate(); }
    get canEditTodo(): boolean { return this.permissionsService.createEntityHelper('todo').canUpdate(); }
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
            utentiPmEdile: this.utenteService.getAll(true, false),
            utenti: this.utenteService.getAll(),
            utente: this.authService.getUser(),
        }).pipe(first()).subscribe({
            next: (data) => {
                this.commesseList = data.commesse;
                this.utentiPmEdileList = data.utentiPmEdile;
                this.utentiList = data.utenti;
                this.utenteLoggato = data.utente;
                // Non caricare i ToDo automaticamente - aspetta la selezione della commessa
                this.loading = false;
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

    /** Carica i ToDo dal server filtrati per commessa */
    loadData() {
        if (!this.commessaSelezionata) {
            this.todoList = [];
            this.loading = false;
            return;
        }
        
        this.loading = true;
        this.todoService.getAll(this.commessaSelezionata).pipe(first())
            .subscribe({
                next: (todoList: ToDo[]) => {
                    this.loading = false;
                    this.todoList = todoList;
                    this.cdr.detectChanges();
                },
                error: (err: any) => {
                    this.loading = false;
                    if (err.status == 404) {
                        this.todoList = [];
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

    /** Mostra il dialog per la creazione di un nuovo ToDo */
    mostraFormCreazioneTodo() {
        this.todoInModifica = undefined;
        this.isModifying = false;

        this.nuovoTodoForm = undefined;
        
        this.nuovoTodoForm = this.fb.group({
            commessaId: [this.commessaSelezionata || '', [Validators.required]],
            assegnatarioPrimarioId: ['', [Validators.required]],
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
}
