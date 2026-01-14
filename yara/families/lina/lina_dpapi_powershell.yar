rule lina_dpapi_powershell
{
    meta:
        author = "No-Stealer Project"
        description = "Detects DPAPI decryption via PowerShell (stealer behavior)"
        confidence = "very high"

    strings:
        $p1 = "ProtectedData]::Unprotect" ascii
        $p2 = "DataProtectionScope]::CurrentUser" ascii
        $p3 = "powershell -NoProfile -ExecutionPolicy Bypass" ascii
        $p4 = "Convert]::FromBase64String" ascii

    condition:
        all of them
}
