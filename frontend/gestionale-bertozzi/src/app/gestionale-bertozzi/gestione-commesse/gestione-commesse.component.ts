import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-gestione-commesse',
    templateUrl: './gestione-commesse.component.html',
    styleUrls: ['./gestione-commesse.component.css'],
    imports: [
        RouterOutlet,
    ]
})
export class GestioneCommesseComponent implements OnInit {

    constructor() { }

    ngOnInit() {
    }

}
