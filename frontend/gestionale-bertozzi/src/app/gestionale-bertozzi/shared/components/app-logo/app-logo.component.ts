import { Component, Input, OnInit } from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-app-logo',
  templateUrl: './app-logo.component.html',
  styleUrls: ['./app-logo.component.css'],
  imports: [],
})
export class AppLogoComponent implements OnInit {

  @Input() noLink: boolean = false;
  appName: string = environment.applicationName;


  constructor() { }

  ngOnInit() {
  }

}
