import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ToDo } from '../../models/GestioneCommesse/todo.model';

@Injectable({
    providedIn: 'root'
})
export class PlanningAmministrativoService {

    private readonly baseUrl = `${environment.baseApiUrl}/planning-amministrativo`;

    constructor(private httpClient: HttpClient) {}

    getAll(commessaId?: number, completato?: boolean): Observable<ToDo[]> {
        let params = new HttpParams();
        if (commessaId) {
            params = params.set('commessaId', commessaId.toString());
        }
        if (completato !== undefined) {
            params = params.set('completato', completato.toString());
        }

        return this.httpClient.get<any[]>(this.baseUrl, { params })
            .pipe(map(data => ToDo.mapArray(data)));
    }

    create(todo: ToDo): Observable<ToDo> {
        return this.httpClient.post<any>(this.baseUrl, this.preparePayload(todo))
            .pipe(map(data => ToDo.map(data)));
    }

    update(id: number, todo: ToDo): Observable<void> {
        return this.httpClient.put<void>(`${this.baseUrl}/${id}`, this.preparePayload(todo));
    }

    delete(id: number): Observable<void> {
        return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
    }

    markAsComplete(id: number): Observable<void> {
        return this.httpClient.patch<void>(`${this.baseUrl}/${id}/complete`, null);
    }

    markAsIncomplete(id: number): Observable<void> {
        return this.httpClient.patch<void>(`${this.baseUrl}/${id}/reopen`, null);
    }

    private preparePayload(todo: ToDo): object {
        return {
            commessaId: todo.commessaId,
            descrizioneTodo: todo.descrizioneTodo,
            assegnatarioPrimarioId: todo.assegnatarioPrimarioId,
            priorita: todo.priorita,
            dataConsegna: todo.dataConsegna?.format('YYYY-MM-DD') ?? null,
            descrizioneAttivitaSvolta: todo.descrizioneAttivitaSvolta || null,
            completato: todo.completato,
        };
    }
}
