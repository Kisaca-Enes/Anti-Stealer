rule MythStealer_Memory_Profile
{
    meta:
        author = "blue-team"
        description = "Detects MythStealer/MythGrabber via in-memory runtime artefacts"
        scope = "memory"
        confidence = "high"

    strings:
        /* App-Bound Chrome 127+ support */
        $appb_magic = "APPB" ascii
        $appb_debug = "app bound key =====" ascii

        /* Browser artefacts */
        $chrome_login = "Login Data" ascii
        $chrome_cookies = "Network/Cookies" ascii
        $local_state = "Local State" ascii

        /* DPAPI + token abuse indicators */
        $dpapi_1 = "CryptUnprotectData" ascii
        $ntapi_1 = "NtOpenProcessToken" ascii

        /* Highly specific debug markers */
        $dbg_cookie = "cookiepls" ascii
        $dbg_pass1  = "pass pls" ascii
        $dbg_pass2  = "abi password" ascii
        $dbg_oh1    = "ohapls" ascii
        $dbg_oh2    = "ohapls2" ascii

    condition:
        /* Must be a PE in memory */
        uint16(0) == 0x5A4D and

        /* App-bound key OR DPAPI token flow */
        (
            $appb_magic or
            ( $dpapi_1 and $ntapi_1 )
        ) and

        /* Browser credential access */
        2 of ($chrome_*) and $local_state and

        /* Debug artefact confirmation */
        1 of ($dbg_*)
}
