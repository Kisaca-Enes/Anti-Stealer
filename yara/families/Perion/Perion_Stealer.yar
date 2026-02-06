rule Perion_Stealer_NodeJS_Memory
{
    meta:
        description = "Detects Perion Stealer NodeJS malware in memory via anti-debug, encrypted addon loader, and C2 artefacts"
        author = "SOC Research"
        date = "2026-02-07"
        malware_family = "Perion"
        sample_type = "memory"
        confidence = "high"

    strings:
        /* C2 / Actor marker */
        $c2_telegram = "t.me/constc2" ascii wide

        /* Anti-debug / Anti-VM */
        $antivm_1 = "[System.Diagnostics.Debugger]::IsAttached" ascii
        $antivm_2 = "AntiVM passed - loading addons" ascii
        $antivm_3 = "VM detected - aborting" ascii
        $antivm_4 = "process.abort()" ascii

        /* Encrypted native addon loader */
        $addon_1 = "addon0.node.enc" ascii
        $addon_2 = "addon1.node.enc" ascii
        $addon_3 = "addon2.node.enc" ascii
        $addon_4 = "dpapi.node.enc" ascii
        $addon_5 = "addon-loader.js" ascii
        $addon_6 = "getRawAsset" ascii
        $addon_7 = "aes-256-cbc" ascii
        $addon_8 = "createDecipheriv" ascii
        $addon_9 = "ADDON-LOADER" ascii

        /* NodeJS / SEA runtime indicators */
        $node_1 = "node:sea" ascii
        $node_2 = "__commonJS" ascii
        $node_3 = "createRequire" ascii
        $node_4 = "process.env" ascii

        /* Anti-analysis process killing */
        $kill_1 = "Stop-Process -Id" ascii
        $kill_2 = "Get-Process | Where-Object" ascii
        $kill_3 = "KillProcessesByNames" ascii
        $kill_4 = "KillProcessesByWindowNames" ascii

    condition:
        /* Memory-only focused detection */
        uint16(0) != 0x5A4D and
        (
            /* Strong Perion fingerprint */
            $c2_telegram and
            2 of ($addon_*) and
            1 of ($antivm_*)
        )
        or
        (
            /* Generic but still Perion-leaning */
            2 of ($node_*) and
            2 of ($addon_*) and
            1 of ($kill_*)
        )
}
