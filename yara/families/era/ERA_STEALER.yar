rule ERA_Stealer_Family_Profile
{
    meta:
        description = "Detects ERA Stealer family based on runtime browser, wallet and Discord theft artefacts"
        author = "Blue Team / DFIR"
        malware_family = "ERA Stealer"
        scope = "memory,disk"
        confidence = "high"

    strings:
        /* Chromium browser artefacts */
        $chromium1 = "Local State" ascii wide
        $chromium2 = "Login Data" ascii wide
        $chromium3 = "Network\\Cookies" ascii wide
        $chromium4 = "os_crypt.encrypted_key" ascii

        /* DPAPI + AES-GCM usage */
        $crypto1 = "ProtectedData]::Unprotect" ascii
        $crypto2 = "aes-256-gcm" ascii
        $crypto3 = "createDecipheriv" ascii

        /* Discord token extraction patterns */
        $discord_token1 = /mfa\.[A-Za-z0-9_-]{80,90}/
        $discord_token2 = /[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{25,110}/
        $discord_api1   = "/api/v9/users/@me" ascii
        $discord_api2   = "authorization" ascii

        /* Wallet browser extensions (subset – high signal) */
        $wallet1 = "Local Extension Settings\\nkbihfbeogaeaoehlefnkodbefgpgknn" ascii  // MetaMask
        $wallet2 = "Local Extension Settings\\bfnaelmomeimhlpmgjnjophhpkkoljpa" ascii  // Phantom
        $wallet3 = "Local Extension Settings\\fhbohimaelbohpjbbldcngcnapndodjp" ascii  // Binance
        $wallet4 = "Local Extension Settings\\hnfanknocfeofbddgcijnmhnfnkdnaad" ascii  // Coinbase

        /* Era Stealer specific branding / telemetry */
        $era1 = "Era stealer" ascii wide
        $era2 = "https://t.me/era_stealer" ascii wide

    condition:
        (
            /* Memory profile */
            3 of ($chromium*) and
            2 of ($crypto*) and
            1 of ($discord_token*) and
            ($discord_api1 or $discord_api2)
        )
        or
        (
            /* Disk / unpacked JS detection */
            2 of ($wallet*) and
            1 of ($discord_token*) and
            any of ($era*)
        )
}
