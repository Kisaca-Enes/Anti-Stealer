rule EVILSOUL_Stealer_Family
{
    meta:
        description = "Detects EvilSoul Stealer family based on Discord token theft, injection, DPAPI abuse and persistence"
        author = "Blue Team / DFIR"
        malware_family = "EvilSoul Stealer"
        scope = "memory,disk"
        confidence = "high"

    strings:
        /* Branding / Operator artefacts */
        $brand1 = "EvilSoul" ascii wide
        $brand2 = "EvilSoulStealer" ascii wide
        $brand3 = "@EvilSoulStealer" ascii wide
        $brand4 = "t.me/EvilSoulStealer" ascii wide

        /* Discord API usage */
        $discord_api1 = "/api/v9/users/@me" ascii
        $discord_api2 = "authorization" ascii
        $discord_api3 = "discord.com/api" ascii

        /* Discord token regex indicators */
        $token1 = /mfa\.[A-Za-z0-9_-]{80,90}/
        $token2 = /[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{25,110}/
        $token3 = "dQw4w9WgXcQ:" ascii

        /* Chromium / DPAPI credential decryption */
        $dpapi1 = "os_crypt.encrypted_key" ascii
        $dpapi2 = "ProtectedData]::Unprotect" ascii
        $dpapi3 = "aes-256-gcm" ascii
        $dpapi4 = "createDecipheriv" ascii

        /* Discord client manipulation */
        $inject1 = "discord_desktop_core" ascii
        $inject2 = "index.js" ascii
        $inject3 = "BetterDiscord" ascii
        $inject4 = "taskkill /F /T /IM Discord.exe" ascii

        /* Persistence */
        $persist1 = "\\Microsoft\\Windows\\Start Menu\\Programs\\Startup" ascii
        $persist2 = "process.execPath" ascii

        /* Screenshot capability */
        $screen1 = "screenshot.png" ascii
        $screen2 = "Screenshot()" ascii

        /* Console hiding */
        $hide1 = "GetConsoleWindow" ascii
        $hide2 = "ShowWindow" ascii

    condition:
        (
            /* Memory profile – running stealer */
            2 of ($discord_api*) and
            1 of ($token*) and
            2 of ($dpapi*) and
            1 of ($inject*)
        )
        or
        (
            /* Disk / unpacked NodeJS stealer */
            2 of ($brand*) and
            1 of ($token*) and
            1 of ($persist*) and
            1 of ($inject*)
        )
}
