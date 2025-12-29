import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PersonaleCliente } from '../../models/Anagrafiche/personale-cliente';

@Injectable({
  providedIn: 'root'
})
export class PersonaleClienteService {

  private readonly baseUrl = `${environment.baseApiUrl}/personale-cliente`;

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<PersonaleCliente[]> {
    return this.httpClient.get<any[]>(this.baseUrl)
      .pipe(map(data => PersonaleCliente.mapArray(data)));
  }

  getById(id: number): Observable<PersonaleCliente> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => PersonaleCliente.map(data)));
  }

  getByClienteId(clienteId: number): Observable<PersonaleCliente[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/cliente/${clienteId}`)
      .pipe(map(data => PersonaleCliente.mapArray(data)));
  }

  create(personale: PersonaleCliente): Observable<PersonaleCliente> {
    return this.httpClient.post<any>(this.baseUrl, personale)
      .pipe(map(data => PersonaleCliente.map(data)));
  }

  update(id: number, personale: PersonaleCliente): Observable<PersonaleCliente> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, personale)
      .pipe(map(data => PersonaleCliente.map(data)));
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}