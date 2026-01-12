rule EvilSoul_New_Stealer_Static
{
    meta:
        description = "EvilSoul NEW stealer - VBS persistence + ZIP exfil + webhook logging"
        author = "No-Stealer Project"
        family = "EvilSoul"
        confidence = "high"
        date = "2026-01-12"

    strings:
        /* Persistence via Startup + VBS */
        $s1 = "Start Menu\\Programs\\Startup" ascii wide
        $s2 = "WScript.CreateObject(\"WScript.Shell\")" ascii wide
        $s3 = "CreateShortcut" ascii wide
        $s4 = "wscript.exe" ascii wide
        $s5 = "WScript.Sleep 5000" ascii wide

        /* ZIP staging */
        $z1 = "archiver(\"zip\"" ascii
        $z2 = "ZipDirectory" ascii
        $z3 = ".zip" ascii wide

        /* Exfil / upload */
        $e1 = "store8.gofile.io/uploadFile" ascii
        $e2 = "axios.post" ascii
        $e3 = "discord.com/api/webhooks" ascii wide

        /* Fake error VBS */
        $f1 = "DLL Error" ascii wide
        $f2 = "0x8007007E" ascii wide
        $f3 = "kernel32.dll" ascii wide

    condition:
        uint16(0) == 0x5A4D and
        (
            /* Persistence core */
            (3 of ($s*)) and
            /* Exfil logic */
            (2 of ($e*)) and
            /* ZIP staging */
            (2 of ($z*))
        )
}
