rule Lina_Stealer_Wallet_Discord_Injection
{
    meta:
        description = "Detects Lina Stealer based on wallet injection, Discord injection, browser wallet harvesting and upload infrastructure"
        author = "Blue Team / DFIR"
        date = "2026-02-07"
        malware_family = "Lina Stealer"
        confidence = "high"
        reference = "defensive-detection"
        hash_scope = "disk_and_memory"

    strings:
        /* --- C2 / Upload Infrastructure --- */
        $dom1 = "linahook.com" ascii wide
        $dom2 = "/upload" ascii
        $dom3 = "/dc-injector" ascii
        $dom4 = "/download/atomic.asar" ascii
        $dom5 = "/download/exodus.asar" ascii
        $dom6 = "send-walletinj" ascii

        /* --- Discord Injection Artefacts --- */
        $disc1 = "discord_desktop_core" ascii wide
        $disc2 = "BetterDiscord" ascii wide
        $disc3 = "Local Storage\\leveldb" ascii wide
        $disc4 = "Zeroed out token database file" ascii

        /* --- Wallet Injection Targets --- */
        $w1 = "AtomicWallet" ascii wide
        $w2 = "Exodus" ascii wide
        $w3 = "app.asar" ascii wide
        $w4 = "walletInjection" ascii

        /* --- Browser Wallet Extension Paths (high-signal set) --- */
        $ext1 = "Local Extension Settings\\nkbihfbeogaeaoehlefnkodbefgpgknn" ascii wide // MetaMask
        $ext2 = "Local Extension Settings\\egjidjbpglichdcondbcbdnbeeppgdph" ascii wide // Trust
        $ext3 = "Local Extension Settings\\bfnaelmomeimhlpmgjnjophhpkkoljpa" ascii wide // Phantom
        $ext4 = "Local Extension Settings\\hnfanknocfeofbddgcijnmhnfnkdnaad" ascii wide // Coinbase
        $ext5 = "Local Extension Settings\\fhilaheimglignddkjgofkcbgekhenbh" ascii wide // Atomic

        /* --- Browser Targets --- */
        $br1 = "Opera GX Stable" ascii wide
        $br2 = "Brave-Browser\\User Data" ascii wide
        $br3 = "Google\\Chrome\\User Data" ascii wide
        $br4 = "Microsoft\\Edge\\User Data" ascii wide

        /* --- Credential / DPAPI Abuse --- */
        $dp1 = "ProtectedData]::Unprotect" ascii
        $dp2 = "powershell -NoProfile -ExecutionPolicy Bypass" ascii

        /* --- Process Termination Before Theft --- */
        $k1 = "taskkill /F /IM Discord.exe" ascii
        $k2 = "taskkill /IM Steam.exe /F" ascii
        $k3 = "taskkill /IM javaw.exe /F" ascii

        /* --- NodeJS Stealer Indicators --- */
        $n1 = "adm-zip" ascii
        $n2 = "form-data" ascii
        $n3 = "axios.post" ascii
        $n4 = "data.zip" ascii
        $n5 = "cache.json" ascii

    condition:
        /* Strong infra + injection */
        (1 of ($dom*) and 2 of ($disc*)) or

        /* Wallet injection behaviour */
        (2 of ($w*) and 1 of ($dom*)) or

        /* Browser wallet harvesting */
        (2 of ($ext*) and 1 of ($br*)) or

        /* DPAPI + PowerShell abuse */
        (1 of ($dp*) and 1 of ($br*)) or

        /* NodeJS stealer packing & exfil */
        (2 of ($n*) and 1 of ($dom*)) or

        /* Kill + Injection combo */
        (1 of ($k*) and 1 of ($disc*) and 1 of ($dom*))
}
