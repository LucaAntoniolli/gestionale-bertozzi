$envName = $args[0]
$sourcesDir = $args[1]
$publishDir = $args[2]

$frontendsDir = "$sourcesDir\frontend"


Write-Host "** Project ** => Angular Gestionale Bertozzi"
Set-Location -Path "$frontendsDir\gestionale-bertozzi"
& npm i --force
& ng build --configuration="$envName" --output-path "$publishDir\GestionaleBertozziUI"