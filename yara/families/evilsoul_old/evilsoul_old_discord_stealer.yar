rule JS_EvilSoul_Stealer_Old
{
    meta:
        author = "No-Stealer Project"
        description = "Detects old EvilSoul Discord stealer/injector (Chromium + Discord injection)"
        date = "2026-01-12"
        malware_family = "EvilSoul"
        language = "JavaScript"
        confidence = "high"

    strings:
        /* Chromium DPAPI masterkey extraction */
        $chromium_local_state = "Local State" ascii
        $os_crypt = "\"os_crypt\"" ascii
        $encrypted_key = "\"encrypted_key\"" ascii
        $dpapi_unprotect = "ProtectedData]::Unprotect" ascii

        /* Discord token patterns */
        $discord_token_plain = /[\w-]{24}\.[\w-]{6}\.[\w-]{27}/
        $discord_token_mfa   = /mfa\.[\w-]{84}/
        $discord_enc_marker  = "dQw4w9WgXcQ:" ascii

        /* Discord process killing */
        $taskkill = "taskkill /F /T /IM Discord.exe" ascii
        $discord_proc1 = "DiscordCanary.exe" ascii
        $discord_proc2 = "DiscordPTB.exe" ascii

        /* Discord desktop core injection */
        $desktop_core = "discord_desktop_core" ascii
        $index_js = "index.js" ascii
        $betterdiscord = "BetterDiscord\\data\\betterdiscord.asar" ascii

        /* Stealer fingerprinting */
        $backup_codes1 = "discord_backup_codes" ascii
        $backup_codes2 = "github-recovery-codes" ascii
        $backup_codes3 = "google-backup-codes" ascii
        $backup_codes4 = "Epic Games Account Two-Factor backup codes" ascii

        /* Branding / OPSEC fail */
        $evilsoul = "EvilSoul" ascii
        $telegram = "t.me/EvilSoulStealer" ascii

    condition:
        uint16(0) == 0x6a73 /* js */
        and
        (
            /* Core stealer behavior */
            ( $chromium_local_state and $os_crypt and $encrypted_key and $dpapi_unprotect )
            and
            ( $discord_token_plain or $discord_token_mfa or $discord_enc_marker )
            and
            ( $desktop_core and $index_js )
        )
        or
        (
            /* Injection + Discord control */
            ( $taskkill and ( $discord_proc1 or $discord_proc2 ) )
            and
            ( $desktop_core or $betterdiscord )
        )
        or
        (
            /* Backup codes harvesting is very telling */
            2 of ( $backup_codes* )
            and
            ( $evilsoul or $telegram )
        )
}
