rule MALWARE_MatrixStealer_Memory
{
    meta:
        description = "Detects Matrix Stealer in memory"
        author = "SOC Detection"
        version = "1.0"
        scan_context = "memory"
        family = "Matrix Stealer"

    strings:

        /* Runtime credential queries */
        $m1 = "SELECT origin_url, username_value, password_value FROM logins" ascii
        $m2 = "SELECT card_number_encrypted" ascii
        $m3 = "cookies.sqlite" ascii

        /* Decryption routine indicators */
        $d1 = "CryptUnprotectData" ascii
        $d2 = "DPAPI" ascii
        $d3 = "BCryptDecrypt" ascii

        /* Wallet targeting */
        $w1 = "Exodus\\exodus.wallet" ascii
        $w2 = "Atomic\\Local Storage" ascii
        $w3 = "Electrum\\wallets" ascii

        /* C2 behavior */
        $c1 = "multipart/form-data" ascii
        $c2 = "Content-Disposition: form-data" ascii
        $c3 = "----WebKitFormBoundary" ascii

        /* Matrix panel indicator */
        $p1 = "/gate.php" ascii
        $p2 = "matrix" ascii nocase

    condition:
        (
            1 of ($m*) and
            1 of ($d*) and
            1 of ($c*)
        )
        or
        (
            1 of ($w*) and
            $d1 and
            $p1
        )
}
