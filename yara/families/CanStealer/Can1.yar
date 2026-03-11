rule CanStealer_Java_Stealer_v1
{
    meta:
        description = "CanStealer (cnstl) - Fake oyun piyasası Discord/Browser/Steam/Sonoyuncu/Craftrise stealer"
        author      = "Grok xAI - özel olarak bu kaynak kod için yazıldı"
        date        = "2026-03-11"
        version     = "1.0"
        reference   = "canstealer.com + gofile upload + 'yarrakin oglunun' mesajı"
        family      = "CanStealer"
        severity    = "critical"

    strings:
        // === EN KRİTİK VE ÖZEL İNDİKATÖRLER (zorunlu) ===
        $phrase     = "hey yarrakin oglunun dosyalarini cektim" ascii wide nocase
        $zip_name   = "cnstl.zip" ascii fullword
        $domain     = "canstealer.com" ascii wide
        $can_header = "=========<CAN Stealer>==========" ascii

        // === ÇOK ÖZGÜN EK İNDİKATÖRLER ===
        $gofile1    = "store2.gofile.io/uploadFile" ascii
        $gofile2    = "aHR0cHM6Ly9hcGkuZ29maWxlLmlvL3NlcnZlcnM=" ascii
        $mit1       = "aHR0cHM6Ly9jYW5zdGVhbGVyLmNvbS9taXQx" ascii
        $discord    = "dQw4w9WgXcQ:" ascii
        $yokki      = "Yokki" ascii fullword
        $screenshot = "screenshot.png" ascii fullword
        $sonoyuncu  = "sonoyuncu.txt" ascii
        $craftrise  = "Craftrise.txt" ascii
        $package    = "package 0.0.0.0;" ascii
        $kill_browsers = "taskkill /F /IM" ascii

        // Ekstra güvenilir string’ler (false positive’i sıfırlamak için)
        $YourSecretKey = "YourSecretKey123" ascii
        $OperaGX       = "Opera GX Stable" ascii
        $SteamLevel    = "Steam Level:" ascii

    condition:
        // Java class veya JAR dosyası olmalı
        (
            uint32(0) == 0xCAFEBABE or           // .class
            uint32(0) == 0x504B0304              // ZIP/JAR
        )
        and
        // ZORUNLU 4 İNDİKATÖR (en düşük false-positive kombinasyonu)
        $phrase
        and $zip_name
        and $domain
        and $can_header
        and
        // Ekstra en az 4 destekleyici string (çok yüksek kesinlik)
        4 of (
            $gofile1, $gofile2, $mit1, $discord,
            $yokki, $screenshot, $sonoyuncu,
            $craftrise, $package, $YourSecretKey,
            $kill_browsers, $OperaGX, $SteamLevel
        )
}
