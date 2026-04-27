$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$distPath = Join-Path $projectRoot "dist"
$assetsSource = Join-Path $projectRoot "assets"
$assetsDest = Join-Path $distPath "assets"
$indexSource = Join-Path $projectRoot "index.htm"
$indexHtmlDest = Join-Path $distPath "index.html"
$indexHtmDest = Join-Path $distPath "index.htm"

if (Test-Path -LiteralPath $distPath) {
  Remove-Item -LiteralPath $distPath -Recurse -Force
}

New-Item -ItemType Directory -Path $distPath | Out-Null
Copy-Item -LiteralPath $indexSource -Destination $indexHtmlDest -Force
Copy-Item -LiteralPath $indexSource -Destination $indexHtmDest -Force
Copy-Item -LiteralPath $assetsSource -Destination $assetsDest -Recurse -Force

Write-Output "Built web assets into $distPath"
