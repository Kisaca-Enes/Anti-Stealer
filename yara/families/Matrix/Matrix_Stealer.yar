rule MALWARE_MatrixStealer_File
{
    meta:
        description = "Detects Matrix Stealer payload (file-based detection)"
        author = "SOC Detection"
        version = "1.0"
        date = "2026-02"
        family = "Matrix Stealer"
        tlp = "TLP:WHITE"

    strings:

        /* Matrix specific markers */
        $s1 = "Matrix Stealer" ascii wide nocase
        $s2 = "matrix_builder" ascii nocase
        $s3 = "matrix_panel" ascii nocase

        /* Known panel / gate patterns */
        $c1 = "/gate.php" ascii
        $c2 = "/panel/login.php" ascii
        $c3 = "/builder/gate.php" ascii

        /* Data collection targets */
        $t1 = "Login Data" ascii
        $t2 = "Web Data" ascii
        $t3 = "Local State" ascii
        $t4 = "wallet.dat" ascii
        $t5 = "extension_settings" ascii

        /* Browser targeting */
        $b1 = "Google\\Chrome\\User Data" ascii
        $b2 = "Mozilla\\Firefox\\Profiles" ascii
        $b3 = "Edge\\User Data" ascii

        /* Crypto / encoding usage */
        $e1 = "FromBase64String" ascii
        $e2 = "Rfc2898DeriveBytes" ascii
        $e3 = "AesManaged" ascii
        $e4 = "RC4" ascii

        /* Telegram exfil */
        $x1 = "api.telegram.org" ascii
        $x2 = "sendDocument" ascii

    condition:
        uint16(0) == 0x5A4D and
        (
            (2 of ($s*)) or
            (1 of ($c*) and 2 of ($t*)) or
            (1 of ($x*) and 1 of ($e*) and 1 of ($b*))
        )
}
