import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TipologiaCommessa } from '../../models/Anagrafiche/tipologia-commessa';

@Injectable({
  providedIn: 'root'
})
export class TipologiaCommessaService {

  private readonly baseUrl = `${environment.baseApiUrl}/tipologia-commessa`;

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<TipologiaCommessa[]> {
    return this.httpClient.get<any[]>(this.baseUrl)
      .pipe(map(data => data.map(item => TipologiaCommessa.map(item))));
  }

  getById(id: number): Observable<TipologiaCommessa> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => TipologiaCommessa.map(data)));
  }

  create(tipologia: TipologiaCommessa): Observable<TipologiaCommessa> {
    return this.httpClient.post<any>(this.baseUrl, tipologia)
      .pipe(map(data => TipologiaCommessa.map(data)));
  }

  update(id: number, tipologia: TipologiaCommessa): Observable<TipologiaCommessa> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, tipologia)
      .pipe(map(data => TipologiaCommessa.map(data)));
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}