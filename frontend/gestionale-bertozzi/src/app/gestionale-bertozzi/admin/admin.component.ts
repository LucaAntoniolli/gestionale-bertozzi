import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [
    RouterOutlet,
  ]
})
export class AdminComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
