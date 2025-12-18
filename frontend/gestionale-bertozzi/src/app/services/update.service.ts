import { Injectable, isDevMode } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, filter, interval, startWith, Observable, from, catchError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  private updateAvailable$ = new BehaviorSubject<boolean>(false);
  private _lastUpdateCheck$ = new BehaviorSubject<Date | null>(null);
  private _isChecking$ = new BehaviorSubject<boolean>(false);
  private _isUpdating$ = new BehaviorSubject<boolean>(false);

  constructor(private swUpdate: SwUpdate) {
    if (!isDevMode() && this.swUpdate.isEnabled) {
      this.initializeUpdateService();
    }
  }

  /**
   * Observable che emette true quando è disponibile un aggiornamento
   */
  get isUpdateAvailable$() {
    return this.updateAvailable$.asObservable();
  }

  /**
   * Observable con la data dell'ultimo controllo aggiornamenti
   */
  get lastUpdateCheck$() {
    return this._lastUpdateCheck$.asObservable();
  }

  /**
   * Observable che indica se è in corso un controllo aggiornamenti
   */
  get isChecking$() {
    return this._isChecking$.asObservable();
  }

  /**
   * Observable che indica se è in corso l'applicazione di un aggiornamento
   */
  get isUpdating$() {
    return this._isUpdating$.asObservable();
  }

  /**
   * Forza un controllo manuale degli aggiornamenti
   */
  checkForUpdate(): Observable<boolean> {
    if (!this.swUpdate.isEnabled) {
      return of(false);
    }

    this._isChecking$.next(true);
    this._lastUpdateCheck$.next(new Date());

    return from(this.swUpdate.checkForUpdate()).pipe(
      tap((updateAvailable) => {
        console.log('Manual update check:', updateAvailable);
        this._isChecking$.next(false);
      }),
      catchError((error) => {
        console.error('Error during manual update check:', error);
        this._isChecking$.next(false);
        return of(false);
      })
    );
  }

  /**
   * Applica l'aggiornamento e ricarica l'app
   */
  applyUpdate(): Observable<boolean> {
    if (!this.swUpdate.isEnabled) {
      return new Observable(observer => {
        observer.error(new Error('Service Worker not enabled'));
      });
    }

    this._isUpdating$.next(true);

    return from(this.swUpdate.activateUpdate()).pipe(
      tap(() => {
        // Piccolo delay prima del reload per permettere al toast di apparire
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }),
      catchError((error) => {
        console.error('Error applying update:', error);
        this._isUpdating$.next(false);
        throw error;
      })
    );
  }

  private initializeUpdateService(): void {
    // Ascolta eventi di nuove versioni
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe(() => {
        this.updateAvailable$.next(true);
      });

    // Controlla aggiornamenti periodicamente (ogni 30 minuti)
    interval(30 * 60 * 1000)
      .pipe(startWith(0))
      .subscribe(() => {
        this.checkForUpdate().subscribe({
          next: (available) => {
            console.log('Periodic update check result:', available);
          },
          error: (error) => {
            console.error('Periodic update check failed:', error);
          }
        });
      });

    // Gestisce errori non recuperabili
    this.swUpdate.unrecoverable.subscribe(() => {
      console.error('Unrecoverable state reached - reloading app');
      // L'app principale gestirà questo evento
    });
  }
}
