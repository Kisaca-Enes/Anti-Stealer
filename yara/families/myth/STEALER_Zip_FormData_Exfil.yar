rule STEALER_Zip_FormData_Exfil
{
    meta:
        description = "Detects stealer exfiltration via ZIP + multipart form"
        confidence = "high"

    strings:
        $z1 = "JSZip" ascii
        $f1 = "FormData" ascii
        $h1 = "multipart/form-data" ascii
        $w1 = "webhook" ascii nocase

    condition:
        2 of ($z*) and
        1 of ($f*) and
        1 of ($h*)
}
