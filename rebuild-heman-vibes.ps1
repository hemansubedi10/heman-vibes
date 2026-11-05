# Rebuild HeMan Vibes app.asar
Stop-Process -Name "*HeMan*", "*Streambert*" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$dir = $PSScriptRoot
Write-Host "Packing HeMan Vibes into app.asar..." -ForegroundColor Cyan
npx --yes @electron/asar pack "$dir" "$dir\app.asar.tmp"

$installDir = "C:\Users\heman\AppData\Local\Programs\Streambert"
if (Test-Path "$installDir\resources") {
    Move-Item -Path "$dir\app.asar.tmp" -Destination "$installDir\resources\app.asar" -Force
    Write-Host "Successfully updated HeMan Vibes in installation directory!" -ForegroundColor Green
    if (Test-Path "$installDir\HeMan Vibes.exe") {
        Start-Process "$installDir\HeMan Vibes.exe"
    }
}
