import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { first } from 'rxjs';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../gestionale-bertozzi/shared/components/modal/modal.component';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AppLogoComponent } from '../../gestionale-bertozzi/shared/components/app-logo/app-logo.component';
import { ButtonModule } from 'primeng/button';
import { ModalService } from '../../services/modal.service';
import { NavigatorService } from '../../services/navigator.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styles: [`
        :host ::ng-deep .pi-eye,
        :host ::ng-deep .pi-eye-slash {
            transform:scale(1.6);
            margin-right: 1rem;
            color: var(--primary-color) !important;
        }
    `],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,

        AppLogoComponent,
        ModalComponent,

        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
    ],
})
export class LoginComponent {

    valCheck: string[] = ['remember'];
    password!: string;
    returnUrl?: string;
    loginForm?: FormGroup;
    loading: boolean = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private as: AuthService,
        private fb: FormBuilder,
        private ms: ModalService,
        private ns: NavigatorService
    ) { }


    ngOnInit(): void {
        this.createForm();
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
        this.loadCredentials();
    }


    login(email: string, password: string) {
        this.loading = true;
        if (this.loginForm?.valid) {
            if (this.loginForm.get('rememberme')?.value) {
                localStorage.setItem('email', email);
                localStorage.setItem('password', password);
            } else {
                localStorage.removeItem('email');
                localStorage.removeItem('password');
            }

            this.as.login(email, password)
                .pipe(
                    first()
                )
                .subscribe({
                    next: lr => {
                        if (lr.isTfaEnabled) {
                            this.router.navigate(['/auth/otp-verification'], { queryParams: { email: email, returnUrl: this.returnUrl } });
                            this.loading = false;
                        }
                        else {
                            this.router.navigate([this.returnUrl ?? '/']);
                            this.loading = false;
                        }
                    },
                    error: err => {
                        this.ms.show();
                        this.loading = false;
                    }
                });
        }
    }

    private createForm() {
        this.loginForm = this.fb.group({
            email: ["", [Validators.required, Validators.email]],
            password: ["", [Validators.required]],
            rememberme: [false]
        });
    }

    private loadCredentials(): void {
        const email = localStorage.getItem('email');
        const password = localStorage.getItem('password');
        if (email && password) {
            this.loginForm?.patchValue({ email, password, rememberme: true });
        }
    }

    onForgotPassword() {
        this.ns.passwordLost();
    }
}
