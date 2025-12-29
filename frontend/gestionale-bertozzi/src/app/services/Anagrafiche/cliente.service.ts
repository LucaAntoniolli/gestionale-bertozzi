import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Cliente } from '../../models/Anagrafiche/cliente';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private readonly baseUrl = `${environment.baseApiUrl}/clienti`;

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Cliente[]> {
    return this.httpClient.get<any[]>(this.baseUrl)
      .pipe(map(data => Cliente.mapArray(data)));
  }

  getById(id: number): Observable<Cliente> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => Cliente.map(data)));
  }

  create(cliente: Cliente): Observable<Cliente> {
    return this.httpClient.post<any>(this.baseUrl, cliente)
      .pipe(map(data => Cliente.map(data)));
  }

  update(id: number, cliente: Cliente): Observable<Cliente> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, cliente)
      .pipe(map(data => Cliente.map(data)));
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}