import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Utente } from '../models/utente';
import { Ruolo } from '../models/ruolo';

@Injectable({
  providedIn: 'root'
})
export class GestioneAccessoService {

  constructor(private httpClient: HttpClient) { }

  elencoUtenti() : Observable<Utente[]>{
    return this.httpClient.get<Utente[]>(`${environment.baseApiUrl}/auth/get-users`);
  }

  ruoloUtente(email: string) : Observable<string[]>{
    return this.httpClient.get<any>(`${environment.baseApiUrl}/auth/get-roles/${email}`);
  }

  elencoRuoli() : Observable<Ruolo[]>{
    return this.httpClient.get<any>(`${environment.baseApiUrl}/auth/get-all-roles`);
  }

  creaUtente(nominativo: string, email: string, password: string, ruolo: string, isEsterno: boolean, societa: string, costoOrario: number) : Observable<any>{
    return this.httpClient.post<any>(`${environment.baseApiUrl}/auth/register`, { Email: email, Password: password, Nominativo: nominativo, Ruolo: ruolo, IsEsterno: isEsterno, Societa: societa, CostoOrario: costoOrario});
  }

  modificaUtente(email: string, nominativo: string, ruolo: string, isEsterno: boolean, societa: string, costoOrario: number) : Observable<any>{
    return this.httpClient.patch<any>(`${environment.baseApiUrl}/auth/update-user`, { Email: email, Password: '', Nominativo: nominativo, Ruolo: ruolo, IsEsterno: isEsterno, Societa: societa, CostoOrario: costoOrario  });
  }

  eliminaUtente(email: string) : Observable<any>{
    return this.httpClient.delete<any>(`${environment.baseApiUrl}/auth/unregister/${email}`);
  }
}
