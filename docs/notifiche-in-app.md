# Notifiche in-app

Pannello laterale di notifiche personali, alimentato da eventi applicativi e da controlli schedulati, più un riepilogo settimanale via mail al Backoffice.

Backend .NET 10 + EF Core 10, frontend Angular 20 zoneless + PrimeNG, scheduling con Hangfire.

Questo documento raccoglie le **scelte** e il perché. Il come sta nel codice.

## Stato

| Fase | Contenuto | Stato |
|---|---|---|
| 1 | Backend: entità, service, controller, migration | completata |
| 2 | Frontend: service, campanella, pannello | completata |
| 3 | Hangfire: infrastruttura di scheduling | completata |
| 4 | Job ricorrenti, notifiche da evento, retention | completata |
| 5 | Riepilogo via mail al Backoffice | completata |

---

## Scelte di fondo

**Lettura = eliminazione.** Le notifiche lette spariscono dal pannello, quindi non esiste una `DataEliminazione` separata. La riga resta però a database, per storico e perché la deduplica possa vederla.

**Nessun permesso di ruolo.** Le notifiche sono personali: solo `[Authorize]`, con filtro sempre sull'utente ricavato dal token. `SeedRolePermissions()` non è stato toccato.

**Polling, non SignalR.** Il contatore si aggiorna ogni 60 secondi su un endpoint che restituisce solo un numero. SignalR avrebbe richiesto hub, riconnessioni e gestione del token: sproporzionato per un gestionale interno. Lo stato lato Angular è in signal, quindi sostituire il polling con un hub non toccherebbe i componenti.

**Hangfire in-process.** Il deploy è Kestrel dietro YARP, non IIS: il processo è a vita lunga, quindi non serve un'applicazione separata schedulata da Task Scheduler. Lo storage sta nello schema `HangFire` del database applicativo; l'utente è `db_owner`, quindi `PrepareSchemaIfNecessary` è lasciato attivo e le tabelle si creano da sole al primo avvio.

**Dashboard raggiungibile solo dal server.** Viene instradata solo se `Hangfire:Dashboard:Abilitata` è `true`, e comunque ristretta agli IP di `IpConsentiti`. Attiva in sviluppo e in produzione, in entrambi i casi con allowlist di solo loopback: **non va aggiunta una rotta `/hangfire` su YARP**. Ci si arriva collegandosi al server (RDP) o via tunnel SSH, navigando su `localhost`. `appsettings.json` la lascia spenta come default per ogni altro ambiente.

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

## Job ricorrenti

Stanno in `NemesiLIB/Services/Notifiche/Job/`, cron in `Hangfire:Cron`. Non hanno dipendenze da Hangfire: sono classi normali, schedulate da `Program.cs`.

| Job | Cadenza | Destinatario |
|---|---|---|
| `ToDoScaduteJob` | ogni giorno, 6:00 | notifica in-app all'assegnatario |
| `OreMancantiJob` | ogni giorno, 6:00 | notifica in-app al singolo |
| `RiepilogoOreMancantiJob` | lunedì, 7:00 | mail al ruolo Backoffice |
| `PuliziaNotificheJob` | domenica, 3:30 | — |

**`ToDoScaduteJob`** — conta le ToDo non completate oltre la data di consegna. Una notifica per tipo di planning, perché il link differisce; vale sia per l'assegnatario primario sia per il secondario, quindi un ToDo con due assegnatari conta per entrambi. Una ToDo senza `DataConsegna` non è scaduta.

**`RilevatoreOreMancanti`** — individua chi non ha caricato ore nei giorni lavorativi della finestra, che è mobile sui 7 giorni precedenti e si ferma a ieri perché le ore di oggi non sono ancora attese.

È **condiviso** fra il promemoria in-app e il riepilogo via mail: due destinatari e due cadenze, ma un solo criterio, così le due comunicazioni non possono raccontare cose diverse. Tre scelte:

- **Un giorno è coperto solo se esiste una riga con `Ore > 0`.** `Ore` è nullable: una riga di sole spese o chilometri non basta.
- **Il perimetro è tutti gli utenti attivi non esterni.** Una prima versione restringeva a chi aveva caricato ore negli ultimi 60 giorni, per non disturbare chi non usa il modulo: si è rivelato controproducente, perché escludeva proprio chi non carica mai le ore, cioè il destinatario che il promemoria deve raggiungere. Sui dati reali passava da 11 destinatari a 1. Nel modello non esiste un'informazione che distingua chi è tenuto a rendicontare (`CostoOrario` è popolato per un solo utente), quindi si sbaglia per eccesso: chi per ruolo non carica ore riceve comunque la segnalazione. Un flag `CaricaOre` su `Utente` sarebbe la soluzione stabile.
- **Ferie, permessi e malattia non sono noti** — non esistono nel modello. Chi è assente riceve comunque la segnalazione. Limite accettato consapevolmente.

