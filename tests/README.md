# Test automatici

Questa cartella contiene l'infrastruttura di test separata dal codice produttivo.

## Avvio completo

Dalla root del repository:

```powershell
.\tests\Run-All.ps1
```

Con raccolta coverage backend:

```powershell
.\tests\Run-All.ps1 -Coverage
```

Solo backend o frontend:

```powershell
.\tests\Run-All.ps1 -SkipFrontend
.\tests\Run-All.ps1 -SkipBackend
```

## Prerequisiti

- .NET SDK 10;
- dipendenze NuGet ripristinabili;
- dipendenze frontend installate con `npm ci`;
- Chrome disponibile per `ChromeHeadless`.

## Copertura attuale

Il progetto `backend/NemesiAPI.Tests` usa xUnit ed EF Core InMemory. I test del Planning Amministrativo verificano:

- ruoli dichiarati sul controller;
- isolamento fra attività Edili e Amministrative;
- creazione con tipo amministrativo e senza assegnatario secondario;
- modifica da parte di un utente autorizzato diverso dal creatore;
- cancellazione negata ai non creatori;
- cancellazione consentita al creatore;
- completamento e riapertura.

I test InMemory non usano SQL Server e non modificano il database locale.

## Limiti e prossime estensioni

- I test controller non eseguono realmente il middleware JWT/ruoli: l'attributo di autorizzazione è verificato per reflection.
- Servono test d'integrazione HTTP con `WebApplicationFactory` per verificare 401/403 end-to-end.
- Servono test Angular specifici per il Planning Amministrativo, inclusi form, visibilità della cancellazione e chiamate del servizio.
- Servono test SQL Server su database temporaneo per migrazioni e vincoli relazionali.
