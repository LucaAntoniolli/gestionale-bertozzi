[CmdletBinding()]
param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$Coverage
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendTests = Join-Path $PSScriptRoot 'backend\NemesiAPI.Tests\NemesiAPI.Tests.csproj'
$frontend = Join-Path $root 'frontend\gestionale-bertozzi'

if (-not $SkipBackend) {
    Write-Host '=== Test backend ==='
    $backendArgs = @('test', $backendTests, '--configuration', 'Release')
    if ($Coverage) {
        $backendArgs += '--collect:XPlat Code Coverage'
    }
    & dotnet @backendArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Test backend falliti con exit code $LASTEXITCODE"
    }
}

if (-not $SkipFrontend) {
    Write-Host '=== Test frontend ==='
    Push-Location $frontend
    try {
        & npm test -- --watch=false --browsers=ChromeHeadless
        if ($LASTEXITCODE -ne 0) {
            throw "Test frontend falliti con exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host '=== Tutti i test richiesti sono terminati con successo ==='
