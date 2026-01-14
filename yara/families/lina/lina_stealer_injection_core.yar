rule lina_stealer_injection_core
{
    meta:
        author = "No-Stealer Project"
        family = "Lina Stealer"
        description = "Detects wallet + Discord injection behavior in Lina Stealer"
        confidence = "very high"

    strings:
        /* Wallet injection */
        $w1 = "injectAtomic" ascii
        $w2 = "injectExodus" ascii
        $w3 = "app.asar" ascii
        $w4 = "Injection successful" ascii

        /* Discord injection */
        $d1 = "discord_desktop_core" ascii
        $d2 = "BetterDiscord" ascii
        $d3 = "dc-injector" ascii
        $d4 = "Zeroed out token database file" ascii

        /* Process kill */
        $k1 = "taskkill /IM javaw.exe /F" ascii
        $k2 = "taskkill /F /IM Discord.exe" ascii

    condition:
        3 of ($w*) and
        2 of ($d*) and
        1 of ($k*)
}
