import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ModalService } from '../../../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css'],
    imports: [
        CommonModule,
        RouterModule,
        // prime
        ButtonModule,
        DialogModule,
    ],
})
export class ModalComponent implements OnInit, OnDestroy {
    isVisible: boolean = false;
    @Input() titolo: string = 'Error';
    @Input() descrizione: string = 'An error occurred';
    @Input() linkUrl?: string = undefined;
    @Input() linkText: string = 'qui';

    private subscription: Subscription = new Subscription();

    constructor(
        private ms: ModalService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.subscription.add(
            this.ms.modalVisibility$.subscribe(
                (isVisible) => {
                    this.isVisible = isVisible;
                    this.cdr.detectChanges();
                }
            )
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    close() {
        this.ms.hide();
    }
}
