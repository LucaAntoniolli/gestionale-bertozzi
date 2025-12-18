import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    imports: [
        CommonModule,
        RouterLink,

        ButtonModule,
    ],
})
export class ErrorComponent { }