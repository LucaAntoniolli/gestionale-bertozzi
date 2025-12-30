import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { first, map, Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Table, TableModule } from 'primeng/table';
import { DataView, DataViewModule } from 'primeng/dataview';
import * as FileSaver from 'file-saver';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TitoloPaginaComponent } from '../../../shared/components/titolo-pagina/titolo-pagina.component';
import { PasswordModule } from 'primeng/password';
import { InputText } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { Utente } from '../../../../models/utente';
import { Ruolo } from '../../../../models/ruolo';
import { GestioneAccessoService } from '../../../../services/gestione-accesso.service';

@Component({
  selector: 'app-gestione-utenti',
  templateUrl: './gestione-utenti.component.html',
  styleUrls: ['./gestione-utenti.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,

    TitoloPaginaComponent,

    ButtonModule,
    DataViewModule,
    DialogModule,
    SelectModule,
    TableModule,
    ToolbarModule,
    PasswordModule,
    InputText,
    InputNumberModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
  ]
})
export class GestioneUtentiComponent implements OnInit {

  // Validatore personalizzato per società obbligatoria quando utente è esterno
  private societaRequiredWhenEsterno(control: AbstractControl): ValidationErrors | null {
    const isEsterno = control.get('isEsterno')?.value;
    const societa = control.get('societa')?.value;

    if (isEsterno && (!societa || societa.trim() === '')) {
      return { societaRequiredForEsterno: true };
    }

    return null;
  }

  utenti?: Utente[];
  ruoli?: Ruolo[];
  loading: boolean = true;
  nuovoUtenteForm?: FormGroup;
  modificaUtenteForm?: FormGroup;
  showDialogCreazioneUtente: boolean = false;
  showDialogModificaUtente: boolean = false;
  disabilitaEliminazioneUtenti: boolean = false;
  isNewUser: boolean = true;
  utente?: Utente;
  errori?: string;

  isMobile$?: Observable<boolean>;

  @ViewChild('filter') filter!: ElementRef;

  constructor(
    private gas: GestioneAccessoService,
    private fb: FormBuilder,
    private conf: ConfirmationService,
    private ms: MessageService,
    private bo: BreakpointObserver,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.isMobile$ = this.bo
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .pipe(map((result) => result.matches));

    this.loadData();
  }

  private loadData() {
    // Forza il bypass della cache del service worker per avere dati freschi
    this.gas.elencoUtenti().pipe(first())
      .subscribe({
        next: (ut) => {
          this.loading = false;
          this.utenti = ut;
          this.cdr.detectChanges();

          if (this.utenti?.length == 1) {
            this.disabilitaEliminazioneUtenti = true;
          }
          else {
            this.disabilitaEliminazioneUtenti = false;
          }
        },
        error: (err) => {
          if (err.status == 404) {
            this.loading = false;
            this.utenti = [];
            this.ms.add({
              severity: 'info',
              summary: 'Nessun dato presente',
              detail: 'Nessun utente trovato',
              life: 3000,
            });
          }
        },
      });

    this.gas.elencoRuoli().pipe(first())
      .subscribe({
        next: (rl) => {
          this.ruoli = rl;
        },
      });
  }

