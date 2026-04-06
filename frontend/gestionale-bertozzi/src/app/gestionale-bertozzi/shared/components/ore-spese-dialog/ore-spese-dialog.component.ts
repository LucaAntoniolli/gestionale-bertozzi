import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { first, map, Observable } from 'rxjs';
import moment from 'moment';

import { Commessa } from '../../../../models/GestioneCommesse/commessa';
import { PianoSviluppo } from '../../../../models/GestioneCommesse/piano-sviluppo';
import { Utente } from '../../../../models/utente';
import { OreSpeseCommessa } from '../../../../models/GestioneCommesse/ore-spese-commessa.model';
import { OreSpeseCommessaService } from '../../../../services/GestioneCommesse/ore-spese-commessa.service';
import { PianoSviluppoService } from '../../../../services/GestioneCommesse/piano-sviluppo.service';

export interface OreSpeseDialogEditData {
    id?: number;
    commessaId?: number;
    pianoSviluppoId?: number;
    utenteId?: string;
    data?: Date | null;
    ore?: number | null;
    spese?: number | null;
    chilometri?: number | null;
    note?: string | null;
}

@Component({
    selector: 'app-ore-spese-dialog',
    templateUrl: './ore-spese-dialog.component.html',
    styleUrls: ['./ore-spese-dialog.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        CommonModule,
        DatePickerModule,
        DialogModule,
        FormsModule,
        InputNumberModule,
        InputText,
        ReactiveFormsModule,
        SelectModule,
    ],
})
export class OreSpeseDialogComponent implements OnChanges {

    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    @Input() isModifying: boolean = false;
    /** Lista commesse da mostrare nel selettore. Se vuota e fixedCommessaId non è impostato, il campo commessa è nascosto. */
    @Input() commesseList: Commessa[] = [];
    @Input() utentiList: Utente[] = [];
    @Input() isUtenteBase: boolean = false;
    @Input() utenteLoggatoId?: string;
    /** Se impostato, la commessa è fissa e il selettore viene nascosto. */
    @Input() fixedCommessaId?: number;
    /** Dati iniziali da pre-caricare nel form (modalità modifica). */
    @Input() editData?: OreSpeseDialogEditData;
    /** Mostra il pulsante "Salva e continua" (solo in creazione). */
    @Input() showSalvaEContinua: boolean = false;

    @Output() salvato = new EventEmitter<void>();
    @Output() salvataEContinua = new EventEmitter<void>();

    form?: FormGroup;
    pianiSviluppoList: PianoSviluppo[] = [];
    loadingPiani: boolean = false;
    isMobile$?: Observable<boolean>;

    get showCommessaSelector(): boolean {
        return !this.fixedCommessaId;
    }

    constructor(
        private oreSpeseService: OreSpeseCommessaService,
        private pianoService: PianoSviluppoService,
        private fb: FormBuilder,
        private ms: MessageService,
        private bo: BreakpointObserver,
        private cdr: ChangeDetectorRef,
    ) {
        this.isMobile$ = this.bo
            .observe([Breakpoints.Handset, Breakpoints.Tablet])
            .pipe(map((result) => result.matches));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible']?.currentValue === true) {
            this.initForm();
        }
    }

    private initForm(): void {
        this.pianiSviluppoList = [];

        const commessaId = this.fixedCommessaId ?? this.editData?.commessaId ?? null;
        const utenteId = (this.isUtenteBase && !this.isModifying)
            ? (this.utenteLoggatoId ?? null)
            : (this.editData?.utenteId ?? null);

        this.form = this.fb.group({
            commessaId: [commessaId, this.fixedCommessaId ? [] : [Validators.required]],
            pianoSviluppoId: [this.editData?.pianoSviluppoId ?? null, [Validators.required]],
            utenteId: [utenteId, [Validators.required]],
            data: [this.editData?.data ?? null, [Validators.required]],
            ore: [this.editData?.ore ?? null, [Validators.required, Validators.min(0), Validators.max(12)]],
            spese: [this.editData?.spese ?? null, [Validators.min(0)]],
            chilometri: [this.editData?.chilometri ?? null, [Validators.min(0)]],
            note: [this.editData?.note ?? ''],
        });

        if (commessaId) {
            this.loadPiani(commessaId);
        }
    }

    private loadPiani(commessaId: number): void {
        this.loadingPiani = true;
        this.pianoService.getAll(commessaId).pipe(first()).subscribe({
            next: (piani) => {
                this.pianiSviluppoList = piani;
                this.loadingPiani = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingPiani = false;
            },
        });
    }

    onCommessaChange(commessaId: number | null): void {
        this.form?.patchValue({ pianoSviluppoId: null });
        this.pianiSviluppoList = [];
        if (!commessaId) return;
        this.loadPiani(commessaId);
    }

    chiudi(): void {
        this.visibleChange.emit(false);
    }

    private buildPayload(): OreSpeseCommessa {
        const v = this.form!.getRawValue();
        const o = new OreSpeseCommessa();
        o.commessaId = this.fixedCommessaId ?? v.commessaId;
        o.pianoSviluppoId = v.pianoSviluppoId;
        o.utenteId = v.utenteId;
        o.data = v.data ? moment.utc(moment(v.data).format('YYYY-MM-DD')) : undefined;
        o.ore = v.ore ?? undefined;
        o.spese = v.spese ?? undefined;
        o.chilometri = v.chilometri ?? undefined;
        o.note = v.note || undefined;
        return o;
    }

    salva(): void {
        if (!this.form?.valid) {
            this.form?.markAllAsTouched();
            this.ms.add({ severity: 'warn', summary: 'Validazione', detail: 'Compila tutti i campi obbligatori', life: 3000 });
            return;
        }

        const payload = this.buildPayload();
        const op$ = this.isModifying && this.editData?.id
            ? this.oreSpeseService.update(this.editData.id, { ...payload, id: this.editData.id })
            : this.oreSpeseService.create(payload);

        op$.pipe(first()).subscribe({
            next: () => {
                this.ms.add({
                    severity: 'success',
                    summary: 'Conferma',
                    detail: this.isModifying ? 'Ore e spese modificate con successo' : 'Ore e spese caricate con successo',
                    life: 3000,
                });
                this.visibleChange.emit(false);
                this.salvato.emit();
            },
            error: (err: any) => {
                this.ms.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: err.error || 'Errore durante il salvataggio',
                    life: 3000,
                });
            },
        });
    }

    salvaEContinua(): void {
        if (!this.form?.valid) {
            this.form?.markAllAsTouched();
            this.ms.add({ severity: 'warn', summary: 'Validazione', detail: 'Compila tutti i campi obbligatori', life: 3000 });
            return;
        }

        const payload = this.buildPayload();
        this.oreSpeseService.create(payload).pipe(first()).subscribe({
            next: () => {
                this.ms.add({
                    severity: 'success',
                    summary: 'Conferma',
                    detail: 'Ore e spese caricate con successo',
                    life: 3000,
                });
                this.salvataEContinua.emit();
                // Mantieni tutti i valori tranne la data
                this.form?.patchValue({ data: null });
                this.form?.get('data')?.markAsUntouched();
                this.form?.get('data')?.markAsPristine();
            },
            error: (err: any) => {
                this.ms.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: err.error || 'Errore durante il salvataggio',
                    life: 3000,
                });
            },
        });
    }
}
