rule StealC_WinInet_Steam_Chromium_C2
{
    meta:
        description = "StealC Stealer detection via WinINet + Steam + Chromium + PHP C2"
        author = "DFIR / SOC"
        date = "2026-02-07"
        malware_family = "StealC"
        confidence = "high"
        scope = "memory,file"

    strings:
        /* WinINet API */
        $wininet1 = "wininet.dll" ascii wide
        $wininet2 = "InternetOpenW" ascii wide
        $wininet3 = "InternetConnectW" ascii wide
        $wininet4 = "HttpOpenRequestW" ascii wide
        $wininet5 = "HttpSendRequestW" ascii wide
        $wininet6 = "InternetReadFile" ascii wide
        $wininet7 = "InternetCrackUrlW" ascii wide

        /* Chromium key extraction */
        $chrom1 = "Local State" ascii wide
        $chrom2 = "app_bound_encrypted_key" ascii wide
        $chrom3 = "\\Chrome\\User Data\\" ascii wide
        $chrom4 = "\\Brave-Browser\\User Data\\" ascii wide
        $chrom5 = "\\Microsoft\\Edge\\User Data\\" ascii wide

        /* Steam harvesting */
        $steam1 = "config.vdf" ascii wide
        $steam2 = "MachineUserConfigStore" ascii wide
        $steam3 = "InstallConfigStore" ascii wide
        $steam4 = "steam_tokens.txt" ascii wide
        $steam5 = "SteamID" ascii wide
        $steam6 = "Token:" ascii wide

        /* StealC C2 patterns */
        $c2_1 = ".php" ascii
        $c2_2 = "/bcecae65969cae2b.php" ascii
        $c2_3 = "rc4.plain" ascii
        $c2_4 = "POST" ascii

        /* Masquerade */
        $fakeproc = "AvastSvc.exe" ascii wide

    condition:
        (
            4 of ($wininet*) and
            2 of ($chrom*) and
            2 of ($steam*)
        )
        or
        (
            3 of ($wininet*) and
            2 of ($steam*) and
            1 of ($c2*)
        )
}
