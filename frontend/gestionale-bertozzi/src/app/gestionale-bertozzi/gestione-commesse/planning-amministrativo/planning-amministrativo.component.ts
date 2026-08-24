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
import { PermissionsService } from '../../../auth/permissions.service';
import { TitoloPaginaComponent } from '../../shared/components/titolo-pagina/titolo-pagina.component';
import { OreSpeseDialogComponent, OreSpeseDialogEditData } from '../../shared/components/ore-spese-dialog/ore-spese-dialog.component';
import * as FileSaver from 'file-saver';

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
        { label: 'Scadute', value: 'scadute' },
        { label: 'Completate', value: 'completate' },
        { label: 'Tutti', value: 'tutti' },
    ];
    vistaSelezionata = 'nonCompletati';

    // Numero di attività scadute e non completate, usato per l'alert sopra la tabella
    todoScadutiCount = 0;

    // Dialog caricamento ore e spese da un'attività del planning
    showDialogOreSpese = false;
    editDataOreSpese?: OreSpeseDialogEditData;

    @ViewChild('todoTable') table!: Table;
    @ViewChild('descrizioneTodoInput') descrizioneTodoInput?: ElementRef;

    get canCreateOreSpese(): boolean { return this.permissionsService.createEntityHelper('orespesecommessa').canCreate(); }
    get isUtenteBase(): boolean { return this.authService.isUserUtenteBase(); }

    constructor(
        private todoService: TodoService,
        private commessaService: CommessaService,
        private utenteService: UtenteService,
        private authService: AuthService,
        private permissionsService: PermissionsService,
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
        const soloCompletati = this.vistaSelezionata === 'completate';
        const soloScadute = this.vistaSelezionata === 'scadute';

        const lista$ = soloScadute
            ? this.todoService.getScadute(this.commessaSelezionata, TipoPlanning.Amministrativo)
            : this.todoService.getAll(this.commessaSelezionata, undefined, undefined, completato, TipoPlanning.Amministrativo, soloCompletati);

        // Nella vista "Scadute" la lista coincide con le attività scadute:
        // il contatore si ricava dal risultato senza una seconda chiamata
        if (!soloScadute) {
            this.aggiornaContatoreScaduti();
        }

        lista$.pipe(first()).subscribe({
            next: todoList => {
                this.todoList = todoList;
                if (soloScadute) {
                    this.todoScadutiCount = this.contaScadutiPerAlert(todoList);
                }
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.todoList = [];
                if (soloScadute) {
                    this.todoScadutiCount = 0;
                }
                this.loading = false;
                this.showError('Errore nel caricamento delle attività amministrative');
                this.cdr.markForCheck();
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
    private aggiornaContatoreScaduti(): void {
        this.todoService.getScadute(this.commessaSelezionata, TipoPlanning.Amministrativo).pipe(first()).subscribe({
            next: scaduti => {
                this.todoScadutiCount = this.contaScadutiPerAlert(scaduti);
                this.cdr.markForCheck();
            },
            error: () => {
                this.todoScadutiCount = 0;
                this.cdr.markForCheck();
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
    mostraVistaScaduti(): void {
        this.vistaSelezionata = 'scadute';
        this.loadData();
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

    /** Apre il dialog di caricamento ore e spese precompilato sulla commessa dell'attività */
    caricaOreDaTodo(todo: ToDo): void {
        this.editDataOreSpese = { commessaId: todo.commessaId };
        this.showDialogOreSpese = true;
    }

    /** Esporta in Excel le attività amministrative attualmente visualizzate */
    exportExcel(): void {
        import('xlsx').then(xlsx => {
            const todoForExcel = this.todoList.map(todo => ({
                'Codice interno': this.getCodiceInternoCommessa(todo.commessaId),
                'Commessa': this.getDescrizioneCommessa(todo.commessaId),
                'Data creazione': todo.dataCreazione ? todo.dataCreazione.format('DD/MM/YYYY') : '',
                'Data consegna': todo.dataConsegna ? todo.dataConsegna.format('DD/MM/YYYY') : '',
                'Descrizione': todo.descrizioneTodo ?? '',
                'Stato': this.getTestoCompletato(todo.completato),
                'Data completamento': todo.dataCompletamento ? todo.dataCompletamento.format('DD/MM/YYYY') : '',
                'Priorità': todo.priorita ?? '',
                'Assegnatario': this.getNominativoUtente(todo.assegnatarioPrimarioId),
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
            this.saveAsExcelFile(excelBuffer, 'planning_amministrativo');
        });
    }

    saveAsExcelFile(buffer: any, fileName: string): void {
        const EXCEL_TYPE =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const EXCEL_EXTENSION = '.xlsx';
        const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
        FileSaver.saveAs(
            data,
            fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
        );
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
            priorita: [todo?.priorita || null],
            dataConsegna: [todo?.dataConsegna?.toDate() ?? null],
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
        todo.dataConsegna = value.dataConsegna ? moment(value.dataConsegna).startOf('day') : undefined;
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
