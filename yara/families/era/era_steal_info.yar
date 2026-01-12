rule ERA_Stealer_Core_NodeJS
{
    meta:
        author = "No-Stealer Project"
        description = "Era Stealer NodeJS core logic (Chromium + Discord token stealer)"
        date = "2026-01-12"
        confidence = "high"
        malware_family = "EraStealer"

    strings:
        /* Chromium DPAPI key extraction */
        $local_state = "Local State" ascii
        $os_crypt = "os_crypt" ascii
        $encrypted_key = "encrypted_key" ascii
        $dpapi_ps = "ProtectedData]::Unprotect" ascii nocase

        /* Discord token patterns */
        $discord_mfa = /mfa\.[\w-]{80,90}/
        $discord_token = /[\w-]{24}\.[\w-]{6}\.[\w-]{25,110}/
        $discord_enc = "dQw4w9WgXcQ:" ascii

        /* Crypto indicators */
        $aes_gcm = "aes-256-gcm" ascii
        $create_decipher = "createDecipheriv" ascii

        /* NodeJS filesystem usage */
        $fs_read = "fs.readFileSync" ascii
        $leveldb = "Local Storage\\\\leveldb" ascii

    condition:
        uint16(0) == 0x5A4D or
        (
            3 of ($local_state, $os_crypt, $encrypted_key) and
            1 of ($dpapi_ps) and
            1 of ($discord_mfa, $discord_token, $discord_enc) and
            1 of ($aes_gcm, $create_decipher) and
            $leveldb
        )
}
