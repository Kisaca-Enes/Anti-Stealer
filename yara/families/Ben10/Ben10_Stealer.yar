rule STEALER_NodeJS_Ben10_Omnitrix_MultiStealer
{
    meta:
        author = "SOC / DFIR"
        description = "Detects Ben10 (Omnitrix) NodeJS multi-stealer via Discord injection, wallet & session harvesting"
        family = "Ben10_Stealer"
        malware_type = "Credential Stealer"
        tlp = "WHITE"
        date = "2026-02-07"

    strings:
        /* === Family Identity === */
        $id1 = "Omnitrix Scanner v3.0" ascii wide
        $id2 = "@ben10grabber" ascii wide
        $id3 = "Omnitrix Identity Harvest" ascii wide
        $id4 = "Hardware Authenticated" ascii wide
        $id5 = "Ben10 Discord Injection" ascii wide

        /* === Discord Token / API === */
        $disc1 = "dQw4w9WgXcQ:" ascii
        $disc2 = "discord.com/api/v9/users/@me/billing/payment-sources" ascii
        $disc3 = "discord.com/api/v10/users" ascii
        $disc4 = "core.asar" ascii
        $disc5 = "discord_desktop_core" ascii

        /* === Crypto / Decryption === */
        $crypt1 = "aes-256-gcm" ascii
        $crypt2 = "pbkdf2Sync" ascii
        $crypt3 = "DPAPI" ascii

        /* === Wallet & Session Theft === */
        $wal1 = ".ROBLOSECURITY" ascii
        $wal2 = "loginusers.vdf" ascii
        $wal3 = "launcher_profiles.json" ascii
        $wal4 = "seed.seco" ascii
        $wal5 = "Exodus" ascii

        /* === Exfiltration === */
        $exf1 = "gofile.io" ascii
        $exf2 = "tmpfiles.org" ascii
        $exf3 = "/api/webhooks/" ascii

    condition:
        (
            /* Strong family match */
            2 of ($id*)
            and
            /* Discord token logic */
            2 of ($disc*)
            and
            /* Stealer crypto */
            1 of ($crypt*)
            and
            /* Multi-platform theft */
            2 of ($wal*)
        )
        or
        (
            /* Memory-only fallback (EDR / Sandbox) */
            $id1 and $disc1 and $wal1
        )
}
