rule STEALER_Discord_Core_Injection
{
    meta:
        description = "Detects stealer-class malware injecting code into Discord desktop core files"
        author = "No-Stealer Project"
        confidence = "very_high"
        target = "electron_app_injection"

    strings:
        /* Discord desktop internals */
        $d1 = "discord_desktop_core" ascii
        $d2 = "webpackChunkdiscord" ascii
        $d3 = "getToken" ascii

        /* credential interception intent */
        $c1 = "password" ascii nocase
        $c2 = "email" ascii nocase
        $c3 = "login" ascii nocase

        /* persistence via file overwrite */
        $p1 = "writeFileSync" ascii
        $p2 = "readFileSync" ascii

    condition:
        (
            all of ($d*)
            and 2 of ($c*)
            and 1 of ($p*)
        )
}
