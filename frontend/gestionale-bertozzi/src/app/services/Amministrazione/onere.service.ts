import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Onere } from '../../models/Amministrazione/onere.model';
import { OnerePagedResponseDto } from '../../models/Amministrazione/onere-paged.model';

@Injectable({
  providedIn: 'root'
})
export class OnereService {

  private readonly baseUrl = `${environment.baseApiUrl}/onere`;

  constructor(private httpClient: HttpClient) { }

  getAll(commessaId?: number): Observable<Onere[]> {
    let params = new HttpParams();
    if (commessaId) params = params.set('commessaId', commessaId.toString());
    return this.httpClient.get<any[]>(this.baseUrl, { params })
      .pipe(map(data => Onere.mapArray(data)));
  }

  getById(id: number): Observable<Onere> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => Onere.map(data)));
  }

  create(onere: Onere): Observable<Onere> {
    return this.httpClient.post<any>(this.baseUrl, onere)
      .pipe(map(data => Onere.map(data)));
  }

  update(id: number, onere: Onere): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, onere);
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPaged(
    pageNumber: number = 1,
    pageSize: number = 20,
    commessaId?: number
  ): Observable<OnerePagedResponseDto> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (commessaId) params = params.set('commessaId', commessaId.toString());
    return this.httpClient.get<any>(`${this.baseUrl}/paged`, { params })
      .pipe(map(data => OnerePagedResponseDto.map(data)));
  }
}
