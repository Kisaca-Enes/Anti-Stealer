rule JS_EvilSoul_Browser_Cookie_Exfil
{
    meta:
        author = "No-Stealer Project"
        description = "Detects EvilSoul browser hijack via remote debugging + cookie exfiltration"
        date = "2026-01-12"
        malware_family = "EvilSoul"
        component = "Browser/Cookie Stealer"
        confidence = "high"

    strings:
        /* ZIP staging */
        $admzip = "AdmZip" ascii
        $writezip = "writeZip" ascii
        $temp_zip = /\\Temp\\.*\.zip/i

        /* Browser remote debugging abuse */
        $remote_debug = "--remote-debugging-port=" ascii
        $json_debug = "http://127.0.0.1:" ascii
        $json_path = "/json" ascii
        $websocket = "webSocketDebuggerUrl" ascii

        /* Chrome DevTools cookie extraction */
        $get_cookies = "Network.getAllCookies" ascii
        $encrypted_value = "encrypted_value" ascii
        $aes_gcm = "aes-256-gcm" ascii

        /* Forced browser relaunch */
        $headless = "--headless=new" ascii
        $user_data = "--user-data-dir=" ascii
        $profile_dir = "--profile-directory=" ascii

        /* Browser kill */
        $taskkill = "taskkill /F /T /IM" ascii

        /* Instagram private API abuse */
        $ig_api = "i.instagram.com/api/v1/accounts/current_user" ascii
        $ig_agent = "Instagram 159.0.0.28.123" ascii
        $sessionid = "sessionid=" ascii

        /* Branding */
        $evilsoul = "EvilSoul" ascii

    condition:
        uint16(0) == 0x6a73
        and
        (
            /* Remote debugging + cookie theft */
            (
                $remote_debug
                and $json_path
                and $get_cookies
                and $aes_gcm
            )
            or
            /* Cookie exfil via Instagram session abuse */
            (
                $ig_api
                and $sessionid
                and $ig_agent
            )
        )
        and
        (
            $admzip or $writezip
        )
}