  mostraFormCreazioneUtente() {
    this.nuovoUtenteForm = this.fb.group({
      nominativo: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(12), Validators.pattern(/^(?=.*[0-9])(?=.*[a-zA-Z]).{12,}$/)]],
      ruolo: ['', [Validators.required]],
      isEsterno: [false],
      societa: [''],
      costoOrario: [0],
    }, { validators: this.societaRequiredWhenEsterno });

    // Aggiungo listener per cambiamenti nel campo isEsterno
    this.nuovoUtenteForm.get('isEsterno')?.valueChanges.subscribe(() => {
      this.nuovoUtenteForm!.updateValueAndValidity();
    });

    this.showDialogCreazioneUtente = true;
  }

  mostraFormModificaUtente(event: Event, email: string, nominativo: string, ruoli?: string[]) {
    this.isNewUser = false;
    this.utente = new Utente();
    this.utente.email = email;
    this.utente.nominativo = nominativo;
    this.utente.ruoli = ruoli || [];

    // Trova l'utente completo per ottenere tutti i dati
    const utenteCompleto = this.utenti?.find(u => u.email === email);

    this.modificaUtenteForm = this.fb.group({
      nominativo: new FormControl({ value: this.utente.nominativo, disabled: false }, Validators.required),
      ruolo: new FormControl({ value: this.utente.ruoli && this.utente.ruoli.length > 0 ? this.utente.ruoli[0] : '', disabled: false }, Validators.required),
      isEsterno: new FormControl({ value: utenteCompleto?.isEsterno || false, disabled: false }),
      societa: new FormControl({ value: utenteCompleto?.societa || '', disabled: false }),
      costoOrario: new FormControl({ value: utenteCompleto?.costoOrario || null, disabled: false }),
    }, { validators: this.societaRequiredWhenEsterno });

    // Aggiungo listener per cambiamenti nel campo isEsterno
    this.modificaUtenteForm.get('isEsterno')?.valueChanges.subscribe(() => {
      this.modificaUtenteForm!.updateValueAndValidity();
    });

    this.showDialogModificaUtente = true;
  }

  creaUtente() {
    let formValue = this.nuovoUtenteForm?.value;
    this.gas.creaUtente(
      formValue.nominativo,
      formValue.email,
      formValue.password,
      formValue.ruolo,
      formValue.isEsterno,
      formValue.societa,
      formValue.costoOrario
    )
      .subscribe({
        next: () => {
          this.showDialogCreazioneUtente = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: 'Utente creato con successo',
          });
          this.loadData();
        },
        error: (err) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile creare l\'utente: ' + err.error,
          });
        },
      });
  }

  modificaUtente() {
    let formValue = this.modificaUtenteForm?.value;
    this.gas.modificaUtente(
      this.utente!.email!,
      formValue.nominativo,
      formValue.ruolo,
      formValue.isEsterno,
      formValue.societa,
      formValue.costoOrario ? formValue.costoOrario : 0
    )
      .subscribe({
        next: () => {
          this.showDialogModificaUtente = false;
          this.ms.add({
            severity: 'success',
            summary: 'Conferma',
            detail: 'Utente modificato con successo',
          });
          this.loadData();
        },
        error: (err) => {
          console.debug(err);
          this.ms.add({
            severity: 'error',
            summary: 'Errore',
            detail: err.error,
          });
        },
      });
  }

  eliminaUtente(event: Event, email: string) {
    this.conf.confirm({
      target: event.target as EventTarget,
      message: "Sei sicuro di voler eliminare l'utente?",
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'No',
      acceptLabel: 'Sì',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.gas.eliminaUtente(email).subscribe({
          next: () => {
            this.ms.add({
              severity: 'success',
              summary: 'Utente eliminato',
              detail: "L'utente è stato eliminato con successo",
            });
            this.loadData();
          },
        });
      },
      reject: () => {
        this.ms.add({
          severity: 'info',
          summary: 'Operazione annullata',
          detail: "L'utente non è stato eliminato",
          life: 3000,
        });
      },
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal(
      (event.target as HTMLInputElement).value,
      'contains'
    );
  }

  clear(table: Table) {
    table.clear();
    this.filter.nativeElement.value = '';
  }

  onFilter(dv: DataView, event: Event) {
    dv.filter((event.target as HTMLInputElement).value);
  }

  exportExcel() {
    import('xlsx').then((xlsx) => {
      const utentiForExcel = this.utenti?.map(utente => ({
        nominativo: utente.nominativo,
        email: utente.email,
        ruolo: utente.ruoli?.join(', '),
        isEsterno: utente.isEsterno ? 'S\u00ec' : 'No',
        societa: utente.societa || '',
        costoOrario: utente.costoOrario || '',
      }));

      if (utentiForExcel) {
        const worksheet = xlsx.utils.json_to_sheet(utentiForExcel);
        const workbook = {
          Sheets: { data: worksheet },
          SheetNames: ['data'],
        };
        const excelBuffer: any = xlsx.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        });
        this.saveAsExcelFile(excelBuffer, 'utenti');
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
