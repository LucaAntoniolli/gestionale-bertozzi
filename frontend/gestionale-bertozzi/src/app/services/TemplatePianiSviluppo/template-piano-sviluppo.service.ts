import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TemplatePianoSviluppo } from '../../models/TemplatePianiSviluppo/template-piano-sviluppo';

@Injectable({
  providedIn: 'root'
})
export class TemplatePianoSviluppoService {

  private readonly baseUrl = `${environment.baseApiUrl}/template-piani-sviluppo`;

  constructor(private httpClient: HttpClient) { }

  getAll(includeAttivita: boolean = false): Observable<TemplatePianoSviluppo[]> {
    const url = includeAttivita ? `${this.baseUrl}?includeAttivita=true` : this.baseUrl;
    return this.httpClient.get<any[]>(url)
      .pipe(map(data => data.map(item => TemplatePianoSviluppo.map(item))));
  }

  getById(id: number, includeAttivita: boolean = false): Observable<TemplatePianoSviluppo> {
    const url = includeAttivita ? `${this.baseUrl}/${id}?includeAttivita=true` : `${this.baseUrl}/${id}`;
    return this.httpClient.get<any>(url)
      .pipe(map(data => TemplatePianoSviluppo.map(data)));
  }

  getByTipologiaCommessa(tipologiaCommessaId: number, includeAttivita: boolean = false): Observable<TemplatePianoSviluppo[]> {
    const url = includeAttivita 
      ? `${this.baseUrl}/tipologia/${tipologiaCommessaId}?includeAttivita=true` 
      : `${this.baseUrl}/tipologia/${tipologiaCommessaId}`;
    return this.httpClient.get<any[]>(url)
      .pipe(map(data => TemplatePianoSviluppo.mapArray(data)));
  }

  create(piano: TemplatePianoSviluppo): Observable<TemplatePianoSviluppo> {
    return this.httpClient.post<any>(this.baseUrl, piano)
      .pipe(map(data => TemplatePianoSviluppo.map(data)));
  }

  update(id: number, piano: TemplatePianoSviluppo): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, piano);
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}
