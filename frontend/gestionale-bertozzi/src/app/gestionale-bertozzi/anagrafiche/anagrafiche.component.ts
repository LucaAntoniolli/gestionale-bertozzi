import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-anagrafiche',
    templateUrl: './anagrafiche.component.html',
    styleUrls: ['./anagrafiche.component.css'],
    imports: [
        RouterOutlet,
    ]
})
export class AnagraficheComponent implements OnInit {

    constructor() { }

    ngOnInit() {
    }

}
