rule STEALER_Lumma_Behavioral
{
    meta:
        description = "Behavioral detection for Lumma-like stealers"
        author = "Anti-Stealer Samuray"
        confidence = "medium-high"

    strings:
        $dpapi = "dpapi.dll" ascii
        $wmi1  = "ROOT\\CIMV2" ascii
        $wmi2  = "SELECT * FROM Win32_BIOS" ascii
        $wmi3  = "SerialNumber" ascii

        $sys1  = "NtQueryVirtualMemory" ascii
        $sys2  = "ReadProcessMemory" ascii

    condition:
        uint16(0) == 0x5A4D and
        all of ($wmi*) and
        $dpapi and
        1 of ($sys*)
}
