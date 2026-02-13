rule Stealerium_NET_FullStealer_HighConfidence
{
    meta:
        author = "enes"
        family = "Stealerium"
        description = "Stealerium .NET infostealer with Telegram + GoFile exfil"
        confidence = "very high"
        reference = "memory dump + static strings"
        last_updated = "2026"

    strings:
        /* Identity */
        $id1 = "Stealerium - coded by @kgnfth" ascii wide
        $id2 = "ProductName" ascii wide
        $id3 = "Stealerium" ascii wide

        /* Costura packing */
        $c1 = "costura.icsharpcode.sharpziplib.dll.compressed" ascii
        $c2 = "costura.newtonsoft.json.dll.compressed" ascii
        $c3 = "costura.system.memory.dll.compressed" ascii

        /* Exfiltration */
        $e1 = "Uploading ZIP archive to GoFile" ascii wide
        $e2 = "https://{server}.gofile.io/" ascii
        $e3 = "/sendMessage?chat_id=" ascii
        $e4 = "/editMessageText?chat_id=" ascii

        /* Capabilities */
        $b1 = "Chrome\\User Data" ascii wide
        $b2 = "Discord\\Local Storage\\leveldb" ascii wide
        $b3 = "keylogger" ascii wide
        $b4 = "Clipboard" ascii wide
        $b5 = "WebcamScreenshot" ascii wide

        /* Anti-analysis */
        $a1 = "AntiAnalysis: Sandbox detected" ascii wide
        $a2 = "Virtual Machine detected" ascii wide
        $a3 = "virustotal-vm-blacklist" ascii

    condition:
        uint16(0) == 0x5A4D and
        (
            2 of ($id*) and
            2 of ($c*) and
            2 of ($e*) and
            2 of ($b*)
        )
}
