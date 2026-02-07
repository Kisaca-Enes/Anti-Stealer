rule StealC_Infostealer_Static_v1
{
    meta:
        description = "Detects StealC infostealer based on strings, Steam/Browser targets and WinINet usage"
        author = "Enes"
        malware_family = "StealC"
        reference = "Steam + Browser credential stealer"
        date = "2026-02-07"

    strings:
        /* Steam & browser targets */
        $steam1 = "config.vdf" ascii nocase
        $steam2 = "\\Steam\\local.vdf" ascii nocase
        $steam3 = "steam_tokens.txt" ascii nocase
        $steam4 = "SteamID" ascii

        $browser1 = "\\Google\\Chrome\\User Data\\Local State" ascii nocase
        $browser2 = "\\Microsoft\\Edge\\User Data\\Local State" ascii nocase
        $browser3 = "MachineUserConfigStore" ascii nocase

        /* Network / WinINet */
        $net1 = "wininet.dll" ascii nocase
        $net2 = "HttpSendRequestW" ascii
        $net3 = "InternetConnectW" ascii
        $net4 = "InternetReadFile" ascii
        $net5 = "InternetCrackUrlW" ascii

        /* StealC specific markers */
        $marker1 = "UUUUUUU" ascii
        $marker2 = "?UUUUUU" ascii
        $json1   = "\"total_parts\":" ascii
        $json2   = "\"part_index\":" ascii
        $json3   = "vector too long" ascii

        /* Self delete */
        $cmd1 = "cmd.exe /c timeout /t" ascii nocase
        $cmd2 = "del /f /q" ascii nocase

    condition:
        uint16(0) == 0x5A4D and
        (
            2 of ($steam*) and
            2 of ($net*)
        ) and
        (
            1 of ($browser*) or
            1 of ($marker*)
        ) and
        1 of ($cmd*)
}
