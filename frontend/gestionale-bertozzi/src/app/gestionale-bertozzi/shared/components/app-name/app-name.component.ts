import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-app-name',
  templateUrl: './app-name.component.html',
  styleUrls: ['./app-name.component.css'],
  imports: [],
})
export class AppNameComponent implements OnInit {

  appName: string = environment.applicationName;

  constructor() { }

  ngOnInit() {
  }

}
