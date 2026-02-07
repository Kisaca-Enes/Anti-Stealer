rule StealC_Infostealer_Memory_v1
{
    meta:
        description = "Detects StealC in memory using payload markers, WinINet APIs and protocol strings"
        author = "Enes"
        malware_family = "StealC"
        scope = "memory"
        date = "2026-02-07"

    strings:
        /* Payload / filler markers */
        $m1 = "UUUUUUU" ascii
        $m2 = "?UUUUUU" ascii

        /* Protocol / parsing */
        $p1 = "\"total_parts\":" ascii
        $p2 = "\"part_index\":" ascii
        $p3 = "missing" ascii
        $p4 = "failed" ascii
        $p5 = "parse error" ascii

        /* Crypto / randomness */
        $c1 = "SystemFunction036" ascii
        $c2 = "GetSystemTimePreciseAsFileTime" ascii

        /* WinINet */
        $n1 = "HttpSendRequestW" ascii
        $n2 = "InternetOpenW" ascii
        $n3 = "InternetReadFile" ascii

    condition:
        (
            2 of ($m*) or
            2 of ($p*)
        ) and
        2 of ($n*) and
        1 of ($c*)
}
