rule TR_FakeGameLauncher_HadesStealer_KEstane_KittiesCraft_2026
{
    meta:
        description = "Turkish fake game launcher / installer campaign (KEstane A / Kitties Craft / KittyesCraftLauncher) with Hades Stealer indicators, NSIS/Electron wrapper and screenshot exfil traits"
        author      = "Enes(Nullsans)"
        reference   = "Hades / fake Electron+NSIS launcher campaign - Minecraft/VRChat/2D/WatchToTV themed"
        date        = "2026-03-22"
        malware     = "Hades Stealer variant / fake game launcher"
        campaign    = "KEstane / Kitties Craft fake launchers"
        severity    = "critical"
        hash        = "4e20d955dab6db6046a2f8f3368faf5a242464dc89ea1050bdb3535d13c7902c"
        tlp         = "clear"
        confidence  = "high"

    strings:
        //
        // Campaign / builder / branding indicators
        //
        $brand1 = "KEstane A" ascii wide nocase
        $brand2 = "KittyesCraftLauncher" ascii wide nocase
        $brand3 = "Kitties Craft" ascii wide nocase
        $brand4 = "KITTY ASSISTANT" ascii wide nocase fullword
        $brand5 = "EvoriInstaller" ascii wide nocase

        //
        // Fake game / installer lure names
        //
        $lure1 = "Minecraft Launcher Setup" ascii wide nocase
        $lure2 = "Chill Out VRChat" ascii wide nocase
        $lure3 = "2D Adventure" ascii wide nocase
        $lure4 = "2D WORLD" ascii wide nocase
        $lure5 = "Watch to TV Setup" ascii wide nocase

        //
        // Electron / renderer IPC / fake installer UI logic
        //
        $ipc1  = "ipcRenderer.send('hide-me')" ascii wide
        $ipc2  = "ipcRenderer.send('install-complete')" ascii wide
        $ui1   = "progress += stepIncrement" ascii wide
        $ui2   = "progress += increment" ascii wide
        $ui3   = "addChat(" ascii wide
        $ui4   = "addNpcMsg(" ascii wide
        $ui5   = "MEOW! I'm Kitty Assistant" ascii wide nocase
        $ui6   = "Ben Kitty Assistant" ascii wide nocase
        $ui7   = "Electron" ascii wide nocase

        //
        // Turkish-targeted UI strings
        //
        $tr1   = "Kurulum ba" ascii wide nocase
        $tr2   = "İleri" ascii wide
        $tr3   = "KABUL ET" ascii wide fullword
        $tr4   = "OYUNA BAŞLA" ascii wide nocase

        //
        // NSIS wrapper indicators
        //
        $nsis1 = "Nullsoft.NSIS.exehead" ascii wide
        $nsis2 = "Nullsoft Install System v3.04" ascii wide
        $nsis3 = "Error launching installer" ascii wide
        $nsis4 = "Installer integrity check has failed" ascii wide
        $nsis5 = "Please wait while Setup is loading..." ascii wide
        $nsis6 = "verifying installer: %d%%" ascii wide

        //
        // Hades Stealer C2 / exfil indicators
        //
        $c2_1  = "api.hdstlr.net" ascii wide nocase
        $c2_2  = "api.hdstlr.net/capture" ascii wide nocase
        $c2_3  = "sys_win_240.png" ascii wide nocase
        $c2_4  = "X-Build-ID" ascii wide
        $c2_5  = "X-API-KEY" ascii wide

        //
        // Screenshot capture / PowerShell / .NET traits
        //
        $ps1   = "System.Windows.Forms.Screen" ascii wide
        $ps2   = "Drawing.Bitmap" ascii wide
        $ps3   = "Graphics.FromImage" ascii wide
        $ps4   = "CopyFromScreen" ascii wide
        $ps5   = "ToBase64String" ascii wide
        $ps6   = "ConvertTo-Json -Compress" ascii wide

        //
        // JSON / exfil body fragments
        //
        $json1 = "\"image\" =" ascii wide
        $json2 = "\"buildId\"" ascii wide

        //
        // Byte-level URL fragment for stronger C2 anchoring
        //
        $c2_bytes = { 68 74 74 70 73 3A 2F 2F 61 70 69 2E 68 64 73 74 6C 72 2E 6E 65 74 2F 63 61 70 74 75 72 65 } // https://api.hdstlr.net/capture

    condition:
        (
            // Branch 1: PE/NSIS fake launcher with strong campaign + Hades correlation
            uint16(0) == 0x5A4D and
            filesize < 20MB and

            // Must look like campaign branding / builder
            1 of ($brand*) and

            // Must contain lure or fake UI flow
            (
                1 of ($lure*) or
                2 of ($ipc*, $ui*)
            ) and

            // Must look like NSIS/Electron wrapper
            (
                2 of ($nsis*) or
                (1 of ($nsis1, $nsis2) and $ui7)
            ) and

            // Must contain strong Hades-specific indicators
            2 of ($c2_1, $c2_2, $c2_3, $c2_4, $c2_5) and

            // Add localization or UI behavior correlation to reduce FP
            (
                2 of ($tr*) or
                2 of ($ipc*, $ui*)
            )
        )
        or
        (
            // Branch 2: Script/PS payload or unpacked component with screenshot exfil logic
            filesize < 800KB and

            // Script-ish or text-ish start, or strong textual indicators inside small file
            (
                uint8(0) == 0x23 or       // '#'
                uint16(0) == 0x2323 or    // '##'
                1 of ($c2_2, $ps1, $ps4)
            ) and

            // Strong Hades C2 correlation
            2 of ($c2_2, $c2_3, $c2_4, $c2_5) and

            // Screenshot / exfil logic
            3 of ($ps*) and

            // URL bytes or JSON body fragments
            (
                $c2_bytes or
                1 of ($json*)
            )
        )
}
