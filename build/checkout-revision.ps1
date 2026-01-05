$repoUrl = "https://github.com/LucaAntoniolli/gestionale-bertozzi.git"
$sourcesDir = $args[0]
$commitHash = $args[1]
$forceClone = $args[2]

git config http.sslVerify false

if (Test-Path -Path "$sourcesDir\.git") {
    Write-Host "Git repository already exists; skipping clone"
} else {
    Write-Host "Cloning repository ${repoUrl}:"
    Remove-Item $sourcesDir -Recurse -Force -Confirm:$false    
    git clone $repoUrl $sourcesDir
}

Write-Host "Checkout (reset hard) revision ${commitHash}:"

Set-Location -Path $sourcesDir
git fetch --all --tags -f
git reset --hard "origin/$commitHash" --