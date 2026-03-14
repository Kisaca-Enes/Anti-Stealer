# ---------- Ayarlar ----------
$PythonPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python314"  # Python kurulu klasör
$ScriptsPath = Join-Path $PythonPath "Scripts"

# 1) App Execution Aliases kapatma
$aliases = @("python.exe","python3.exe")
foreach ($a in $aliases) {
    $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\$a"
    if (Test-Path $regPath) {
        Remove-ItemProperty -Path $regPath -Name "(default)" -ErrorAction SilentlyContinue
    }
}
# Alternatif GUI yolu: app execution aliases zaten devre dışı bırakılmış olmalı

# 2) PATH kontrol ve ekleme
$envPaths = [System.Environment]::GetEnvironmentVariable("Path","User").Split(";")
$add = $false
if ($PythonPath -notin $envPaths) { 
    $add = $true
    $envPaths += $PythonPath 
}
if ($ScriptsPath -notin $envPaths) { 
    $add = $true
    $envPaths += $ScriptsPath
}
if ($add) {
    $newPath = ($envPaths -join ";")
    [System.Environment]::SetEnvironmentVariable("Path",$newPath,"User")
    Write-Host "[OK] PATH guncellendi. CMD veya PowerShell'i kapatıp yeniden acin." -ForegroundColor Green
} else {
    Write-Host "[INFO] PATH zaten guncel." -ForegroundColor Cyan
}

# 3) Test
Write-Host "[INFO] python komutunu test ediliyor..."
try {
    $ver = & python --version
    Write-Host "[OK] Python bulundu: $ver" -ForegroundColor Green
} catch {
    Write-Warn "[WARN] python komutu hala bulunamadi. CMD/PowerShell'i yeniden baslatin."
}
