# Python komutunu güvenli şekilde bul
$py = $null
try { $py = (Get-Command py -ErrorAction Stop).Source } catch {}
if (-not $py) {
    try { $py = (Get-Command python -ErrorAction Stop).Source } catch {}
}

if (-not $py) {
    Write-Host "Python bulunamadı! Lütfen Python 3.11 veya 3.12/3.14+ kurun."
    exit 1
}

Write-Host "Python bulundu: $py"

# pip yoksa ensurepip ile kur
try { & $py -m pip --version > $null 2>&1 } catch { & $py -m ensurepip --upgrade }

# pip'i güncelle
& $py -m pip install --upgrade pip

# Paketleri kur
$packages = @("flask","pywebview")
foreach ($pkg in $packages) {
    Write-Host "Kuruluyor: $pkg"
    try { & $py -m pip install --upgrade $pkg } catch { Write-Warning "$pkg kurulamadı: $_" }
}
