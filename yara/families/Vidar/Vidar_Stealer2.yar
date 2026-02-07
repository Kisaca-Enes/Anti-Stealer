rule Vidar_Stealer {
    meta:
        description = "Vidar Stealer memory dump indicators"
        author = "Enes"
        date = "2026-02-07"
        version = "1.0"

    strings:
        $s1 = "UAWAVAUATVWSH"
        $s2 = "AWAVAUATVWUSH"
        $s3 = "AVVWSH"
        $s4 = "UVWSPH"
        $s5 = "McD$<C"
        $s6 = "IcD$<A"
        $s7 = "Fp)~tH"
        $s8 = "C:\\ProgramData\\"
        $s9 = "%LOCALAPPDATA%"
        $s10 = "%APPDATA%"
        $hex1 = { DE AD BE EF }
        $hex2 = { 00 08 E2 00 00 08 E2 00 }

    condition:
        3 of ($s*) or 1 of ($hex*)
}
