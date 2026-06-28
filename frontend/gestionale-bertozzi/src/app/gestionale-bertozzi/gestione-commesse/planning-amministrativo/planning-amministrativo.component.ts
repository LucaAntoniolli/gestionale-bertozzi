import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import moment from 'moment';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { first, forkJoin, map, Observable } from 'rxjs';
import { CommessaLight } from '../../../models/GestioneCommesse/commessa-light';
import { ToDo, TipoPlanning } from '../../../models/GestioneCommesse/todo.model';
import { Utente } from '../../../models/utente';
import { CommessaService } from '../../../services/GestioneCommesse/commessa.service';
import { TodoService } from '../../../services/GestioneCommesse/todo.service';
import { UtenteService } from '../../../services/utente.service';
import { AuthService } from '../../../auth/auth.service';
import { TitoloPaginaComponent } from '../../shared/components/titolo-pagina/titolo-pagina.component';

@Component({
    selector: 'app-planning-amministrativo',
    templateUrl: './planning-amministrativo.component.html',
    styleUrls: ['./planning-amministrativo.component.css'],
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
        InputText,
        MessageModule,
        ReactiveFormsModule,
        SelectModule,
        SelectButtonModule,
        TableModule,
        TagModule,
        TextareaModule,
        TitoloPaginaComponent,
        ToolbarModule,
        TooltipModule,
    ],
})
export class PlanningAmministrativoComponent implements OnInit {

    todoList: ToDo[] = [];
    commesseList: CommessaLight[] = [];
    utentiList: Utente[] = [];
    utenteLoggato: Utente | null = null;
    loading = true;
    commessaSelezionata?: number;
    todoForm?: FormGroup;
    todoInModifica?: ToDo;
    showDialog = false;
    isMobile$?: Observable<boolean>;
    readonly prioritaOptions = [1, 2, 3, 4, 5];
    readonly vistaOptions = [
        { label: 'Non completati e recenti', value: 'nonCompletati' },
        { label: 'Tutti', value: 'tutti' },
    ];
    vistaSelezionata = 'nonCompletati';

    @ViewChild('todoTable') table!: Table;
    @ViewChild('descrizioneTodoInput') descrizioneTodoInput?: ElementRef;

    constructor(
        private todoService: TodoService,
        private commessaService: CommessaService,
        private utenteService: UtenteService,
        private authService: AuthService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private breakpointObserver: BreakpointObserver,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.isMobile$ = this.breakpointObserver
            .observe([Breakpoints.Handset, Breakpoints.Tablet])
            .pipe(map(result => result.matches));

        this.loadReferenceData();
    }

    loadData(): void {
        this.loading = true;
        const completato = this.vistaSelezionata === 'nonCompletati' ? false : true;
        this.todoService.getAll(this.commessaSelezionata, undefined, undefined, completato, TipoPlanning.Amministrativo).pipe(first()).subscribe({
            next: todoList => {
                this.todoList = todoList;
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.todoList = [];
                this.loading = false;
                this.showError('Errore nel caricamento delle attività amministrative');
                this.cdr.markForCheck();
            },
        });
    }

    mostraFormCreazione(): void {
        this.todoInModifica = undefined;
        this.todoForm = this.createForm();
        this.showDialog = true;
    }

    modificaTodo(todo: ToDo): void {
        this.todoInModifica = todo;
        this.todoForm = this.createForm(todo);
        this.showDialog = true;
    }

