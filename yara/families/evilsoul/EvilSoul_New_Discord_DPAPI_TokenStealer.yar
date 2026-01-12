rule EvilSoul_New_Discord_DPAPI_TokenStealer
{
    meta:
        description = "EvilSoul NEW - Discord token stealer using DPAPI and Chrome Local State"
        author = "No-Stealer Project"
        family = "EvilSoul"
        module = "Discord / DPAPI"
        confidence = "very high"
        date = "2026-01-12"

    strings:
        /* Chrome / Chromium DPAPI */
        $dp1 = "Local State" ascii wide
        $dp2 = "os_crypt" ascii
        $dp3 = "encrypted_key" ascii
        $dp4 = "ProtectedData]::Unprotect" ascii
        $dp5 = "powershell.exe Add-Type -AssemblyName System.Security" ascii

        /* Discord token patterns */
        $dt1 = "dQw4w9WgXcQ:" ascii
        $dt2 = "aes-256-gcm" ascii
        $dt3 = "discord.com/api/v9/users/@me" ascii
        $dt4 = "authorization: result.token" ascii
        $dt5 = "mfa." ascii

        /* Token harvesting paths */
        $fs1 = "Local Storage\\leveldb" ascii wide
        $fs2 = ".log" ascii
        $fs3 = ".ldb" ascii

    condition:
        uint16(0) == 0x5A4D and
        (
            /* DPAPI key extraction */
            (3 of ($dp*)) and
            /* Discord token logic */
            (2 of ($dt*)) and
            /* LevelDB scraping */
            (2 of ($fs*))
        )
}