`GiorniLavorativi` esclude sabato, domenica e le festività nazionali italiane, con Pasquetta calcolata. Il patrono è locale e non è incluso.

### Riepilogo via mail al Backoffice

**`RiepilogoOreMancantiJob`** invia a chi ha il ruolo `Backoffice` la tabella di chi non ha caricato le ore, con nome, numero di giorni e date scoperte. Template `Templates/Emails/riepilogo-ore-mancanti.html`, un invio per destinatario perché `MailData.EmailToId` accetta un solo indirizzo.

**Settimanale, non giornaliero**, a differenza del promemoria al singolo: è un controllo di gestione, non un sollecito, e la stessa tabella ogni mattina verrebbe archiviata senza leggerla dopo tre giorni. Il cron resta configurabile.

**Nessun invio quando non c'è nulla da segnalare.** Un riepilogo vuoto ogni settimana insegna solo a ignorare il mittente.

#### Vincoli imposti dal sanitizer

`MailService` passa i `TemplateHtmlValues` attraverso `HtmlSanitizer`, che **sanifica ma non codifica** — con `TemplateValues` la tabella arriverebbe come testo coi tag in vista, quindi i nominativi vanno codificati esplicitamente nel job. Ma il sanitizer impone anche due vincoli meno ovvi, entrambi verificati dai test in `SanitizerTabellaTests`:

- **Va iniettata la tabella intera, non le sole righe.** Il sanitizer analizza il frammento con un parser HTML, e `tr` o `td` fuori da una `table` sono invalidi: vengono scartati lasciando solo il testo, che finisce concatenato sopra una tabella vuota. Una prima versione iniettava le righe in un `tbody` del template e la mail arrivava così.
- **Gli stili sono inline, non classi.** L'attributo `class` non è fra quelli consentiti e viene rimosso; `style` invece sopravvive. Un blocco `<style>` nel template non basterebbe a formattare il markup iniettato — e molti client di posta lo ignorano comunque.

Un terzo punto riguarda il deploy: il template ha bisogno della sua voce `<None Update>` in `NemesiAPI.csproj`, altrimenti non viene copiato in output e in produzione l'invio fallisce con file-not-found. `MailService` lo cerca sotto `Directory.GetCurrentDirectory()`, quindi conta anche la working directory del processo.

### Chiusura delle notifiche non più valide

La chiave di deduplica contiene la data, quindi ogni giorno ne nasce una nuova: la segnalazione torna finché la condizione non si risolve, e leggerla non la silenzia. Senza contromisure il pannello accumulerebbe una riga al giorno.

`INotificaService.ChiudiNonPiuValideAsync(famiglia, chiaviAncoraValide)` marca come lette tutte le non lette della famiglia (`todo-scadute:`, `ore-mancanti:`) che non figurano fra le chiavi appena generate. Ogni job la invoca **dopo** aver creato le proprie, passando le chiavi di oggi.

Copre due casi con un'unica operazione:

- la rilevazione di ieri, superata da quella di oggi;
- quella di un utente per cui **la condizione non sussiste più** — che è il caso insidioso, perché non generando una notifica nuova non ci sarebbe nulla a rimpiazzarla, e resterebbe in pannello a segnalare attività ormai completate.

Per questo la chiamata sta anche nel ramo in cui il job non trova nulla da segnalare, con lista vuota: se nessuno ha più scadenze, vanno chiuse tutte.

Il risultato è che esiste **al più una notifica non letta** per utente e famiglia, e che corrisponde sempre allo stato reale.

La famiglia include i due punti finali (`ore-mancanti:`): il confronto è uno `StartsWith`.

### Retention

**`PuliziaNotificheJob`** gira la domenica alle 3:30 e cancella le notifiche **già lette** più vecchie di `Notifiche:MesiRetention` (default 6).

- **Le non lette non si toccano a nessuna età**: sono la posta dell'utente, e cancellarle significherebbe fargli sparire qualcosa che non ha mai visto. Quelle dei controlli ricorrenti si chiudono comunque da sé per sostituzione.
- Una riga marcata letta ma **senza `DataLettura`** — per esempio scritta da SQL diretto — verrebbe altrimenti conservata per sempre: in quel caso vale la `DataCreazione`.
- Il vincolo sulla deduplica è ampiamente rispettato: le chiavi dei job sono giornaliere, la retention è di sei mesi.

