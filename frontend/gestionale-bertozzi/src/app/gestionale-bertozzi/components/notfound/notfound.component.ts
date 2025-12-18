import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AppLogoComponent } from '../../shared/components/app-logo/app-logo.component';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-notfound',
    templateUrl: './notfound.component.html',
    imports: [
        CommonModule,
        RouterModule,
        
        AppLogoComponent,
    ]
})
export class NotfoundComponent { }