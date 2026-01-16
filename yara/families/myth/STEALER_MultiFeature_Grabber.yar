rule STEALER_MultiFeature_Grabber
{
    meta:
        description = "Detects multi-feature credential stealer based on feature density"
        author = "No-Stealer Project"
        confidence = "very_high"

    strings:
        $b1 = "Login Data" ascii
        $b2 = "Cookies" ascii
        $d1 = "discord" ascii nocase
        $d2 = "token" ascii nocase
        $w1 = "wallet" ascii nocase
        $s1 = "systemInfo" ascii nocase
        $z1 = "JSZip" ascii
        $x1 = "FormData" ascii

    condition:
        uint16(0) == 0x5A4D and
        (
            2 of ($b*) and
            2 of ($d*) and
            1 of ($w*) and
            1 of ($z*) and
            1 of ($x*)
        )
}
