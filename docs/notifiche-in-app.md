# Notifiche in-app

Pannello laterale di notifiche personali, alimentato da eventi applicativi e — in prospettiva — da controlli schedulati notturni.

Backend .NET 10 + EF Core 10, frontend Angular 20 zoneless + PrimeNG, scheduling previsto con Hangfire.

Questo documento raccoglie le **scelte** e il perché. Il come sta nel codice.

## Stato

| Fase | Contenuto | Stato |
|---|---|---|
| 1 | Backend: entità, service, controller, migration | completata |
| 2 | Frontend: service, campanella, pannello | completata |
| 3 | Hangfire e job ricorrenti | da fare |
| 4 | Notifiche da evento e retention | parziale — fatte le assegnazioni ToDo |

---

## Scelte di fondo

**Lettura = eliminazione.** Le notifiche lette spariscono dal pannello, quindi non esiste una `DataEliminazione` separata. La riga resta però a database, per storico e perché la deduplica possa vederla.

**Nessun permesso di ruolo.** Le notifiche sono personali: solo `[Authorize]`, con filtro sempre sull'utente ricavato dal token. `SeedRolePermissions()` non è stato toccato.

**Polling, non SignalR.** Il contatore si aggiorna ogni 60 secondi su un endpoint che restituisce solo un numero. SignalR avrebbe richiesto hub, riconnessioni e gestione del token: sproporzionato per un gestionale interno. Lo stato lato Angular è in signal, quindi sostituire il polling con un hub non toccherebbe i componenti.

**Hangfire in-process, quando si farà.** Il deploy è Kestrel dietro YARP, non IIS: il processo è a vita lunga, quindi non serve un'applicazione separata schedulata da Task Scheduler.

---

## Struttura del codice

Tre livelli con responsabilità nette:

| Livello | Risponde a | Conosce il dominio? | Scrive su DB? |
|---|---|---|---|
| Controller | *è successo qualcosa?* | sì | no |
| `NotificheToDoService` e affini | *cosa dice la notifica?* | sì | no |
| `NotificaService` | *come la salvo?* | **no** | sì |

Il livello generico non deve sapere cosa sia un ToDo, altrimenti diventa un contenitore che accumula un metodo per ogni evento del gestionale.

```
NemesiLIB/Services/Notifiche/
├── INotificaService.cs / NotificaService.cs   generico: persistenza, deduplica, destinatari attivi
├── NuovaNotifica.cs
└── Eventi/
    └── INotificheToDoService.cs / NotificheToDoService.cs   di dominio: testo, link, politiche
```

**Perché non i domain event.** Servirebbero quando lo stesso evento parte da più punti, o quando scatena reazioni indipendenti. Oggi nessuna delle due. I service di dominio non sono lavoro sprecato: alla migrazione diventerebbero il corpo degli handler, cambierebbe solo chi li invoca.

Se si passerà ai domain event, **non** dispacciarli dentro l'override di `SaveChangesAsync`: `NotificaService` chiama a sua volta `SaveChanges`, e si otterrebbe una rientranza col change tracker in stato intermedio.

---

## Modello dati

Tabella `Notifica`. Oltre ai campi ovvi (destinatario, titolo, descrizione, link, flag di lettura, date):

| Campo | Perché c'è |
|---|---|
| `Tipo` | Icona e colore nella riga del pannello |
| `Categoria` | Filtri e raggruppamenti futuri |
| `ChiaveDeduplica` | Impedisce che un job rieseguito duplichi la stessa notifica |
| `DataScadenza` | Notifiche che si autoripuliscono |
| `UtenteOrigine` | Chi l'ha generata; `null` = sistema |

**`Notifica` non implementa `IAuditable`**, a differenza delle altre entità: `ApplyAuditInformation()` legge l'utente da `HttpContextAccessor`, assente nei job, e `DataModifica` duplicherebbe `DataLettura`.

**Indici**: `(UtenteId, IsLetta)` per il conteggio, `(UtenteId, DataCreazione)` per la lista, e un **univoco filtrato** su `ChiaveDeduplica`. Quest'ultimo non è ridondante: la deduplica applicativa è un check-then-insert, che due esecuzioni sovrapposte superano entrambe.

