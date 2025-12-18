import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TfaLogin } from '../../models/tfa';
import { LoginResponse } from '../../models/login-response';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ModalComponent } from '../../gestionale-bertozzi/shared/components/modal/modal.component';
import { CommonModule } from '@angular/common';
import { AppLogoComponent } from '../../gestionale-bertozzi/shared/components/app-logo/app-logo.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-otp-verification',
  templateUrl: './otp-verification.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    
    AppLogoComponent,

    ModalComponent,
    ButtonModule,
  ],
})
export class OtpVerificationComponent implements OnInit {

  private email: string = "";
  private returnUrl: string = "";
  loading: boolean = false;

  twoFactorAuthForm = new FormGroup({
    code: new FormControl('', [Validators.required]),
  });

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private ms: MessageService,
  ) { }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'];
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
    this.email = this.route.snapshot.queryParams['email'];
  }

  login(){
    this.loading = true;
    let twoFactorLogin: TfaLogin = {
      email: this.email,
      code: this.twoFactorAuthForm.get('code')?.value ?? '',
    }

    this.auth.loginTfa(twoFactorLogin)
      .subscribe({
        next: (res: LoginResponse) => {
          localStorage.setItem("email", this.email);
          this.router.navigate([this.returnUrl ?? '/']);
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.ms.add({severity:'error', summary:'Errore', detail: "Codice OTP non valido"});
          this.loading = false;
        }
      })
  }

}