    salvaTodo(): void {
        if (!this.todoForm?.valid) {
            this.todoForm?.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Validazione',
                detail: 'Compila tutti i campi obbligatori',
            });
            return;
        }

        const todo = this.buildTodoFromForm();

        let operation$: Observable<ToDo | void>;
        if (this.todoInModifica?.id) {
            operation$ = this.todoService.update(this.todoInModifica.id, todo);
        } else {
            operation$ = this.todoService.create(todo);
        }

        operation$.pipe(first()).subscribe({
            next: () => {
                this.showDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Conferma',
                    detail: this.todoInModifica
                        ? 'Attività amministrativa modificata con successo'
                        : 'Attività amministrativa creata con successo',
                });
                this.loadData();
            },
            error: (error: any) => {
                const detail = typeof error?.error === 'string'
                    ? error.error
                    : 'Errore durante il salvataggio dell’attività amministrativa';
                this.showError(detail);
            },
        });
    }

    salvaTodoESuccessivo(): void {
        if (!this.todoForm?.valid || this.todoInModifica) {
            this.todoForm?.markAllAsTouched();
            return;
        }

        this.todoService.create(this.buildTodoFromForm()).pipe(first()).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Conferma',
                    detail: 'Attività amministrativa creata con successo',
                });
                this.loadData();
                this.todoForm?.patchValue({ descrizioneTodo: '' });
                this.todoForm?.get('descrizioneTodo')?.markAsPristine();
                this.todoForm?.get('descrizioneTodo')?.markAsUntouched();
                setTimeout(() => this.descrizioneTodoInput?.nativeElement?.focus(), 0);
            },
            error: (error: any) => this.showError(
                typeof error?.error === 'string'
                    ? error.error
                    : 'Errore durante il salvataggio dell’attività amministrativa'
            ),
        });
    }

    completaTodo(todo: ToDo): void {
        if (!todo.id) return;
        this.todoService.markAsComplete(todo.id).pipe(first()).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Conferma', detail: 'Attività completata' });
                this.loadData();
            },
            error: () => this.showError('Errore durante il completamento dell’attività'),
        });
    }

    riapriTodo(todo: ToDo): void {
        if (!todo.id) return;
        this.todoService.markAsIncomplete(todo.id).pipe(first()).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Conferma', detail: 'Attività riaperta' });
                this.loadData();
            },
            error: () => this.showError('Errore durante la riapertura dell’attività'),
        });
    }

    canDeleteTodo(todo: ToDo): boolean {
        const creator = todo.utenteCreazione?.trim().toLowerCase();
        const currentUserEmail = this.utenteLoggato?.email?.trim().toLowerCase();
        return !!creator && !!currentUserEmail && creator === currentUserEmail;
    }

    eliminaTodo(todo: ToDo): void {
        if (!todo.id || !this.canDeleteTodo(todo)) return;

        this.confirmationService.confirm({
            message: 'Sei sicuro di voler eliminare questa attività amministrativa?',
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sì',
            rejectLabel: 'No',
            accept: () => {
                this.todoService.delete(todo.id!).pipe(first()).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Conferma',
                            detail: 'Attività amministrativa eliminata',
                        });
                        this.loadData();
                    },
                    error: (error: any) => this.showError(
                        error?.status === 403
                            ? 'Può eliminare l’attività soltanto chi l’ha creata'
                            : 'Errore durante l’eliminazione dell’attività'
                    ),
                });
            },
        });
    }

    onCommessaChange(): void {
        this.loadData();
    }

    getCodiceInternoCommessa(commessaId?: number): string {
        return this.commesseList.find(c => c.id === commessaId)?.commessaCodiceInterno || '';
    }

    getDescrizioneCommessa(commessaId?: number): string {
        return this.commesseList.find(c => c.id === commessaId)?.descrizione || '';
    }

    getNominativoUtente(utenteId?: string): string {
        return this.utentiList.find(u => u.id === utenteId)?.nominativo || '';
    }

    getSeverityCompletato(completato: boolean): 'success' | 'danger' {
        return completato ? 'success' : 'danger';
    }

    getTestoCompletato(completato: boolean): string {
        return completato ? 'Completato' : 'Da completare';
    }

    private loadReferenceData(): void {
        forkJoin({
            commesse: this.commessaService.getAllLight(),
            utenti: this.utenteService.getAll(),
            utente: this.authService.getUser(),
        }).pipe(first()).subscribe({
            next: data => {
                this.commesseList = data.commesse;
                this.utentiList = data.utenti;
                this.utenteLoggato = data.utente;
                this.loadData();
            },
            error: () => {
                this.loading = false;
                this.showError('Errore nel caricamento di commesse e utenti');
                this.cdr.markForCheck();
            },
        });
    }

    private createForm(todo?: ToDo): FormGroup {
        return this.fb.group({
            commessaId: [todo?.commessaId ?? this.commessaSelezionata ?? '', Validators.required],
            descrizioneTodo: [todo?.descrizioneTodo ?? '', Validators.required],
            assegnatarioPrimarioId: [todo?.assegnatarioPrimarioId ?? '', Validators.required],
            priorita: [todo?.priorita || null, Validators.required],
            dataConsegna: [todo?.dataConsegna?.toDate() ?? null, Validators.required],
            descrizioneAttivitaSvolta: [todo?.descrizioneAttivitaSvolta ?? ''],
            completato: [todo?.completato ?? false],
        });
    }

    private buildTodoFromForm(): ToDo {
        const value = this.todoForm!.getRawValue();
        const todo = new ToDo();
        todo.id = this.todoInModifica?.id;
        todo.tipoPlanning = TipoPlanning.Amministrativo;
        todo.commessaId = value.commessaId;
        todo.descrizioneTodo = value.descrizioneTodo;
        todo.assegnatarioPrimarioId = value.assegnatarioPrimarioId;
        todo.priorita = value.priorita;
        todo.dataConsegna = moment(value.dataConsegna).startOf('day');
        todo.descrizioneAttivitaSvolta = value.descrizioneAttivitaSvolta || undefined;
        todo.completato = value.completato;
        return todo;
    }

    private showError(detail: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail,
            life: 4000,
        });
    }
}
