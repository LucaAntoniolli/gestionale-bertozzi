import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ModalComponent } from '../../gestionale-bertozzi/shared/components/modal/modal.component';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AppLogoComponent } from '../../gestionale-bertozzi/shared/components/app-logo/app-logo.component';
import { ModalService } from '../../services/modal.service';

@Component({
    selector: 'app-password-lost',
    templateUrl: './password-lost.component.html',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,

        AppLogoComponent,
        ModalComponent,

        ButtonModule,
        InputTextModule,
    ],
})
export class PasswordLostComponent implements OnInit {
    password!: string;

    pswLostForm?: FormGroup;

    constructor(
        private as: AuthService,
        private fb: FormBuilder,
        private ms: ModalService
    ) {}

    ngOnInit(): void {
        this.createForm();
    }

    reset() {
        if (this.pswLostForm?.valid) {
            this.as.passwordLost(this.pswLostForm.value.email).subscribe({
                next: () => {
                    this.ms.show();
                }
            });
        }
    }

    private createForm() {
        this.pswLostForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
        });
    }
}
