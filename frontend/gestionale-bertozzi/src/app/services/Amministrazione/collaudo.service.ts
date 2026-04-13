import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Collaudo } from '../../models/Amministrazione/collaudo.model';
import { CollaudoPagedResponseDto } from '../../models/Amministrazione/collaudo-paged.model';

@Injectable({
  providedIn: 'root'
})
export class CollaudoService {

  private readonly baseUrl = `${environment.baseApiUrl}/collaudo`;

  constructor(private httpClient: HttpClient) { }

  getAll(fornitoreId?: number, scopoLavoroId?: number, commessaId?: number, pagato?: boolean): Observable<Collaudo[]> {
    let params = new HttpParams();
    if (fornitoreId) params = params.set('fornitoreId', fornitoreId.toString());
    if (scopoLavoroId) params = params.set('scopoLavoroId', scopoLavoroId.toString());
    if (commessaId) params = params.set('commessaId', commessaId.toString());
    if (pagato !== undefined) params = params.set('pagato', pagato.toString());
    return this.httpClient.get<any[]>(this.baseUrl, { params })
      .pipe(map(data => Collaudo.mapArray(data)));
  }

  getById(id: number): Observable<Collaudo> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => Collaudo.map(data)));
  }

  create(collaudo: Collaudo): Observable<Collaudo> {
    return this.httpClient.post<any>(this.baseUrl, collaudo)
      .pipe(map(data => Collaudo.map(data)));
  }

  update(id: number, collaudo: Collaudo): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, collaudo);
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPaged(
    pageNumber: number = 1,
    pageSize: number = 20,
    fornitoreId?: number,
    scopoLavoroId?: number,
    commessaId?: number,
    pagato?: boolean
  ): Observable<CollaudoPagedResponseDto> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (fornitoreId) params = params.set('fornitoreId', fornitoreId.toString());
    if (scopoLavoroId) params = params.set('scopoLavoroId', scopoLavoroId.toString());
    if (commessaId) params = params.set('commessaId', commessaId.toString());
    if (pagato !== undefined) params = params.set('pagato', pagato.toString());
    return this.httpClient.get<any>(`${this.baseUrl}/paged`, { params })
      .pipe(map(data => CollaudoPagedResponseDto.map(data)));
  }
}
