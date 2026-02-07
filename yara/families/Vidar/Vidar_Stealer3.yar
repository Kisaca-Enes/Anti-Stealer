rule Vidar_Infostealer_Static_Memory
{
    meta:
        description = "Detects Vidar Infostealer based on memory/static strings and behavior artifacts"
        author = "you"
        date = "2026-02-07"
        malware_family = "Vidar"
        reference = "internal analysis"
        confidence = "high"

    strings:
        /* Vidar-characteristic function / code markers */
        $code1 = "UAWAVAUATVWSH" ascii
        $code2 = "AWAVAUATVWUSH" ascii
        $code3 = "AVVWSH" ascii
        $code4 = "UVWSPH" ascii

        /* Browser & extension data targets */
        $browser1 = "\\logins.json" ascii
        $browser2 = "Local Extension Settings" ascii
        $browser3 = "Sync Extension Settings" ascii
        $browser4 = "IndexedDB" ascii
        $browser5 = "chrome-extension_" ascii

        /* Vidar task / module naming */
        $task1 = "Wallet Rules" ascii
        $task2 = "File Grabber Rules" ascii
        $task3 = "Loader Tasks" ascii

        /* Anti-debug / system discovery APIs */
        $api1 = "IsDebuggerPresent" ascii
        $api2 = "CheckRemoteDebuggerPresent" ascii
        $api3 = "GetLogicalDriveStringsA" ascii
        $api4 = "OpenDesktopA" ascii

        /* Hex / magic markers */
        $hex1 = { DE AD BE EF }
        $hex2 = { 00 09 06 00 00 09 06 00 }

    condition:
        (
            2 of ($code*) and
            2 of ($browser*) and
            1 of ($task*)
        )
        or
        (
            1 of ($code*) and
            2 of ($api*) and
            $hex1
        )
}
