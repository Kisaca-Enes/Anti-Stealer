rule JS_EvilSoul_Old_Full_Stealer
{
    meta:
        author = "No-Stealer Project"
        description = "Detects old EvilSoul full stealer core (browser, cookies, passwords, games)"
        date = "2026-01-12"
        malware_family = "EvilSoul"
        variant = "old"
        confidence = "very_high"

    strings:
        /* Branding */
        $brand = "EvilSoul" ascii
        $footer = "@EvilSoulStealer" ascii

        /* Chromium DPAPI + AES */
        $dpapi = "ProtectedData" ascii
        $aes_gcm = "aes-256-gcm" ascii
        $v10 = "v10" ascii
        $v11 = "v11" ascii

        /* Remote debugging browser hijack */
        $remote_debug = "--remote-debugging-port=" ascii
        $headless = "--headless=new" ascii
        $user_data = "--user-data-dir=" ascii
        $profile_dir = "--profile-directory=" ascii
        $no_sandbox = "--no-sandbox" ascii

        /* DevTools cookie extraction */
        $get_cookies = "Network.getAllCookies" ascii
        $ws_debug = "webSocketDebuggerUrl" ascii

        /* Cookie session abuse */
        $ig_api = "i.instagram.com/api/v1/accounts/current_user" ascii
        $tiktok_api = "tiktok.com/passport/web/account/info" ascii
        $spotify_api = "spotify.com/api/account-settings" ascii
        $sessionid = "sessionid=" ascii
        $sp_dc = "sp_dc=" ascii

        /* Database theft */
        $login_data = "Login Data" ascii
        $web_data = "Web Data" ascii
        $history = "History" ascii
        $autofill = "autofill" ascii

        /* Game account theft */
        $steam = "Steam\\config\\loginusers.vdf" ascii
        $minecraft = ".minecraft" ascii
        $launcher_profiles = "launcher_profiles.json" ascii
        $accounts_json = "accounts.json" ascii

        /* Staging & exfil */
        $admzip = "AdmZip" ascii
        $writezip = "writeZip" ascii
        $temp_zip = /\\Temp\\.*\.zip/i
        $webhook = "api/webhooks" ascii

        /* Process control */
        $taskkill = "taskkill /F /T /IM" ascii

    condition:
        uint16(0) == 0x6a73
        and
        $brand
        and
        (
            /* Browser takeover + cookie dump */
            (
                $remote_debug
                and $get_cookies
                and $aes_gcm
            )
            or
            /* Session hijacking (social platforms) */
            (
                $sessionid
                and ( $ig_api or $tiktok_api or $spotify_api )
            )
            or
            /* Credential databases */
            (
                $login_data
                and $web_data
            )
        )
        and
        (
            /* Exfiltration */
            $admzip
            or $webhook
        )
}
