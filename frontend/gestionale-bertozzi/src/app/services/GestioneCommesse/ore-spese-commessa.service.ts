import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OreSpeseCommessa } from '../../models/GestioneCommesse/ore-spese-commessa.model';
import { OreSpesePagedResponseDto } from '../../models/GestioneCommesse/ore-spese-paged.model';

@Injectable({
  providedIn: 'root'
})
export class OreSpeseCommessaService {

  private readonly baseUrl = `${environment.baseApiUrl}/ore-spese-commessa`;

  constructor(private httpClient: HttpClient) { }

  /**
   * Recupera tutte le ore/spese commessa, opzionalmente filtrate
   * @param commessaId - ID della commessa per filtrare (opzionale)
   * @param pianoSviluppoId - ID del piano di sviluppo per filtrare (opzionale)
   * @param utenteId - ID dell'utente per filtrare (opzionale)
   * @returns Observable array di ore/spese commessa
   */
  getAll(commessaId?: number, utenteId?: string): Observable<OreSpeseCommessa[]> {
    let params = new HttpParams();
    if (commessaId) {
      params = params.set('commessaId', commessaId.toString());
    }
    if (utenteId) {
      params = params.set('utenteId', utenteId);
    }

    return this.httpClient.get<any[]>(this.baseUrl, { params })
      .pipe(map(data => OreSpeseCommessa.mapArray(data)));
  }

  /**
   * Recupera una singola voce ore/spese commessa per ID
   * @param id - ID della voce ore/spese commessa
   * @returns Observable della voce ore/spese commessa
   */
  getById(id: number, utenteId?: string): Observable<OreSpeseCommessa> {
    let params = new HttpParams();
    if (utenteId) {
      params = params.set('utenteId', utenteId);
    }
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`, { params })
      .pipe(map(data => OreSpeseCommessa.map(data)));
  }

  /**
   * Crea una nuova voce ore/spese commessa
   * @param oreSpeseCommessa - Dati da creare
   * @returns Observable della voce creata
   */
  create(oreSpeseCommessa: OreSpeseCommessa): Observable<OreSpeseCommessa> {
    const payload = this.preparePayload(oreSpeseCommessa);
    return this.httpClient.post<any>(this.baseUrl, payload)
      .pipe(map(data => OreSpeseCommessa.map(data)));
  }

  /**
   * Aggiorna una voce ore/spese commessa esistente
   * @param id - ID della voce da aggiornare
   * @param oreSpeseCommessa - Dati aggiornati
   * @returns Observable void
   */
  update(id: number, oreSpeseCommessa: OreSpeseCommessa): Observable<any> {
    const payload = this.preparePayload(oreSpeseCommessa);
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Elimina una voce ore/spese commessa
   * @param id - ID della voce da eliminare
   * @returns Observable void
   */
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Prepara i dati per l'invio al backend
   * Converte i moment in stringhe ISO
   */
  /**
   * Recupera le ore/spese in modalità paginata con filtri avanzati
   */
  getPaged(
    pageNumber: number = 1,
    pageSize: number = 20,
    commessaId?: number,
    utenteId?: string,
    dataFrom?: Date,
    dataTo?: Date
  ): Observable<OreSpesePagedResponseDto> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (commessaId) params = params.set('commessaId', commessaId.toString());
    if (utenteId) params = params.set('utenteId', utenteId);
    if (dataFrom) params = params.set('dataFrom', dataFrom.toISOString().split('T')[0]);
    if (dataTo) params = params.set('dataTo', dataTo.toISOString().split('T')[0]);

    return this.httpClient.get<any>(`${this.baseUrl}/paged`, { params })
      .pipe(map(data => OreSpesePagedResponseDto.map(data)));
  }

  private preparePayload(oreSpeseCommessa: OreSpeseCommessa): any {
    const payload: any = { ...oreSpeseCommessa };

    // Converti moment in formato ISO per il backend
    if (oreSpeseCommessa.data) {
      payload.data = oreSpeseCommessa.data.toISOString();
    }

    // Rimuovi le proprietà di navigazione prima dell'invio
    delete payload.utente;
    delete payload.dataCreazione;
    delete payload.dataModifica;
    delete payload.utenteCreazione;
    delete payload.utenteModifica;

    return payload;
  }
}
