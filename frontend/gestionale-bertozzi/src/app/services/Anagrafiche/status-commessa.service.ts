import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StatusCommessa } from '../../models/Anagrafiche/status-commessa';

@Injectable({
  providedIn: 'root'
})
export class StatusCommessaService {

  private readonly baseUrl = `${environment.baseApiUrl}/status-commessa`;

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<StatusCommessa[]> {
    return this.httpClient.get<any[]>(this.baseUrl)
      .pipe(map(data => data.map(item => StatusCommessa.map(item))));
  }

  getById(id: number): Observable<StatusCommessa> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => StatusCommessa.map(data)));
  }

  create(status: StatusCommessa): Observable<StatusCommessa> {
    return this.httpClient.post<any>(this.baseUrl, status)
      .pipe(map(data => StatusCommessa.map(data)));
  }

  update(id: number, status: StatusCommessa): Observable<StatusCommessa> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, status)
      .pipe(map(data => StatusCommessa.map(data)));
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}