rule Lumma_Stealer_Config_Chacha20
{
    meta:
        author = "Enes"
        description = "Lumma Stealer config-based detection (ChaCha20 + loot paths + exfil)"
        family = "Lumma"
        confidence = "high"
        date = "2026-02"

    strings:
        /* --- Crypto --- */
        $chacha = "ChaCha20" ascii
        $nonce  = "nonce" ascii
        $counter = "counter" ascii

        /* --- Exfil --- */
        $multipart1 = "Content-Disposition: form-data; name=\"file\"; filename=\"" ascii
        $multipart2 = "Content-Type: multipart/form-data; boundary=" ascii

        /* --- Loot paths --- */
        $loot1 = "Login Data" ascii
        $loot2 = "\\Local State" ascii
        $loot3 = "\\Local Storage\\leveldb" ascii
        $loot4 = "Discord" ascii
        $loot5 = "Steam/Tokens.txt" ascii
        $loot6 = "Thunderbird" ascii

        /* --- Infra pattern --- */
        $tld1 = ".su/" ascii
        $tld2 = ".cyou" ascii

    condition:
        uint16(0) == 0x5A4D and
        $chacha and
        2 of ($nonce, $counter) and
        1 of ($multipart*) and
        3 of ($loot*) and
        1 of ($tld*)
}
