import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment';
import { environment } from '../../../environments/environment';
import { CostoTrasferta } from '../../models/Amministrazione/costo-trasferta.model';
import { CostoTrasfertaPagedResponseDto } from '../../models/Amministrazione/costo-trasferta-paged.model';

@Injectable({
  providedIn: 'root'
})
export class CostoTrasfertaService {

  private readonly baseUrl = `${environment.baseApiUrl}/costo-trasferta`;

  constructor(private httpClient: HttpClient) { }

  getAll(clienteId?: number, commessaId?: number, utenteId?: string): Observable<CostoTrasferta[]> {
    let params = new HttpParams();
    if (clienteId) params = params.set('clienteId', clienteId.toString());
    if (commessaId) params = params.set('commessaId', commessaId.toString());
    if (utenteId) params = params.set('utenteId', utenteId);
    return this.httpClient.get<any[]>(this.baseUrl, { params })
      .pipe(map(data => CostoTrasferta.mapArray(data)));
  }

  getById(id: number): Observable<CostoTrasferta> {
    return this.httpClient.get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(data => CostoTrasferta.map(data)));
  }

  create(costoTrasferta: CostoTrasferta): Observable<CostoTrasferta> {
    const payload = this.preparePayload(costoTrasferta);
    return this.httpClient.post<any>(this.baseUrl, payload)
      .pipe(map(data => CostoTrasferta.map(data)));
  }

  update(id: number, costoTrasferta: CostoTrasferta): Observable<any> {
    const payload = this.preparePayload(costoTrasferta);
    return this.httpClient.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPaged(
    pageNumber: number = 1,
    pageSize: number = 20,
    clienteId?: number,
    commessaId?: number,
    utenteId?: string,
    dataDaFrom?: moment.Moment,
    dataDaTo?: moment.Moment
  ): Observable<CostoTrasfertaPagedResponseDto> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (clienteId) params = params.set('clienteId', clienteId.toString());
    if (commessaId) params = params.set('commessaId', commessaId.toString());
    if (utenteId) params = params.set('utenteId', utenteId);
    if (dataDaFrom) params = params.set('dataDaFrom', dataDaFrom.format('YYYY-MM-DD'));
    if (dataDaTo) params = params.set('dataDaTo', dataDaTo.format('YYYY-MM-DD'));
    return this.httpClient.get<any>(`${this.baseUrl}/paged`, { params })
      .pipe(map(data => CostoTrasfertaPagedResponseDto.map(data)));
  }

  private preparePayload(costoTrasferta: CostoTrasferta): any {
    const payload: any = { ...costoTrasferta };
    if (costoTrasferta.dataDa) {
      payload.dataDa = costoTrasferta.dataDa.toISOString();
    }
    if (costoTrasferta.dataA) {
      payload.dataA = costoTrasferta.dataA.toISOString();
    }
    return payload;
  }
}
