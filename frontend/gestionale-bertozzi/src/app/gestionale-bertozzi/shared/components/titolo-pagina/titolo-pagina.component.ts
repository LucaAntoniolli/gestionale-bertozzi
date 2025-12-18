import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-titolo-pagina',
  templateUrl: './titolo-pagina.component.html',
  styleUrls: ['./titolo-pagina.component.css'],
  imports: [],
})
export class TitoloPaginaComponent implements OnInit {

  @Input() titoloPagina?: string;
  
  constructor() { }

  ngOnInit() {
  }

}
