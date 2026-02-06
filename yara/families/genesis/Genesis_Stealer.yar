rule GENESIS_Stealer_Family
{
    meta:
        description = "Detects Genesis Stealer family via Chromium/Firefox data theft, Discord token harvesting, DPAPI/AES-GCM usage, browser process killing and system recon"
        author = "Blue Team / DFIR"
        malware_family = "Genesis Stealer"
        scope = "memory,disk"
        confidence = "high"

    strings:
        /* Browser credential theft (Chromium) */
        $chromium1 = "Login Data" ascii wide
        $chromium2 = "Network\\Cookies" ascii wide
        $chromium3 = "Web Data" ascii wide
        $chromium4 = "os_crypt.encrypted_key" ascii
        $chromium5 = "aes-256-gcm" ascii
        $chromium6 = "createDecipheriv" ascii

        /* Firefox artefacts */
        $firefox1 = "cookies.sqlite" ascii
        $firefox2 = "moz_cookies" ascii

        /* Discord token theft */
        $discord1 = "discord.com/api/v9/users/@me" ascii
        $discord2 = "Authorization" ascii
        $discord3 = /[\w-]{24}\.[\w-]{6}\.[\w-]{27}/

        /* Browser process manipulation */
        $kill1 = "taskkill /F /IM" ascii
        $kill2 = "chrome.exe" ascii
        $kill3 = "msedge.exe" ascii
        $kill4 = "firefox.exe" ascii

        /* Headless browser abuse */
        $headless1 = "--remote-debugging-port=9222" ascii
        $headless2 = "--headless" ascii
        $headless3 = "--disable-gpu" ascii
        $headless4 = "--no-sandbox" ascii

        /* Crypto wallet & game theft */
        $wallet1 = "Local Extension Settings" ascii
        $wallet2 = ".minecraft" ascii
        $wallet3 = ".lunarclient" ascii

        /* System & WiFi reconnaissance */
        $recon1 = "Get-WmiObject Win32_VideoController" ascii
        $recon2 = "netsh wlan show profiles" ascii
        $recon3 = "Key Content" ascii
        $recon4 = "Get-MpComputerStatus" ascii

        /* Temp DB copy pattern */
        $tempdb1 = "cookies_" ascii
        $tempdb2 = "logindata_" ascii
        $tempdb3 = "webdata_" ascii

    condition:
        (
            /* Memory detection – active stealer */
            3 of ($chromium*) and
            1 of ($discord*) and
            1 of ($kill*) and
            1 of ($headless*)
        )
        or
        (
            /* Disk / unpacked NodeJS stealer */
            2 of ($chromium*) and
            1 of ($firefox*) and
            1 of ($wallet*) and
            2 of ($recon*)
        )
}
