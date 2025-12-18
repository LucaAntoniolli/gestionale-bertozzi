# Istruzioni per Migrations EF Core

Installlare tool dotnet ef se non presente
- ```dotnet tool install --global dotnet-ef --version 8.*```

Installare pacchetto Microsoft.EntityFrameworkCore.Design

Comando per crare una migrazione
```dotnet ef migrations add IdentityMigrations --project NemesiLIB --startup-project NemesiAPI --context GestionaleBertozziContext```

Comando per eseguire l'aggiornamento del DB
```dotnet ef database update --project NemesiLIB --startup-project NemesiAPI --context GestionaleBertozziContext```

Comando per rimuovere le migrations
```dotnet ef migrations remove --project NemesiLIB --startup-project NemesiAPI --context GestionaleBertozziContext```

Comando per creare gli script di tutte le migration in avanti
```dotnet ef migrations script --project NemesiLIB --startup-project NemesiAPI --context GestionaleBertozziContext```

Comando per creare gli script da una migration in avanti
```dotnet ef migrations script NomeMigration --project NemesiLIB --startup-project NemesiAPI --context GestionaleBertozziContext```

Se necessario specificare la connection string, aggioungere in coda, recuperando la connection string dall'appsetting json
- ```--connection ""```

Definire environment e lanciare aggiornamento DB
- ```$env:ASPNETCORE_ENVIRONMENT = "Luca"```
- ```dotnet ef database update --project NemesiLIB --startup-project NemesiAPI --context GestionaleBertozziContext```
