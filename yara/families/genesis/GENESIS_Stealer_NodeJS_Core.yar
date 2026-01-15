rule GENESIS_Stealer_NodeJS_Core
{
    meta:
        author = "No-Stealer Project"
        description = "Detects Genesis Stealer Node.js core (browser kill, headless chrome, AES-GCM decrypt)"
        family = "Genesis Stealer"
        language = "NodeJS"
        confidence = "high"
        date = "2026-01"

    strings:
        /* Headless browser & remote debug */
        $dbg1 = "--remote-debugging-port=9222"
        $dbg2 = "--headless"
        $dbg3 = "--disable-gpu"
        $dbg4 = "--no-sandbox"

        /* Chrome / Edge paths */
        $chrome1 = "Google\\Chrome\\User Data"
        $edge1   = "Microsoft\\Edge\\User Data"
        $localst = "Local State"

        /* AES-GCM Chrome cookie decrypt */
        $aes1 = "aes-256-gcm"
        $aes2 = "createDecipheriv"
        $aes3 = "v10"
        $aes4 = "v11"

        /* Process killing */
        $tk1 = "taskkill /F /IM"
        $tk2 = "tasklist"

        /* User enumeration */
        $usr1 = "C:\\\\Users"

        /* Node.js indicators */
        $node1 = "child_process"
        $node2 = "crypto.createDecipheriv"
        $node3 = "fs.readdirSync"
        $node4 = "spawn("

    condition:
        uint16(0) == 0x5a4d or
        (
            5 of ($dbg*) and
            2 of ($aes*) and
            1 of ($usr*) and
            2 of ($node*) and
            any of ($tk*)
        )
}

