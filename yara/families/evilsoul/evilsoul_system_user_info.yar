rule EVILSOUL_NodeJS_Stealer_New_Extended
{
    meta:
        author = "No-Stealer Project"
        description = "Detects EvilSoul NodeJS full-featured stealer (tokens, passwords, cards, autofill, history)"
        malware_family = "EvilSoul"
        date = "2026-01"
        confidence = "very-high"
        severity = "critical"

    strings:
        /* Discord token theft */
        $token1 = /mfa\.[\w-]{84}/
        $token2 = /[\w-]{24}\.[\w-]{6}\.[\w-]{27}/
        $token3 = "dQw4w9WgXcQ:" ascii

        /* Discord API */
        $discord_api1 = "discord.com/api/v9/users/@me" ascii
        $discord_api2 = "discord.com/api/v10/users/" ascii

        /* Chromium credential storage */
        $chromium1 = "Local State" ascii
        $chromium2 = "Login Data" ascii
        $chromium3 = "Web Data" ascii
        $chromium4 = "os_crypt" ascii
        $chromium5 = "encrypted_key" ascii

        /* Credit card & autofill tables */
        $cc1 = "credit_cards" ascii
        $cc2 = "masked_credit_cards" ascii
        $cc3 = "server_stored_cvc" ascii
        $cc4 = "card_number_encrypted" ascii
        $cc5 = "name_on_card" ascii

        $autofill1 = "SELECT * FROM autofill" ascii
        $history1  = "SELECT * FROM urls" ascii
        $history2  = "last_visit_time" ascii

        /* Crypto & DPAPI */
        $crypto1 = "createDecipheriv" ascii
        $crypto2 = "aes-256-gcm" ascii
        $dpapi1  = "ProtectedData]::Unprotect" ascii
        $dpapi2  = "CurrentUser" ascii

        /* Loot staging & exfil */
        $loot1 = "passwords.txt" ascii
        $loot2 = "creditcards.txt" ascii
        $loot3 = "autofills.txt" ascii
        $loot4 = "history.txt" ascii
        $loot5 = "backup_codes.txt" ascii

        /* ZIP packaging */
        $zip1 = "archiver(\"zip\"" ascii
        $zip2 = ".zip" ascii

        /* System profiling */
        $sys1 = "os.cpus()" ascii
        $sys2 = "os.totalmem()" ascii
        $sys3 = "os.hostname()" ascii
        $sys4 = "os.version()" ascii

        /* Stealer branding */
        $id1 = "EvilSoul Stealer" ascii
        $id2 = "EvilSoul" ascii

    condition:
        (
            2 of ($token*) and
            3 of ($chromium*) and
            2 of ($crypto*) and
            1 of ($dpapi*) and
            1 of ($discord_api*) and
            2 of ($cc*) and
            1 of ($zip*)
        )
}
