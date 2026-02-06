rule MythStealer_MythGrabber_Full_Memory_Profile
{
    meta:
        author = "blue-team"
        family = "MythStealer / MythGrabber"
        description = "Detects MythGrabber stealer via in-memory runtime artefacts"
        scope = "memory"
        confidence = "very-high"

    strings:
        /* Chrome 127+ App-Bound Key support */
        $appb_magic = "APPB" ascii
        $appb_dbg   = "app bound key =====" ascii

        /* Browser credential artefacts */
        $login_data   = "Login Data" ascii
        $cookies_path = "Network/Cookies" ascii
        $local_state  = "Local State" ascii

        /* Crypto & DPAPI */
        $dpapi = "CryptUnprotectData" ascii
        $ncrypt = "NCryptDecrypt" ascii

        /* Keylogging / spyware APIs */
        $keylog = "GetAsyncKeyState" ascii
        $clip   = "OpenClipboard" ascii
        $screen = "PrintWindow" ascii

        /* Telegram stealer (very strong indicator) */
        $tdata = "tdata" ascii
        $tg_key = "D877F783D5D3EF8C" ascii

        /* Discord injection */
        $discord_core = "discord_desktop_core" ascii
        $inject_dbg   = "Injected into" ascii

        /* Highly specific debug markers */
        $dbg1 = "cookiepls" ascii
        $dbg2 = "pass pls" ascii
        $dbg3 = "abi password" ascii
        $dbg4 = "ohapls" ascii
        $dbg5 = "ohapls2" ascii
        $dbg6 = "allah carpsin" ascii
        $dbg7 = "ANANI SIKEYIM" ascii

    condition:
        /* Must be PE mapped in memory */
        uint16(0) == 0x5A4D and

        /* Core stealer capability */
        (
            $appb_magic or
            ( $dpapi and $ncrypt )
        ) and

        /* Browser credential access */
        2 of ($login_data, $cookies_path, $local_state) and

        /* Spyware behaviour */
        1 of ($keylog, $clip, $screen) and

        /* Telegram OR Discord injection */
        (
            $tg_key or
            $discord_core
        ) and

        /* Family confirmation via debug artefacts */
        1 of ($dbg*)
}
