# Packs theme/ into dist/felo-skyline.zip for Online Store > Themes > Upload zip file.
# Shopify wants layout/, templates/ and the other folders at the top of the zip, so we zip the contents of theme/, not the folder itself.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$theme = Join-Path $root 'theme'
$dist = Join-Path $root 'dist'
$zip = Join-Path $dist 'felo-skyline.zip'

New-Item -ItemType Directory -Force $dist | Out-Null
if (Test-Path $zip) { Remove-Item $zip -Force }

# Check every JSON file and every section schema parses before packing; Shopify rejects the whole upload otherwise.
$bad = @()
Get-ChildItem $theme -Recurse -Filter *.json | ForEach-Object {
	try { Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null } catch { $bad += $_.FullName }
}
Get-ChildItem (Join-Path $theme 'sections') -Filter *.liquid | ForEach-Object {
	$text = Get-Content $_.FullName -Raw
	$m = [regex]::Match($text, '(?s)\{%\s*schema\s*%\}(.*?)\{%\s*endschema\s*%\}')
	if ($m.Success) {
		try { $m.Groups[1].Value | ConvertFrom-Json | Out-Null } catch { $bad += "$($_.FullName) (schema)" }
	}
}
if ($bad.Count) {
	Write-Host 'These files have broken JSON:' -ForegroundColor Red
	$bad | ForEach-Object { Write-Host "  $_" }
	exit 1
}

# Add files one by one: Windows PowerShell's built-in zipping writes backslash paths, which Shopify's uploader rejects.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($zip, 'Create')
try {
	Get-ChildItem $theme -Recurse -File | ForEach-Object {
		$name = $_.FullName.Substring($theme.Length + 1).Replace('\', '/')
		[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $name) | Out-Null
	}
} finally {
	$archive.Dispose()
}
Write-Host "Built $zip"
