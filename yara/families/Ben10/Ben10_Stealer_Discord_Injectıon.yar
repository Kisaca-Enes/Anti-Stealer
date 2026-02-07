rule STEALER_NodeJS_Ben10_Discord_Injection
{
    meta:
        author = "SOC / DFIR"
        description = "Detects Ben10 NodeJS Discord stealer via injection + token harvesting (disk & memory)"
        family = "Ben10_Stealer"
        tlp = "WHITE"
        reference = "Internal analysis"
        date = "2026-02-07"

    strings:
        /* === Family / Branding === */
        $ben1 = "Ben10 Discord Injection" ascii wide
        $ben2 = "@ben10grabber" ascii wide
        $ben3 = "Ben10 Injection" ascii wide
        $ben4 = "CRITICAL_PAYLOAD_ERROR" ascii

        /* === Discord Token & Crypto === */
        $tok1 = "dQw4w9WgXcQ:" ascii
        $tok2 = "aes-256-gcm" ascii
        $tok3 = "DPAPI" ascii

        /* === Electron / Discord Injection === */
        $inj1 = "discord_desktop_core" ascii
        $inj2 = "core.asar" ascii
        $inj3 = "BrowserWindow.getAllWindows" ascii
        $inj4 = "webContents.debugger.attach" ascii
        $inj5 = "Network.responseReceived" ascii

        /* === NodeJS Stealer Behaviour === */
        $node1 = "leveldb" ascii
        $node2 = "Local State" ascii
        $node3 = "os_crypt" ascii
        $node4 = "findLevelDBPaths" ascii
        $node5 = "decryptToken" ascii

        /* === Suspicious Webhook Usage === */
        $wh1 = "/api/webhooks/" ascii
        $wh2 = "canary.discord.com/api/webhooks" ascii

    condition:
        (
            /* Core family identity */
            1 of ($ben*)
            and

            /* Token theft logic */
            2 of ($tok*)
            and

            /* Discord injection behaviour */
            2 of ($inj*)
            and

            /* NodeJS stealer mechanics */
            2 of ($node*)
        )
        or
        (
            /* Memory-only fallback (sandbox / EDR) */
            $inj4 and $tok1 and $node1
        )
}
