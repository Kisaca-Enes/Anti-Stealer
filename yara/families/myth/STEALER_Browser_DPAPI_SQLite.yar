rule STEALER_Browser_DPAPI_SQLite
{
    meta:
        description = "Detects browser credential stealing via DPAPI + SQLite"
        confidence = "high"

    strings:
        $d1 = "Dpapi" ascii
        $s1 = "better-sqlite3" ascii
        $s2 = "Login Data" ascii
        $s3 = "Cookies" ascii
        $t1 = "tmp" ascii
        $t2 = "temp" ascii

    condition:
        2 of ($s*) and
        1 of ($d*) and
        1 of ($t*)
}
