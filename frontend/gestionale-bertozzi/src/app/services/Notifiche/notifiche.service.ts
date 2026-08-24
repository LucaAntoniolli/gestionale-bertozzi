import { HttpClient } from '@angular/common/http';
import { Injectable, signal, inject } from '@angular/core';
import { EMPTY, Observable, Subscription, catchError, map, of, switchMap, tap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { ConteggioNotifiche, Notifica } from '../../models/Notifiche/notifica';

const INTERVALLO_POLLING_MS = 60_000;

@Injectable({
  providedIn: 'root'
})
export class NotificheService {

  private readonly baseUrl = `${environment.baseApiUrl}/notifiche`;

  private httpClient = inject(HttpClient);
  private auth = inject(AuthService);

  /**
   * L'applicazione è zoneless: lo stato è esposto come signal perché sia il polling
   * sia le risposte HTTP possano aggiornare la vista senza change detection implicita.
   */
  readonly nonLette = signal(0);
  readonly notifiche = signal<Notifica[]>([]);
  readonly caricamento = signal(false);

  private polling?: Subscription;
  private onVisibilityChange?: () => void;

  // ---------------------------------------------------------------- polling

  avviaPolling(intervalloMs: number = INTERVALLO_POLLING_MS): void {
    if (this.polling) return;

    this.polling = timer(0, intervalloMs)
      .pipe(
        // A tab nascosta non si interroga il server: evita di tenere vivi i refresh
        // token per sessioni lasciate aperte in secondo piano.
        switchMap(() => {
          if (document.visibilityState !== 'visible' || !this.auth.isLoggedIn()) return EMPTY;
          return this.richiediConteggio();
        }),
      )
      .subscribe(conteggio => this.nonLette.set(conteggio.nonLette));

    // Al rientro sulla tab il contatore si aggiorna subito, senza aspettare il tick.
    this.onVisibilityChange = () => {
      if (document.visibilityState === 'visible') this.aggiornaConteggio();
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  fermaPolling(): void {
    this.polling?.unsubscribe();
    this.polling = undefined;

    if (this.onVisibilityChange) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.onVisibilityChange = undefined;
    }
  }

  aggiornaConteggio(): void {
    if (!this.auth.isLoggedIn()) return;
    this.richiediConteggio().subscribe(c => this.nonLette.set(c.nonLette));
  }

  private richiediConteggio(): Observable<ConteggioNotifiche> {
    return this.httpClient.get<any>(`${this.baseUrl}/conteggio`).pipe(
      map(data => ConteggioNotifiche.map(data)),
      // catchError va dentro il switchMap: sullo stream esterno un singolo errore di
      // rete completerebbe il timer, spegnendo il polling per il resto della sessione.
      catchError(() => EMPTY),
    );
  }

  // ------------------------------------------------------------------ lista

  carica(): void {
    this.caricamento.set(true);
    this.httpClient.get<any[]>(this.baseUrl)
      .pipe(
        map(data => Notifica.mapArray(data)),
        catchError(() => of([] as Notifica[])),
      )
      .subscribe(lista => {
        this.notifiche.set(lista);
        this.nonLette.set(lista.length);
        this.caricamento.set(false);
      });
  }

  segnaLetta(id: number): Observable<void> {
    const precedenti = this.notifiche();
    this.rimuoviDaLista(id);

    return this.httpClient.put<void>(`${this.baseUrl}/${id}/letta`, {}).pipe(
      catchError(err => {
        // Rollback: la riga torna visibile invece di sparire senza essere stata chiusa.
        this.notifiche.set(precedenti);
        this.nonLette.set(precedenti.length);
        throw err;
      }),
    );
  }

  segnaTutteLette(): Observable<void> {
    const precedenti = this.notifiche();
    this.notifiche.set([]);
    this.nonLette.set(0);

    return this.httpClient.put<void>(`${this.baseUrl}/leggi-tutte`, {}).pipe(
      catchError(err => {
        this.notifiche.set(precedenti);
        this.nonLette.set(precedenti.length);
        throw err;
      }),
    );
  }

  private rimuoviDaLista(id: number): void {
    const rimaste = this.notifiche().filter(n => n.id !== id);
    this.notifiche.set(rimaste);
    this.nonLette.set(rimaste.length);
  }
}
