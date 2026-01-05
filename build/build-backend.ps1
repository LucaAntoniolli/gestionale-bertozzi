$configuration = $args[0]
$sourcesDir = $args[1]
$publishDir = $args[2]

$cliTools = "$PSScriptRoot\.cli-tools"
$cliToolsVersion = "6.0"
$dotnet = "$cliTools\dotnet"

$apisDir = "$sourcesDir\backend"

Write-Host "Installing (updating) build tools:"
if (Test-Path -Path $cliTools) {
    "cli-tools path exists; skipping installation"
} else {
    & "$PSScriptRoot\install-cli.ps1" $cliTools $cliToolsVersion
}

Write-Host "///////////     Building APIs:       ///////////////"

Write-Host "** Removing previous builds binaries"
Get-ChildItem "$sourcesDir\backend" -include bin,obj -Recurse | ForEach-Object ($_) { remove-item $_.fullname -Force -Recurse }

& $dotnet build "$sourcesDir\backend\Nemesi.sln" -c $configuration

Write-Host "** Project ** => Gestionale Bertozzi API"
& $dotnet publish "$apisDir\NemesiAPI\NemesiAPI.csproj" -c $configuration -o "$publishDir\GestionaleBertozziAPI"