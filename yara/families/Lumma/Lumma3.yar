rule STEALER_Lumma_Core_2026
{
    meta:
        description = "Lumma Stealer core detection (2026 build, syscall + browser artifacts)"
        author = "Anti-Stealer Samuray"
        family = "Lumma"
        confidence = "high"
        reference = "FLOSS + tria.ge analysis"

    strings:
        /* Browser & credential artifacts */
        $b1 = "key4.db" ascii
        $b2 = "logins.json" ascii
        $b3 = "cookies.sqlite" ascii
        $b4 = "formhistory.sqlite" ascii
        $b5 = "\\Local State" ascii

        /* Low-level syscall behavior */
        $s1 = "NtQueryVirtualMemory" ascii
        $s2 = "NtCreateThreadEx" ascii
        $s3 = "NtFreeVirtualMemory" ascii
        $s4 = "ntdll.dll" ascii

        /* Lumma-specific config markers */
        $c1 = "Build Date:" ascii
        $c2 = "Configuration:" ascii
        $c3 = "application/x-www-form-urlencoded" ascii

    condition:
        uint16(0) == 0x5A4D and
        (
            3 of ($b*) and
            2 of ($s*) and
            1 of ($c*)
        )
}