**La chiave di deduplica include il periodo** (`attivita-scadenza:1234:2026-08`). Senza, una notifica chiusa non tornerebbe mai più; con periodo mensile non si ripete nel mese ma può ricomparire dopo. È ciò che rende i job idempotenti e i retry innocui.

---

## Notifiche di assegnazione ToDo

Generate da `ToDoController` su `Create` e `Update`.

- **Create**: notifica primario e secondario.
- **Update**: solo chi non era già assegnato. Modificare descrizione, data o stato di completamento non rinotifica nessuno.
- **Chi compie l'azione non riceve notifica**, nemmeno assegnando a se stesso.
- Link a `/gestione-commesse/planning` o `planning-amministrativo` secondo il `TipoPlanning`.

**Nessuna `ChiaveDeduplica` su queste notifiche.** L'assegnazione è un evento discreto, non una condizione ricorrente: con la chiave, un ToDo tolto e poi riassegnato alla stessa persona non genererebbe la seconda notifica.

**Un errore sulle notifiche non fa fallire il salvataggio.** Quando il service viene invocato il ToDo è già committato: l'intero blocco è in `try/catch` con log.

Caso limite noto: promuovere il secondario a primario non notifica, perché era già fra gli assegnatari.

---

## Punti di attenzione

**Filtro per utente sulle scritture.** Ogni query filtra su `n.Id == id && n.UtenteId == UtenteCorrenteId`, mai `FindAsync(id)`. Con il solo id chiunque potrebbe chiudere le notifiche altrui, e nessun test funzionale se ne accorgerebbe.

**Dashboard Hangfire dietro YARP.** Il filtro di default confronta l'IP del chiamante con quello locale, ma dietro proxy vede sempre l'IP del proxy: considererebbe locale ogni richiesta, lasciando aperta una UI da cui si lanciano job. La scelta consigliata è non instradarla affatto dal proxy.

**Fuso orario dei job.** Il default di Hangfire è UTC: senza `TimeZone = TimeZoneInfo.Local` gli orari slittano al cambio di ora legale.

**`DateTime` e fuso.** SQL Server restituisce `Kind = Unspecified`: senza `SpecifyKind(..., Utc)` il JSON esce privo della `Z` e il browser legge le date come locali, sfasando le date relative. Vale anche per gli insert manuali — usare `GETUTCDATE()`, non `GETDATE()`.

**Angular è zoneless.** Con `provideZonelessChangeDetection()` un contatore su proprietà normale aggiornato da un timer non farebbe scattare alcuna change detection: i signal sono obbligatori.

**`catchError` dentro lo `switchMap`.** Sullo stream esterno il primo errore di rete completerebbe il `timer`, spegnendo il polling per il resto della sessione senza alcun segnale.

**Destinatari disattivati.** Il filtro su `IsAttivo` è dentro `NotificaService`, una volta sola: i job che risolvono un intero ruolo non devono ricordarsene.

**Audit nei job.** `ApplyAuditInformation()` ricade su `"-"` senza `HttpContext`. Irrilevante per `Notifica`, diventa un problema quando un job scriverà commesse o attività: servirà un utente ambientale "sistema".

---

## Aperto

- Quali controlli notturni servono (attività in scadenza, commesse oltre consegna, collaudi, ToDo scadute).
- Se agganciare l'email per alcune categorie: `IMailService` esiste già, andrebbe dentro `NotificaService` così vale sia per i job sia per gli eventi utente.
- Retention: cancellare le lette oltre i sei mesi, **purché** la finestra resti più ampia del periodo nelle chiavi di deduplica, altrimenti si fanno risorgere notifiche già chiuse.

---

## Comandi

```
# dalla cartella backend/
dotnet ef migrations add <NomeMigration> --project NemesiLIB --startup-project NemesiAPI --context GestionaleBertozziContext

$env:ASPNETCORE_ENVIRONMENT = "luca"
dotnet ef database update --project NemesiLIB --startup-project NemesiAPI --context GestionaleBertozziContext
```

Vedi [commands-entity-framework.md](commands-entity-framework.md).
