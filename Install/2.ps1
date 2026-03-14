# Python yolu bul
$py = (Get-Command py -ErrorAction SilentlyContinue | ForEach-Object { $_.Source }) -or (Get-Command python -ErrorAction SilentlyContinue | ForEach-Object { $_.Source })

if (-not $py) { Write-Host "Python bulunamadı!"; exit 1 }

# pip yoksa ensurepip ile kur
try { & $py -m pip --version > $null 2>&1 } catch { & $py -m ensurepip --upgrade }

# pip'i güncelle
& $py -m pip install --upgrade pip

# Paketleri kur
$packages = @("flask","pywebview")
foreach ($pkg in $packages) {
    try {
        Write-Host "Kuruluyor: $pkg"
        & $py -m pip install --upgrade $pkg
        Write-Host "$pkg yüklendi."
    } catch {
        Write-Warning "$pkg kurulamadı: $_"
    }
}
