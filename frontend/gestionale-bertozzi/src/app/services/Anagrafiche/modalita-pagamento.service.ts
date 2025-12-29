import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ModalitaPagamento } from '../../models/Anagrafiche/modalita-pagamento';

@Injectable({
  providedIn: 'root'
})
export class ModalitaPagamentoService {

  private readonly baseUrl = `${environment.baseApiUrl}/modalita-pagamento`;

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<ModalitaPagamento[]> {
    return this.httpClient.get<any[]>(this.baseUrl)
      .pipe(map(data => data.map(item => ModalitaPagamento.map(item))));
  }

  getById(id: number): Observable<ModalitaPagamento> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => ModalitaPagamento.map(data)));
  }

  create(modalita: ModalitaPagamento): Observable<ModalitaPagamento> {
    return this.httpClient.post<any>(this.baseUrl, modalita)
      .pipe(map(data => ModalitaPagamento.map(data)));
  }

  update(id: number, modalita: ModalitaPagamento): Observable<ModalitaPagamento> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, modalita)
      .pipe(map(data => ModalitaPagamento.map(data)));
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}