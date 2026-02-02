import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PianoSviluppo } from '../../models/GestioneCommesse/piano-sviluppo';

@Injectable({
  providedIn: 'root'
})
export class PianoSviluppoService {

  private readonly baseUrl = `${environment.baseApiUrl}/piani-sviluppo`;

  constructor(private httpClient: HttpClient) { }

  /**
   * Recupera tutti i piani di sviluppo
   * @param commessaId - ID della commessa per filtrare i piani (opzionale)
   * @param includeAttivita - Se true, include le attività nei piani
   * @returns Observable array di piani di sviluppo
   */
  getAll(commessaId?: number, includeAttivita: boolean = false): Observable<PianoSviluppo[]> {
    let params = new HttpParams();
    if (commessaId) {
      params = params.set('commessaId', commessaId.toString());
    }
    params = params.set('includeAttivita', includeAttivita.toString());
    
    return this.httpClient.get<any[]>(this.baseUrl, { params })
      .pipe(map(data => PianoSviluppo.mapArray(data)));
  }

  /**
   * Recupera un singolo piano di sviluppo per ID
   * @param id - ID del piano di sviluppo
   * @param includeAttivita - Se true, include le attività nel piano
   * @returns Observable del piano di sviluppo
   */
  getById(id: number, includeAttivita: boolean = false): Observable<PianoSviluppo> {
    let params = new HttpParams();
    params = params.set('includeAttivita', includeAttivita.toString());
    
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`, { params })
      .pipe(map(data => PianoSviluppo.map(data)));
  }

  /**
   * Recupera tutti i piani di sviluppo di una commessa
   * @param commessaId - ID della commessa
   * @param includeAttivita - Se true, include le attività nei piani
   * @returns Observable array di piani di sviluppo
   */
  getByCommessa(commessaId: number, includeAttivita: boolean = false): Observable<PianoSviluppo[]> {
    let params = new HttpParams();
    params = params.set('includeAttivita', includeAttivita.toString());
    
    return this.httpClient.get<any[]>(`${this.baseUrl}/commessa/${commessaId}`, { params })
      .pipe(map(data => PianoSviluppo.mapArray(data)));
  }

  /**
   * Crea un nuovo piano di sviluppo
   * @param piano - Dati del piano di sviluppo da creare
   * @returns Observable del piano di sviluppo creato
   */
  create(piano: PianoSviluppo): Observable<PianoSviluppo> {
    return this.httpClient.post<any>(this.baseUrl, piano)
      .pipe(map(data => PianoSviluppo.map(data)));
  }

  /**
   * Aggiorna un piano di sviluppo esistente
   * @param id - ID del piano di sviluppo da aggiornare
   * @param piano - Dati aggiornati del piano di sviluppo
   * @returns Observable void
   */
  update(id: number, piano: PianoSviluppo): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, piano);
  }

  /**
   * Elimina un piano di sviluppo
   * @param id - ID del piano di sviluppo da eliminare
   * @returns Observable void
   */
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}
