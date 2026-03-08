rule EvilSoul_Stealer_NodeJS_2025_2026
{
    meta:
        description      = "Detects Evil Soul Stealer - Node.js based multi-browser/session infostealer with strong evasion, Discord webhook exfil, Python Chrome decryptor"
        author           = "Based on source code analysis 2025-2026 samples"
        reference        = "Evil Soul Discord stealer, Brazilian origin campaigns"
        date             = "2026-03"
        malware_family   = "EvilSoul"
        severity         = "HIGH"
        mitre_attack     = "T1555.003, T1555.004, T1113, T1567.002, T1562.001, T1547.001"
        note             = "Targets wide browser list, app-bound key decryption, Defender exclusions, fake service names"

    strings:

        // ────────────────────────────────────────────────
        // En güçlü & spesifik imza - config key (değişmesi zor)
        // ────────────────────────────────────────────────
        $key_evilweekly  = "EVIL-WEEKLY-F59A9F0B42B3" ascii wide fullword

        // Discord webhook (örneklerden biri - varyantlarda değişebilir ama sık görülüyor)
        $webhook_pat1    = "https://discord.com/api/webhooks/1432055166512664718/" ascii
        $webhook_pat2    = "https://canary.discord.com/api/webhooks/1424613285348642816/" ascii

        // ────────────────────────────────────────────────
        // Çok geniş browser / profile listesi (nadir görülen detay seviyesi)
        // ────────────────────────────────────────────────
        $b1 = "\\Google\\Chrome SxS\\User Data\\" ascii
        $b2 = "\\Google\\Chrome\\User Data\\Profile 5\\" ascii
        $b3 = "\\BraveSoftware\\Brave-Browser\\User Data\\Guest Profile\\" ascii
        $b4 = "\\Yandex\\YandexBrowser\\User Data\\Profile 5\\" ascii
        $b5 = "\\Microsoft\\Edge\\User Data\\Guest Profile\\" ascii
        $b6 = "\\Opera Software\\Opera GX Stable\\Profile 5\\" ascii
        $b7 = "\\7Star\\7Star\\User Data\\" ascii
        $b8 = "\\Kometa\\User Data\\" ascii
        $b9 = "\\Orbitum\\User Data\\" ascii
        $b10= "\\CentBrowser\\User Data\\" ascii

        // ────────────────────────────────────────────────
        // Evasion & anti-analysis imzaları
        // ────────────────────────────────────────────────
        $ev1 = "DisableProtections" ascii fullword
        $ev2 = "DefenderExclusions" ascii fullword
        $ev3 = "Add-MpPreference -ExclusionPath 'C:\\'" ascii
        $ev4 = "Set-MpPreference -DisableRealtimeMonitoring $true" ascii
        $ev5 = "sc config WinDefend start= disabled" ascii
        $ev6 = "GenLegitNames" ascii fullword
        $ev7 = "Windows System Helper" ascii
        $ev8 = "Runtime Broker Service" ascii
        $ev9 = "Background Tasks Host" ascii
        $ev10= "ObfuscateMemory" ascii fullword

        // ────────────────────────────────────────────────
        // Chrome decryption v20 / app-bound encrypted key parçaları
        // (2024-2026 Chrome sürümlerinde görülen yeni yöntem)
        // ────────────────────────────────────────────────
        $chr1 = "app_bound_encrypted_key" ascii fullword
        $chr2 = "os_crypt\" : { \"app_bound_encrypted_key" ascii
        $chr3 = "derive_v20_master_key" ascii
        $chr4 = "parse_key_blob" ascii
        $chr5 = "impersonate_lsass" ascii
        $chr6 = "decrypt_with_cng" ascii
        $chr7 = "NCryptOpenStorageProvider" ascii
        $chr8 = "Microsoft Software Key Storage Provider" ascii
        $chr9 = "Google Chromekey1" ascii
        $chr10= "byte_xor" ascii fullword

        // AES / ChaCha20 sabit anahtarlar (flag 1,2,3)
        $aes1 = "B31C6E241AC846728DA9C1FAC4936651CFFB944D143AB816276BCC6DA0284787" ascii nocase
        $aes2 = "E98F37D7F4E1FA433D19304DC2258042090E2D1D7EEA7670D41F738D08729660" ascii nocase
        $aes3 = "CCF8A1CEC56605B8517552BA1A2D061C03A29E90274FB2FCF59BA4B75C392390" ascii nocase

        // ────────────────────────────────────────────────
        // Diğer karakteristik fonksiyon / string'ler
        // ────────────────────────────────────────────────
        $f1  = "GetSessions" ascii fullword
        $f2  = "ExodusSession" ascii
        $f3  = "SessionRoblox" ascii
        $f4  = "SteamSession" ascii
        $f5  = "MinecraftSession" ascii
        $f6  = "ChromePython" ascii fullword
        $f7  = "operaPasswords" ascii fullword
        $f8  = "GetCreditCards" ascii fullword
        $f9  = "GetAutoFills" ascii fullword
        $f10 = "DownloadPanel" ascii fullword
        $f11 = "FakeError" ascii fullword
        $f12 = "rushwtf" ascii fullword          // muhtemelen obfuscated evasion fonksiyonu
        $f13 = "breaking" ascii fullword

        // Log / error toplama paternleri
        $log1 = "logs += `" ascii
        $log2 = "Computer Name: ${os.userInfo().username}" ascii

    condition:

        // En yüksek doğruluk (kritik imza kombinasyonları)

        // 1. En güçlü koşul: config anahtarı + app-bound decryption
        ($key_evilweekly or 1 of ($webhook_pat*)) and 3 of ($chr*)

        or

        // 2. Geniş browser listesi + evasion + chrome v20 decryption
        (
            6 of ($b*) and
            4 of ($ev*) and
            2 of ($chr*)
        )

        or

        // 3. Sabit AES/ChaCha/XOR key'lerden en az biri + evasion fonksiyonları
        (
            1 of ($aes*) and
            3 of ($ev*) and
            2 of ($f*)
        )

        or

        // 4. Session stealer + credit card + autofill + opera + python injector
        (
            all of ($f1,$f2,$f3,$f4,$f5) and
            3 of ($f6,$f7,$f8,$f9,$f10) and
            2 of ($ev*)
        )

        or

        // 5. Çok geniş ama hala anlamlı fallback (obfuscated varyantlar için)
        (
            2 of ($key_evilweekly, $webhook_pat*, $aes*) and
            5 of ($ev*, $chr*, $f*, $b*, $log*) and
            filesize < 800KB
        )

        // Tipik Node.js stealer boyutu aralığı
        and filesize < 1MB and filesize > 40KB
}
