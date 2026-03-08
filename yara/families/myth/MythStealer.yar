rule MythGrabber_v140_NodeJS_Stealer
{
    meta:
        description      = "Detects MythGrabber v140 - Node.js based infostealer (browser passwords/cookies, Discord tokens, wallets, screenshot, injection)"
        author           = "Based on provided source reconstruction"
        reference        = "MythGrabber stealer - Discord webhook exfil"
        date             = "2025-03"
        malware_family   = "MythGrabber"
        severity         = "HIGH"
        hash             = "unknown"   // packed/bytecode olduğu için hash genellikle değişir
        mitre_attack     = "T1555.003, T1113, T1005, T1567.002"

    strings:

        // -------------------------------
        // En güçlü imza: webhook adresi (canary)
        // Bu neredeyse %100 spesifik (2025 sonu itibarıyla aktif)
        // -------------------------------
        $webhook_strict  = "https://canary.discord.com/api/webhooks/1439790358534819992/k8qpWQM0LyeEyxj2DcR6A-hwVIaifn0uh13KpUF3RDFJ69UvfFQEuf8XkjLypuQUJLRb" ascii wide

        // -------------------------------
        // MythGrabber marka string'leri
        // -------------------------------
        $m1 = "MythGrabber v140" ascii
        $m2 = "MythGrabber v140" wide
        $m3 = "🔥 MythGrabber v140" ascii

        // -------------------------------
        // Kod yapısından çok spesifik parçalar
        // -------------------------------
        $s1 = "isVirtualMachine" ascii fullword
        $s2 = "VBoxMouse.sys" ascii
        $s3 = "vmhgfs.sys" ascii
        $s4 = "decryptBrowserData" ascii fullword
        $s5 = "getMasterKey" ascii fullword
        $s6 = "os_crypt.encrypted_key" ascii
        $s7 = "DPAPI-protected master key" ascii

        // Discord token regex ve yollar
        $d1 = "mfa.[\\w-]{84}" ascii
        $d2 = "Local Storage\\leveldb" ascii
        $d3 = "discordcanary" ascii fullword
        $d4 = "discordptb" ascii fullword

        // Browser yolları ve dosyalar (kısmi eşleşme ile)
        $b1 = "\\Google\\Chrome\\User Data" ascii
        $b2 = "\\BraveSoftware\\Brave-Browser\\User Data" ascii
        $b3 = "\\Microsoft\\Edge\\User Data" ascii
        $b4 = "Login Data" ascii fullword nocase
        $b5 = "Cookies" ascii fullword nocase
        $b6 = "Network\\Cookies" ascii

        // C2 / exfil ile ilgili
        $c1 = "payload_json" ascii fullword
        $c2 = "file" ascii fullword
        $c3 = ".zip" ascii fullword
        $c4 = "${systemInfo.hostname}_${Date.now()}.zip" ascii

        // JSZip + form-data + axios kombinasyonu
        $lib1 = "JSZip" ascii fullword
        $lib2 = "form-data" ascii fullword
        $lib3 = "better-sqlite3" ascii fullword
        $lib4 = "@primno/dpapi" ascii

        // Embed yapısı
        $embed1 = "title: '🔥 MythGrabber v140'" ascii
        $embed2 = "color: 0xff0000" ascii
        $embed3 = "footer: { text: 'MythGrabber v140' }" ascii

    condition:
        // En güçlü koşullar (çok yüksek doğruluk)
        any of ($webhook_strict*) or

        // Marka + en az 5 güçlü belirti
        (1 of ($m*) and 5 of ($s*,$d*,$b*,$c*,$lib*,$embed*)) or

        // Marka olmadan ama çok güçlü kombinasyon (FUD denemelerinde marka silinmiş olabilir)
        (
            2 of ($s*) and
            2 of ($d*) and
            2 of ($b*) and
            2 of ($lib*)
        ) or

        // Embed + webhook veya zip gönderme paternleri
        (
            1 of ($embed*) and
            2 of ($c*, $webhook_strict*)
        )
}
