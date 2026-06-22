@echo off
setlocal EnableExtensions

title Avvio Gestionale Bertozzi

rem La cartella .ai-docs si trova direttamente sotto la root del repository.
for %%I in ("%~dp0..") do set "ROOT=%%~fI"
set "FRONTEND=%ROOT%\frontend\gestionale-bertozzi"
set "BACKEND_PROJECT=%ROOT%\backend\NemesiAPI\NemesiAPI.csproj"

echo ============================================================
echo  Avvio locale Gestionale Bertozzi
echo  Repository: %ROOT%
echo ============================================================
echo.

if not exist "%BACKEND_PROJECT%" (
    echo [ERRORE] Progetto backend non trovato:
    echo %BACKEND_PROJECT%
    goto :error
)

if not exist "%FRONTEND%\package.json" (
    echo [ERRORE] package.json frontend non trovato:
    echo %FRONTEND%\package.json
    goto :error
)

where dotnet >nul 2>&1
if errorlevel 1 (
    echo [ERRORE] Il comando dotnet non e' disponibile nel PATH.
    echo Installare .NET SDK 10 e riprovare.
    goto :error
)

powershell.exe -NoProfile -Command "$sdk = dotnet --list-sdks | Select-String '^10\.'; if ($sdk) { exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo [ERRORE] .NET SDK 10 non risulta installato.
    dotnet --list-sdks
    goto :error
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERRORE] Il comando npm non e' disponibile nel PATH.
    echo Installare Node.js e npm e riprovare.
    goto :error
)

if not exist "%FRONTEND%\node_modules" (
    echo [SETUP] Dipendenze frontend assenti: esecuzione di npm ci...
    pushd "%FRONTEND%"
    call npm ci
    if errorlevel 1 (
        popd
        echo [ERRORE] Installazione delle dipendenze frontend fallita.
        goto :error
    )
    popd
    echo [OK] Dipendenze frontend installate.
    echo.
)

powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 10000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo [START] Backend su http://localhost:10000
    start "Gestionale Bertozzi - Backend" powershell.exe -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%ROOT%'; dotnet run --project '.\backend\NemesiAPI\NemesiAPI.csproj' --launch-profile giacomo"
) else (
    echo [SKIP] La porta 10000 e' gia' in ascolto: backend non riavviato.
)

powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo [START] Frontend su http://localhost:4200
    start "Gestionale Bertozzi - Frontend" powershell.exe -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%FRONTEND%'; npm start"
) else (
    echo [SKIP] La porta 4200 e' gia' in ascolto: frontend non riavviato.
)

echo.
echo [INFO] Attendo alcuni secondi prima di aprire il browser...
timeout /t 6 /nobreak >nul
start "" "http://localhost:4200"

echo.
echo ============================================================
echo  Avvio richiesto.
echo  Frontend: http://localhost:4200
echo  Swagger:  http://localhost:10000/swagger
echo ============================================================
echo.
echo Chiudere questa finestra. I terminali backend e frontend
echo resteranno aperti per mostrare log ed eventuali errori.
timeout /t 3 /nobreak >nul
exit /b 0

:error
echo.
echo Avvio interrotto. Correggere l'errore indicato sopra.
pause
exit /b 1
