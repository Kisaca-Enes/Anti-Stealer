rule lina_stealer_node_core
{
    meta:
        author = "No-Stealer Project"
        family = "Lina Stealer"
        description = "Detects Lina Stealer core behavior in Node.js malware"
        date = "2026-01-14"
        language = "JavaScript"
        confidence = "high"

    strings:
        /* ZIP + exfil */
        $zip1 = "new AdmZip" ascii
        $zip2 = "addLocalFolder" ascii
        $zip3 = "writeZip" ascii
        $zip4 = "All_Wallets.zip" ascii

        /* Upload */
        $up1 = "FormData()" ascii
        $up2 = "axios.post" ascii
        $up3 = "/upload" ascii

        /* Environment paths */
        $env1 = "process.env.LOCALAPPDATA" ascii
        $env2 = "process.env.APPDATA" ascii

        /* Process kill */
        $kill1 = "taskkill /IM Steam.exe /F" ascii
        $kill2 = "taskkill /F /IM" ascii

    condition:
        uint16(0) == 0x3f3f or
        (
            all of ($zip*) and
            2 of ($up*) and
            1 of ($env*) and
            1 of ($kill*)
        )
}
