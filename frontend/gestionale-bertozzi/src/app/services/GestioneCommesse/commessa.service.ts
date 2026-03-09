import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Commessa } from '../../models/GestioneCommesse/commessa';
import { CommessaLight } from '../../models/GestioneCommesse/commessa-light';

@Injectable({
  providedIn: 'root'
})
export class CommessaService {

  private readonly baseUrl = `${environment.baseApiUrl}/commesse`;

  constructor(private httpClient: HttpClient) { }

  /**
   * Recupera tutte le commesse, opzionalmente filtrate per cliente
   * @param clienteId - ID del cliente per filtrare le commesse (opzionale)
   * @param soloChiuse - Se true, recupera solo le commesse chiuse (default: false)
   * @returns Observable array di commesse
   */
  getAll(clienteId?: number, soloChiuse: boolean = false): Observable<Commessa[]> {
    let params = new HttpParams();
    if (clienteId) {
      params = params.set('clienteId', clienteId.toString());
    }
    if (soloChiuse) {
      params = params.set('soloChiuse', soloChiuse.toString());
    }
    return this.httpClient.get<any[]>(this.baseUrl, { params })
      .pipe(map(data => Commessa.mapArray(data)));
  }

  getAllLight(soloChiuse: boolean = false): Observable<CommessaLight[]> {
    let params = new HttpParams();
    if (soloChiuse) {
      params = params.set('soloChiuse', soloChiuse.toString());
    }
    return this.httpClient.get<any[]>(`${this.baseUrl}/light`, { params })
      .pipe(map(data => CommessaLight.mapArray(data)));
  }

  /**
   * Recupera una singola commessa per ID
   * @param id - ID della commessa
   * @returns Observable della commessa con tutte le sue relazioni (cliente, referente, tipologia, status, piani)
   */
  getById(id: number): Observable<Commessa> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => Commessa.map(data)));
  }

  /**
   * Crea una nuova commessa
   * @param commessa - Dati della commessa da creare
   * @returns Observable della commessa creata
   */
  create(commessa: Commessa): Observable<Commessa> {
    const payload = this.preparePayload(commessa);
    return this.httpClient.post<any>(this.baseUrl, payload)
      .pipe(map(data => Commessa.map(data)));
  }

  /**
   * Aggiorna una commessa esistente
   * @param id - ID della commessa da aggiornare
   * @param commessa - Dati aggiornati della commessa
   * @returns Observable void
   */
  update(id: number, commessa: Commessa): Observable<any> {
    const payload = this.preparePayload(commessa);
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Elimina una commessa
   * Elimina in cascata anche i piani di sviluppo e le attività associate
   * @param id - ID della commessa da eliminare
   * @returns Observable void
   */
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Prepara i dati della commessa per l'invio al backend
   * Converte i moment in stringhe formato YYYY-MM-DD (solo data, senza ora/timezone)
   */
  private preparePayload(commessa: Commessa): any {
    const payload: any = { ...commessa };
    
    // Converti moment in formato YYYY-MM-DD per il backend (evita problemi di timezone)
    if (commessa.dataInizioPrevista) {
      payload.dataInizioPrevista = commessa.dataInizioPrevista.format('YYYY-MM-DD');
    }
    if (commessa.dataConclusionePrevista) {
      payload.dataConclusionePrevista = commessa.dataConclusionePrevista.format('YYYY-MM-DD');
    }
    
    // Rimuovi le proprietà di navigazione prima dell'invio
    delete payload.cliente;
    delete payload.tipologiaCommessa;
    delete payload.statusCommessa;
    delete payload.pianiSviluppo;
    
    return payload;
  }
}
