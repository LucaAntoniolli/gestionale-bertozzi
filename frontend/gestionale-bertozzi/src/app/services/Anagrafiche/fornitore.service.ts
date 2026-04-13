import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Fornitore } from '../../models/Anagrafiche/fornitore';
import { FornitorePagedResponseDto } from '../../models/Anagrafiche/fornitore-paged.model';

@Injectable({
  providedIn: 'root'
})
export class FornitoreService {

  private readonly baseUrl = `${environment.baseApiUrl}/fornitori`;

  constructor(private httpClient: HttpClient) { }

  getAll(modalitaPagamentoId?: number, tipo?: string): Observable<Fornitore[]> {
    let params = new HttpParams();
    if (modalitaPagamentoId) params = params.set('modalitaPagamentoId', modalitaPagamentoId.toString());
    if (tipo) params = params.set('tipo', tipo);
    return this.httpClient.get<any[]>(this.baseUrl, { params })
      .pipe(map(data => Fornitore.mapArray(data)));
  }

  getById(id: number): Observable<Fornitore> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => Fornitore.map(data)));
  }

  create(fornitore: Fornitore): Observable<Fornitore> {
    return this.httpClient.post<any>(this.baseUrl, fornitore)
      .pipe(map(data => Fornitore.map(data)));
  }

  update(id: number, fornitore: Fornitore): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, fornitore);
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPaged(
    pageNumber: number = 1,
    pageSize: number = 20,
    search?: string,
    modalitaPagamentoId?: number,
    tipo?: string
  ): Observable<FornitorePagedResponseDto> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (search) params = params.set('search', search);
    if (modalitaPagamentoId) params = params.set('modalitaPagamentoId', modalitaPagamentoId.toString());
    if (tipo) params = params.set('tipo', tipo);
    return this.httpClient.get<any>(`${this.baseUrl}/paged`, { params })
      .pipe(map(data => FornitorePagedResponseDto.map(data)));
  }
}
