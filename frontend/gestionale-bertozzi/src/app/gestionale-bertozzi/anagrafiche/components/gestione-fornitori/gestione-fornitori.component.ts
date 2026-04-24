import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, forkJoin, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TitoloPaginaComponent } from '../../../shared/components/titolo-pagina/titolo-pagina.component';
import { Fornitore } from '../../../../models/Anagrafiche/fornitore';
import { ModalitaPagamento } from '../../../../models/Anagrafiche/modalita-pagamento';
import { FornitoreService } from '../../../../services/Anagrafiche/fornitore.service';
import { ModalitaPagamentoService } from '../../../../services/Anagrafiche/modalita-pagamento.service';

@Component({
    selector: 'app-gestione-fornitori',
    templateUrl: './gestione-fornitori.component.html',
    styleUrls: ['./gestione-fornitori.component.css'],
    standalone: true,
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
export class GestioneFornitoriComponent implements OnInit {

    fornitori: Fornitore[] = [];
    modalitaPagamento: ModalitaPagamento[] = [];
    loading: boolean = true;

    // Form unico per creazione e modifica
    fornitoreForm?: FormGroup;
    isModifying: boolean = false;
    selectedFornitore?: Fornitore;

    // Dialog visibility
    showDialog: boolean = false;

    // Tipo fornitore
    tipoFornitore: string[] = ['Azienda', 'Privato', 'Professionista', 'Pubblica Amministrazione'];

    @ViewChild('filter') filter!: ElementRef;

    isMobile$?: Observable<boolean>;

    constructor(
        private fornitoreService: FornitoreService,
        private modalitaPagamentoService: ModalitaPagamentoService,
        private fb: FormBuilder,
        private conf: ConfirmationService,
        private ms: MessageService,
        private cdr: ChangeDetectorRef,
        private bo: BreakpointObserver,
    ) { }

    ngOnInit() {
        this.loadData();
        this.isMobile$ = this.bo
            .observe([Breakpoints.Handset, Breakpoints.Tablet])
            .pipe(map((result) => result.matches));
    }

    private loadData() {
        this.loading = true;
        forkJoin({
            fornitori: this.fornitoreService.getAll(),
            modalitaPagamento: this.modalitaPagamentoService.getAll()
        }).pipe(first())
            .subscribe({
                next: (result) => {
                    this.loading = false;
                    this.fornitori = result.fornitori;
                    this.modalitaPagamento = result.modalitaPagamento;
                    this.cdr.detectChanges();
                },
                error: (err: any) => {
                    this.loading = false;
                    if (err.status == 404) {
                        this.fornitori = [];
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

    // ==================== FORNITORE CRUD ====================

    mostraFormCreazione() {
        this.isModifying = false;
        this.selectedFornitore = undefined;
        this.fornitoreForm = this.fb.group({
            ragioneSociale: ['', [Validators.required, Validators.minLength(2)]],
            sigla: [''],
            modalitaPagamentoId: [null],
            partitaIva: [''],
            codiceFiscale: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
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
        this.showDialog = true;
    }

    mostraFormModifica(fornitore: Fornitore) {
        this.isModifying = true;
        this.selectedFornitore = fornitore;
        this.fornitoreForm = this.fb.group({
            ragioneSociale: [fornitore.ragioneSociale, [Validators.required, Validators.minLength(2)]],
            sigla: [fornitore.sigla],
            modalitaPagamentoId: [fornitore.modalitaPagamentoId],
            partitaIva: [fornitore.partitaIva],
            codiceFiscale: [fornitore.codiceFiscale, [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
            indirizzo: [fornitore.indirizzo],
            comune: [fornitore.comune],
            cap: [fornitore.cap],
            provincia: [fornitore.provincia],
            nazione: [fornitore.nazione],
            telefono: [fornitore.telefono],
            email: [fornitore.email, [Validators.email]],
            sdi: [fornitore.sdi],
            tipo: [fornitore.tipo, [Validators.required]],
        });
        this.showDialog = true;
    }

    salva() {
        if (this.isModifying) {
            this.modifica();
        } else {
            this.crea();
        }
    }

    private crea() {
        const formValue = this.fornitoreForm?.value;
        const nuovoFornitore = new Fornitore();
        Object.assign(nuovoFornitore, formValue);

        this.fornitoreService.create(nuovoFornitore).subscribe({
            next: () => {
                this.showDialog = false;
                this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Fornitore creato con successo' });
                this.loadData();
            },
            error: () => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile creare il fornitore' });
            },
        });
    }

    private modifica() {
        const formValue = this.fornitoreForm?.value;
        const fornitoreAggiornato = { ...this.selectedFornitore! } as Fornitore;
        Object.assign(fornitoreAggiornato, formValue);

        this.fornitoreService.update(this.selectedFornitore!.id!, fornitoreAggiornato).subscribe({
            next: () => {
                this.showDialog = false;
                this.ms.add({ severity: 'success', summary: 'Conferma', detail: 'Fornitore modificato con successo' });
                this.loadData();
            },
            error: () => {
                this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile modificare il fornitore' });
            },
        });
    }

    elimina(event: Event, fornitore: Fornitore) {
        this.conf.confirm({
            target: event.target as EventTarget,
            message: 'Sei sicuro di voler eliminare questo fornitore?',
            header: 'Conferma eliminazione',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'No',
            acceptLabel: 'Sì',
            acceptIcon: 'pi pi-check',
            rejectIcon: 'pi pi-times',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-primary',
            accept: () => {
                this.fornitoreService.delete(fornitore.id!).subscribe({
                    next: () => {
                        this.ms.add({
                            severity: 'success',
                            summary: 'Fornitore eliminato',
                            detail: 'Il fornitore è stato eliminato con successo',
                        });
                        this.loadData();
                    },
                    error: () => {
                        this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile eliminare il fornitore' });
                    },
                });
            },
            reject: () => {
                this.ms.add({
                    severity: 'info',
                    summary: 'Operazione annullata',
                    detail: 'Il fornitore non è stato eliminato',
                    life: 3000,
                });
            },
        });
    }

    // ==================== UTILITY ====================

    exportExcel() {
        import('xlsx').then((xlsx) => {
            const data = this.fornitori.map(f => ({
                'Ragione Sociale': f.ragioneSociale,
                'Sigla': f.sigla,
                'Tipo': f.tipo,
                'P.IVA': f.partitaIva,
                'Cod. Fiscale': f.codiceFiscale,
                'Email': f.email,
                'Telefono': f.telefono,
                'Indirizzo': f.indirizzo,
                'Comune': f.comune,
                'CAP': f.cap,
                'Provincia': f.provincia,
                'Nazione': f.nazione,
                'SDI': f.sdi,
                'Modalità Pagamento': f.modalitaPagamento?.descrizione,
            }));
            const ws = xlsx.utils.json_to_sheet(data);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, 'Fornitori');
            const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
            import('file-saver').then(module => {
                const FileSaver = module.default;
                const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
                FileSaver.saveAs(dataBlob, 'fornitori.xlsx');
            });
        });
    }
}
