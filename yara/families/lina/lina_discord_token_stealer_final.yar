rule lina_discord_token_stealer_final
{
    meta:
        author = "No-Stealer Project"
        family = "Lina Stealer"
        description = "Detects Discord token stealing via LevelDB, Safe Storage, and API validation"
        confidence = "very high"
        last_stage = "true"

    strings:
        /* Token regex & patterns */
        $r1 = "dQw4w9WgXcQ:" ascii
        $r2 = "[\\w-]{24,27}\\.[\\w-]{6,7}\\.[\\w-]{25,110}" ascii

        /* Discord validation */
        $d1 = "/api/v9/users/@me" ascii
        $d2 = "Authorization': token" ascii
        $d3 = "discord.com" ascii

        /* LevelDB harvesting */
        $l1 = "Local Storage\\leveldb" ascii
        $l2 = ".ldb" ascii
        $l3 = ".log" ascii

        /* Browser abuse */
        $b1 = "chrome.cookies.getAll" ascii
        $b2 = "chrome.downloads.download" ascii
        $b3 = "--load-extension=" ascii

        /* Process control */
        $p1 = "taskkill /F /IM Discord.exe" ascii
        $p2 = "DiscordCanary.exe" ascii

    condition:
        (
            (1 of ($r*)) and
            (2 of ($l*)) and
            (2 of ($d*))
        )
        or
        (
            all of ($b*) and
            1 of ($p*)
        )
}
