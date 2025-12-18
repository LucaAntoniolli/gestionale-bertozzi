import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ModalService {
    constructor() {}

    private modalVisibilitySubject = new BehaviorSubject<boolean>(false);
    modalVisibility$ = this.modalVisibilitySubject.asObservable();

    show() {
        this.modalVisibilitySubject.next(true);
    }

    hide() {
        this.modalVisibilitySubject.next(false);
    }
}
