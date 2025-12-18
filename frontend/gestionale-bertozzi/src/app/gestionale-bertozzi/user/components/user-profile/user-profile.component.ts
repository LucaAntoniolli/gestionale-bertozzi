import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ɵinjectChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { first, forkJoin } from 'rxjs';

import { BadgeModule } from 'primeng/badge';
import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { QRCodeComponent } from 'angularx-qrcode';

import { AuthService } from '../../../../auth/auth.service';
import { TfaSetup } from '../../../../models/tfa';
import { TitoloPaginaComponent } from '../../../shared/components/titolo-pagina/titolo-pagina.component';
import { ButtonModule } from 'primeng/button';


@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  imports: [
    
    CommonModule,
    ReactiveFormsModule,

    AccordionModule,
    ButtonModule,
    BadgeModule,
    InputTextModule,
    QRCodeComponent,

    TitoloPaginaComponent,
  ]
})
export class UserProfileComponent implements OnInit {

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private ms: MessageService,
  ) { }

  user: any;
  role: string = "";
  modificaUtenteForm?: FormGroup;
  tfaForm?: FormGroup;
  cambioPasswordForm?: FormGroup; 

  isLoading: boolean = true;
  tfaEnabled: boolean = false;
  errorMessage: string = "";
  qrInfo: string = "";
  authenticatorKey: string = "";
  tfaSetupResponse?: TfaSetup;

  ngOnInit(): void {
    
    this.auth.getUser().pipe(first()).subscribe(
      user => {
        this.user = user;
        this.role = this.auth.getRolesFromToken().join(', ');
        this.auth.getTfaSetup(this.user.email).subscribe((tfaSetup: TfaSetup) => {
          this.tfaEnabled = tfaSetup.isTfaEnabled ?? false;
          this.qrInfo = tfaSetup.formattedKey ?? '';
          this.authenticatorKey = tfaSetup.authenticatorKey ?? '';
          this.isLoading = false;
          this.createForms();
          this.cdr.detectChanges();
        });
    });
  }

  createForms(){
    this.modificaUtenteForm = this.fb.group({
      nominativo: new FormControl({value: this.user.nominativo, disabled: true}, Validators.required),
      email: new FormControl({value: this.user.email, disabled: true}, Validators.required),
      ruolo: new FormControl({value: this.role, disabled: true}, Validators.required),
    });

    this.tfaForm = this.fb.group({
      code: new FormControl("", Validators.required)
    });

    this.cambioPasswordForm = this.fb.group({
      vecchiaPassword: new FormControl("", Validators.required),
      nuovaPassword: new FormControl("", [Validators.required, Validators.minLength(10)]),
      confermaPassword: new FormControl("", Validators.required)
    }, { validators: this.passwordMatchValidator });
  }

  disableTfa(){
    let email = this.user.email ?? '';
    this.auth.disableTfa(email)
      .subscribe({
        next: (res: any) => {
          this.tfaEnabled = false;
          this.ms.add({severity: 'success', summary: 'Successo', detail: '2FA disattivata con successo'});
        },
        error: (err: HttpErrorResponse) => {
          this.ms.add({severity: 'error', summary: 'Errore', detail: 'Errore durante la disattivazione del 2FA: ' + err.message});
        }
      })
  }

  enableTfa(){
    const tfaSetupDto: TfaSetup = {
      isTfaEnabled: true,
      email: this.user.email ?? '',
      code: this.tfaForm?.get('code')?.value
    }
    console.log("Chiamo il metodo enableTfa con questo parametro", tfaSetupDto);
    this.auth.postTfaSetup(tfaSetupDto)
      .subscribe({
        next: (res: any) => {
          this.tfaEnabled = true;
          this.ms.add({ severity: 'success', summary: 'Successo', detail: '2FA attivata con successo' });
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage
          this.ms.add({ severity: 'error', summary: 'Errore', detail: "Errore durante l'attivaizone del 2FA: " + err.message });
        }
      })
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('nuovaPassword')?.value;
    const confirmPassword = form.get('confermaPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confermaPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    form.get('confermaPassword')?.setErrors(null);
    return null;
  }

  cambiaPassword() {
    if (this.cambioPasswordForm?.valid) {
      const vecchiaPassword = this.cambioPasswordForm.get('vecchiaPassword')?.value;
      const nuovaPassword = this.cambioPasswordForm.get('nuovaPassword')?.value;

      this.auth.changePassword(vecchiaPassword, nuovaPassword).pipe(first()).subscribe({
        next: () => {
          this.ms.add({ severity: 'success', summary: 'Successo', detail: 'Password cambiata con successo' });
          this.cambioPasswordForm?.reset();},
        error: (err: HttpErrorResponse) => {
          this.ms.add({ severity: 'error', summary: 'Errore', detail: 'Errore durante il cambio password: ' + err.message });
        }
      });
    }
  }
}
