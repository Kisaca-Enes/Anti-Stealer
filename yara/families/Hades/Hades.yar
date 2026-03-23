rule TR_HadesStealer_FakeLaunchers_KEstane_KittiesCraft_2026
{
    meta:
        description = "Turkish fake game / fake streaming launcher campaign with Hades Stealer (MYTH subvariant) indicators"
        author      = "Enes(Nullsans)"
        reference   = "KEstane / Kitties Craft / Hades Stealer / MYTH-derived fake launcher campaign"
        date        = "2026-03-23"
        malware     = "Hades Stealer / MYTH subvariant"
        campaign    = "KEstane / Kitties Craft fake launchers"
        severity    = "critical"
        hash        = "4e20d955dab6db6046a2f8f3368faf5a242464dc89ea1050bdb3535d13c7902c"
        confidence  = "high"

    strings:
        //
        // Campaign / branding
        //
        $brand1 = "KEstane A" ascii wide nocase
        $brand2 = "KittyesCraftLauncher" ascii wide nocase
        $brand3 = "Kitties Craft" ascii wide nocase
        $brand4 = "KITTY ASSISTANT" ascii wide nocase fullword
        $brand5 = "EvoriInstaller" ascii wide nocase

        //
        // Lures / fake products
        //
        $lure1  = "Minecraft Launcher Setup" ascii wide nocase
        $lure2  = "Chill Out VRChat" ascii wide nocase
        $lure3  = "2D Adventure" ascii wide nocase
        $lure4  = "2D WORLD" ascii wide nocase
        $lure5  = "Watch to TV Setup" ascii wide nocase
        $lure6  = "WatchToTV" ascii wide nocase

        //
        // Electron / fake installer UI behavior
        //
        $ipc1   = "ipcRenderer.send('hide-me')" ascii wide
        $ipc2   = "ipcRenderer.send('install-complete')" ascii wide
        $ui1    = "progress += stepIncrement" ascii wide
        $ui2    = "progress += increment" ascii wide
        $ui3    = "addChat(" ascii wide
        $ui4    = "addNpcMsg(" ascii wide
        $ui5    = "MEOW! I'm Kitty Assistant" ascii wide nocase
        $ui6    = "Ben Kitty Assistant" ascii wide nocase
        $ui7    = "Electron" ascii wide nocase

        //
        // Turkish UI / social engineering
        //
        $tr1    = "Kurulum ba" ascii wide nocase
        $tr2    = "İleri" ascii wide
        $tr3    = "KABUL ET" ascii wide fullword
        $tr4    = "OYUNA BAŞLA" ascii wide nocase

        //
        // NSIS wrapper
        //
        $nsis1  = "Nullsoft.NSIS.exehead" ascii wide
        $nsis2  = "Nullsoft Install System v3.04" ascii wide
        $nsis3  = "Error launching installer" ascii wide
        $nsis4  = "Installer integrity check has failed" ascii wide
        $nsis5  = "Please wait while Setup is loading..." ascii wide
        $nsis6  = "verifying installer: %d%%" ascii wide

        //
        // Hades / exfil / static C2
        //
        $c2_1   = "api.hdstlr.net" ascii wide nocase
        $c2_2   = "api.hdstlr.net/capture" ascii wide nocase
        $c2_3   = "hdstlr.net" ascii wide nocase
        $c2_4   = "sys_win_240.png" ascii wide nocase
        $c2_5   = "X-Build-ID" ascii wide
        $c2_6   = "X-API-KEY" ascii wide

        //
        // Screenshot / PS / .NET exfil
        //
        $ps1    = "System.Windows.Forms.Screen" ascii wide
        $ps2    = "Drawing.Bitmap" ascii wide
        $ps3    = "Graphics.FromImage" ascii wide
        $ps4    = "CopyFromScreen" ascii wide
        $ps5    = "ToBase64String" ascii wide
        $ps6    = "ConvertTo-Json -Compress" ascii wide

        //
        // Exfil body fragments
        //
        $json1  = "\"image\"" ascii wide
        $json2  = "\"buildId\"" ascii wide

        //
        // Raw byte IOC
        //
        $c2_bytes = { 68 74 74 70 73 3A 2F 2F 61 70 69 2E 68 64 73 74 6C 72 2E 6E 65 74 }

    condition:
        (
            //
            // BRANCH 1:
            // Fake launcher / installer themed sample
            //
            (
                uint16(0) == 0x5A4D or
                1 of ($ui7, $ipc1, $ipc2)
            )
            and
            (
                1 of ($brand*) or
                2 of ($lure*)
            )
            and
            (
                1 of ($nsis*) or
                2 of ($ipc*, $ui*)
            )
            and
            (
                1 of ($c2_1, $c2_2, $c2_3, $c2_4, $c2_5, $c2_6)
            )
        )
        or
        (
            //
            // BRANCH 2:
            // Strong Hades C2 + exfil behavior (packed/unpacked payloads)
            //
            (
                2 of ($c2_1, $c2_2, $c2_3, $c2_4, $c2_5, $c2_6)
                or
                ($c2_1 and 1 of ($c2_4, $c2_5, $c2_6))
            )
            and
            (
                2 of ($ps*) or
                $c2_bytes
            )
            and
            (
                1 of ($json*) or
                1 of ($brand*)
            )
        )
        or
        (
            //
            // BRANCH 3:
            // Small script-like / stage payload logic without size dependency
            //
            (
                uint8(0) == 0x23 or
                uint16(0) == 0x2323 or
                1 of ($ps1, $ps4, $c2_2)
            )
            and
            (
                1 of ($c2_1, $c2_2, $c2_3)
            )
            and
            (
                2 of ($ps*)
            )
        )
}
