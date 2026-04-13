import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ScopoLavoro } from '../../models/Anagrafiche/scopo-lavoro';
import { ScopoLavoroPagedResponseDto } from '../../models/Anagrafiche/scopo-lavoro-paged.model';

@Injectable({
  providedIn: 'root'
})
export class ScopoLavoroService {

  private readonly baseUrl = `${environment.baseApiUrl}/scopo-lavoro`;

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<ScopoLavoro[]> {
    return this.httpClient.get<any[]>(this.baseUrl)
      .pipe(map(data => ScopoLavoro.mapArray(data)));
  }

  getById(id: number): Observable<ScopoLavoro> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => ScopoLavoro.map(data)));
  }

  create(scopoLavoro: ScopoLavoro): Observable<ScopoLavoro> {
    return this.httpClient.post<any>(this.baseUrl, scopoLavoro)
      .pipe(map(data => ScopoLavoro.map(data)));
  }

  update(id: number, scopoLavoro: ScopoLavoro): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, scopoLavoro);
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPaged(
    pageNumber: number = 1,
    pageSize: number = 20,
    search?: string
  ): Observable<ScopoLavoroPagedResponseDto> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (search) params = params.set('search', search);
    return this.httpClient.get<any>(`${this.baseUrl}/paged`, { params })
      .pipe(map(data => ScopoLavoroPagedResponseDto.map(data)));
  }
}
