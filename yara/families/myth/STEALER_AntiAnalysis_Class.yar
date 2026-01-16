rule STEALER_AntiAnalysis_Class
{
    meta:
        description = "Detects stealer-class binaries with aggressive anti-analysis logic"
        author = "No-Stealer Project"
        confidence = "high"
        category = "stealer"

    strings:
        /* environment fingerprinting indicators */
        $env_1 = "hostname" ascii nocase
        $env_2 = "username" ascii nocase
        $env_3 = "networkInterfaces" ascii nocase

        /* anti-analysis behavior markers */
        $aa_1 = "sandbox" ascii nocase
        $aa_2 = "virtual" ascii nocase
        $aa_3 = "debug" ascii nocase

        /* execution termination intent */
        $term_1 = "process.exit" ascii
        $term_2 = "del /f /q" ascii

    condition:
        uint16(0) == 0x5A4D and
        (
            2 of ($env_*) and
            2 of ($aa_*)
        ) and
        1 of ($term_*)
}
