rule EVILSOUL_NodeJS_Stealer_New
{
    meta:
        author = "No-Stealer Project"
        description = "Detects EvilSoul NodeJS Discord & Browser Stealer (New)"
        malware_family = "EvilSoul"
        date = "2026-01"
        severity = "high"

    strings:
        /* Discord token patterns */
        $token1 = /mfa\.[\w-]{84}/
        $token2 = /[\w-]{24}\.[\w-]{6}\.[\w-]{27}/
        $token3 = "dQw4w9WgXcQ:" ascii

        /* Discord API usage */
        $api1 = "https://discord.com/api/v9/users/@me" ascii
        $api2 = "https://discord.com/api/v10/users/" ascii

        /* Browser credential theft */
        $chromium1 = "Local State" ascii
        $chromium2 = "Login Data" ascii
        $chromium3 = "Web Data" ascii
        $chromium4 = "os_crypt" ascii
        $chromium5 = "encrypted_key" ascii

        /* Crypto / DPAPI */
        $crypto1 = "createDecipheriv" ascii
        $crypto2 = "aes-256-gcm" ascii
        $dpapi1 = "ProtectedData]::Unprotect" ascii
        $dpapi2 = "CurrentUser" ascii

        /* Backup codes */
        $backup1 = "discord_backup_codes" ascii
        $backup2 = "github-recovery-codes" ascii
        $backup3 = "google-backup-codes" ascii
        $backup4 = "Epic Games Account Two-Factor backup codes" ascii

        /* Stealer identity */
        $id1 = "EvilSoul Stealer" ascii
        $id2 = "EvilSoul" ascii

    condition:
        uint16(0) == 0x6173 or uint16(0) == 0x7b5c or
        (
            2 of ($token*) and
            3 of ($chromium*) and
            2 of ($crypto*) and
            1 of ($dpapi*) and
            1 of ($api*)
        )
}
