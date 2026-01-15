rule GENESIS_Stealer_System_Profile_NodeJS
{
    meta:
        author = "No-Stealer Project"
        description = "Detects Genesis Stealer system profiling, Minecraft/Lunar theft, WiFi dump, Defender recon"
        family = "Genesis Stealer"
        stage = "post-infection / profiling"
        language = "NodeJS"
        confidence = "very_high"
        date = "2026-01"

    strings:
        /* Minecraft & Lunar Client */
        $mc1 = ".minecraft"
        $mc2 = "usercache.json"
        $lc1 = ".lunarclient"
        $lc2 = "accounts.json"
        $lc3 = "settings.json"

        /* System recon */
        $sys1 = "os.cpus()"
        $sys2 = "os.totalmem()"
        $sys3 = "os.networkInterfaces()"
        $sys4 = "os.hostname()"
        $sys5 = "os.userInfo()"

        /* Windows recon commands */
        $ps1 = "Get-WmiObject Win32_VideoController"
        $ps2 = "Get-MpComputerStatus"
        $ps3 = "tasklist /FO CSV"
        $ps4 = "HKLM:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall"

        /* WiFi password theft */
        $wifi1 = "netsh wlan show profiles"
        $wifi2 = "key=clear"
        $wifi3 = "Key Content"

        /* Geo / IP */
        $ip1 = "ip-api.com/json"

        /* Recursive data theft */
        $fs1 = "copyDirectoryRecursive"
        $fs2 = "C:\\\\Users"

    condition:
        (
            1 of ($mc*) and
            1 of ($lc*) and
            3 of ($sys*) and
            2 of ($wifi*) and
            any of ($ps*) and
            any of ($ip*)
        )
}
