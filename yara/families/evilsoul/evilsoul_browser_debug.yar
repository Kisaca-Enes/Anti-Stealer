rule EVILSOUL_NodeJS_Browser_Debug_Persistence
{
    meta:
        author = "No-Stealer Project"
        description = "Detects EvilSoul NodeJS browser hijack via DevTools + persistence watchdog"
        malware_family = "EvilSoul"
        category = "browser_hijack"
        confidence = "very-high"
        severity = "critical"
        date = "2026-01"

    strings:
        /* Chrome DevTools abuse */
        $dbg1 = "--remote-debugging-port" ascii
        $dbg2 = "webSocketDebuggerUrl" ascii
        $dbg3 = "Network.getAllCookies" ascii
        $dbg4 = "/json" ascii
        $dbg5 = "ws.on(\"message\"" ascii

        /* Headless launch */
        $head1 = "--headless" ascii
        $head2 = "--disable-extensions" ascii
        $head3 = "--no-sandbox" ascii
        $head4 = "about:blank" ascii

        /* Cookie decryption */
        $cookie1 = "encrypted_value" ascii
        $cookie2 = "createDecipheriv" ascii
        $cookie3 = "aes-256-gcm" ascii

        /* Startup persistence */
        $persist1 = "Start Menu\\Programs\\Startup" ascii
        $persist2 = "CreateShortcut" ascii
        $persist3 = ".lnk" ascii
        $persist4 = "wscript.exe" ascii
        $persist5 = ".vbs" ascii
        $persist6 = "WScript.Sleep 5000" ascii

        /* Roblox targeting */
        $rbx1 = ".ROBLOSECURITY=" ascii
        $rbx2 = "roblox.com/mobileapi/userinfo" ascii
        $rbx3 = "RobuxBalance" ascii

    condition:
        (
            2 of ($dbg*) and
            2 of ($head*) and
            2 of ($persist*) and
            1 of ($cookie*) and
            1 of ($rbx*)
        )
}
