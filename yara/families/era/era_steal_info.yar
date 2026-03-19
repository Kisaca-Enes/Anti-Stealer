rule ERA_Stealer_Core_NodeJS
{
    meta:
        author = "No-Stealer Project"
        description = "Detects Era Stealer NodeJS core logic (Chromium + Discord token stealer)"
        date = "2026-01-12"
        confidence = "high"
        malware_family = "ERA Stealer"
        scope = "memory,disk"

    strings:
        /* Chromium DPAPI key extraction */
        $chromium1 = "Local State" ascii
        $chromium2 = "os_crypt" ascii
        $chromium3 = "encrypted_key" ascii
        $chromium4 = "Local Storage\\\\leveldb" ascii

        /* DPAPI / filesystem access */
        $ctx1 = "ProtectedData]::Unprotect" ascii nocase
        $ctx2 = "fs.readFileSync" ascii

        /* Discord token patterns */
        $discord1 = /mfa\.[A-Za-z0-9_-]{80,90}/
        $discord2 = /[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{25,110}/
        $discord3 = "dQw4w9WgXcQ:" ascii

        /* Crypto indicators */
        $crypto1 = "aes-256-gcm" ascii
        $crypto2 = "createDecipheriv" ascii

    condition:
        (
            3 of ($chromium*) and
            1 of ($ctx*) and
            1 of ($discord*) and
            1 of ($crypto*)
        )
}
