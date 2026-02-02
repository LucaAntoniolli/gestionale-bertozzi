import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Attivita } from '../../models/GestioneCommesse/attivita';

@Injectable({
  providedIn: 'root'
})
export class AttivitaService {

  private readonly baseUrl = `${environment.baseApiUrl}/attivita`;

  constructor(private httpClient: HttpClient) { }

  /**
   * Recupera tutte le attività, opzionalmente filtrate per piano di sviluppo
   * @param pianoSviluppoId - ID del piano di sviluppo per filtrare le attività
   * @returns Observable array di attività
   */
  getAll(pianoSviluppoId?: number): Observable<Attivita[]> {
    let params = new HttpParams();
    if (pianoSviluppoId) {
      params = params.set('pianoSviluppoId', pianoSviluppoId.toString());
    }
    return this.httpClient.get<any[]>(this.baseUrl, { params })
      .pipe(map(data => Attivita.mapArray(data)));
  }

  /**
   * Recupera una singola attività per ID
   * @param id - ID dell'attività
   * @returns Observable dell'attività
   */
  getById(id: number): Observable<Attivita> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => Attivita.map(data)));
  }

  /**
   * Recupera tutte le attività di un piano di sviluppo
   * @param pianoSviluppoId - ID del piano di sviluppo
   * @returns Observable array di attività
   */
  getByPianoSviluppo(pianoSviluppoId: number): Observable<Attivita[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/piano/${pianoSviluppoId}`)
      .pipe(map(data => Attivita.mapArray(data)));
  }

  /**
   * Crea una nuova attività
   * @param attivita - Dati dell'attività da creare
   * @returns Observable dell'attività creata
   */
  create(attivita: Attivita): Observable<Attivita> {
    const payload = this.preparePayload(attivita);
    return this.httpClient.post<any>(this.baseUrl, payload)
      .pipe(map(data => Attivita.map(data)));
  }

  /**
   * Aggiorna un'attività esistente
   * @param id - ID dell'attività da aggiornare
   * @param attivita - Dati aggiornati dell'attività
   * @returns Observable void
   */
  update(id: number, attivita: Attivita): Observable<any> {
    const payload = this.preparePayload(attivita);
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Elimina un'attività
   * @param id - ID dell'attività da eliminare
   * @returns Observable void
   */
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Prepara i dati dell'attività per l'invio al backend
   * Converte i moment in stringhe ISO
   */
  private preparePayload(attivita: Attivita): any {
    const payload: any = { ...attivita };
    
    // Converti moment in formato ISO per il backend
    if (attivita.dataRiferimento) {
      payload.dataRiferimento = attivita.dataRiferimento.toISOString();
    }
    
    return payload;
  }
}