---

## Punti di attenzione

**Filtro per utente sulle scritture.** Ogni query filtra su `n.Id == id && n.UtenteId == UtenteCorrenteId`, mai `FindAsync(id)`. Con il solo id chiunque potrebbe chiudere le notifiche altrui, e nessun test funzionale se ne accorgerebbe.

**Dashboard Hangfire dietro YARP.** Non si usa `LocalRequestsOnlyAuthorizationFilter`: confronta l'IP del chiamante con quello locale, ma dietro proxy vede sempre l'IP del proxy e considererebbe locale ogni richiesta, lasciando aperta una UI da cui si lanciano job. Al suo posto c'è `HangfireDashboardAuthorizationFilter`, con allowlist esplicita e deny per default. Per lo stesso motivo, se un domani la dashboard fosse resa raggiungibile via proxy **non basta aggiungere l'IP del proxy** — equivarrebbe a consentire tutti: servirebbe prima `UseForwardedHeaders` configurato con i proxy attendibili.

**La dashboard va registrata prima di `UseAuthorization`.** È middleware, non un endpoint, e il `FallbackPolicy` globale (`RequireAuthenticatedUser`) respinge con 401 anche le richieste che non corrispondono ad alcun endpoint. Messa dopo, restituisce 401 senza che Hangfire venga mai interpellato — sintomo indistinguibile da un filtro che nega.

**`DisplayStorageConnectionString = false`.** Il default di Hangfire è `true` e mostrerebbe la connection string nella dashboard, password inclusa.

**Fuso orario dei job.** Il default di Hangfire è UTC: senza `TimeZone = TimeZoneInfo.Local` gli orari slittano al cambio di ora legale.

**`DateTime` e fuso.** SQL Server restituisce `Kind = Unspecified`: senza `SpecifyKind(..., Utc)` il JSON esce privo della `Z` e il browser legge le date come locali, sfasando le date relative. Vale anche per gli insert manuali — usare `GETUTCDATE()`, non `GETDATE()`.

**Angular è zoneless.** Con `provideZonelessChangeDetection()` un contatore su proprietà normale aggiornato da un timer non farebbe scattare alcuna change detection: i signal sono obbligatori.

**`catchError` dentro lo `switchMap`.** Sullo stream esterno il primo errore di rete completerebbe il `timer`, spegnendo il polling per il resto della sessione senza alcun segnale.

**Destinatari disattivati.** Il filtro su `IsAttivo` è dentro `NotificaService`, una volta sola: i job che risolvono un intero ruolo non devono ricordarsene.

**`QUOTED_IDENTIFIER ON` per le scritture su `Notifica`.** L'indice univoco filtrato lo esige: qualsiasi INSERT, UPDATE o DELETE da una sessione che lo ha spento fallisce con l'errore 1934. SSMS lo imposta di default, **sqlcmd no**: negli script va messo in testa.

**Audit nei job.** `ApplyAuditInformation()` ricade su `"-"` senza `HttpContext`. Irrilevante per `Notifica`, diventa un problema quando un job scriverà commesse o attività: servirà un utente ambientale "sistema".

---

## Aperto

- Nel database di sviluppo il ruolo `Backoffice` non ha utenti assegnati: finché resta così il riepilogo settimanale non parte, e lo si vede solo dal warning nei log.
- Se agganciare l'email anche alle notifiche in-app di alcune categorie: andrebbe dentro `NotificaService`, così varrebbe sia per i job sia per gli eventi utente.
- Un flag `CaricaOre` su `Utente`, per distinguere chi è tenuto a rendicontare: renderebbe preciso il perimetro di `OreMancantiJob`, che oggi comprende tutti gli interni attivi.
- Se e come gestire le assenze: oggi chi è in ferie riceve comunque la segnalazione dei giorni senza ore.

---

## Comandi

```
# dalla cartella backend/
dotnet ef migrations add <NomeMigration> --project NemesiLIB --startup-project NemesiAPI --context GestionaleBertozziContext

$env:ASPNETCORE_ENVIRONMENT = "luca"
dotnet ef database update --project NemesiLIB --startup-project NemesiAPI --context GestionaleBertozziContext
```

Vedi [commands-entity-framework.md](commands-entity-framework.md).
