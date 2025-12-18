import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-framework',
  templateUrl: './gestionale-bertozzi.component.html',
  imports: [
    RouterOutlet,
  ]
})
export class ServicePilotComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
