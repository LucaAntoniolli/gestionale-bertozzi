import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TemplateAttivita } from '../../models/TemplatePianiSviluppo/template-attivita';

@Injectable({
  providedIn: 'root'
})
export class TemplateAttivitaService {

  private readonly baseUrl = `${environment.baseApiUrl}/template-attivita`;

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<TemplateAttivita[]> {
    return this.httpClient.get<any[]>(this.baseUrl)
      .pipe(map(data => TemplateAttivita.mapArray(data)));
  }

  getById(id: number): Observable<TemplateAttivita> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => TemplateAttivita.map(data)));
  }

  getByPianoSviluppoId(pianoSviluppoId: number): Observable<TemplateAttivita[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/piano/${pianoSviluppoId}`)
      .pipe(map(data => TemplateAttivita.mapArray(data)));
  }

  create(attivita: TemplateAttivita): Observable<TemplateAttivita> {
    return this.httpClient.post<any>(this.baseUrl, attivita)
      .pipe(map(data => TemplateAttivita.map(data)));
  }

  update(id: number, attivita: TemplateAttivita): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, attivita);
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}
