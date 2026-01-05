[CmdletBinding()]
Param(
  # use 'local' to build actual workarea
  # e.g 84a30e1ae2805d438abab6eade31fd6ffea99b54 (!! do not yet use with tags; by now it doesn't work properly)
  [Parameter(
    Mandatory=$true, 
    Position=0,
    HelpMessage="use 'local' to build actual workarea or a #branch_name# to build branch")
  ]
  [string]$commit,

  # use Debug, Test, Release (conforming to Solution Configuration Manager)
  [Parameter(
    Mandatory=$true,
    Position=1,
    HelpMessage="use Debug, Test, Release (conforming to Solution Configuration Manager)")
  ]
  [ValidateSet("Debug", "Test", "Release")]
  [string]$configuration,

  # front, back or both
  [Parameter(
    Mandatory=$true,
    Position=2,
    HelpMessage="use front, back or both")]
  [ValidateSet("front", "back", "both")]
  [string]$buildType,
  
  # e.g actual, next, production
  [Parameter(
    Mandatory=$true,
    Position=3,
    HelpMessage="use collaudo or produzione")]
    [ValidateSet("collaudo", "produzione")]
  [string]$envName
)

$publishDir = "$PSScriptRoot\.publish"

if ($commit -eq "local") {
    Write-Host "---------    Building Local Work area    ------------------"
    Write-Host "Warning: local build WILL NOT checkout or reset anything from GIT (will build work area as it is now, including untracked or uncommitted content)!!"
    $tempWorkspaceDir = "$PSScriptRoot\..\.."
} else {
    Write-Host "---------    Building a GIT commit    ------------------"
    $tempWorkspaceDir = "$PSScriptRoot\.build-temp"    
}
Write-Host "Workspace dir set to $tempWorkspaceDir"
Write-Host "Publish dir set to $publishDir\$commit-$configuration-$envName"


if (Test-Path -Path "$publishDir\$commit-$configuration-$envName") {
    Write-Host "Delete $commit-$configuration-$envName in publish folders:"
    Remove-Item "$publishDir\$commit-$configuration-$envName\*" -Recurse -Force -Confirm:$false
}

if ($commit -ne "local") {
    Write-Host "Performing GIT operations:"
    & "$PSScriptRoot\checkout-revision.ps1" $tempWorkspaceDir $commit
}

if ($buildType -eq "back" -Or $buildType -eq "both") {
    Write-Host "---------    Building Backend    ------------------"
    & "$PSScriptRoot\build-backend.ps1" $configuration $tempWorkspaceDir "$publishDir\$commit-$configuration-$envName"
}


if ($buildType -eq "front" -Or $buildType -eq "both") {
    Write-Host "---------    Building Frontend    ------------------"
    & "$PSScriptRoot\build-frontend.ps1" $envName $tempWorkspaceDir "$publishDir\$commit-$configuration-$envName"
}

Set-Location -Path $PSScriptRoot