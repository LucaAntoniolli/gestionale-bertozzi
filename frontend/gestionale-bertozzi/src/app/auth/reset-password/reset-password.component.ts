import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppLogoComponent } from '../../gestionale-bertozzi/shared/components/app-logo/app-logo.component';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ModalComponent } from '../../gestionale-bertozzi/shared/components/modal/modal.component';
import { ModalService } from '../../services/modal.service';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,

        AppLogoComponent,
        ModalComponent,

        ButtonModule,
        PasswordModule,
        
    ],
})
export class ResetPasswordComponent implements OnInit {
    password!: string;
    passwordConfirm!: string;

    resetPwdForm?: FormGroup;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private as: AuthService,
        private fb: FormBuilder,
        private ms: ModalService,
    ) {}

    ngOnInit(): void {
        let token = this.route.snapshot.params['resetToken'];
        this.createForm(token);
    }

    reset() {
        let formValue = this.resetPwdForm?.value;
        if (this.resetPwdForm?.valid) {
            this.as
                .resetPassword(formValue.token, formValue.password)
                .subscribe({
                    next: () => {
                        this.router.navigate(['/']);
                    },
                    error: (err) => {
                        this.ms.show();
                    },
                });
        }
    }

    private createForm(token: string) {
        this.resetPwdForm = this.fb.group(
            {
                token: [token, [Validators.required]],
                password: ['', [Validators.required, Validators.minLength(12), Validators.pattern(/^(?=.*[0-9])(?=.*[a-zA-Z]).{12,}$/)]],
                passwordConfirm: ['', [Validators.required, Validators.minLength(12), Validators.pattern(/^(?=.*[0-9])(?=.*[a-zA-Z]).{12,}$/)]],
            },
            { validator: this.checkPassowords }
        );
    }

    private checkPassowords(form: FormGroup) {
        let pass = form.get('password')?.value;
        let confPass = form.get('passwordConfirm')?.value;

        return pass === confPass ? null : { notSame: true };
    }
}
