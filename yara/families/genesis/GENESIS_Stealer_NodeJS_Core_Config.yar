rule GENESIS_Stealer_NodeJS_Core_Config
{
    meta:
        author = "No-Stealer Project"
        description = "Detects Genesis Stealer via hardcoded config, browser paths, wallets, Minecraft and exfil APIs"
        family = "Genesis Stealer"
        language = "NodeJS"
        confidence = "very_high"
        date = "2026-01"

    strings:
        /* Genesis specific branding / keys */
        $g1 = "GenesisSociety"
        $g2 = "KEY: dQw4w9WgXcQ"
        $g3 = "_genesis_"
        $g4 = "GENESIS_MINECRAFT"

        /* Discord exfiltration */
        $dc1 = "discord.com/api/webhooks"
        $dc2 = "WEBHOOK_URL_PLACEHOLDER"
        $dc3 = "_tokens.txt"
        $dc4 = "_cookies.txt"
        $dc5 = "_passwords.txt"

        /* Browser credential theft */
        $br1 = "Login Data"
        $br2 = "Web Data"
        $br3 = "Local State"
        $br4 = "SELECT origin_url, username_value, password_value"
        $br5 = "SELECT host_key, name, value, encrypted_value"

        /* Chromium / Firefox paths */
        $bp1 = "\\Google\\Chrome\\User Data"
        $bp2 = "\\Microsoft\\Edge\\User Data"
        $bp3 = "\\Opera Software\\Opera GX Stable"
        $bp4 = "\\Mozilla\\Firefox\\Profiles"

        /* Wallet extensions */
        $w1 = "nkbihfbeogaeaoehlefnkodbefgpgknn" // Metamask
        $w2 = "aholpfdialjgjfhomihkjbmgjidlcdno" // Exodus
        $w3 = "fhilaheimglignddkjgofkcbgekhenbh" // Atomic
        $w4 = "Coinomi"

        /* Minecraft / Lunar */
        $mc1 = ".minecraft"
        $mc2 = "launcher_profiles.json"
        $lc1 = ".lunarclient"
        $lc2 = "accounts.json"
        $lc3 = "settings.json"

        /* WiFi & system recon */
        $sys1 = "netsh wlan show profiles"
        $sys2 = "key=clear"
        $sys3 = "Get-MpComputerStatus"
        $sys4 = "Get-WmiObject Win32_VideoController"

        /* External APIs */
        $api1 = "ip-api.com/json"
        $api2 = "api.gofile.io/getServer"
        $api3 = "gofile.io/uploadFile"

        /* NodeJS runtime indicators */
        $js1 = "require('fs')"
        $js2 = "require('child_process')"
        $js3 = "require('sqlite3')"
        $js4 = "adm-zip"

    condition:
        (
            1 of ($g*) and
            2 of ($dc*) and
            3 of ($br*) and
            1 of ($bp*) and
            1 of ($w*) and
            1 of ($mc*) and
            1 of ($lc*) and
            2 of ($sys*) and
            1 of ($api*) and
            2 of ($js*)
        )
}
