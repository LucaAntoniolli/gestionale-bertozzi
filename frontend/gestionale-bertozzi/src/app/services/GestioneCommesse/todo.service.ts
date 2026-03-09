import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ToDo } from '../../models/GestioneCommesse/todo.model';

@Injectable({
  providedIn: 'root'
})
export class TodoService {

  private readonly baseUrl = `${environment.baseApiUrl}/todos`;

  constructor(private httpClient: HttpClient) { }

  /**
   * Recupera tutti i ToDo, opzionalmente filtrati
   * @param commessaId - ID della commessa per filtrare i ToDo (opzionale)
   * @param assegnatarioPrimarioId - ID dell'assegnatario primario (opzionale)
   * @param assegnatarioSecondarioId - ID dell'assegnatario secondario (opzionale)
   * @param completato - Filtra per stato completato (opzionale)
   * @returns Observable array di ToDo
   */
  getAll(
    commessaId?: number, 
    assegnatarioPrimarioId?: string, 
    assegnatarioSecondarioId?: string,
    completato?: boolean
  ): Observable<ToDo[]> {
    let params = new HttpParams();
    if (commessaId) {
      params = params.set('commessaId', commessaId.toString());
    }
    if (assegnatarioPrimarioId) {
      params = params.set('assegnatarioPrimarioId', assegnatarioPrimarioId);
    }
    if (assegnatarioSecondarioId) {
      params = params.set('assegnatarioSecondarioId', assegnatarioSecondarioId);
    }
    if (completato !== undefined) {
      params = params.set('completato', completato.toString());
    }
    return this.httpClient.get<any[]>(this.baseUrl, { params })
      .pipe(map(data => ToDo.mapArray(data)));
  }

  /**
   * Recupera un singolo ToDo per ID
   * @param id - ID del ToDo
   * @returns Observable del ToDo con tutte le sue relazioni
   */
  getById(id: number): Observable<ToDo> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => ToDo.map(data)));
  }

  /**
   * Crea un nuovo ToDo
   * @param todo - Dati del ToDo da creare
   * @returns Observable del ToDo creato
   */
  create(todo: ToDo): Observable<ToDo> {
    const payload = this.preparePayload(todo);
    return this.httpClient.post<any>(this.baseUrl, payload)
      .pipe(map(data => ToDo.map(data)));
  }

  /**
   * Aggiorna un ToDo esistente
   * @param id - ID del ToDo da aggiornare
   * @param todo - Dati aggiornati del ToDo
   * @returns Observable void
   */
  update(id: number, todo: ToDo): Observable<any> {
    const payload = this.preparePayload(todo);
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Elimina un ToDo
   * @param id - ID del ToDo da eliminare
   * @returns Observable void
   */
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Marca un ToDo come completato
   * @param id - ID del ToDo da completare
   * @param descrizioneAttivitaSvolta - Descrizione dell'attività svolta (opzionale)
   * @returns Observable void
   */
  markAsComplete(id: number, descrizioneAttivitaSvolta?: string): Observable<any> {
    return this.httpClient.patch<any>(`${this.baseUrl}/${id}/complete`, descrizioneAttivitaSvolta || null);
  }

  /**
   * Riapre un ToDo (marca come non completato)
   * @param id - ID del ToDo da riaprire
   * @returns Observable void
   */
  markAsIncomplete(id: number): Observable<any> {
    return this.httpClient.patch<any>(`${this.baseUrl}/${id}/reopen`, null);
  }

  /**
   * Prepara i dati del ToDo per l'invio al backend
   * Converte i moment in stringhe formato YYYY-MM-DD (solo data, senza ora/timezone)
   */
  private preparePayload(todo: ToDo): any {
    const payload: any = { ...todo };
    
    // Converti moment in formato YYYY-MM-DD per il backend (evita problemi di timezone)
    if (todo.dataConsegna) {
      payload.dataConsegna = todo.dataConsegna.format('YYYY-MM-DD');
    }
    
    // Rimuovi le proprietà di navigazione prima dell'invio
    delete payload.assegnatarioPrimario;
    delete payload.assegnatarioSecondario;
    delete payload.commessa;
    delete payload.dataCreazione;
    delete payload.dataModifica;
    delete payload.utenteCreazione;
    delete payload.utenteModifica;
    
    return payload;
  }
}
